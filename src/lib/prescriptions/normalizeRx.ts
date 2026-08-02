import { supabase } from "@/integrations/supabase/client";
import type { ParsedRxItem } from "@/lib/protocolBridge";

export type RxSource = "catalog" | "cache" | "ai" | "none";

export interface NormalizedRxItem extends ParsedRxItem {
  source: RxSource;
  confidence: number;
}

export interface RawRxInput {
  name: string;
  raw_text?: string | null;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  dosage_form?: string | null;
  quantity?: number | null;
}

const CYRILLIC = /[А-Яа-яЁё]/;

/** Латинское наименование не годится для бланка (пусто или по-русски). */
export function needsRxLookup(item: Pick<ParsedRxItem, "medication_latin_name" | "dosage_form">): boolean {
  const latin = (item.medication_latin_name || "").trim();
  return !latin || CYRILLIC.test(latin) || !(item.dosage_form || "").trim();
}

export function hasCyrillicLatinName(latin: string | null | undefined): boolean {
  const v = (latin || "").trim();
  return !v || CYRILLIC.test(v);
}

/** Строка назначения -> имя препарата + остаток как свободный текст. */
export function splitAssignmentLine(line: string): { name: string; raw_text: string } {
  const raw = line.trim().replace(/^[•\-\d.)\s]+/, "");
  const m = raw.match(/^([A-Za-zА-Яа-яЁё\-\s]+?)(?:\s+(\d|\(|по\s)|,|$)/);
  const name = (m?.[1] || raw).trim();
  return { name, raw_text: raw };
}

/**
 * Просит бэкенд заполнить рецептурные поля: сначала каталог/кэш, затем ИИ.
 * При ошибке возвращает исходные позиции без изменений (ручной ввод работает).
 */
export async function normalizeRxItems(items: RawRxInput[]): Promise<NormalizedRxItem[] | null> {
  if (items.length === 0) return [];
  const { data, error } = await supabase.functions.invoke("rx-normalize-items", {
    body: { items },
  });
  if (error) {
    console.error("rx-normalize-items failed", error);
    return null;
  }
  const list = (data as { items?: NormalizedRxItem[] })?.items;
  if (!Array.isArray(list)) return null;
  return list.map((it) => ({
    medication_ru_name: it.medication_ru_name ?? null,
    medication_latin_name: it.medication_latin_name ?? "",
    dosage_form: it.dosage_form ?? "",
    dose: it.dose ?? "",
    quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
    frequency: it.frequency ?? "",
    duration: it.duration ?? "",
    signa: it.signa ?? null,
    source: (it.source ?? "none") as RxSource,
    confidence: typeof it.confidence === "number" ? it.confidence : 0,
  }));
}
