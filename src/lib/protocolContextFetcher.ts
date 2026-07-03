// Fetch textual content of the currently-active patient protocol
// (visit / ultrasound / treatment_plan / consultation round) so it can be
// injected into the Cabinet assistant question as background context.

import { supabase } from "@/integrations/supabase/client";
import { normalizeImportedProtocolData } from "@/lib/visits/normalizeProtocolData";
import type { ActivePatientContext } from "@/lib/protocolBridge";

const LABELS: Record<string, string> = {
  complaints: "Жалобы",
  anamnesis: "Анамнез",
  dynamics: "Динамика",
  general_status: "Общий/соматический статус",
  ortho_status: "Ортопедический статус",
  neuro_status: "Неврологический статус",
  psych_status: "Психологический статус",
  wound_status: "Состояние раны",
  operation_name: "Операция",
  operation_date: "Дата операции",
  pain: "Болевой синдром",
  temperature: "Температура",
  working_diagnosis: "Рабочий диагноз",
  diagnosis: "Диагноз",
  conclusion: "Заключение",
  exam_plan: "План обследования",
  recommendations: "Рекомендации",
  cbc: "ОАК",
  urinalysis: "ОАМ",
  biochem: "Биохимия",
  hormones: "Гормоны",
  other_labs: "Прочие анализы",
  uzi_express: "УЗИ (экспресс)",
  sexual_formula_text: "Половая формула",
  sexual_constitution: "Половая конституция",
  indications: "Показания",
};

const LS_FIELDS: Record<string, string> = {
  external_genitalia: "Наружные половые органы",
  penis: "Половой член",
  perineum: "Промежность",
  scrotum: "Мошонка",
  right_testis: "Правое яичко",
  left_testis: "Левое яичко",
  right: "Справа",
  left: "Слева",
  epididymis: "Придатки",
  spermatic_cord: "Семенные канатики",
  inguinal_rings: "Паховые кольца",
  notes: "Примечания",
};

function block(title: string, body: string): string {
  return `### ${title}\n${body.trim()}`;
}

function formatVisit(data: any): string {
  if (!data || typeof data !== "object") return "";
  const norm = normalizeImportedProtocolData((data.type || "primary_short") as any, data);
  const parts: string[] = [];
  for (const [key, label] of Object.entries(LABELS)) {
    const v = norm[key];
    if (typeof v === "string" && v.trim()) parts.push(block(label, v));
  }
  const ls = norm.local_status;
  if (ls && typeof ls === "object") {
    const lsParts: string[] = [];
    for (const [k, ru] of Object.entries(LS_FIELDS)) {
      const v = (ls as any)[k];
      if (typeof v === "string" && v.trim()) lsParts.push(`- ${ru}: ${v.trim()}`);
    }
    if (lsParts.length) parts.push(block("Локальный статус", lsParts.join("\n")));
  }
  const somatic = norm.somatic;
  if (somatic && typeof somatic === "object") {
    const t = somatic.full_text || somatic.general;
    if (typeof t === "string" && t.trim()) parts.push(block("Соматический статус", t));
  }
  // Fallback: если ничего не собралось — вывалим fields как есть.
  if (!parts.length && norm.fields && typeof norm.fields === "object") {
    const raw: string[] = [];
    for (const [k, v] of Object.entries(norm.fields)) {
      if (typeof v === "string" && v.trim()) raw.push(`- ${k}: ${v.trim()}`);
    }
    if (raw.length) parts.push(block("Поля протокола", raw.slice(0, 40).join("\n")));
  }
  return parts.join("\n\n");
}

function truncate(s: string, max = 12000): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n\n[…обрезано ${s.length - max} симв.]`;
}

export async function fetchActiveProtocolText(
  ctx: ActivePatientContext,
): Promise<string | null> {
  try {
    if (ctx.kind === "visit" && ctx.targetId) {
      const { data } = await supabase
        .from("patient_visits")
        .select("id, visit_date, protocol_type, protocol_data, patient:patients(full_name, birth_date, history_number)")
        .eq("id", ctx.targetId)
        .maybeSingle();
      if (!data) return null;
      const patient = (data as any).patient;
      const head = [
        `Пациент: ${patient?.full_name || ctx.patientName}`,
        patient?.birth_date ? `Дата рождения: ${patient.birth_date}` : null,
        patient?.history_number ? `№ истории: ${patient.history_number}` : null,
        (data as any).visit_date ? `Дата визита: ${(data as any).visit_date}` : null,
        (data as any).protocol_type ? `Тип протокола: ${(data as any).protocol_type}` : null,
      ].filter(Boolean).join("\n");
      const body = formatVisit((data as any).protocol_data);
      return truncate([head, body].filter(Boolean).join("\n\n"));
    }

    if (ctx.kind === "ultrasound" && ctx.targetId) {
      const { data } = await supabase
        .from("ultrasound_results")
        .select("*")
        .eq("id", ctx.targetId)
        .maybeSingle();
      if (!data) return null;
      const d = data as Record<string, any>;
      const lines: string[] = [`Пациент: ${ctx.patientName}`];
      const skip = new Set(["id", "patient_id", "created_at", "updated_at", "user_id"]);
      for (const [k, v] of Object.entries(d)) {
        if (skip.has(k)) continue;
        if (v === null || v === undefined || v === "" || v === false) continue;
        if (typeof v === "object") {
          try { lines.push(`- ${k}: ${JSON.stringify(v)}`); } catch { /* skip */ }
        } else {
          lines.push(`- ${k}: ${v}`);
        }
      }
      return truncate(lines.join("\n"));
    }

    if (ctx.kind === "treatment_plan" && ctx.targetId) {
      const [{ data: plan }, { data: items }] = await Promise.all([
        supabase.from("treatment_plans").select("*").eq("id", ctx.targetId).maybeSingle(),
        supabase.from("treatment_plan_items").select("*").eq("plan_id", ctx.targetId),
      ]);
      if (!plan) return null;
      const p = plan as Record<string, any>;
      const parts: string[] = [`Пациент: ${ctx.patientName}`];
      if (p.diagnosis) parts.push(block("Диагноз", String(p.diagnosis)));
      if (p.complaints) parts.push(block("Жалобы", String(p.complaints)));
      if (p.anamnesis) parts.push(block("Анамнез", String(p.anamnesis)));
      if (p.notes) parts.push(block("Примечания", String(p.notes)));
      if (Array.isArray(items) && items.length) {
        const rows = items.map((it: any) => {
          const bits = [it.name, it.dose ? `${it.dose} ${it.dose_unit || ""}` : "", it.frequency, it.duration_days ? `${it.duration_days} дн` : ""].filter(Boolean).join(" · ");
          return `- ${bits}`;
        });
        parts.push(block("Назначения плана", rows.join("\n")));
      }
      return truncate(parts.join("\n\n"));
    }

    if (ctx.kind === "consultation" && ctx.targetId) {
      const { data } = await supabase
        .from("consultation_rounds")
        .select("*")
        .eq("id", ctx.targetId)
        .maybeSingle();
      if (!data) return null;
      const d = data as Record<string, any>;
      const parts: string[] = [`Пациент: ${ctx.patientName}`];
      for (const k of ["complaints", "anamnesis", "status", "findings", "conclusion", "recommendations", "notes"]) {
        if (d[k]) parts.push(block(k, String(d[k])));
      }
      return truncate(parts.join("\n\n"));
    }
  } catch (e) {
    console.error("[protocolContextFetcher]", e);
    return null;
  }
  return null;
}
