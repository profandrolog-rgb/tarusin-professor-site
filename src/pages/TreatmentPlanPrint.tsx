import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Printer, Loader2 } from "lucide-react";
import { SECTIONS, TreatmentCategory } from "@/components/treatment/sections";

interface PlanItemDB {
  id: string;
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
  patient: { full_name: string; birth_date: string } | null;
}

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
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("treatment_plans")
        .select("id, issued_at, duration_days, diagnosis_short, clinical_summary, status, patient:patients(full_name, birth_date)")
        .eq("id", id!).maybeSingle();
      const { data: rows } = await supabase.from("treatment_plan_items")
        .select("*").eq("plan_id", id!).order("section_category").order("order_index");
      setPlan(p as any);
      setItems((rows as any) || []);
      setBusy(false);
      await supabase.from("treatment_plans").update({ print_count: ((p as any)?.print_count ?? 0) + 1 } as any).eq("id", id!);
    })();
  }, [id]);

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

  return (
    <div className="bg-muted/30 min-h-screen py-6">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; border: none !important; }
          @page { size: A4 portrait; margin: 15mm; }
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
          ЛИСТ НАЗНАЧЕНИЙ
        </div>

        {/* Header info */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "3mm" }}>
          <div>Дата выписки: <b>{format(date, "d MMMM yyyy 'г.'", { locale: ru })}</b></div>
          <div>№ {plan.id.slice(0, 8).toUpperCase()}</div>
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
                {list.map(it => (
                  <li key={it.id} style={{ marginBottom: "1.5mm" }}>
                    {renderLine(it, plan.duration_days)}
                    {it.is_off_label && <span style={{ fontSize: "8pt", marginLeft: "2mm" }}>(off-label)</span>}
                  </li>
                ))}
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

        {/* Signature */}
        <div style={{ marginTop: "12mm", display: "flex", justifyContent: "space-between", fontSize: "10pt" }}>
          <div>
            Врач: ________________________
            <div style={{ marginTop: "1mm" }}>проф., д.м.н. Тарусин Д.И.</div>
          </div>
          <div style={{ textAlign: "right" }}>
            М.П.
            <div style={{ marginTop: "1mm" }}>Дата: {format(date, "dd.MM.yyyy")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
