import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Printer, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { SECTIONS, TreatmentCategory } from "@/components/treatment/sections";
import { calculatePlanCost, formatRub, latestPriceDate, type CostCatalog, type CostItemInput } from "@/lib/treatment/cost";
import { fetchIrtForCatalogIds, formatIrtPointLine, type IrtCatalogMap } from "@/lib/treatment/acupunctureExpand";
import { WritePrescriptionsButton } from "@/components/treatment/WritePrescriptionsButton";


interface PlanItemDB {
  id: string;
  catalog_id: string | null;
  section_category: TreatmentCategory;
  order_index: number;
  name_snapshot: string;
  inn_snapshot: string | null;
  form_snapshot: string | null;
  dose: number | null;
  dose_unit: string | null;
  dilution_volume: number | null;
  dilution_solvent: string | null;
  frequency: string | null;
  duration_days: number | null;
  time_of_day: string[] | null;
  infusion_rate: string | null;
  route_override: string | null;
  notes: string | null;
  is_off_label: boolean;
  day_pattern: string | null;
  prn_estimated_doses: number | null;
}

interface PlanDB {
  id: string;
  issued_at: string;
  duration_days: number;
  diagnosis_short: string | null;
  clinical_summary: string | null;
  status: string;
  mode: string;
  course_number: number | null;
  show_cost_in_print: boolean | null;
  lab_control_enabled: boolean | null;
  is_public: boolean | null;
  public_hash: string | null;
  patient: { id: string; full_name: string; birth_date: string } | null;
}

interface LabControlRow {
  id: string;
  control_point: string | null;
  at_day: number | null;
  test_ids: string[] | null;
  custom_tests: string[] | null;
  notes: string | null;
  order_index: number;
}

interface LabTest { id: string; name: string; short_name: string | null; }

const ROUTE_LABELS: Record<TreatmentCategory, string> = {
  iv_drip: "в/в капельно",
  iv_bolus: "в/в струйно",
  im: "в/м",
  sc: "п/к",
  oral_rx: "внутрь",
  oral_supplement: "внутрь",
  rectal: "ректально",
  topical: "накожно",
  nasal: "интраназально",
  sublingual: "под язык",
  peptide: "по схеме",
  procedure: "",
  lifestyle: "",
  homeopathy: "под язык",
  physiotherapy: "процедура",

};

function renderLine(it: PlanItemDB, courseDays: number): string {
  const parts: string[] = [];
  let head = it.name_snapshot;
  if (it.dose != null) head += ` ${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`;
  if (it.dilution_volume && it.dilution_solvent) {
    head += ` в ${it.dilution_volume} мл ${it.dilution_solvent}`;
  } else if (it.dilution_volume) {
    head += ` в ${it.dilution_volume} мл`;
  }
  parts.push(head);

  const tail: string[] = [];
  const route = it.route_override || ROUTE_LABELS[it.section_category];
  if (route) tail.push(route);
  if (it.infusion_rate) tail.push(it.infusion_rate);
  if (it.time_of_day && it.time_of_day.length) tail.push(it.time_of_day.join("/"));
  if (it.frequency) tail.push(it.frequency);
  const days = it.duration_days ?? courseDays;
  if (days) tail.push(`дни 1–${days}`);
  if (tail.length) parts.push(tail.join(", "));

  let line = parts.join(" — ");
  if (it.notes) line += `. ${it.notes}`;
  if (!line.endsWith(".")) line += ".";
  return line;
}

function expandPattern(pattern: string | null | undefined, courseDays: number, itemDays?: number | null): Set<number> {
  const total = itemDays ?? courseDays;
  const set = new Set<number>();
  if (!pattern || pattern.trim() === "") {
    for (let i = 1; i <= total; i++) set.add(i);
    return set;
  }
  pattern.split(",").map(s => s.trim()).filter(Boolean).forEach(part => {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const a = +range[1], b = +range[2];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= courseDays) set.add(i);
      return;
    }
    const every = part.match(/^через\s+(\d+)$/i);
    if (every) {
      const step = +every[1] + 1;
      for (let i = 1; i <= courseDays; i += step) set.add(i);
      return;
    }
    const n = Number(part);
    if (!Number.isNaN(n) && n >= 1 && n <= courseDays) set.add(n);
  });
  return set;
}

export default function TreatmentPlanPrint() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<PlanDB | null>(null);
  const [items, setItems] = useState<PlanItemDB[]>([]);
  const [labControl, setLabControl] = useState<LabControlRow[]>([]);
  const [labTestsMap, setLabTestsMap] = useState<Map<string, LabTest>>(new Map());
  const [catalogMap, setCatalogMap] = useState<Map<string, CostCatalog>>(new Map());
  const [acupunctureMap, setAcupunctureMap] = useState<IrtCatalogMap>(new Map());
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);


  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("treatment_plans")
        .select("id, issued_at, duration_days, diagnosis_short, clinical_summary, status, mode, course_number, show_cost_in_print, lab_control_enabled, is_public, public_hash, patient:patients(full_name, birth_date)")
        .eq("id", id!).maybeSingle();
      const { data: rows } = await supabase.from("treatment_plan_items")
        .select("*").eq("plan_id", id!).order("section_category").order("order_index");
      const { data: lc } = await supabase.from("treatment_plan_lab_control" as any)
        .select("*").eq("plan_id", id!).order("order_index");

      const planItems = (rows as any[]) || [];
      const lcRows = (lc as any[]) || [];

      // Lab tests catalog (only ids referenced)
      const allTestIds = new Set<string>();
      lcRows.forEach(r => (r.test_ids || []).forEach((tid: string) => allTestIds.add(tid)));
      if (allTestIds.size) {
        const { data: lt } = await supabase
          .from("lab_tests_catalog")
          .select("id, name, short_name")
          .in("id", Array.from(allTestIds));
        const m = new Map<string, LabTest>();
        (lt || []).forEach((t: any) => m.set(t.id, t));
        setLabTestsMap(m);
      }

      // Catalog pricing (only for items that have a catalog_id)
      const catIds = Array.from(new Set(planItems.map(i => i.catalog_id).filter(Boolean) as string[]));
      if (catIds.length) {
        const { data: cat } = await supabase
          .from("treatment_catalog")
          .select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_updated_at, price_source_preference")
          .in("id", catIds);
        const m = new Map<string, CostCatalog>();
        (cat || []).forEach((c: any) => m.set(c.id, c));
        setCatalogMap(m);
        const irt = await fetchIrtForCatalogIds(catIds);
        setAcupunctureMap(irt);
      }


      setPlan(p as any);
      setItems(planItems);
      setLabControl(lcRows);
      setBusy(false);
      await supabase.from("treatment_plans").update({ print_count: ((p as any)?.print_count ?? 0) + 1 } as any).eq("id", id!);

      if ((p as any)?.is_public && (p as any)?.public_hash) {
        try {
          const url = `${window.location.origin}/p/${(p as any).public_hash}`;
          const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1 });
          setQrDataUrl(dataUrl);
        } catch { /* ignore QR errors */ }
      }
    })();
  }, [id]);

  const costBreakdown = useMemo(() => {
    if (!plan) return null;
    const input: Array<CostItemInput & { name_snapshot: string }> = items.map(it => ({
      catalog_id: it.catalog_id,
      section_category: it.section_category,
      frequency: it.frequency,
      day_pattern: it.day_pattern,
      duration_days: it.duration_days,
      prn_estimated_doses: it.prn_estimated_doses,
      name_snapshot: it.name_snapshot,
    }));
    return calculatePlanCost(input, catalogMap, plan.duration_days, (plan.mode as any) || "flat");
  }, [items, catalogMap, plan]);

  if (busy || !plan) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  const lifestyleItems = items.filter(i => i.section_category === "lifestyle");
  const medicalSections = SECTIONS.filter(s => s.key !== "lifestyle");
  const date = new Date(plan.issued_at);
  const birth = plan.patient?.birth_date ? new Date(plan.patient.birth_date) : null;
  let age: number | null = null;
  if (birth) {
    age = date.getFullYear() - birth.getFullYear();
    const m = date.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && date.getDate() < birth.getDate())) age!--;
  }

  const scheduledItems = items.filter(i => i.section_category !== "lifestyle" && i.day_pattern);
  const showCalendar = plan.mode === "scheduled" && scheduledItems.length > 0;
  const landscape = plan.duration_days > 21;
  const compact = scheduledItems.length > 30;
  const showCost = !!plan.show_cost_in_print && costBreakdown && costBreakdown.total > 0;
  const showLab = !!plan.lab_control_enabled && labControl.length > 0;

  return (
    <div className="bg-muted/30 min-h-screen py-6">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; border: none !important; }
          @page { size: A4 portrait; margin: 15mm; }
          ${landscape ? `.calendar-page { page-break-before: always; }
          @page calendar { size: A4 landscape; margin: 12mm; }
          .calendar-page { page: calendar; }` : ".calendar-page { page-break-before: always; }"}
        }
      `}</style>

      <div className="no-print max-w-[210mm] mx-auto mb-4 flex justify-end gap-2 px-4">
        <Button onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4"/>Печать / PDF</Button>
      </div>

      <div className="print-page bg-white text-black mx-auto shadow-lg" style={{ width: "210mm", minHeight: "297mm", padding: "15mm", fontFamily: "Times New Roman, serif", fontSize: "11pt", lineHeight: 1.45 }}>
        {/* Letterhead */}
        <div style={{ borderBottom: "2px solid #000", paddingBottom: "4mm", marginBottom: "5mm" }}>
          <div style={{ textAlign: "center", fontSize: "9pt", letterSpacing: "0.5px" }}>
            Министерство здравоохранения Российской Федерации
          </div>
          <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12pt", marginTop: "2mm" }}>
            Профессор, д.м.н. Тарусин Дмитрий Игоревич
          </div>
          <div style={{ textAlign: "center", fontSize: "9pt", marginTop: "1mm" }}>
            Детский уролог-андролог высшей категории · Московский андрологический центр
          </div>
        </div>

        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "15pt", letterSpacing: "2px", marginBottom: "4mm" }}>
          ЛИСТ НАЗНАЧЕНИЙ{plan.course_number != null ? ` № ${plan.course_number}` : ""}
        </div>

        {/* Header info */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "3mm" }}>
          <div>Дата выписки: <b>{format(date, "d MMMM yyyy 'г.'", { locale: ru })}</b></div>
          <div>ID: {plan.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div style={{ fontSize: "10pt", marginBottom: "1mm" }}>
          Ф.И.О. пациента: <b>{plan.patient?.full_name || "—"}</b>
          {age !== null && <span style={{ marginLeft: "5mm" }}>Возраст: <b>{age} лет</b></span>}
        </div>
        {plan.diagnosis_short && (
          <div style={{ fontSize: "10pt", marginBottom: "1mm" }}>
            Диагноз: <b>{plan.diagnosis_short}</b>
          </div>
        )}
        <div style={{ fontSize: "10pt", marginBottom: "3mm" }}>
          Длительность курса: <b>{plan.duration_days} дней</b>
        </div>

        {plan.clinical_summary && (
          <div style={{ fontStyle: "italic", fontSize: "10pt", color: "#222", borderLeft: "2px solid #888", paddingLeft: "3mm", margin: "3mm 0 5mm 0" }}>
            {plan.clinical_summary}
          </div>
        )}

        <hr style={{ border: 0, borderTop: "1px solid #000", margin: "3mm 0" }}/>

        {/* Sections */}
        {medicalSections.map(section => {
          const list = items.filter(i => i.section_category === section.key);
          if (!list.length) return null;
          return (
            <div key={section.key} style={{ marginBottom: "4mm", pageBreakInside: "avoid" }}>
              <div style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: "1mm", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {section.label}
              </div>
              <ol style={{ margin: 0, paddingLeft: "8mm" }}>
                {list.map(it => {
                  const irt = it.catalog_id ? acupunctureMap.get(it.catalog_id) : undefined;
                  return (
                    <li key={it.id} style={{ marginBottom: "1.5mm" }}>
                      {renderLine(it, plan.duration_days)}
                      {it.is_off_label && <span style={{ fontSize: "8pt", marginLeft: "2mm" }}>(off-label)</span>}
                      {irt && irt.points.length > 0 && (
                        <div style={{ marginTop: "1mm", marginLeft: "2mm", fontSize: "9.5pt", color: "#222" }}>
                          {(() => {
                            const meta: string[] = [];
                            if (irt.session_count != null) meta.push(`${irt.session_count} сеансов`);
                            if (irt.session_duration_min != null) meta.push(`${irt.session_duration_min} мин/сеанс`);
                            if (irt.frequency) meta.push(irt.frequency);
                            return meta.length ? (
                              <div style={{ fontStyle: "italic", marginBottom: "0.5mm" }}>Курс: {meta.join(" · ")}</div>
                            ) : null;
                          })()}
                          <div style={{ fontWeight: "bold", marginBottom: "0.5mm" }}>Точки протокола ({irt.points.length}):</div>
                          <ol style={{ margin: 0, paddingLeft: "6mm" }}>
                            {irt.points.map((pt, idx) => (
                              <li key={idx} style={{ marginBottom: "0.5mm" }}>{formatIrtPointLine(pt)}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>

            </div>
          );
        })}

        {/* Lifestyle */}
        {lifestyleItems.length > 0 && (
          <div style={{ marginTop: "5mm", pageBreakInside: "avoid" }}>
            <div style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: "1mm", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Рекомендации образа жизни
            </div>
            <ol style={{ margin: 0, paddingLeft: "8mm" }}>
              {lifestyleItems.map(it => (
                <li key={it.id} style={{ marginBottom: "1.5mm" }}>
                  <b>{it.name_snapshot}</b>{it.notes ? ` — ${it.notes}` : ""}
                  {it.frequency ? `. ${it.frequency}` : ""}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Lab control on therapy */}
        {showLab && (
          <div style={{ marginTop: "5mm", pageBreakInside: "avoid" }}>
            <div style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: "1.5mm", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Контроль на фоне терапии
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: "1.2mm 2mm", background: "#f0f0f0", textAlign: "left", width: "38mm" }}>Точка контроля</th>
                  <th style={{ border: "1px solid #000", padding: "1.2mm 2mm", background: "#f0f0f0", textAlign: "left", width: "16mm" }}>День</th>
                  <th style={{ border: "1px solid #000", padding: "1.2mm 2mm", background: "#f0f0f0", textAlign: "left" }}>Анализы / исследования</th>
                </tr>
              </thead>
              <tbody>
                {labControl.map(lc => {
                  const tests = [
                    ...(lc.test_ids || []).map(tid => labTestsMap.get(tid)?.short_name || labTestsMap.get(tid)?.name).filter(Boolean) as string[],
                    ...(lc.custom_tests || []),
                  ];
                  return (
                    <tr key={lc.id}>
                      <td style={{ border: "1px solid #000", padding: "1.2mm 2mm", verticalAlign: "top" }}>{lc.control_point || "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "1.2mm 2mm", verticalAlign: "top" }}>{lc.at_day != null ? `${lc.at_day}` : "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "1.2mm 2mm", verticalAlign: "top" }}>
                        {tests.length ? tests.join(", ") : "—"}
                        {lc.notes ? <div style={{ fontSize: "8.5pt", color: "#444", marginTop: "0.5mm", fontStyle: "italic" }}>{lc.notes}</div> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Cost estimate */}
        {showCost && costBreakdown && (
          <div style={{ marginTop: "5mm", pageBreakInside: "avoid" }}>
            <div style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: "1.5mm", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Ориентировочная стоимость курса
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
              <tbody>
                {Object.entries(costBreakdown.byGroup).map(([k, g]) => (
                  <tr key={k}>
                    <td style={{ padding: "0.8mm 2mm", borderBottom: "1px dashed #999" }}>{g.emoji} {g.label}</td>
                    <td style={{ padding: "0.8mm 2mm", borderBottom: "1px dashed #999", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatRub(g.sum)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "1.2mm 2mm", borderTop: "1.5px solid #000", fontWeight: "bold" }}>Итого:</td>
                  <td style={{ padding: "1.2mm 2mm", borderTop: "1.5px solid #000", fontWeight: "bold", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatRub(costBreakdown.total)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: "8.5pt", color: "#444", marginTop: "1.5mm", fontStyle: "italic" }}>
              {(() => {
                const d = latestPriceDate(catalogMap.values());
                return d
                  ? `Цены актуальны на ${format(new Date(d), "d MMMM yyyy 'г.'", { locale: ru })}, могут отличаться ±15–20% в зависимости от аптеки. `
                  : "Расчёт ориентировочный, ±15–20% в зависимости от аптеки. ";
              })()}
              Стоимость процедур, расходных материалов и услуг клиники в расчёт не включена.
              {costBreakdown.missing.length > 0 ? ` Цены не заданы для ${costBreakdown.missing.length} позиций — они не учтены.` : ""}
            </div>
          </div>
        )}


        {/* Signature */}
        <div style={{ marginTop: "12mm", display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "10pt", gap: "8mm" }}>
          <div>
            Врач: ________________________
            <div style={{ marginTop: "1mm" }}>проф., д.м.н. Тарусин Д.И.</div>
            <div style={{ marginTop: "1mm" }}>М.П.   Дата: {format(date, "dd.MM.yyyy")}</div>
          </div>
          {qrDataUrl && (
            <div style={{ textAlign: "center" }}>
              <img src={qrDataUrl} alt="QR-код памятки" style={{ width: "25mm", height: "25mm", display: "block" }} />
              <div style={{ fontSize: "8pt", marginTop: "1mm", color: "#444", maxWidth: "30mm" }}>Памятка пациента онлайн</div>
            </div>
          )}
        </div>

      </div>

      {showCalendar && (
        <div
          className="print-page calendar-page bg-white text-black mx-auto shadow-lg"
          style={{
            width: landscape ? "297mm" : "210mm",
            minHeight: landscape ? "210mm" : "297mm",
            padding: "12mm",
            marginTop: "8mm",
            fontFamily: "Times New Roman, serif",
            fontSize: compact ? "8pt" : "9pt",
            lineHeight: 1.2,
          }}
        >
          <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12pt", marginBottom: "3mm", letterSpacing: "1px" }}>
            КАЛЕНДАРЬ КУРСА{plan.course_number != null ? ` № ${plan.course_number}` : ""} — {plan.patient?.full_name}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #000", padding: "1mm 2mm", textAlign: "left", width: compact ? "38mm" : "55mm", background: "#f0f0f0" }}>
                  Позиция
                </th>
                {Array.from({ length: plan.duration_days }, (_, i) => i + 1).map(d => (
                  <th key={d} style={{ border: "1px solid #000", padding: "1mm 0", textAlign: "center", background: "#f0f0f0", fontSize: compact ? "7pt" : "8pt" }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduledItems.map(it => {
                const days = expandPattern(it.day_pattern, plan.duration_days, it.duration_days);
                return (
                  <tr key={it.id}>
                    <td style={{ border: "1px solid #000", padding: "1mm 2mm", fontSize: compact ? "7.5pt" : "8.5pt" }}>
                      {it.name_snapshot}
                      {it.dose != null && (
                        <span style={{ color: "#555" }}> — {it.dose}{it.dose_unit ? " " + it.dose_unit : ""}</span>
                      )}
                    </td>
                    {Array.from({ length: plan.duration_days }, (_, i) => i + 1).map(d => (
                      <td
                        key={d}
                        style={{
                          border: "1px solid #ccc",
                          background: days.has(d) ? "#888" : "transparent",
                          padding: 0,
                          height: compact ? "4mm" : "5mm",
                        }}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: "3mm", fontSize: "8pt", color: "#444" }}>
            Серая заливка — дни приёма согласно паттерну. Всего позиций по расписанию: {scheduledItems.length}.
          </div>
        </div>
      )}
    </div>
  );
}
