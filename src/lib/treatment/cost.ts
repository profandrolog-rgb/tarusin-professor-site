// Cost calculation for treatment plan items.
// Reads price/pack data from treatment_catalog; uses parseFrequency for cadence.

import { countActiveDays } from "./dayPattern";
import type { TreatmentCategory } from "@/components/treatment/sections";

export const COST_INCLUDED_CATEGORIES: TreatmentCategory[] = [
  "iv_drip", "iv_bolus", "im", "sc",
  "oral_rx", "oral_supplement",
  "rectal", "topical", "nasal", "sublingual", "peptide",
];
export const COST_EXCLUDED_CATEGORIES: TreatmentCategory[] = ["procedure", "lifestyle"];

export function parseFrequency(text: string | null | undefined): number {
  if (!text) return 1;
  const t = text.toLowerCase().trim();
  if (t === "по требованию" || t === "prn") return 0;
  if (t.includes("длительно") || t.includes("ежедневно")) return 1;
  if (t.includes("ч/день") || t.includes("через день")) return 0.5;

  // "N р/сут"
  let m = t.match(/(\d+)\s*р\/\s*сут/);
  if (m) return Number(m[1]);

  // "N р/M дн"
  m = t.match(/(\d+)\s*р\/\s*(\d+)\s*дн/);
  if (m) return Number(m[1]) / Number(m[2]);

  // "N р/нед"
  m = t.match(/(\d+)\s*р\/\s*нед/);
  if (m) return Number(m[1]) / 7;

  // "N р/M нед" — берём середину диапазона если есть
  m = t.match(/(\d+)\s*р\/(\d+)(?:-(\d+))?\s*нед/);
  if (m) {
    const mid = m[3] ? (Number(m[2]) + Number(m[3])) / 2 : Number(m[2]);
    return Number(m[1]) / (mid * 7);
  }

  // "N р/мес"
  m = t.match(/(\d+)\s*р\/\s*мес/);
  if (m) return Number(m[1]) / 30;

  return 1;
}

export interface CostCatalog {
  id: string;
  price_override: number | null;
  pack_size_num: number | null;
  units_per_dose_num: number | null;
  patient_info?: Record<string, any> | null;
  price_auto?: number | null;
  price_auto_updated_at?: string | null;
  price_source_preference?: "auto" | "manual" | null;
}

/** Returns the effective unit price respecting source preference. */
export function effectivePrice(catalog: { price_override?: number | null; price_auto?: number | null; price_source_preference?: "auto" | "manual" | null } | null | undefined): number | null {
  if (!catalog) return null;
  const pref = catalog.price_source_preference || "auto";
  if (pref === "manual") return catalog.price_override ?? null;
  return catalog.price_auto ?? catalog.price_override ?? null;
}

export interface CostItemInput {
  catalog_id?: string | null;
  section_category: TreatmentCategory;
  frequency: string | null | undefined;
  day_pattern?: string | null;
  duration_days: number | null;
  prn_estimated_doses?: number | null;
}

export interface ItemCostResult {
  cost: number;
  packsNeeded: number;
  totalUnits: number;
  unitPrice: number | null;
  unitsPerDose: number;
  packSize: number;
  hasPrice: boolean;
  excluded: boolean;
}

function readNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function calculateItemCost(
  item: CostItemInput,
  catalog: CostCatalog | undefined | null,
  planDurationDays: number,
  planMode: "flat" | "scheduled" = "flat",
): ItemCostResult {
  const excluded = COST_EXCLUDED_CATEGORIES.includes(item.section_category);
  const base: ItemCostResult = {
    cost: 0, packsNeeded: 0, totalUnits: 0,
    unitPrice: null, unitsPerDose: 1, packSize: 1,
    hasPrice: false, excluded,
  };
  if (excluded) return base;

  const unitPrice = catalog ? effectivePrice(catalog) : null;
  const packSize = (catalog ? readNum(catalog.pack_size_num) : null)
    ?? (catalog?.patient_info ? readNum(catalog.patient_info.pack_size_num ?? catalog.patient_info.units_per_pack) : null)
    ?? 1;
  const unitsPerDose = (catalog ? readNum(catalog.units_per_dose_num) : null)
    ?? (catalog?.patient_info ? readNum(catalog.patient_info.units_per_dose) : null)
    ?? 1;

  let totalUnits = 0;
  const freqText = (item.frequency || "").toLowerCase();
  if (freqText.includes("по требованию")) {
    const prn = readNum(item.prn_estimated_doses) ?? 10;
    totalUnits = prn * unitsPerDose;
  } else {
    const freqPerDay = parseFrequency(item.frequency);
    const itemDuration = item.duration_days ?? planDurationDays;
    const activeDays = planMode === "scheduled"
      ? countActiveDays(item.day_pattern, planDurationDays, itemDuration)
      : itemDuration;
    totalUnits = Math.ceil(unitsPerDose * freqPerDay * activeDays);
  }
  const packsNeeded = packSize > 0 ? Math.ceil(totalUnits / packSize) : 0;
  const cost = unitPrice != null ? packsNeeded * unitPrice : 0;
  return {
    cost,
    packsNeeded,
    totalUnits,
    unitPrice,
    unitsPerDose,
    packSize,
    hasPrice: unitPrice != null && unitPrice > 0,
    excluded: false,
  };
}

export interface PlanCostBreakdown {
  total: number;
  byCategory: Partial<Record<TreatmentCategory, number>>;
  byGroup: Record<string, { label: string; emoji: string; sum: number }>;
  missing: Array<{ catalog_id?: string | null; name: string; category: TreatmentCategory }>;
  itemsCounted: number;
}

const GROUP_DEFS: Array<{ key: string; label: string; emoji: string; cats: TreatmentCategory[] }> = [
  { key: "iv",   label: "Внутривенные инфузии",  emoji: "💧", cats: ["iv_drip", "iv_bolus"] },
  { key: "inj",  label: "Инъекции (в/м, п/к, пептиды)", emoji: "💉", cats: ["im", "sc", "peptide"] },
  { key: "rx",   label: "Пероральные Rx",        emoji: "💊", cats: ["oral_rx"] },
  { key: "supp", label: "БАД / нутрицевтика",    emoji: "🌿", cats: ["oral_supplement"] },
  { key: "top",  label: "Накожно (гели/кремы)",  emoji: "🖐", cats: ["topical"] },
  { key: "rect", label: "Ректально",             emoji: "🔻", cats: ["rectal"] },
  { key: "nas",  label: "Назально",              emoji: "👃", cats: ["nasal"] },
  { key: "sub",  label: "Сублингвально",         emoji: "👅", cats: ["sublingual"] },
];

export function calculatePlanCost(
  items: Array<CostItemInput & { name_snapshot: string }>,
  catalogMap: Map<string, CostCatalog>,
  planDurationDays: number,
  planMode: "flat" | "scheduled" = "flat",
): PlanCostBreakdown {
  const byCategory: Partial<Record<TreatmentCategory, number>> = {};
  const missing: PlanCostBreakdown["missing"] = [];
  let total = 0;
  let itemsCounted = 0;

  items.forEach(it => {
    if (COST_EXCLUDED_CATEGORIES.includes(it.section_category)) return;
    const catalog = it.catalog_id ? catalogMap.get(it.catalog_id) : undefined;
    const res = calculateItemCost(it, catalog, planDurationDays, planMode);
    if (!res.hasPrice) {
      missing.push({ catalog_id: it.catalog_id, name: it.name_snapshot, category: it.section_category });
      return;
    }
    byCategory[it.section_category] = (byCategory[it.section_category] || 0) + res.cost;
    total += res.cost;
    itemsCounted++;
  });

  const byGroup: PlanCostBreakdown["byGroup"] = {};
  GROUP_DEFS.forEach(g => {
    const sum = g.cats.reduce((acc, c) => acc + (byCategory[c] || 0), 0);
    if (sum > 0) byGroup[g.key] = { label: g.label, emoji: g.emoji, sum };
  });

  return { total, byCategory, byGroup, missing, itemsCounted };
}

export const formatRub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";

export function priceFreshness(updatedAt: string | null | undefined): "missing" | "fresh" | "stale" | "old" {
  if (!updatedAt) return "missing";
  const ageDays = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  if (ageDays <= 30) return "fresh";
  if (ageDays <= 90) return "stale";
  return "old";
}
