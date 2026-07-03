// Собирает полную ретроспективу пациента из всех медицинских таблиц
// и формирует контекст для передачи в AI (обычный чат / консилиум).
// Возвращает: markdown-блок «Хронология», таблица динамики антропо/УЗИ,
// плюс сводку количества записей для UI-индикатора.

import { supabase } from "@/integrations/supabase/client";

export interface HistoryCounts {
  visits: number;
  ultrasound: number;
  labs: number;
  anthropometry: number;
  plans: number;
  rounds: number;
  documents: number;
  diagnoses: number;
  metabolic: number;
}

export interface PatientHistoryResult {
  text: string;
  counts: HistoryCounts;
}

const MAX = 200_000; // ~200KB текста — модели обычно выдерживают

function fmtDate(v: any): string {
  if (!v) return "—";
  try { return new Date(v).toISOString().slice(0, 10); } catch { return String(v); }
}

function stringifyValue(v: any): string {
  if (v == null || v === "" || v === false) return "";
  if (typeof v === "object") {
    try {
      const s = JSON.stringify(v);
      return s.length > 800 ? s.slice(0, 800) + "…" : s;
    } catch { return ""; }
  }
  return String(v);
}

function flattenRow(row: Record<string, any>, skip: Set<string>): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(row)) {
    if (skip.has(k)) continue;
    const s = stringifyValue(v);
    if (s) out.push(`- ${k}: ${s}`);
  }
  return out;
}

const SKIP_META = new Set(["id", "patient_id", "user_id", "created_at", "updated_at", "created_by"]);

// Ключевые числовые показатели, за которыми строим динамику
const ANTHRO_METRICS: Array<[string, string]> = [
  ["height_cm", "Рост, см"],
  ["weight_kg", "Вес, кг"],
  ["bmi", "ИМТ"],
  ["bsa", "BSA, м²"],
  ["head_circumference_cm", "Окр. головы, см"],
  ["waist_circumference_cm", "Окр. талии, см"],
  ["tanner_stage", "Tanner"],
  ["penile_length_cm", "L полового члена"],
];

function buildDynamicsTable(
  title: string,
  rows: Array<Record<string, any>>,
  dateField: string,
  metrics: Array<[string, string]>,
): string {
  if (!rows.length) return "";
  const sorted = [...rows].sort((a, b) => {
    const da = new Date(a[dateField] ?? a.created_at ?? 0).getTime();
    const db = new Date(b[dateField] ?? b.created_at ?? 0).getTime();
    return da - db;
  });
  const usedMetrics = metrics.filter(([k]) => sorted.some((r) => r[k] != null && r[k] !== ""));
  if (!usedMetrics.length) return "";
  const header = "| Дата | " + usedMetrics.map(([, ru]) => ru).join(" | ") + " |";
  const sep = "|" + "---|".repeat(usedMetrics.length + 1);
  const body = sorted.map((r) => {
    const cells = usedMetrics.map(([k]) => {
      const v = r[k];
      return v == null || v === "" ? "—" : String(v);
    });
    return `| ${fmtDate(r[dateField] ?? r.created_at)} | ${cells.join(" | ")} |`;
  });
  return `### ${title}\n${header}\n${sep}\n${body.join("\n")}`;
}

export async function fetchPatientHistory(patientId: string, patientName?: string): Promise<PatientHistoryResult> {
  const counts: HistoryCounts = {
    visits: 0, ultrasound: 0, labs: 0, anthropometry: 0,
    plans: 0, rounds: 0, documents: 0, diagnoses: 0, metabolic: 0,
  };

  const [
    visitsRes, uzRes, labsRes, anthroRes, plansRes,
    diagRes, docsRes, mapRes, patientRes,
  ] = await Promise.all([
    supabase.from("patient_visits").select("*").eq("patient_id", patientId).order("visit_date", { ascending: true }),
    supabase.from("ultrasound_results").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
    supabase.from("lab_results").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
    supabase.from("anthropometry_measurements").select("*").eq("patient_id", patientId).order("measurement_date", { ascending: true }),
    supabase.from("treatment_plans").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
    supabase.from("patient_diagnosis_timeline").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
    supabase.from("patient_documents").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
    supabase.from("metabolic_map_snapshots").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
    supabase.from("patients").select("full_name, birth_date, sex, history_number, notes").eq("id", patientId).maybeSingle(),
  ]);

  const visits = visitsRes.data || [];
  const uz = uzRes.data || [];
  const labs = labsRes.data || [];
  const anthro = anthroRes.data || [];
  const plans = plansRes.data || [];
  const diagnoses = diagRes.data || [];
  const docs = docsRes.data || [];
  const maps = mapRes.data || [];
  const patient = patientRes.data as any;

  // Раунды консультаций пациента: через consultation_cases по имени (нет FK на patients.id)
  let rounds: any[] = [];
  const pname = patient?.full_name || patientName;
  if (pname) {
    const { data: cases } = await supabase
      .from("consultation_cases")
      .select("id")
      .eq("patient_full_name", pname);
    const caseIds = (cases || []).map((c: any) => c.id);
    if (caseIds.length) {
      const { data: rr } = await supabase
        .from("consultation_rounds")
        .select("*")
        .in("case_id", caseIds)
        .order("created_at", { ascending: true });
      rounds = rr || [];
    }
  }

  counts.visits = visits.length;
  counts.ultrasound = uz.length;
  counts.labs = labs.length;
  counts.anthropometry = anthro.length;
  counts.plans = plans.length;
  counts.rounds = rounds.length;
  counts.documents = docs.length;
  counts.diagnoses = diagnoses.length;
  counts.metabolic = maps.length;

  const parts: string[] = [];
  const head: string[] = [];
  head.push(`# Ретроспектива пациента: ${patient?.full_name || patientName || patientId}`);
  if (patient?.birth_date) head.push(`Дата рождения: ${patient.birth_date}`);
  if (patient?.sex) head.push(`Пол: ${patient.sex}`);
  if (patient?.history_number) head.push(`№ истории: ${patient.history_number}`);
  parts.push(head.join("\n"));

  // Динамика — таблицы
  const anthroTable = buildDynamicsTable("Динамика антропометрии", anthro, "measurement_date", ANTHRO_METRICS);
  if (anthroTable) parts.push(anthroTable);

  // УЗИ: динамика по всем числовым полям, что встречались хотя бы дважды
  if (uz.length) {
    const numericKeys = new Map<string, number>();
    for (const r of uz) {
      for (const [k, v] of Object.entries(r as any)) {
        if (SKIP_META.has(k)) continue;
        if (typeof v === "number" || (typeof v === "string" && v !== "" && !isNaN(Number(v)))) {
          numericKeys.set(k, (numericKeys.get(k) || 0) + 1);
        }
      }
    }
    const keys = [...numericKeys.entries()].filter(([, c]) => c >= 2).map(([k]) => [k, k] as [string, string]);
    const uzTable = buildDynamicsTable("Динамика УЗИ (числовые показатели)", uz, "created_at", keys);
    if (uzTable) parts.push(uzTable);
  }

  // Диагнозы — таймлайн
  if (diagnoses.length) {
    const rows = diagnoses.map((d: any) => `- ${fmtDate(d.diagnosis_date ?? d.created_at)}: ${d.icd10 || ""} ${d.diagnosis_text || d.notes || ""}`.trim());
    parts.push(`### Диагнозы (хронология)\n${rows.join("\n")}`);
  }

  // Визиты
  if (visits.length) {
    const blocks = visits.map((v: any) => {
      const inner = flattenRow(v.protocol_data || {}, new Set(["type"]));
      return `#### Визит ${fmtDate(v.visit_date)} (${v.protocol_type || "?"})\n${inner.join("\n") || "(без структурированных данных)"}`;
    });
    parts.push(`### Осмотры / визиты\n${blocks.join("\n\n")}`);
  }

  // УЗИ — тексты заключений
  if (uz.length) {
    const blocks = uz.map((r: any) => {
      const lines = flattenRow(r, SKIP_META);
      return `#### УЗИ ${fmtDate(r.created_at)}\n${lines.join("\n")}`;
    });
    parts.push(`### УЗИ (полные записи)\n${blocks.join("\n\n")}`);
  }

  // Лабораторные
  if (labs.length) {
    const blocks = labs.map((r: any) => {
      const lines = flattenRow(r, SKIP_META);
      return `- ${fmtDate(r.test_date ?? r.created_at)}: ${lines.join("; ")}`;
    });
    parts.push(`### Лабораторные результаты\n${blocks.join("\n")}`);
  }

  // Планы лечения
  if (plans.length) {
    const blocks = plans.map((p: any) => {
      const bits = [
        p.diagnosis_short && `Диагноз: ${p.diagnosis_short}`,
        p.mode && `Режим: ${p.mode}`,
        p.duration_days && `Курс: ${p.duration_days} дн`,
        p.status && `Статус: ${p.status}`,
      ].filter(Boolean).join(" · ");
      return `- ${fmtDate(p.issued_at ?? p.created_at)}: ${bits}`;
    });
    parts.push(`### Планы лечения\n${blocks.join("\n")}`);
  }

  // Раунды консультаций
  if (rounds.length) {
    const blocks = rounds.map((r: any) => {
      const body = [
        r.complaints && `Жалобы: ${r.complaints}`,
        r.medical_history && `Анамнез: ${r.medical_history}`,
        r.ai_assessment && `AI-заключение: ${r.ai_assessment}`,
        r.doctor_conclusion && `Заключение врача: ${r.doctor_conclusion}`,
      ].filter(Boolean).join("\n");
      return `#### Раунд #${r.round_number ?? "?"} — ${fmtDate(r.created_at)}\n${body}`;
    });
    parts.push(`### Онлайн-консультации (раунды)\n${blocks.join("\n\n")}`);
  }

  // Документы
  if (docs.length) {
    const rows = docs.map((d: any) => `- ${fmtDate(d.created_at)}: ${d.title || d.file_name || "документ"} ${d.description ? "— " + d.description : ""}`);
    parts.push(`### Документы\n${rows.join("\n")}`);
  }

  // Metabolic map snapshots
  if (maps.length) {
    const rows = maps.map((m: any) => `- ${fmtDate(m.created_at)}: снимок метаболической карты (${m.summary || m.notes || "без комментария"})`);
    parts.push(`### Метаболическая карта — снимки\n${rows.join("\n")}`);
  }

  parts.push(
    `---\n### Инструкция моделям\n` +
    `Проанализируй ретроспективу пациента в хронологическом порядке. Обязательно укажи: ` +
    `(1) что изменилось между визитами/УЗИ/анализами; (2) положительная или отрицательная динамика; ` +
    `(3) какие показатели вышли за референсные значения и когда; (4) связь между предыдущими заключениями и текущим состоянием; ` +
    `(5) рекомендации с учётом всей истории, а не только последнего эпизода.`
  );

  let text = parts.join("\n\n");
  if (text.length > MAX) text = text.slice(0, MAX) + `\n\n[…ретроспектива обрезана: ${text.length - MAX} симв.]`;

  return { text, counts };
}

export function summarizeCounts(c: HistoryCounts): string {
  const bits: string[] = [];
  if (c.visits) bits.push(`визитов: ${c.visits}`);
  if (c.ultrasound) bits.push(`УЗИ: ${c.ultrasound}`);
  if (c.labs) bits.push(`анализов: ${c.labs}`);
  if (c.anthropometry) bits.push(`антропо: ${c.anthropometry}`);
  if (c.plans) bits.push(`планов: ${c.plans}`);
  if (c.rounds) bits.push(`раундов: ${c.rounds}`);
  if (c.diagnoses) bits.push(`диагнозов: ${c.diagnoses}`);
  if (c.documents) bits.push(`документов: ${c.documents}`);
  if (c.metabolic) bits.push(`карт: ${c.metabolic}`);
  return bits.join(" · ") || "записей не найдено";
}
