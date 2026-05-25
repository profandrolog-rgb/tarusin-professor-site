import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Public-facing plan view. Strips MNN, off-label, costs, hidden positions, internal notes.

type Section = "iv_drip"|"iv_bolus"|"im"|"sc"|"oral_rx"|"oral_supplement"|"rectal"|"topical"|"nasal"|"sublingual"|"peptide"|"procedure"|"lifestyle";

interface PublicItem {
  id: string;
  catalog_id: string | null;
  section_category: Section;
  order_index: number;
  name_snapshot: string;
  dose: number | null;
  dose_unit: string | null;
  frequency: string | null;
  duration_days: number | null;
  time_of_day: string[] | null;
  route_override: string | null;
  day_pattern: string | null;
  patient_info: {
    patient_name?: string | null;
    patient_description?: string | null;
    patient_visibility?: string | null;
    patient_group_label?: string | null;
    patient_purpose?: string | null;
    patient_instruction?: string | null;
    patient_caution?: string | null;
  } | null;
}

interface PublicPayload {
  plan: {
    id: string;
    issued_at: string;
    duration_days: number;
    diagnosis_short: string | null;
    course_number: number | null;
    lab_control_enabled: boolean | null;
    mode: string;
  };
  patient: { full_name: string; birth_date: string } | null;
  items: PublicItem[];
  lab_control: Array<{
    id: string;
    control_point: string | null;
    at_day: number | null;
    test_ids: string[] | null;
    custom_tests: string[] | null;
    notes: string | null;
    order_index: number;
  }>;
  test_names: Record<string, string>;
}

const GROUPS: Array<{ key: string; emoji: string; label: string; cats: Section[] }> = [
  { key: "iv",   emoji: "💧", label: "Внутривенные капельницы", cats: ["iv_drip", "iv_bolus"] },
  { key: "inj",  emoji: "💉", label: "Уколы (в/м, п/к, пептиды)", cats: ["im", "sc", "peptide"] },
  { key: "rx",   emoji: "💊", label: "Таблетки и капсулы по рецепту", cats: ["oral_rx"] },
  { key: "supp", emoji: "🌿", label: "Витамины и БАДы", cats: ["oral_supplement"] },
  { key: "top",  emoji: "🖐", label: "Наружные средства (гели, кремы)", cats: ["topical"] },
  { key: "rect", emoji: "🔻", label: "Ректальные свечи", cats: ["rectal"] },
  { key: "nas",  emoji: "👃", label: "Назальные средства", cats: ["nasal"] },
  { key: "sub",  emoji: "👅", label: "Под язык", cats: ["sublingual"] },
  { key: "proc", emoji: "🩺", label: "Процедуры", cats: ["procedure"] },
  { key: "life", emoji: "🌟", label: "Образ жизни и рекомендации", cats: ["lifestyle"] },
];

export default function PublicTreatmentPlan() {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<PublicPayload | null>(null);
  const [busy, setBusy] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!hash) { setNotFound(true); setBusy(false); return; }
    (async () => {
      const { data: row, error } = await supabase.rpc("get_public_plan", { _hash: hash });
      if (error || !row) { setNotFound(true); setBusy(false); return; }
      setData(row as unknown as PublicPayload);
      setBusy(false);
      // Fire-and-forget view increment
      supabase.rpc("increment_public_plan_view", { _hash: hash }).then(() => {});
    })();
  }, [hash]);

  const groups = useMemo(() => {
    if (!data) return [] as Array<{ emoji: string; label: string; items: Array<{ name: string; description: string }> }>;
    const byCat: Partial<Record<Section, Array<{ name: string; description: string; isGroup?: boolean }>>> = {};
    data.items.forEach(it => {
      const info = it.patient_info || {};
      const name = (info.patient_name?.trim()) || it.name_snapshot;
      const parts = [info.patient_purpose, info.patient_instruction, info.patient_description, info.patient_caution]
        .map(s => (s || "").trim()).filter(Boolean);
      const description = parts.join(" ");
      if ((info.patient_visibility || "visible") === "grouped" && info.patient_group_label) {
        const arr = byCat[it.section_category] ??= [];
        const existing = arr.find(x => x.isGroup && x.name === info.patient_group_label);
        if (existing) {
          if (description && !existing.description.includes(description)) {
            existing.description = existing.description ? `${existing.description}; ${description}` : description;
          }
        } else {
          arr.push({ name: info.patient_group_label, description, isGroup: true });
        }
        return;
      }
      (byCat[it.section_category] ??= []).push({ name, description });
    });
    return GROUPS.map(g => {
      const merged: Array<{ name: string; description: string }> = [];
      g.cats.forEach(c => merged.push(...((byCat[c] || []) as any)));
      return merged.length ? { emoji: g.emoji, label: g.label, items: merged } : null;
    }).filter(Boolean) as Array<{ emoji: string; label: string; items: Array<{ name: string; description: string }> }>;
  }, [data]);

  if (busy) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }
  if (notFound || !data) {
    return (
      <>
        <Helmet><meta name="robots" content="noindex, nofollow"/><title>Памятка не найдена</title></Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-2xl font-bold mb-2">Памятка недоступна</h1>
          <p className="text-muted-foreground">Ссылка устарела или была отозвана. Обратитесь к лечащему врачу.</p>
        </div>
      </>
    );
  }

  const date = new Date(data.plan.issued_at);
  const labRows = data.plan.lab_control_enabled ? data.lab_control : [];

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow"/>
        <title>Памятка пациенту — Профессор Тарусин Д.И.</title>
      </Helmet>
      <div className="min-h-screen bg-muted/30 py-6 print:bg-white print:py-0">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .memo-page { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 15mm !important; }
            @page { size: A4 portrait; margin: 15mm; }
          }
        `}</style>

        <div className="memo-page bg-white text-black mx-auto shadow-lg" style={{ maxWidth: "210mm", minHeight: "297mm", padding: "10mm", fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.55 }}>
          {/* Letterhead */}
          <div style={{ borderBottom: "2px solid #000", paddingBottom: "4mm", marginBottom: "6mm" }}>
            <div style={{ textAlign: "center", fontSize: "10pt", letterSpacing: "0.5px" }}>
              Министерство здравоохранения Российской Федерации
            </div>
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13pt", marginTop: "2mm" }}>
              Профессор, д.м.н. Тарусин Дмитрий Игоревич
            </div>
            <div style={{ textAlign: "center", fontSize: "9.5pt", marginTop: "1mm", color: "#444" }}>
              Детский уролог-андролог высшей категории · Московский андрологический центр
            </div>
          </div>

          <h1 className="text-center font-bold tracking-wide" style={{ fontSize: "22pt", marginBottom: "4mm" }}>
            ПАМЯТКА ПАЦИЕНТУ{data.plan.course_number != null ? ` · Курс № ${data.plan.course_number}` : ""}
          </h1>
          <p className="text-center" style={{ fontSize: "11pt", color: "#555", marginBottom: "2mm" }}>
            для <b style={{ color: "#000" }}>{data.patient?.full_name || "—"}</b>
            {" · "}курс {data.plan.duration_days} дней
            {" · "}{format(date, "d MMMM yyyy 'г.'", { locale: ru })}
          </p>
          <p className="text-center italic" style={{ color: "#555", fontSize: "10.5pt", marginBottom: "8mm" }}>
            Это пояснение к листу назначений простым языком. Если что-то непонятно — звоните или пишите перед началом курса.
          </p>

          {groups.length === 0 && (
            <p className="text-center italic" style={{ color: "#888" }}>Памятка пока не заполнена.</p>
          )}

          {groups.map(g => (
            <section key={g.label} style={{ marginBottom: "6mm", breakInside: "avoid" }}>
              <h2 className="font-bold uppercase tracking-wider" style={{ fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }}>
                {g.emoji} {g.label}
              </h2>
              <ul style={{ paddingLeft: "6mm", margin: 0 }}>
                {g.items.map((it, i) => (
                  <li key={i} style={{ marginBottom: "2.5mm" }}>
                    <b>{it.name}</b>
                    {it.description ? <span> — {it.description}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {labRows.length > 0 && (
            <section style={{ marginTop: "6mm", breakInside: "avoid" }}>
              <h2 className="font-bold uppercase tracking-wider" style={{ fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }}>
                🔬 Контроль на фоне терапии
              </h2>
              <ul style={{ paddingLeft: "6mm", margin: 0 }}>
                {labRows.map(lc => {
                  const tests = [
                    ...((lc.test_ids || []).map(tid => data.test_names[tid]).filter(Boolean) as string[]),
                    ...(lc.custom_tests || []),
                  ];
                  return (
                    <li key={lc.id} style={{ marginBottom: "2mm" }}>
                      <b>{lc.control_point || "Контроль"}</b>
                      {lc.at_day != null ? ` (день ${lc.at_day})` : ""}
                      {tests.length ? ` — ${tests.join(", ")}` : ""}
                      {lc.notes ? <div style={{ fontSize: "10pt", color: "#555", fontStyle: "italic", marginTop: "0.5mm" }}>{lc.notes}</div> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Contacts */}
          <section style={{ marginTop: "10mm", paddingTop: "4mm", borderTop: "1px solid #ccc", fontSize: "10pt", color: "#333" }}>
            <div style={{ fontWeight: "bold", marginBottom: "1.5mm" }}>📞 Контакты МАЦ</div>
            <div>Московский андрологический центр</div>
            <div>Сайт: <a href="https://tarusin-professor.ru" style={{ color: "#0066cc" }}>tarusin-professor.ru</a></div>
            <div style={{ marginTop: "1mm", fontStyle: "italic", color: "#666" }}>
              Памятка не заменяет лист назначений и консультацию врача. Все вопросы — на приёме или по телефону.
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
