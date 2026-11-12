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
