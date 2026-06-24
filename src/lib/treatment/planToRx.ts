// Convert plan items to prescription items, filtering by "аптечная форма" categories.
import type { ParsedRxItem } from "@/lib/protocolBridge";
import type { TreatmentCategory } from "@/components/treatment/sections";

// Категории, которые выписываются на бланке 107-1/у.
// Исключены: oral_supplement (БАД), peptide, procedure, lifestyle, homeopathy, physiotherapy.
export const RX_CATEGORIES: ReadonlySet<TreatmentCategory> = new Set<TreatmentCategory>([
  "iv_drip",
  "iv_bolus",
  "im",
  "sc",
  "oral_rx",
  "rectal",
  "topical",
  "nasal",
  "sublingual",
]);

export interface PlanItemLike {
  section_category: TreatmentCategory;
  name_snapshot: string;
  inn_snapshot?: string | null;
  form_snapshot?: string | null;
  dose: number | null;
  dose_unit: string | null;
  frequency: string | null;
  duration_days: number | null;
  notes: string | null;
}

export function isRxCategory(c: TreatmentCategory): boolean {
  return RX_CATEGORIES.has(c);
}

export function planItemToRxItem(it: PlanItemLike): ParsedRxItem {
  const dose = it.dose != null
    ? `${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`.trim()
    : "";
  const duration = it.duration_days ? `${it.duration_days} дн.` : "";
  return {
    medication_ru_name: it.name_snapshot,
    medication_latin_name: it.inn_snapshot || it.name_snapshot,
    dosage_form: it.form_snapshot || "",
    dose,
    quantity: 1,
    frequency: it.frequency || "",
    duration,
    signa: it.notes ?? null,
  };
}

export function planItemsToRxItems(items: PlanItemLike[]): ParsedRxItem[] {
  return items
    .filter((i) => isRxCategory(i.section_category))
    .map(planItemToRxItem);
}
