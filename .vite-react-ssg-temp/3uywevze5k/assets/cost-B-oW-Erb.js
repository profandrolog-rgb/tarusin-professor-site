function expandPattern(pattern, courseDays, itemDays) {
  const total = itemDays ?? courseDays;
  const set = /* @__PURE__ */ new Set();
  if (!pattern || pattern.trim() === "") {
    for (let i = 1; i <= total; i++) set.add(i);
    return set;
  }
  pattern.split(",").map((s) => s.trim()).filter(Boolean).forEach((part) => {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const a = +range[1], b = +range[2];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (i >= 1 && i <= courseDays) set.add(i);
      }
      return;
    }
    const every = part.match(/^через\s+(\d+)$/i);
    if (every) {
      const step = +every[1] + 1;
      for (let i = 1; i <= courseDays; i += step) set.add(i);
      return;
    }
    const n = Number(part);
    if (!Number.isNaN(n) && n >= 1 && n <= courseDays) set.add(n);
  });
  return set;
}
function countActiveDays(pattern, courseDays, itemDays) {
  return expandPattern(pattern, courseDays, itemDays).size;
}
const COST_EXCLUDED_CATEGORIES = ["procedure", "lifestyle"];
function parseFrequency(text) {
  if (!text) return 1;
  const t = text.toLowerCase().trim();
  if (t === "по требованию" || t === "prn") return 0;
  if (t.includes("длительно") || t.includes("ежедневно")) return 1;
  if (t.includes("ч/день") || t.includes("через день")) return 0.5;
  let m = t.match(/(\d+)\s*р\/\s*сут/);
  if (m) return Number(m[1]);
  m = t.match(/(\d+)\s*р\/\s*(\d+)\s*дн/);
  if (m) return Number(m[1]) / Number(m[2]);
  m = t.match(/(\d+)\s*р\/\s*нед/);
  if (m) return Number(m[1]) / 7;
  m = t.match(/(\d+)\s*р\/(\d+)(?:-(\d+))?\s*нед/);
  if (m) {
    const mid = m[3] ? (Number(m[2]) + Number(m[3])) / 2 : Number(m[2]);
    return Number(m[1]) / (mid * 7);
  }
  m = t.match(/(\d+)\s*р\/\s*мес/);
  if (m) return Number(m[1]) / 30;
  return 1;
}
function effectivePrice(catalog) {
  if (!catalog) return null;
  const pref = catalog.price_source_preference || "auto";
  if (pref === "manual") return catalog.price_override ?? null;
  return catalog.price_auto ?? catalog.price_override ?? null;
}
function readNum(v) {
  if (v === null || v === void 0 || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function calculateItemCost(item, catalog, planDurationDays, planMode = "flat") {
  const excluded = COST_EXCLUDED_CATEGORIES.includes(item.section_category);
  const base = {
    cost: 0,
    packsNeeded: 0,
    totalUnits: 0,
    unitPrice: null,
    unitsPerDose: 1,
    packSize: 1,
    hasPrice: false,
    excluded
  };
  if (excluded) return base;
  const unitPrice = catalog ? effectivePrice(catalog) : null;
  const packSize = (catalog ? readNum(catalog.pack_size_num) : null) ?? ((catalog == null ? void 0 : catalog.patient_info) ? readNum(catalog.patient_info.pack_size_num ?? catalog.patient_info.units_per_pack) : null) ?? 1;
  const unitsPerDose = (catalog ? readNum(catalog.units_per_dose_num) : null) ?? ((catalog == null ? void 0 : catalog.patient_info) ? readNum(catalog.patient_info.units_per_dose) : null) ?? 1;
  let totalUnits = 0;
  const freqText = (item.frequency || "").toLowerCase();
  if (freqText.includes("по требованию")) {
    const prn = readNum(item.prn_estimated_doses) ?? 10;
    totalUnits = prn * unitsPerDose;
  } else {
    const freqPerDay = parseFrequency(item.frequency);
    const itemDuration = item.duration_days ?? planDurationDays;
    const activeDays = planMode === "scheduled" ? countActiveDays(item.day_pattern, planDurationDays, itemDuration) : itemDuration;
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
    excluded: false
  };
}
const GROUP_DEFS = [
  { key: "iv", label: "Внутривенные инфузии", emoji: "💧", cats: ["iv_drip", "iv_bolus"] },
  { key: "inj", label: "Инъекции (в/м, п/к, пептиды)", emoji: "💉", cats: ["im", "sc", "peptide"] },
  { key: "rx", label: "Пероральные Rx", emoji: "💊", cats: ["oral_rx"] },
  { key: "supp", label: "БАД / нутрицевтика", emoji: "🌿", cats: ["oral_supplement"] },
  { key: "top", label: "Накожно (гели/кремы)", emoji: "🖐", cats: ["topical"] },
  { key: "rect", label: "Ректально", emoji: "🔻", cats: ["rectal"] },
  { key: "nas", label: "Назально", emoji: "👃", cats: ["nasal"] },
  { key: "sub", label: "Сублингвально", emoji: "👅", cats: ["sublingual"] }
];
function calculatePlanCost(items, catalogMap, planDurationDays, planMode = "flat") {
  const byCategory = {};
  const missing = [];
  let total = 0;
  let itemsCounted = 0;
  items.forEach((it) => {
    if (COST_EXCLUDED_CATEGORIES.includes(it.section_category)) return;
    const catalog = it.catalog_id ? catalogMap.get(it.catalog_id) : void 0;
    const res = calculateItemCost(it, catalog, planDurationDays, planMode);
    if (!res.hasPrice) {
      missing.push({ catalog_id: it.catalog_id, name: it.name_snapshot, category: it.section_category });
      return;
    }
    byCategory[it.section_category] = (byCategory[it.section_category] || 0) + res.cost;
    total += res.cost;
    itemsCounted++;
  });
  const byGroup = {};
  GROUP_DEFS.forEach((g) => {
    const sum = g.cats.reduce((acc, c) => acc + (byCategory[c] || 0), 0);
    if (sum > 0) byGroup[g.key] = { label: g.label, emoji: g.emoji, sum };
  });
  return { total, byCategory, byGroup, missing, itemsCounted };
}
const formatRub = (n) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";
function priceFreshness(updatedAt) {
  if (!updatedAt) return "missing";
  const ageDays = (Date.now() - new Date(updatedAt).getTime()) / 864e5;
  if (ageDays <= 30) return "fresh";
  if (ageDays <= 90) return "stale";
  return "old";
}
function latestPriceDate(catalogs) {
  let max = 0;
  for (const c of catalogs) {
    const pref = c.price_source_preference || "auto";
    const candidate = pref === "manual" ? c.price_updated_at : c.price_auto_updated_at ?? c.price_updated_at;
    if (!candidate) continue;
    const t = new Date(candidate).getTime();
    if (t > max) max = t;
  }
  return max ? new Date(max).toISOString() : null;
}
export {
  calculatePlanCost as c,
  effectivePrice as e,
  formatRub as f,
  latestPriceDate as l,
  priceFreshness as p
};
