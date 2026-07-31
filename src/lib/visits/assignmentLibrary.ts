import { supabase } from "@/integrations/supabase/client";
import type { AssignmentsData } from "@/components/visits/AssignmentsPanel";

export type AssignmentCategory = keyof AssignmentsData;

export const ASSIGNMENT_CATEGORY_LABEL: Record<AssignmentCategory, string> = {
  examinations: "Обследования",
  treatments: "Медикаменты и лечение",
  referrals: "Консультации",
  diet: "Диета и режим",
  surgeries: "Оперативное лечение",
  activity: "Физ. нагрузка",
};

export interface LibraryItem {
  id: string;
  category: string;
  item_text: string;
  usage_count: number;
}

/** Библиотека формулировок по категории, самые частые — сверху. */
export async function fetchAssignmentLibrary(category: AssignmentCategory): Promise<LibraryItem[]> {
  const { data, error } = await supabase
    .from("assignment_library" as any)
    .select("id, category, item_text, usage_count")
    .eq("category", category)
    .order("usage_count", { ascending: false })
    .order("last_used_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return ((data as any) || []) as LibraryItem[];
}

/**
 * Запоминает все формулировки назначений: новые попадают в библиотеку,
 * у существующих растёт счётчик использований. Вызывается при сохранении визита.
 * Ошибки не мешают сохранению протокола.
 */
export async function rememberAssignments(assignments: unknown): Promise<void> {
  const a = assignments as Partial<Record<AssignmentCategory, unknown>> | null | undefined;
  if (!a || typeof a !== "object") return;
  const items: { category: string; item_text: string }[] = [];
  (Object.keys(ASSIGNMENT_CATEGORY_LABEL) as AssignmentCategory[]).forEach((cat) => {
    const list = a[cat];
    if (!Array.isArray(list)) return;
    list.forEach((raw) => {
      const text = typeof raw === "string" ? raw.trim() : "";
      if (text.length < 3 || text.length > 2000) return;
      items.push({ category: cat, item_text: text });
    });
  });
  if (items.length === 0) return;
  try {
    await supabase.rpc("remember_assignments" as any, { _items: items as any });
  } catch {
    /* библиотека — вспомогательный механизм, молча игнорируем */
  }
}
