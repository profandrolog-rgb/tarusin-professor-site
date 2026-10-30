/**
 * Сопоставление выданных путёвок с операционным журналом.
 * Путёвка считается «прооперированной», если в журнале есть операция
 * этого пациента (ФИО + дата рождения) не раньше даты выдачи путёвки,
 * либо у путёвки статус «Оперирован».
 */
export interface ReferralLite {
  id: string;
  full_name: string;
  birth_date: string | null;
  created_at: string;
  status: string;
  operation_name?: string | null;
  diagnosis?: string | null;
  planned_date_from?: string | null;
  planned_date_to?: string | null;
}

export interface JournalLite {
  id: string;
  patient_name: string;
  patient_birth_date: string | null;
  operation_date: string;
  operation_name: string;
}

export const normName = (s?: string | null) =>
  (s || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();

export interface MatchedReferral extends ReferralLite {
  operation: JournalLite | null;
  operated: boolean;
}

export function matchReferrals(refs: ReferralLite[], journal: JournalLite[]): MatchedReferral[] {
  return refs.map((r) => {
    const name = normName(r.full_name);
    const issued = (r.created_at || "").slice(0, 10);
    const candidates = journal
      .filter((j) => normName(j.patient_name) === name)
      .filter((j) => !r.birth_date || !j.patient_birth_date || j.patient_birth_date === r.birth_date)
      .filter((j) => !issued || j.operation_date >= issued)
      .sort((a, b) => a.operation_date.localeCompare(b.operation_date));
    const operation = candidates[0] ?? null;
    return { ...r, operation, operated: !!operation || r.status === "operated" };
  });
}

export function effectivenessStats(rows: MatchedReferral[]) {
  const issued = rows.length;
  const operated = rows.filter((r) => r.operated).length;
  const notServed = issued - operated;
  const percent = issued ? Math.round((operated / issued) * 1000) / 10 : 0;
  return { issued, operated, notServed, percent };
}
