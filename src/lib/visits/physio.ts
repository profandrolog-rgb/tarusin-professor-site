/** Протокол физиолечения: перечень процедур и расчёт листов по сеансам. */
export const PHYSIO_PROCEDURES = [
  "Высокоинтенсивная магнитная стимуляция мышц тазового дна",
  "Высокоинтенсивная магнитная стимуляция предстательной железы",
  "Магнитотерапия области проекции простаты и мочевого пузыря",
  "Магнитотерапия передней брюшной стенки",
  "Магнитотерапия пояснично-крестцовой области",
  "Магнитотерапия области полового члена и мошонки",
  "Ударно-волновая терапия полового члена",
  "Ударно-волновая терапия мышц промежности",
];

export interface PhysioRow {
  name?: string;
  duration?: string;
  params?: string;
  notes?: string;
}

export interface PhysioData {
  indications?: string;
  procedures?: PhysioRow[];
  sessions_total?: number | string;
  per_week?: number | string;
  recommendations?: string;
}

/** Номера сеансов для печати: все или один выбранный (1..N). */
export function physioSessionNumbers(total: unknown, only?: number | null): number[] {
  const n = Math.max(1, Math.min(60, Math.floor(Number(total) || 1)));
  if (only && only >= 1 && only <= n) return [only];
  return Array.from({ length: n }, (_, i) => i + 1);
}

export const filledPhysioRows = (rows?: PhysioRow[]) =>
  (rows || []).filter((r) => (r.name || "").trim());

const PHYSIO_HINT = /магнит|ударно-?волн|физио|электрофорез|лазеротерап|ультразвуков[а-я]* терап|дарсонвал|амплипульс|электростимул/i;

/** Выбрать физиопроцедуры из текстов назначений и перенести в протокол физиолечения. */
export function physioFromAssignments(treatments: string[]): PhysioData | null {
  const picked = (treatments || []).filter((t) => {
    const s = (t || "").toLowerCase();
    return PHYSIO_PROCEDURES.some((p) => s.includes(p.toLowerCase())) || PHYSIO_HINT.test(s);
  });
  if (picked.length === 0) return null;
  let total: number | undefined;
  let perWeek: number | undefined;
  const procedures: PhysioRow[] = picked.map((t) => {
    const known = PHYSIO_PROCEDURES.find((p) => t.toLowerCase().includes(p.toLowerCase()));
    const n = t.match(/(\d+)\s*(процедур|сеанс)/i);
    const w = t.match(/(\d+)\s*раз[а]?\s+в\s+неделю/i);
    if (n && total === undefined) total = Number(n[1]);
    if (w && perWeek === undefined) perWeek = Number(w[1]);
    const rest = known ? t.slice(t.toLowerCase().indexOf(known.toLowerCase()) + known.length).replace(/^[\s—–,:-]+/, "").trim() : "";
    return { name: known || t.trim(), duration: "", params: "", notes: rest };
  });
  return { procedures, sessions_total: total ?? 10, per_week: perWeek ?? 2 };
}
