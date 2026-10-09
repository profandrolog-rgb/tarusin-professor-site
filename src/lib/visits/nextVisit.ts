import { format } from "date-fns";
import { ru } from "date-fns/locale";

/** Варианты рекомендованной длительности повторного приёма. */
export const NEXT_VISIT_DURATIONS = ["15 минут", "20 минут", "30 минут", "45 минут", "1 час", "1,5 часа"];

const fmt = (iso: string) => format(new Date(iso), "dd MMMM yyyy", { locale: ru }) + " г.";

/** Текст даты контрольного осмотра: конкретная дата или интервал (конец интервала — protocol_data.next_visit_date_to). */
export function formatNextVisitDate(from: string | null | undefined, data: any): string | null {
  if (!from) return null;
  const to = data?.next_visit_date_to;
  if (to && to !== from) return `с ${fmt(from)} по ${fmt(to)}`;
  return fmt(from);
}

/** Что не заполнено для повторного приёма (пусто — всё в порядке). */
export function nextVisitMissing(from: string | null | undefined, data: any): string[] {
  const missing: string[] = [];
  if (!from) missing.push("дата контрольного осмотра");
  else if (data?.next_visit_range && !data?.next_visit_date_to) missing.push("конец интервала дат");
  if (!data?.next_visit_duration) missing.push("рекомендованное время приёма");
  return missing;
}

/** Сутки после операции: день операции = 0. */
export function calcPostOpDay(visitDate?: string | null, operationDate?: string | null): number | undefined {
  if (!visitDate || !operationDate) return undefined;
  const a = new Date(visitDate.slice(0, 10) + "T00:00:00Z").getTime();
  const b = new Date(operationDate.slice(0, 10) + "T00:00:00Z").getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
  const n = Math.round((a - b) / 86400000);
  return n >= 0 ? n : undefined;
}
