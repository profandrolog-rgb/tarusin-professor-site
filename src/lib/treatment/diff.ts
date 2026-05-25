import type { TreatmentCategory } from "@/components/treatment/sections";

export interface DiffItem {
  catalog_id?: string | null;
  name_snapshot: string;
  inn_snapshot?: string | null;
  form_snapshot?: string | null;
  section_category: TreatmentCategory;
  dose?: number | null;
  dose_unit?: string | null;
  frequency?: string | null;
  duration_days?: number | null;
  day_pattern?: string | null;
  time_of_day?: string[] | null;
  dilution_volume?: number | null;
  dilution_solvent?: string | null;
  notes?: string | null;
  is_off_label?: boolean;
  [k: string]: any;
}

export type DiffStatus = "same" | "added" | "removed" | "changed";

export interface DiffEntry {
  key: string;
  section: TreatmentCategory;
  a?: DiffItem;
  b?: DiffItem;
  status: DiffStatus;
  changedFields: string[];
}

/** Build a stable item identity key (prefer catalog_id, fallback to name+inn). */
export function itemKey(it: DiffItem): string {
  if (it.catalog_id) return `cat:${it.catalog_id}`;
  return `name:${(it.name_snapshot || "").toLowerCase().trim()}|${(it.inn_snapshot || "").toLowerCase().trim()}`;
}

const COMPARE_FIELDS: (keyof DiffItem)[] = [
  "dose", "dose_unit", "frequency", "duration_days",
  "day_pattern", "dilution_volume", "dilution_solvent", "notes",
];

function normTOD(arr?: string[] | null): string {
  return [...(arr || [])].sort().join(",");
}

export function diffItems(a?: DiffItem, b?: DiffItem): string[] {
  if (!a || !b) return [];
  const fields: string[] = [];
  for (const f of COMPARE_FIELDS) {
    const av = (a as any)[f] ?? null;
    const bv = (b as any)[f] ?? null;
    if (String(av) !== String(bv)) fields.push(f as string);
  }
  if (normTOD(a.time_of_day) !== normTOD(b.time_of_day)) fields.push("time_of_day");
  return fields;
}

export function buildDiff(aItems: DiffItem[], bItems: DiffItem[]): DiffEntry[] {
  const aMap = new Map<string, DiffItem>();
  const bMap = new Map<string, DiffItem>();
  aItems.forEach(i => aMap.set(itemKey(i), i));
  bItems.forEach(i => bMap.set(itemKey(i), i));
  const keys = new Set<string>([...aMap.keys(), ...bMap.keys()]);
  const out: DiffEntry[] = [];
  keys.forEach(k => {
    const a = aMap.get(k);
    const b = bMap.get(k);
    let status: DiffStatus = "same";
    let changedFields: string[] = [];
    if (a && !b) status = "removed";
    else if (!a && b) status = "added";
    else {
      changedFields = diffItems(a, b);
      status = changedFields.length ? "changed" : "same";
    }
    out.push({
      key: k,
      section: (a?.section_category || b?.section_category) as TreatmentCategory,
      a, b, status, changedFields,
    });
  });
  return out;
}

export interface DiffSummary {
  added: number;
  removed: number;
  changed: number;
  same: number;
  costDelta: number;
}

export function summarize(diff: DiffEntry[], costA: number, costB: number): DiffSummary {
  return {
    added: diff.filter(d => d.status === "added").length,
    removed: diff.filter(d => d.status === "removed").length,
    changed: diff.filter(d => d.status === "changed").length,
    same: diff.filter(d => d.status === "same").length,
    costDelta: (costB || 0) - (costA || 0),
  };
}
