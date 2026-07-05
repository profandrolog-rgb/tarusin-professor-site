import type { ParsedPlanItem } from "@/lib/protocolBridge";
import type { AssignmentsData } from "@/components/visits/AssignmentsPanel";
import { EMPTY_ASSIGNMENTS } from "@/components/visits/AssignmentsPanel";

export type VisitBucket = keyof AssignmentsData;

export const VISIT_BUCKET_LABEL: Record<VisitBucket, string> = {
  examinations: "Обследования",
  treatments: "Медикаменты",
  referrals: "Консультации",
  diet: "Диета и режим",
};

export function bucketForPlanItem(it: ParsedPlanItem): VisitBucket {
  const c = (it.section_category || "").toLowerCase().trim();

  // Latin keys from parse-treatment-recommendations
  const LATIN_MAP: Record<string, VisitBucket> = {
    examination: "examinations",
    exam: "examinations",
    lab: "examinations",
    labs: "examinations",
    imaging: "examinations",
    diagnostic: "examinations",
    referral: "referrals",
    consultation: "referrals",
    consult: "referrals",
    lifestyle: "diet",
    diet: "diet",
    nutrition: "diet",
    iv_drip: "treatments",
    iv_bolus: "treatments",
    im: "treatments",
    sc: "treatments",
    oral_rx: "treatments",
    oral_supplement: "treatments",
    rectal: "treatments",
    topical: "treatments",
    nasal: "treatments",
    sublingual: "treatments",
    peptide: "treatments",
    procedure: "treatments",
    homeopathy: "treatments",
    physiotherapy: "treatments",
  };
  if (LATIN_MAP[c]) return LATIN_MAP[c];

  // Fallback: Russian regex heuristics
  if (/обслед|анализ|узи|кт|мрт|рентг|диагност|допплер|эхо|лаб/.test(c)) return "examinations";
  if (/консульт|направ|специалист/.test(c)) return "referrals";
  if (/диет|питан|режим|образ жизни/.test(c)) return "diet";
  if (/мед|лекар|препар|табл|капс|раств|инъек|мазь|свеч|сироп|капл|бад|пептид|гомеоп|процедур|физио/.test(c))
    return "treatments";
  return "treatments";
}

const bucketFor = bucketForPlanItem;


function formatItem(it: ParsedPlanItem): string {
  const parts: string[] = [];
  parts.push(it.name.trim());
  if (it.dose != null) {
    const u = (it.dose_unit || "").trim();
    parts.push(`— ${it.dose}${u ? " " + u : ""}`);
  } else if (it.dose_unit) {
    parts.push(`— ${it.dose_unit}`);
  }
  if (it.frequency) parts.push(it.frequency);
  if (it.duration_days) parts.push(`${it.duration_days} дн.`);
  if (it.time_of_day && it.time_of_day.length) parts.push(`(${it.time_of_day.join(", ")})`);
  if (it.route_hint) parts.push(it.route_hint);
  if (it.notes) parts.push(`— ${it.notes}`);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Merge parsed plan items into existing assignments (no duplicates by string). */
export function mergePlanItemsIntoAssignments(
  current: AssignmentsData | undefined,
  items: ParsedPlanItem[],
): AssignmentsData {
  const base: AssignmentsData = {
    examinations: [...(current?.examinations ?? EMPTY_ASSIGNMENTS.examinations)],
    treatments: [...(current?.treatments ?? EMPTY_ASSIGNMENTS.treatments)],
    referrals: [...(current?.referrals ?? EMPTY_ASSIGNMENTS.referrals)],
    diet: [...(current?.diet ?? EMPTY_ASSIGNMENTS.diet)],
  };
  for (const it of items) {
    if (!it?.name) continue;
    const b = bucketFor(it);
    const line = formatItem(it);
    if (!line) continue;
    if (!base[b].some((x) => x.trim().toLowerCase() === line.toLowerCase())) {
      base[b].push(line);
    }
  }
  return base;
}
