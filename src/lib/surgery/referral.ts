export const REFERRAL_STATUSES = [
  { value: "issued", label: "Путёвка выдана", color: "bg-sky-500" },
  { value: "labs_in_progress", label: "Сдаёт анализы", color: "bg-amber-500" },
  { value: "labs_ready", label: "Анализы готовы", color: "bg-lime-600" },
  { value: "date_set", label: "Дата назначена", color: "bg-indigo-500" },
  { value: "hospitalized", label: "Госпитализирован", color: "bg-violet-600" },
  { value: "operated", label: "Оперирован", color: "bg-emerald-600" },
  { value: "postponed", label: "Перенесена", color: "bg-orange-600" },
  { value: "declined", label: "Отказ", color: "bg-rose-600" },
  { value: "lost", label: "Потерян из виду", color: "bg-zinc-500" },
] as const;

export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]["value"];

export const ACTIVE_STATUSES: ReferralStatus[] = [
  "issued",
  "labs_in_progress",
  "labs_ready",
  "date_set",
  "hospitalized",
];

export function statusLabel(v?: string | null) {
  return REFERRAL_STATUSES.find((s) => s.value === v)?.label || v || "—";
}

export function statusColor(v?: string | null) {
  return REFERRAL_STATUSES.find((s) => s.value === v)?.color || "bg-muted";
}

export function calcAgeText(birthDate?: string | null): string {
  if (!birthDate) return "";
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const yWord = years % 10 === 1 && years % 100 !== 11 ? "год" : [2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years % 100) ? "года" : "лет";
  if (years < 1) return `${months} мес.`;
  return months > 0 ? `${years} ${yWord} ${months} мес.` : `${years} ${yWord}`;
}

/** Дней без движения по путёвке */
export function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

/** Светофор просрочки: 14 / 30 / 60 дней без активности */
export function overdueLevel(days: number | null): "ok" | "warn" | "bad" | "critical" {
  if (days == null) return "ok";
  if (days >= 60) return "critical";
  if (days >= 30) return "bad";
  if (days >= 14) return "warn";
  return "ok";
}

export function formatRuDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU");
}

export function plannedDateText(from?: string | null, to?: string | null): string {
  if (from && to && from !== to) return `${formatRuDate(from)} — ${formatRuDate(to)}`;
  if (from) return formatRuDate(from);
  return "дата уточняется";
}

export const DEFAULT_MEMO_BODY = `1. Обследование перед операцией должно быть выполнено не ранее чем за 14 дней до госпитализации (заключения специалистов — не ранее чем за 1 месяц).
2. За 7 дней до операции прекратите приём препаратов, влияющих на свёртываемость крови (аспирин и аналоги), — по согласованию с лечащим врачом.
3. Накануне операции — лёгкий ужин до 19:00. В день операции нельзя есть и пить (натощак).
4. Утром в день операции примите гигиенический душ; при необходимости выполняется удаление волос в области операции.
5. С собой возьмите: паспорт (свидетельство о рождении), полис, СНИЛС, результаты обследования, сменную обувь, предметы личной гигиены, компрессионный трикотаж (если рекомендован).
6. При острых заболеваниях (температура, насморк, кашель, кишечная инфекция) операция переносится — заранее сообщите координатору.
7. Ребёнка сопровождает один законный представитель с документами, подтверждающими родство.
8. О любых изменениях состояния и планов сообщайте координатору по телефону, указанному в путёвке.`;
