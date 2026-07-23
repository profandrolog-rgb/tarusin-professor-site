/**
 * Резолвер референсных границ и фильтр путей по полу пациента.
 *
 * Приоритет подбора референса СТРОГО ТАКОЙ:
 *   (1) референс с бланка (lab.reference_min / reference_max);
 *   (2) reference_ranges по совпадению analyte_code + sex (sex='A' матчит любой) + возраст;
 *   (3) только для фазозависимых показателей (E2, PROG, LH, FSH при sex='F')
 *       дополнительно требуется совпадение по phase (или status у девочек).
 *
 * Ключевая защита: если у женского фазозависимого показателя фаза не указана
 * (cyclePhase = null / 'unknown') — резолвер НЕ подставляет референс по умолчанию,
 * а возвращает { needsPhase: true }, чтобы правило не сработало ложно.
 *
 * Для мужских и общих (sex='A') показателей phase/status игнорируются.
 */

import { supabase } from "@/integrations/supabase/client";

export type PatientSex = "M" | "F" | null;
export type CyclePhase = "follicular" | "ovulatory" | "luteal" | "postmenopause" | "unknown" | null;
export type ReproStatus =
  | "prepubertal" | "pubertal" | "reproductive" | "pregnant" | "postmenopause" | "pediatric"
  | "unknown" | null;

export interface PatientCtx {
  sex: PatientSex;
  ageYears: number | null;
  cyclePhase: CyclePhase;
  reproStatus: ReproStatus;
}

export interface ReferenceRow {
  analyte_code: string;
  sex: "M" | "F" | "A";
  phase: string | null;
  status: string | null;
  age_min_years: number;
  age_max_years: number;
  ref_low: number | null;
  ref_high: number | null;
  unit: string | null;
}

/** Фазозависимые показатели у женщин — их референс обязательно требует фазы. */
export const PHASE_DEPENDENT_CODES = new Set(["E2", "PROG", "LH", "FSH"]);

function up(s: unknown): string {
  return String(s ?? "").toUpperCase().trim();
}

/** Возраст пациента укладывается в интервал [age_min_years, age_max_years). */
function ageMatches(ageYears: number | null, row: ReferenceRow): boolean {
  if (ageYears == null) return true; // возраст неизвестен — не фильтруем по возрасту
  return ageYears >= Number(row.age_min_years) && ageYears < Number(row.age_max_years);
}

export interface ResolvedRef {
  ref_low: number | null;
  ref_high: number | null;
  source: "blank" | "reference_ranges";
}
export type ResolveResult = ResolvedRef | { needsPhase: true } | null;

/**
 * Возвращает границы референса для конкретного лабораторного значения.
 * lab_reference_min/max — то, что пришло с бланка (может быть null).
 * refIndex — предзагруженный набор reference_ranges для нужных analyte_code.
 * rulePhase — если правило явно указывает фазу (rule.when.phase), она должна
 *   совпадать с фазой пациентки, иначе правило неприменимо → null.
 */
export function resolveReference(args: {
  analyteCode: string | null | undefined;
  labReferenceMin: number | null;
  labReferenceMax: number | null;
  ctx: PatientCtx;
  refIndex: ReferenceRow[];
  rulePhase?: string | null;
}): ResolveResult {
  const { labReferenceMin, labReferenceMax, ctx, refIndex, rulePhase } = args;
  const code = up(args.analyteCode);

  // (1) референс с бланка — высший приоритет
  if (labReferenceMin != null || labReferenceMax != null) {
    return { ref_low: labReferenceMin, ref_high: labReferenceMax, source: "blank" };
  }

  if (!code) return null;

  const isPhaseDepFemale = ctx.sex === "F" && PHASE_DEPENDENT_CODES.has(code);

  // Фазозависимый показатель у женщины — обязательное совпадение по фазе
  if (isPhaseDepFemale) {
    const phase = ctx.cyclePhase && ctx.cyclePhase !== "unknown" ? ctx.cyclePhase : null;
    const status = ctx.reproStatus && ctx.reproStatus !== "unknown" ? ctx.reproStatus : null;
    // Если в правиле явно задана фаза — она обязана совпасть, иначе правило не наше
    if (rulePhase && phase && rulePhase !== phase) return null;
    // Ни фазы, ни статуса — не подставляем ничего, требуем контекст цикла
    if (!phase && !status) return { needsPhase: true };
    const targetPhase = rulePhase || phase;
    const row = refIndex.find(
      (r) =>
        up(r.analyte_code) === code &&
        (r.sex === "F" || r.sex === "A") &&
        ((targetPhase && r.phase === targetPhase) ||
          (status && r.status === status)) &&
        ageMatches(ctx.ageYears, r),
    );
    if (row) return { ref_low: row.ref_low, ref_high: row.ref_high, source: "reference_ranges" };
    // Есть контекст, но подходящей строки нет — трактуем как отсутствие данных
    return null;
  }

  // Общий/мужской показатель. Если для показателя есть статусные интервалы
  // (например, DHEA-S до/во время пубертата), сначала требуем совпадение
  // статуса; без него не подменяем детский интервал взрослым.
  const sexCandidates: Array<"M" | "F" | "A"> = ctx.sex ? [ctx.sex, "A"] : ["A"];
  const matchingRows = refIndex.filter(
    (r) =>
      up(r.analyte_code) === code &&
      sexCandidates.includes(r.sex) &&
      ageMatches(ctx.ageYears, r),
  );
  const status = ctx.reproStatus && ctx.reproStatus !== "unknown" ? ctx.reproStatus : null;
  const statusRow = status
    ? matchingRows.find((r) => !r.phase && r.status === status)
    : undefined;
  if (statusRow) return { ref_low: statusRow.ref_low, ref_high: statusRow.ref_high, source: "reference_ranges" };
  const row = matchingRows.find((r) => !r.phase && !r.status);
  if (row) return { ref_low: row.ref_low, ref_high: row.ref_high, source: "reference_ranges" };
  return null;
}

/**
 * Раскраска узла карты по отклонению значения от референса.
 *   value ∈ [low, high]                    → "norm"
 *   отклонение ≤ 15% от ближней границы    → "mild"
 *   отклонение 15%…50%                     → "moderate"
 *   отклонение > 50%                       → "severe"
 *   нет границ (обе null)                  → "nodata"
 * Если задана только одна граница (low ИЛИ high), проверяется только она.
 * Величина отклонения нормируется на ближнюю границу; если она ≈ 0, берётся
 * ширина диапазона (high - low), чтобы избежать деления на ноль.
 */
export type SeverityLevel = "norm" | "mild" | "moderate" | "severe" | "nodata";

export function severityFromRange(
  value: number | null | undefined,
  refLow: number | null | undefined,
  refHigh: number | null | undefined,
): SeverityLevel {
  if (value == null || !Number.isFinite(Number(value))) return "nodata";
  const v = Number(value);
  const lowOk = refLow != null && Number.isFinite(Number(refLow));
  const highOk = refHigh != null && Number.isFinite(Number(refHigh));
  if (!lowOk && !highOk) return "nodata";
  const low = lowOk ? Number(refLow) : -Infinity;
  const high = highOk ? Number(refHigh) : Infinity;
  if (v >= low && v <= high) return "norm";

  // Отклонение относительно ближайшей нарушенной границы
  const boundary = v < low ? low : high;
  const denom = Math.abs(boundary) > 1e-9
    ? Math.abs(boundary)
    : (lowOk && highOk ? Math.abs(high - low) || 1 : 1);
  const dev = Math.abs(v - boundary) / denom;
  if (dev <= 0.15) return "mild";
  if (dev <= 0.5) return "moderate";
  return "severe";
}

/**
 * Загружает reference_ranges для набора кодов.
 * Пустой список кодов — вернёт пустой массив без запроса.
 */
export async function loadReferenceRanges(codes: string[]): Promise<ReferenceRow[]> {
  const clean = Array.from(new Set(codes.map(up).filter(Boolean)));
  if (!clean.length) return [];
  const { data, error } = await (supabase as any)
    .from("reference_ranges")
    .select("analyte_code, sex, phase, status, age_min_years, age_max_years, ref_low, ref_high, unit")
    .in("analyte_code", clean);
  if (error) {
    console.warn("[metabolic] loadReferenceRanges failed:", error.message);
    return [];
  }
  return (data as ReferenceRow[]) || [];
}

/**
 * Правило «pathways.sex = пол пациента ИЛИ pathways.sex IS NULL».
 * Если пол пациента не указан — показываем только общие пути (sex IS NULL),
 * половые (и мужские, и женские) прячем: карта не должна решать за врача.
 */
export function filterPathwaysBySex<T extends { sex?: string | null }>(
  pathways: T[],
  patientSex: PatientSex,
): T[] {
  if (!patientSex) return pathways.filter((p) => !p.sex);
  return pathways.filter((p) => !p.sex || p.sex === patientSex);
}

/**
 * Извлекает контекст цикла из protocol_data визита.
 * Ожидаемые поля: cycle_phase, cycle_day, repro_status, а также
 * менс_date/cycle_length для «полного» режима, из которого вычисляется фаза.
 */
export function deriveCycleContext(protocolData: any): {
  cyclePhase: CyclePhase;
  cycleDay: number | null;
  reproStatus: ReproStatus;
} {
  if (!protocolData || typeof protocolData !== "object") {
    return { cyclePhase: null, cycleDay: null, reproStatus: null };
  }
  const rawPhase = String(protocolData.cycle_phase || "").toLowerCase();
  const knownPhases = new Set(["follicular", "ovulatory", "luteal", "postmenopause", "unknown"]);
  const rawStatus = String(protocolData.repro_status || "").toLowerCase();
  const knownStatus = new Set([
    "prepubertal", "pubertal", "reproductive", "pregnant", "postmenopause", "pediatric", "unknown",
  ]);
  let phase: CyclePhase = knownPhases.has(rawPhase) ? (rawPhase as CyclePhase) : null;
  const day = Number(protocolData.cycle_day);
  const cycleDay = Number.isFinite(day) && day > 0 ? Math.round(day) : null;

  // Полный режим: если указана дата последней менструации + длина цикла — считаем фазу.
  if (!phase && protocolData.last_period_date) {
    const start = new Date(protocolData.last_period_date);
    const cycleLen = Number(protocolData.cycle_length) || 28;
    if (!Number.isNaN(start.getTime())) {
      const diffDays = Math.floor((Date.now() - start.getTime()) / 86400000);
      const inCycle = ((diffDays % cycleLen) + cycleLen) % cycleLen + 1;
      const ovulation = cycleLen - 14; // ЛГ-пик за 14 дней до конца
      if (inCycle < ovulation - 1) phase = "follicular";
      else if (inCycle <= ovulation + 1) phase = "ovulatory";
      else phase = "luteal";
    }
  }
  const status: ReproStatus = knownStatus.has(rawStatus) ? (rawStatus as ReproStatus) : null;
  return { cyclePhase: phase, cycleDay, reproStatus: status };
}

export function calcAgeYears(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return ms / (365.25 * 24 * 3600 * 1000);
}
