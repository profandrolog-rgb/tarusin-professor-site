/** Дневник ритма микций: 3 суток × 12 строк. Ночь по умолчанию 22:00–06:00, можно отметить вручную. */
export interface DiaryRow { time?: string; drank?: string; voided?: string; night?: boolean }
export interface VoidingDiary { enabled?: boolean; days?: DiaryRow[][]; conclusion?: string }

export const DIARY_DAYS = 3;
export const DIARY_ROWS = 12;

const toMin = (t?: string): number | null => {
  const m = /^(\d{1,2})[:.,](\d{2})$/.exec((t || "").trim());
  if (!m) return null;
  const h = +m[1], mm = +m[2];
  return h < 24 && mm < 60 ? h * 60 + mm : null;
};
const num = (v?: string) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const isAutoNight = (time?: string) => {
  const m = toMin(time);
  return m !== null && (m >= 22 * 60 || m < 6 * 60);
};
export const isNight = (r: DiaryRow) => (typeof r.night === "boolean" ? r.night : isAutoNight(r.time));

/** Интервалы (мин) между соседними событиями в течение суток; переход через полночь учитывается. */
function intervals(times: number[]): number[] {
  const res: number[] = [];
  for (let i = 1; i < times.length; i++) {
    let d = times[i] - times[i - 1];
    if (d < 0) d += 1440;
    if (d > 0) res.push(d);
  }
  return res;
}

export interface DiaryStats {
  voidsPerDay: number[];
  voidsTotal: number;
  voidMin: number | null; voidMax: number | null;
  drinkMin: number | null; drinkMax: number | null;
  avgPortionPerDay: (number | null)[];
  avgPortion3: number | null;
  dayVolume: number; nightVolume: number;
  drankTotal: number; voidedTotal: number;
  dailyDiuresis: number | null;
  daysWithData: number;
}

export function calcDiary(diary: VoidingDiary | undefined): DiaryStats {
  const days = diary?.days || [];
  const voidInt: number[] = [], drinkInt: number[] = [];
  const voidsPerDay: number[] = [], avgPortionPerDay: (number | null)[] = [];
  let dayVolume = 0, nightVolume = 0, drankTotal = 0, voidedTotal = 0, portions = 0, daysWithData = 0;

  for (let i = 0; i < DIARY_DAYS; i++) {
    const rows = days[i] || [];
    // Порядок строк = хронологический порядок записи
    const voids = rows.filter((r) => num(r.voided) > 0);
    const drinks = rows.filter((r) => num(r.drank) > 0);
    voidInt.push(...intervals(voids.map((r) => toMin(r.time)).filter((x): x is number => x !== null)));
    drinkInt.push(...intervals(drinks.map((r) => toMin(r.time)).filter((x): x is number => x !== null)));
    const vSum = voids.reduce((s, r) => s + num(r.voided), 0);
    voids.forEach((r) => (isNight(r) ? (nightVolume += num(r.voided)) : (dayVolume += num(r.voided))));
    drankTotal += drinks.reduce((s, r) => s + num(r.drank), 0);
    voidedTotal += vSum;
    portions += voids.length;
    voidsPerDay.push(voids.length);
    avgPortionPerDay.push(voids.length ? Math.round(vSum / voids.length) : null);
    if (voids.length || drinks.length) daysWithData++;
  }
  const mn = (a: number[]) => (a.length ? Math.min(...a) : null);
  const mx = (a: number[]) => (a.length ? Math.max(...a) : null);
  return {
    voidsPerDay, voidsTotal: portions,
    voidMin: mn(voidInt), voidMax: mx(voidInt),
    drinkMin: mn(drinkInt), drinkMax: mx(drinkInt),
    avgPortionPerDay,
    avgPortion3: portions ? Math.round(voidedTotal / portions) : null,
    dayVolume, nightVolume, drankTotal, voidedTotal,
    dailyDiuresis: daysWithData ? Math.round(voidedTotal / daysWithData) : null,
    daysWithData,
  };
}

export const fmtMin = (m: number | null) =>
  m === null ? "—" : m >= 60 ? `${Math.floor(m / 60)} ч ${m % 60 ? `${m % 60} мин` : ""}`.trim() : `${m} мин`;
