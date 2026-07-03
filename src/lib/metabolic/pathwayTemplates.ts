// Фиксированные шаблоны схем для 20 базовых путей.
// Каждый шаблон описывает узлы (nodeId + label + позиция) и связи.
// Отрисовкой занимается src/components/metabolic/schemes/TemplateSVG.tsx.

export type Archetype = "cascade" | "conveyor" | "ring";

export interface TplNode {
  id: string;
  label: string;
  /** cascade: 0..N сверху вниз; conveyor: 0..N слева направо; ring: индекс на кольце */
  col: number;
  /** cascade: 0..N слева направо на своём ярусе; conveyor: 0..N сверху вниз в колонке */
  row?: number;
}
export interface TplEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}
export interface Template {
  archetype: Archetype;
  nodes: TplNode[];
  edges: TplEdge[];
}

// Каскад: 3 яруса, стрелки сверху вниз
const cascade = (n: [string, string, number, number?][], e: [string, string, string?][]): Template => ({
  archetype: "cascade",
  nodes: n.map(([id, label, col, row]) => ({ id, label, col, row: row ?? 0 })),
  edges: e.map(([from, to, label]) => ({ from, to, label })),
});
// Конвейер: N колонок слева направо
const conv = (n: [string, string, number, number?][], e: [string, string, string?, boolean?][]): Template => ({
  archetype: "conveyor",
  nodes: n.map(([id, label, col, row]) => ({ id, label, col, row: row ?? 0 })),
  edges: e.map(([from, to, label, dashed]) => ({ from, to, label, dashed })),
});
const ring = (n: [string, string][], e: [string, string, string?][]): Template => ({
  archetype: "ring",
  nodes: n.map(([id, label], i) => ({ id, label, col: i })),
  edges: e.map(([from, to, label]) => ({ from, to, label })),
});

export const PATHWAY_TEMPLATES: Record<string, Template> = {
  // ── Гормональные оси (каскад) ─────────────────────────────
  hpg: cascade(
    [
      ["gnrh", "Гипоталамус · ГнРГ", 0, 1],
      ["lh", "Гипофиз · ЛГ", 1, 0],
      ["fsh", "Гипофиз · ФСГ", 1, 2],
      ["testo", "Тестостерон", 2, 0],
      ["estr", "Эстрадиол", 2, 1],
      ["shbg", "ГСПГ", 2, 2],
    ],
    [["gnrh", "lh"], ["gnrh", "fsh"], ["lh", "testo"], ["fsh", "estr"], ["testo", "shbg", "связь"]],
  ),
  growth_igf1: cascade(
    [
      ["ghrh", "Гипоталамус · СРФ", 0, 1],
      ["gh", "Гипофиз · СТГ", 1, 1],
      ["igf1", "Печень · ИФР-1", 2, 0],
      ["igfbp3", "ИФРСБ-3", 2, 1],
      ["growth", "Рост / метафизы", 2, 2],
    ],
    [["ghrh", "gh"], ["gh", "igf1"], ["gh", "igfbp3"], ["igf1", "growth"]],
  ),
  thyroid: cascade(
    [
      ["trh", "Гипоталамус · ТРГ", 0, 1],
      ["tsh", "Гипофиз · ТТГ", 1, 1],
      ["t4", "Щитовидная · Т4", 2, 0],
      ["t3", "Т3 (свободный)", 2, 1],
      ["at_tpo", "Ат-ТПО / Ат-ТГ", 2, 2],
    ],
    [["trh", "tsh"], ["tsh", "t4"], ["t4", "t3"], ["at_tpo", "t4", "аутоагрессия"]],
  ),
  hpa: cascade(
    [
      ["crh", "Гипоталамус · КРГ", 0, 1],
      ["acth", "Гипофиз · АКТГ", 1, 1],
      ["cort", "Кортизол утро", 2, 0],
      ["cort_ev", "Кортизол вечер", 2, 1],
      ["dheas", "ДГЭА-С", 2, 2],
    ],
    [["crh", "acth"], ["acth", "cort"], ["acth", "cort_ev"], ["acth", "dheas"]],
  ),

  // ── Энергия / субстраты (конвейер + кольцо) ───────────────
  energy_tca: ring(
    [
      ["citrate", "Цитрат"],
      ["isocitrate", "Изоцитрат"],
      ["akg", "α-КГ"],
      ["succinyl", "Сукцинил-КоА"],
      ["succinate", "Сукцинат"],
      ["fumarate", "Фумарат"],
      ["malate", "Малат"],
      ["oaa", "Оксалоацетат"],
    ],
    [
      ["citrate", "isocitrate"], ["isocitrate", "akg"], ["akg", "succinyl"],
      ["succinyl", "succinate"], ["succinate", "fumarate"], ["fumarate", "malate"],
      ["malate", "oaa"], ["oaa", "citrate"],
    ],
  ),
  insulin_glucose: conv(
    [
      ["glu", "Глюкоза натощак", 0, 0],
      ["ins", "Инсулин", 0, 1],
      ["homa", "HOMA-IR", 1, 0],
      ["hba1c", "HbA1c", 1, 1],
      ["ir", "Инсулинорезистентность", 2, 0],
    ],
    [["glu", "homa"], ["ins", "homa"], ["homa", "ir"], ["hba1c", "ir"]],
  ),
  lipids: conv(
    [
      ["chol", "Общий ХС", 0, 0],
      ["ldl", "ЛПНП", 1, 0],
      ["hdl", "ЛПВП", 1, 1],
      ["tg", "Триглицериды", 1, 2],
      ["atg", "Атерогенность / АпоB", 2, 0],
    ],
    [["chol", "ldl"], ["chol", "hdl"], ["chol", "tg"], ["ldl", "atg"], ["tg", "atg"]],
  ),

  // ── Кровь, железо, воспаление ─────────────────────────────
  iron: conv(
    [
      ["ferr", "Депо · Ферритин", 0, 0],
      ["tsat", "Транспорт · Fe/ОЖСС", 1, 0],
      ["hb", "Эритропоэз · Hb", 2, 0],
      ["mcv", "MCV / MCH", 2, 1],
    ],
    [["ferr", "tsat"], ["tsat", "hb"], ["tsat", "mcv"]],
  ),
  inflammation: conv(
    [
      ["crp", "СРБ", 0, 0],
      ["esr", "СОЭ", 0, 1],
      ["fib", "Фибриноген", 1, 0],
      ["alb", "Альбумин", 1, 1],
      ["prot", "Общий белок", 2, 0],
    ],
    [["crp", "fib"], ["esr", "fib"], ["fib", "prot"], ["alb", "prot"]],
  ),

  // ── Микронутриенты и метилирование ────────────────────────
  methylation: conv(
    [
      ["met", "Метионин", 0, 0],
      ["sam", "SAM", 1, 0],
      ["sah", "SAH", 1, 1],
      ["hcy", "Гомоцистеин", 2, 0],
      ["b12", "B12 / фолат", 2, 1],
    ],
    [["met", "sam"], ["sam", "sah"], ["sah", "hcy"], ["b12", "hcy", "реметилирование"]],
  ),
  micronutrients: conv(
    [
      ["d25", "25(OH)D", 0, 0],
      ["b12", "B12", 0, 1],
      ["fol", "Фолаты", 0, 2],
      ["mg", "Магний", 1, 0],
      ["zn", "Цинк", 1, 1],
      ["se", "Селен", 1, 2],
    ],
    [],
  ),
  micronutrients_steroid: conv(
    [
      ["zn", "Zn (5α-редуктаза)", 0, 0],
      ["se", "Se (дейодиназа)", 0, 1],
      ["mg", "Mg (ГАМК/митохондрии)", 0, 2],
      ["b6", "B6 (аминокислоты)", 1, 0],
      ["chol", "Холестерин → стероиды", 2, 0],
    ],
    [["zn", "chol"], ["se", "chol"], ["b6", "chol"]],
  ),
  bone_mineral: conv(
    [
      ["d25", "25(OH)D", 0, 0],
      ["ca", "Кальций", 1, 0],
      ["p", "Фосфор", 1, 1],
      ["pth", "ПТГ", 1, 2],
      ["alp", "ЩФ костная", 2, 0],
    ],
    [["d25", "ca"], ["d25", "p"], ["pth", "ca"], ["ca", "alp"]],
  ),

  // ── Аминокислоты и защита ─────────────────────────────────
  amino_urea: conv(
    [
      ["prot", "Белок пищи", 0, 0],
      ["aa", "Аминокислоты", 1, 0],
      ["nh3", "Аммиак", 2, 0],
      ["urea", "Мочевина", 3, 0],
      ["b6", "B6 · кофактор", 1, 1],
    ],
    [["prot", "aa"], ["aa", "nh3"], ["nh3", "urea"], ["b6", "aa", "кофактор"]],
  ),
  detox_p12: conv(
    [
      ["tox", "Токсин / метаболит", 0, 0],
      ["p1", "Фаза I (CYP)", 1, 0],
      ["p2", "Фаза II (конъюгация)", 2, 0],
      ["out", "Выведение", 3, 0],
      ["gsh", "Глутатион", 2, 1],
    ],
    [["tox", "p1"], ["p1", "p2"], ["p2", "out"], ["gsh", "p2", "кофактор"]],
  ),
  neurotransmitters: conv(
    [
      ["trp", "Триптофан", 0, 0],
      ["tyr", "Тирозин", 0, 1],
      ["ser", "Серотонин", 1, 0],
      ["da", "Дофамин", 1, 1],
      ["ne", "Норадреналин", 2, 1],
      ["mel", "Мелатонин", 2, 0],
    ],
    [["trp", "ser"], ["ser", "mel"], ["tyr", "da"], ["da", "ne"]],
  ),
  oxidative_stress: conv(
    [
      ["ros", "АФК", 0, 0],
      ["sod", "СОД", 1, 0],
      ["gpx", "GPx / GSH", 1, 1],
      ["cat", "Каталаза", 1, 2],
      ["mda", "МДА / 8-OHdG", 2, 0],
    ],
    [["ros", "sod"], ["ros", "gpx"], ["ros", "cat"], ["sod", "mda"]],
  ),

  // ── Водно-электролитный баланс ────────────────────────────
  electrolytes_abr: conv(
    [
      ["na", "Na⁺", 0, 0],
      ["k", "K⁺", 0, 1],
      ["cl", "Cl⁻", 0, 2],
      ["ph", "pH / HCO₃⁻", 1, 0],
      ["osm", "Осмолярность", 2, 0],
    ],
    [["na", "osm"], ["k", "ph"], ["cl", "ph"]],
  ),

  // ── Прочее ────────────────────────────────────────────────
  gut_permeability: conv(
    [
      ["diet", "Пища / антигены", 0, 0],
      ["zon", "Зонулин", 1, 0],
      ["perm", "Проницаемость ↑", 2, 0],
      ["inf", "Системное воспаление", 3, 0],
    ],
    [["diet", "zon"], ["zon", "perm"], ["perm", "inf"]],
  ),
  mast_cell_histamine: conv(
    [
      ["trig", "Триггер", 0, 0],
      ["mast", "Мастоцит", 1, 0],
      ["hist", "Гистамин ↑", 2, 0],
      ["dao", "DAO / MAO", 2, 1],
      ["sym", "Симптомы", 3, 0],
    ],
    [["trig", "mast"], ["mast", "hist"], ["hist", "sym"], ["dao", "hist", "деградация"]],
  ),
};

export function getTemplate(slug: string): Template | null {
  return PATHWAY_TEMPLATES[slug] ?? null;
}
