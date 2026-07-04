// Агрегированные (составные) узлы: собираются из нескольких строк lab_results.
// Логика: подобрать все строки, чей test_name/test_code матчится на любой из components,
// проверить единицы (должны совпадать), просуммировать. Не трогает БД и не меняет резолвер
// одиночных узлов — используется как дополнительный слой поверх nodeValuesByPathway.

export type AggregateConfig = {
  node_id: string;
  label: string;
  op: "sum";
  components: string[];
  note?: string;
};

export const AGGREGATE_NODES: AggregateConfig[] = [
  {
    node_id: "omega3",
    label: "Омега-3 (сумма)",
    op: "sum",
    components: [
      "Альфа-линоленовая", "ALA", "Эйкозапентаеновая", "EPA", "Докозапентаеновая", "DPA",
      "Докозагексаеновая", "DHA", "C18:3n3", "C20:5n3", "C22:5n3", "C22:6n3",
    ],
  },
  {
    node_id: "omega6",
    label: "Омега-6 (сумма)",
    op: "sum",
    components: [
      "Линолевая", "LA", "Гамма-линоленовая", "GLA", "Дигомо-гамма-линоленовая", "DGLA",
      "Арахидоновая", "AA", "C18:2n6", "C18:3n6", "C20:3n6", "C20:4n6",
    ],
  },
  {
    node_id: "omega9",
    label: "Омега-9 (сумма)",
    op: "sum",
    components: ["Олеиновая", "Мидовая", "Mead", "Нервоновая", "Эруковая", "C18:1n9", "C20:3n9", "C24:1n9"],
  },
  {
    node_id: "sfa_mufa",
    label: "Насыщенные + МНЖК",
    op: "sum",
    components: ["Пальмитиновая", "Стеариновая", "Миристиновая", "Лауриновая", "Пальмитолеиновая", "C14:0", "C16:0", "C18:0", "C16:1"],
  },
  {
    node_id: "trans_fa",
    label: "Транс-ЖК",
    op: "sum",
    components: ["Элаидиновая", "Линоэлаидиновая", "транс", "trans", "C18:1n9t", "C18:2n6t"],
  },
  {
    node_id: "beta_ox_short",
    label: "Бета-окисление: короткие цепи",
    op: "sum",
    components: ["C2", "C3", "C4", "C5", "Ацетилкарнитин", "Пропионилкарнитин", "Бутирилкарнитин", "Изовалерилкарнитин"],
  },
  {
    node_id: "beta_ox_medium",
    label: "Бета-окисление: средние цепи",
    op: "sum",
    components: ["C6", "C8", "C10", "C12", "Гексаноилкарнитин", "Октаноилкарнитин", "Деканоилкарнитин"],
  },
  {
    node_id: "beta_ox_long",
    label: "Бета-окисление: длинные цепи",
    op: "sum",
    components: ["C14", "C16", "C18", "Пальмитоилкарнитин", "Стеароилкарнитин", "Олеоилкарнитин", "C14:1", "C16:1", "C18:1", "C18:2"],
  },
];

export type LabRowLite = {
  id: string;
  test_name: string | null;
  test_code: string | null;
  value: number | string | null;
  unit: string | null;
};

const norm = (s: unknown) => String(s ?? "").toLowerCase().trim();

// Компонент матчится к строке labRow, если:
//  - test_code точно равен компоненту (без регистра), ИЛИ
//  - нормализованное test_name содержит нормализованный компонент как подстроку.
// Простая, но достаточная эвристика — точнее должен быть только каталог синонимов.
export function rowMatchesComponent(row: LabRowLite, component: string): boolean {
  const c = component.trim();
  if (!c) return false;
  const cLow = c.toLowerCase();
  const code = (row.test_code || "").trim().toLowerCase();
  if (code && code === cLow) return true;
  const name = norm(row.test_name);
  if (!name) return false;
  // строгий сегмент: слово окружено границами (чтобы "C2" не матчил "C20")
  const escaped = cLow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "u");
  return re.test(name);
}

export type AggregateValue = { value: number; unit: string } | { value: null; unit: string; error: string };

export function computeAggregate(cfg: AggregateConfig, rows: LabRowLite[]): AggregateValue | null {
  // Найти все матчащие строки (уникальные по id).
  const seen = new Set<string>();
  const matched: LabRowLite[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    if (cfg.components.some((c) => rowMatchesComponent(r, c))) {
      seen.add(r.id);
      matched.push(r);
    }
  }
  if (!matched.length) return null;

  const units = new Set(matched.map((m) => (m.unit || "").trim()).filter(Boolean));
  if (units.size > 1) {
    return { value: null, unit: Array.from(units).join(" / "), error: "разные единицы" };
  }
  const unit = units.size === 1 ? Array.from(units)[0] : "";

  let sum = 0;
  let anyNum = false;
  for (const r of matched) {
    const n = typeof r.value === "number" ? r.value : Number(String(r.value ?? "").replace(",", "."));
    if (Number.isFinite(n)) { sum += n; anyNum = true; }
  }
  if (!anyNum) return null;
  return { value: Number(sum.toFixed(4)), unit };
}

// Считает все агрегаты, возвращает Map<node_id, textForDisplay>.
export function computeAllAggregates(rows: LabRowLite[]): Map<string, { text: string; error?: string }> {
  const out = new Map<string, { text: string; error?: string }>();
  for (const cfg of AGGREGATE_NODES) {
    const v = computeAggregate(cfg, rows);
    if (!v) continue;
    if ("error" in v) {
      out.set(cfg.node_id, { text: "нет данных", error: v.error });
    } else {
      const u = v.unit ? ` ${v.unit}` : "";
      out.set(cfg.node_id, { text: `${v.value}${u}`.trim() });
    }
  }
  return out;
}

export const AGGREGATE_NODE_IDS = new Set(AGGREGATE_NODES.map((a) => a.node_id));
