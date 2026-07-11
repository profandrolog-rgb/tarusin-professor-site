import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { r as Checkbox, b as Badge } from "../main.mjs";
const SEVERITY_COLORS = {
  no_data: { stroke: "#9aa5b1", fill: "#eef1f4", text: "#334155", label: "Нет данных" },
  norm: { stroke: "#2f9e64", fill: "#e6f6ec", text: "#14532d", label: "Норма" },
  mild: { stroke: "#d69e2e", fill: "#fdf3d7", text: "#713f12", label: "Лёгкое" },
  moderate: { stroke: "#dd6b20", fill: "#fde3cf", text: "#7c2d12", label: "Умеренное" },
  severe: { stroke: "#e02424", fill: "#fbd7d7", text: "#7f1d1d", label: "Тяжёлое" }
};
const SEVERITY_ORDER = ["no_data", "norm", "mild", "moderate", "severe"];
function severityRank(s) {
  return SEVERITY_ORDER.indexOf(s);
}
function PathwaySceneSVG({
  scene,
  highlights,
  rxNodes,
  rxLabelByNode,
  className = "",
  fallback,
  maxHeight
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function render() {
      var _a, _b, _c, _d;
      if (!scene || !Array.isArray(scene.elements) || scene.elements.length === 0) {
        setEmpty(true);
        setLoading(false);
        return;
      }
      setEmpty(false);
      setLoading(true);
      try {
        const { exportToSvg } = await import("@excalidraw/excalidraw");
        const nodeSeverityByElId = /* @__PURE__ */ new Map();
        const elements = scene.elements.map((el) => ({ ...el }));
        for (const el of elements) {
          const nodeId = (_a = el == null ? void 0 : el.customData) == null ? void 0 : _a.nodeId;
          if (nodeId && (highlights == null ? void 0 : highlights.has(nodeId))) {
            const sev = highlights.get(nodeId);
            const c = SEVERITY_COLORS[sev];
            el.strokeColor = c.stroke;
            el.backgroundColor = c.fill;
            nodeSeverityByElId.set(el.id, sev);
          }
        }
        for (const el of elements) {
          if (el.type !== "arrow" && el.type !== "line") continue;
          const startId = (_b = el.startBinding) == null ? void 0 : _b.elementId;
          const endId = (_c = el.endBinding) == null ? void 0 : _c.elementId;
          const sevs = [];
          if (startId && nodeSeverityByElId.has(startId)) sevs.push(nodeSeverityByElId.get(startId));
          if (endId && nodeSeverityByElId.has(endId)) sevs.push(nodeSeverityByElId.get(endId));
          if (!sevs.length) continue;
          const worst = sevs.reduce((a, b) => severityRank(a) >= severityRank(b) ? a : b);
          if (worst === "no_data" || worst === "norm") continue;
          el.strokeColor = SEVERITY_COLORS[worst].stroke;
          el.strokeWidth = Math.max(2, (el.strokeWidth ?? 1) + 1);
        }
        const svg = await exportToSvg({
          elements,
          appState: {
            ...scene.appState || {},
            exportBackground: false,
            exportWithDarkMode: false
          },
          files: scene.files || null
        });
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.display = "block";
        svg.style.maxWidth = "100%";
        if (maxHeight) svg.style.maxHeight = `${maxHeight}px`;
        if (rxNodes && rxNodes.size > 0) {
          const svgNS = "http://www.w3.org/2000/svg";
          for (const el of scene.elements) {
            const nodeId = (_d = el == null ? void 0 : el.customData) == null ? void 0 : _d.nodeId;
            if (!nodeId || !rxNodes.has(nodeId)) continue;
            const w = Number(el.width) || 0;
            const h = Number(el.height) || 0;
            const cx = Number(el.x) + w;
            const cy = Number(el.y);
            const g = document.createElementNS(svgNS, "g");
            g.setAttribute("transform", `translate(${cx - 10}, ${cy - 10})`);
            const c = document.createElementNS(svgNS, "circle");
            c.setAttribute("r", "12");
            c.setAttribute("fill", "#10b981");
            c.setAttribute("stroke", "#065f46");
            c.setAttribute("stroke-width", "1.5");
            const t = document.createElementNS(svgNS, "text");
            t.setAttribute("text-anchor", "middle");
            t.setAttribute("dominant-baseline", "central");
            t.setAttribute("font-size", "13");
            t.setAttribute("font-weight", "700");
            t.setAttribute("fill", "white");
            t.textContent = "℞";
            g.appendChild(c);
            g.appendChild(t);
            const label = rxLabelByNode == null ? void 0 : rxLabelByNode.get(nodeId);
            if (label) {
              const lt = document.createElementNS(svgNS, "text");
              lt.setAttribute("text-anchor", "start");
              lt.setAttribute("x", "16");
              lt.setAttribute("y", "4");
              lt.setAttribute("font-size", "11");
              lt.setAttribute("fill", "#065f46");
              lt.textContent = label.length > 40 ? label.slice(0, 40) + "…" : label;
              g.appendChild(lt);
            }
            svg.appendChild(g);
          }
        }
        if (cancelled) return;
        const host = containerRef.current;
        if (host) {
          host.innerHTML = "";
          host.appendChild(svg);
        }
        setLoading(false);
      } catch (e) {
        console.error("[PathwaySceneSVG] render failed", e);
        setLoading(false);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [scene, highlights, maxHeight, rxNodes, rxLabelByNode]);
  if (empty) {
    return /* @__PURE__ */ jsx("div", { className: `text-xs italic text-muted-foreground px-2 py-6 text-center rounded bg-muted/30 ${className}`, children: fallback ?? "Схема пути пока не задана" });
  }
  return /* @__PURE__ */ jsxs("div", { className: `relative rounded bg-muted/20 overflow-hidden ${className}`, children: [
    loading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-background/50", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground" }) }),
    /* @__PURE__ */ jsx("div", { ref: containerRef, className: "w-full" })
  ] });
}
const cascade = (n, e) => ({
  archetype: "cascade",
  nodes: n.map(([id, label, col, row]) => ({ id, label, col, row: row ?? 0 })),
  edges: e.map(([from, to, label]) => ({ from, to, label }))
});
const conv = (n, e) => ({
  archetype: "conveyor",
  nodes: n.map(([id, label, col, row]) => ({ id, label, col, row: row ?? 0 })),
  edges: e.map(([from, to, label, dashed]) => ({ from, to, label, dashed }))
});
const ring = (n, e) => ({
  archetype: "ring",
  nodes: n.map(([id, label], i) => ({ id, label, col: i })),
  edges: e.map(([from, to, label]) => ({ from, to, label }))
});
const PATHWAY_TEMPLATES = {
  // ── Гормональные оси (каскад) ─────────────────────────────
  hpg: cascade(
    [
      ["gnrh", "Гипоталамус · ГнРГ", 0, 1],
      ["lh", "Гипофиз · ЛГ", 1, 0],
      ["fsh", "Гипофиз · ФСГ", 1, 2],
      ["testo", "Тестостерон", 2, 0],
      ["estr", "Эстрадиол", 2, 1],
      ["shbg", "ГСПГ", 2, 2]
    ],
    [["gnrh", "lh"], ["gnrh", "fsh"], ["lh", "testo"], ["fsh", "estr"], ["testo", "shbg", "связь"]]
  ),
  growth_igf1: cascade(
    [
      ["ghrh", "Гипоталамус · СРФ", 0, 1],
      ["gh", "Гипофиз · СТГ", 1, 1],
      ["igf1", "Печень · ИФР-1", 2, 0],
      ["igfbp3", "ИФРСБ-3", 2, 1],
      ["growth", "Рост / метафизы", 2, 2]
    ],
    [["ghrh", "gh"], ["gh", "igf1"], ["gh", "igfbp3"], ["igf1", "growth"]]
  ),
  thyroid: cascade(
    [
      ["trh", "Гипоталамус · ТРГ", 0, 1],
      ["tsh", "Гипофиз · ТТГ", 1, 1],
      ["t4", "Щитовидная · Т4", 2, 0],
      ["t3", "Т3 (свободный)", 2, 1],
      ["at_tpo", "Ат-ТПО / Ат-ТГ", 2, 2]
    ],
    [["trh", "tsh"], ["tsh", "t4"], ["t4", "t3"], ["at_tpo", "t4", "аутоагрессия"]]
  ),
  hpa: cascade(
    [
      ["crh", "Гипоталамус · КРГ", 0, 1],
      ["acth", "Гипофиз · АКТГ", 1, 1],
      ["cort", "Кортизол утро", 2, 0],
      ["cort_ev", "Кортизол вечер", 2, 1],
      ["dheas", "ДГЭА-С", 2, 2]
    ],
    [["crh", "acth"], ["acth", "cort"], ["acth", "cort_ev"], ["acth", "dheas"]]
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
      ["oaa", "Оксалоацетат"]
    ],
    [
      ["citrate", "isocitrate"],
      ["isocitrate", "akg"],
      ["akg", "succinyl"],
      ["succinyl", "succinate"],
      ["succinate", "fumarate"],
      ["fumarate", "malate"],
      ["malate", "oaa"],
      ["oaa", "citrate"]
    ]
  ),
  insulin_glucose: conv(
    [
      ["glu", "Глюкоза натощак", 0, 0],
      ["ins", "Инсулин", 0, 1],
      ["homa", "HOMA-IR", 1, 0],
      ["hba1c", "HbA1c", 1, 1],
      ["ir", "Инсулинорезистентность", 2, 0]
    ],
    [["glu", "homa"], ["ins", "homa"], ["homa", "ir"], ["hba1c", "ir"]]
  ),
  lipids: conv(
    [
      ["chol", "Общий ХС", 0, 0],
      ["ldl", "ЛПНП", 1, 0],
      ["hdl", "ЛПВП", 1, 1],
      ["tg", "Триглицериды", 1, 2],
      ["atg", "Атерогенность / АпоB", 2, 0]
    ],
    [["chol", "ldl"], ["chol", "hdl"], ["chol", "tg"], ["ldl", "atg"], ["tg", "atg"]]
  ),
  // ── Кровь, железо, воспаление ─────────────────────────────
  iron: conv(
    [
      ["ferr", "Депо · Ферритин", 0, 0],
      ["tsat", "Транспорт · Fe/ОЖСС", 1, 0],
      ["hb", "Эритропоэз · Hb", 2, 0],
      ["mcv", "MCV / MCH", 2, 1]
    ],
    [["ferr", "tsat"], ["tsat", "hb"], ["tsat", "mcv"]]
  ),
  inflammation: conv(
    [
      ["crp", "СРБ", 0, 0],
      ["esr", "СОЭ", 0, 1],
      ["fib", "Фибриноген", 1, 0],
      ["alb", "Альбумин", 1, 1],
      ["prot", "Общий белок", 2, 0]
    ],
    [["crp", "fib"], ["esr", "fib"], ["fib", "prot"], ["alb", "prot"]]
  ),
  // ── Микронутриенты и метилирование ────────────────────────
  methylation: conv(
    [
      ["met", "Метионин", 0, 0],
      ["sam", "SAM", 1, 0],
      ["sah", "SAH", 1, 1],
      ["hcy", "Гомоцистеин", 2, 0],
      ["b12", "B12 / фолат", 2, 1]
    ],
    [["met", "sam"], ["sam", "sah"], ["sah", "hcy"], ["b12", "hcy", "реметилирование"]]
  ),
  micronutrients: conv(
    [
      ["d25", "25(OH)D", 0, 0],
      ["b12", "B12", 0, 1],
      ["fol", "Фолаты", 0, 2],
      ["mg", "Магний", 1, 0],
      ["zn", "Цинк", 1, 1],
      ["se", "Селен", 1, 2]
    ],
    []
  ),
  micronutrients_steroid: conv(
    [
      ["zn", "Zn (5α-редуктаза)", 0, 0],
      ["se", "Se (дейодиназа)", 0, 1],
      ["mg", "Mg (ГАМК/митохондрии)", 0, 2],
      ["b6", "B6 (аминокислоты)", 1, 0],
      ["chol", "Холестерин → стероиды", 2, 0]
    ],
    [["zn", "chol"], ["se", "chol"], ["b6", "chol"]]
  ),
  bone_mineral: conv(
    [
      ["d25", "25(OH)D", 0, 0],
      ["ca", "Кальций", 1, 0],
      ["p", "Фосфор", 1, 1],
      ["pth", "ПТГ", 1, 2],
      ["alp", "ЩФ костная", 2, 0]
    ],
    [["d25", "ca"], ["d25", "p"], ["pth", "ca"], ["ca", "alp"]]
  ),
  // ── Аминокислоты и защита ─────────────────────────────────
  amino_urea: conv(
    [
      ["prot", "Белок пищи", 0, 0],
      ["aa", "Аминокислоты", 1, 0],
      ["nh3", "Аммиак", 2, 0],
      ["urea", "Мочевина", 3, 0],
      ["b6", "B6 · кофактор", 1, 1]
    ],
    [["prot", "aa"], ["aa", "nh3"], ["nh3", "urea"], ["b6", "aa", "кофактор"]]
  ),
  detox_p12: conv(
    [
      ["tox", "Токсин / метаболит", 0, 0],
      ["p1", "Фаза I (CYP)", 1, 0],
      ["p2", "Фаза II (конъюгация)", 2, 0],
      ["out", "Выведение", 3, 0],
      ["gsh", "Глутатион", 2, 1]
    ],
    [["tox", "p1"], ["p1", "p2"], ["p2", "out"], ["gsh", "p2", "кофактор"]]
  ),
  neurotransmitters: conv(
    [
      ["trp", "Триптофан", 0, 0],
      ["tyr", "Тирозин", 0, 1],
      ["ser", "Серотонин", 1, 0],
      ["da", "Дофамин", 1, 1],
      ["ne", "Норадреналин", 2, 1],
      ["mel", "Мелатонин", 2, 0]
    ],
    [["trp", "ser"], ["ser", "mel"], ["tyr", "da"], ["da", "ne"]]
  ),
  oxidative_stress: conv(
    [
      ["ros", "АФК", 0, 0],
      ["sod", "СОД", 1, 0],
      ["gpx", "GPx / GSH", 1, 1],
      ["cat", "Каталаза", 1, 2],
      ["mda", "МДА / 8-OHdG", 2, 0]
    ],
    [["ros", "sod"], ["ros", "gpx"], ["ros", "cat"], ["sod", "mda"]]
  ),
  // ── Водно-электролитный баланс ────────────────────────────
  electrolytes_abr: conv(
    [
      ["na", "Na⁺", 0, 0],
      ["k", "K⁺", 0, 1],
      ["cl", "Cl⁻", 0, 2],
      ["ph", "pH / HCO₃⁻", 1, 0],
      ["osm", "Осмолярность", 2, 0]
    ],
    [["na", "osm"], ["k", "ph"], ["cl", "ph"]]
  ),
  // ── Прочее ────────────────────────────────────────────────
  gut_permeability: conv(
    [
      ["diet", "Пища / антигены", 0, 0],
      ["zon", "Зонулин", 1, 0],
      ["perm", "Проницаемость ↑", 2, 0],
      ["inf", "Системное воспаление", 3, 0]
    ],
    [["diet", "zon"], ["zon", "perm"], ["perm", "inf"]]
  ),
  mast_cell_histamine: conv(
    [
      ["trig", "Триггер", 0, 0],
      ["mast", "Мастоцит", 1, 0],
      ["hist", "Гистамин ↑", 2, 0],
      ["dao", "DAO / MAO", 2, 1],
      ["sym", "Симптомы", 3, 0]
    ],
    [["trig", "mast"], ["mast", "hist"], ["hist", "sym"], ["dao", "hist", "деградация"]]
  )
};
function getTemplate(slug) {
  return PATHWAY_TEMPLATES[slug] ?? null;
}
const NODE_W = 130;
const NODE_H = 52;
const CANVAS_W = 720;
function layout(t, targetH = 320) {
  const nodes = /* @__PURE__ */ new Map();
  if (t.archetype === "ring") {
    const H2 = targetH;
    const cx = CANVAS_W / 2;
    const cy = H2 / 2;
    const rx = CANVAS_W / 2 - NODE_W / 2 - 20;
    const ry = H2 / 2 - NODE_H / 2 - 20;
    const N = t.nodes.length;
    t.nodes.forEach((n, i) => {
      const a = i / N * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * rx - NODE_W / 2;
      const y = cy + Math.sin(a) * ry - NODE_H / 2;
      nodes.set(n.id, { x, y, w: NODE_W, h: NODE_H, cx: x + NODE_W / 2, cy: y + NODE_H / 2 });
    });
    return { width: CANVAS_W, height: H2, nodes };
  }
  if (t.archetype === "cascade") {
    const tiers = /* @__PURE__ */ new Map();
    for (const n of t.nodes) {
      const arr = tiers.get(n.col) || [];
      arr.push(n);
      tiers.set(n.col, arr);
    }
    const tierKeys = [...tiers.keys()].sort((a, b) => a - b);
    const H2 = Math.max(targetH, tierKeys.length * 110);
    const yStep = H2 / (tierKeys.length + 1);
    tierKeys.forEach((k, tIdx) => {
      const arr = tiers.get(k).slice().sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
      const step = CANVAS_W / (arr.length + 1);
      arr.forEach((n, i) => {
        const cx = step * (i + 1);
        const cy = yStep * (tIdx + 1);
        nodes.set(n.id, { x: cx - NODE_W / 2, y: cy - NODE_H / 2, w: NODE_W, h: NODE_H, cx, cy });
      });
    });
    return { width: CANVAS_W, height: H2, nodes };
  }
  const cols = /* @__PURE__ */ new Map();
  for (const n of t.nodes) {
    const arr = cols.get(n.col) || [];
    arr.push(n);
    cols.set(n.col, arr);
  }
  const colKeys = [...cols.keys()].sort((a, b) => a - b);
  const maxRow = Math.max(1, ...t.nodes.map((n) => (n.row ?? 0) + 1));
  const H = Math.max(targetH, maxRow * 90);
  const xStep = CANVAS_W / (colKeys.length + 1);
  colKeys.forEach((k, cIdx) => {
    const arr = cols.get(k).slice().sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
    const yStep = H / (arr.length + 1);
    arr.forEach((n, i) => {
      const cx = xStep * (cIdx + 1);
      const cy = yStep * (i + 1);
      nodes.set(n.id, { x: cx - NODE_W / 2, y: cy - NODE_H / 2, w: NODE_W, h: NODE_H, cx, cy });
    });
  });
  return { width: CANVAS_W, height: H, nodes };
}
let seed = 1;
const nextSeed$1 = () => seed = (seed + 9973) % 2147483647;
function baseEl$1(id) {
  return {
    id,
    angle: 0,
    strokeColor: "#334155",
    backgroundColor: "#ffffff",
    fillStyle: "solid",
    strokeWidth: 1.5,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: nextSeed$1(),
    version: 1,
    versionNonce: nextSeed$1(),
    isDeleted: false,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false
  };
}
function templateToScene(template) {
  var _a, _b;
  seed = 1;
  const geom = layout(template);
  const elements = [];
  const rectIdByNode = /* @__PURE__ */ new Map();
  const bindByRect = /* @__PURE__ */ new Map();
  for (const n of template.nodes) {
    const g = geom.nodes.get(n.id);
    if (!g) continue;
    const rectId = `rect-${n.id}`;
    const textId = `text-${n.id}`;
    rectIdByNode.set(n.id, rectId);
    const rectEl = {
      ...baseEl$1(rectId),
      type: "rectangle",
      x: g.x,
      y: g.y,
      width: g.w,
      height: g.h,
      roundness: { type: 3 },
      backgroundColor: "#f8fafc",
      strokeColor: "#94a3b8",
      customData: { nodeId: n.id },
      boundElements: [{ id: textId, type: "text" }]
    };
    bindByRect.set(rectId, rectEl.boundElements);
    elements.push(rectEl);
    elements.push({
      ...baseEl$1(textId),
      type: "text",
      x: g.x + 6,
      y: g.cy - 10,
      width: g.w - 12,
      height: 20,
      text: n.label,
      fontSize: 13,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 16,
      containerId: rectId,
      originalText: n.label,
      lineHeight: 1.2
    });
  }
  for (const e of template.edges) {
    const a = geom.nodes.get(e.from);
    const b = geom.nodes.get(e.to);
    const startId = rectIdByNode.get(e.from);
    const endId = rectIdByNode.get(e.to);
    if (!a || !b || !startId || !endId) continue;
    const arrowId = `arrow-${e.from}-${e.to}`;
    const arrowEl = {
      ...baseEl$1(arrowId),
      type: "arrow",
      x: a.cx,
      y: a.cy,
      width: b.cx - a.cx,
      height: b.cy - a.cy,
      points: [
        [0, 0],
        [b.cx - a.cx, b.cy - a.cy]
      ],
      lastCommittedPoint: null,
      startBinding: { elementId: startId, focus: 0, gap: 6 },
      endBinding: { elementId: endId, focus: 0, gap: 6 },
      startArrowhead: null,
      endArrowhead: "arrow",
      strokeColor: "#94a3b8",
      strokeWidth: 1.5,
      customData: { edge: `${e.from}__${e.to}` }
    };
    if (e.dashed) arrowEl.strokeStyle = "dashed";
    elements.push(arrowEl);
    (_a = bindByRect.get(startId)) == null ? void 0 : _a.push({ id: arrowId, type: "arrow" });
    (_b = bindByRect.get(endId)) == null ? void 0 : _b.push({ id: arrowId, type: "arrow" });
  }
  return {
    elements,
    appState: { viewBackgroundColor: "#ffffff", gridSize: null },
    files: {}
  };
}
function RxBlock({
  recs,
  affectedNodes,
  onTogglePrint,
  compact = false,
  showEmpty = true
}) {
  const byNode = /* @__PURE__ */ new Map();
  for (const r of recs) {
    const k = r.target_node_id || "_";
    if (!byNode.has(k)) byNode.set(k, []);
    byNode.get(k).push(r);
  }
  const nodesFromRecs = new Set(byNode.keys());
  const missingNodes = (affectedNodes || []).filter((n) => !nodesFromRecs.has(n));
  if (recs.length === 0 && missingNodes.length === 0 && !showEmpty) return null;
  return /* @__PURE__ */ jsxs("div", { className: compact ? "text-xs space-y-2 pt-2 border-t" : "text-sm space-y-3 pt-3 border-t", children: [
    /* @__PURE__ */ jsxs("div", { className: "font-medium flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsx("span", { className: "text-emerald-700 dark:text-emerald-400 font-semibold", children: "℞" }),
      "Точки приложения терапии (из каталога)"
    ] }),
    recs.length === 0 && /* @__PURE__ */ jsxs("div", { className: "italic text-muted-foreground", children: [
      "В каталоге нет средств, привязанных к сработавшим показателям этого пути. Пополните ",
      /* @__PURE__ */ jsx("code", { children: "targets" }),
      " в каталоге лечения."
    ] }),
    [...byNode.entries()].map(([node, items]) => /* @__PURE__ */ jsxs("div", { className: "rounded border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 space-y-1.5", children: [
      /* @__PURE__ */ jsx("div", { className: "font-medium text-emerald-900 dark:text-emerald-200", children: items[0].application_point || node }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: items.map((r) => {
        var _a, _b, _c, _d, _e;
        return /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          onTogglePrint && /* @__PURE__ */ jsx(
            Checkbox,
            {
              className: "mt-0.5",
              checked: r.include_in_print,
              onCheckedChange: (v) => onTogglePrint(r.id, !!v),
              "aria-label": "Включить в печать"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: ((_a = r.catalog) == null ? void 0 : _a.name) || "—" }),
              ((_b = r.catalog) == null ? void 0 : _b.category) && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] px-1 py-0", children: r.catalog.category }),
              r.priority > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] px-1 py-0", children: [
                "P",
                r.priority
              ] }),
              r.evidence_level > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] px-1 py-0", children: [
                "EL",
                r.evidence_level
              ] }),
              r.is_manual && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] px-1 py-0", children: "ручное" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: [
              ((_c = r.catalog) == null ? void 0 : _c.default_dose) != null ? `${r.catalog.default_dose}${r.catalog.dose_unit ? " " + r.catalog.dose_unit : ""}` : null,
              (_d = r.catalog) == null ? void 0 : _d.default_route_label,
              (_e = r.catalog) == null ? void 0 : _e.default_frequency
            ].filter(Boolean).join(" · ") || "—" }),
            r.rationale && /* @__PURE__ */ jsx("div", { className: "text-[11px] italic opacity-80", children: r.rationale }),
            (r.age_warning || r.contra_warning) && /* @__PURE__ */ jsxs("div", { className: "text-[11px] mt-1 flex items-start gap-1 text-amber-800 dark:text-amber-300", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsxs("span", { children: [
                r.age_warning && /* @__PURE__ */ jsx("div", { children: r.age_warning }),
                r.contra_warning && /* @__PURE__ */ jsx("div", { children: r.contra_warning })
              ] })
            ] })
          ] })
        ] }, r.id);
      }) })
    ] }, node)),
    missingNodes.map((n) => /* @__PURE__ */ jsxs("div", { className: "italic text-muted-foreground text-[12px] pl-2 border-l-2 border-muted", children: [
      n,
      ": в каталоге нет средства для этой точки."
    ] }, n))
  ] });
}
const RECT_W = 130;
const RECT_H = 52;
let seedCounter = 1;
function nextSeed() {
  seedCounter = (seedCounter + 9973) % 2147483647;
  return seedCounter;
}
function baseEl(id) {
  return {
    id,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "#ffffff",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false
  };
}
function positioned(nodes) {
  return nodes.map((n, i) => {
    if (typeof n.x === "number" && typeof n.y === "number") return n;
    const col = i % 4;
    const row = Math.floor(i / 4);
    return { ...n, x: 40 + col * 160, y: 40 + row * 120 };
  });
}
function buildAutoScene(nodes, edges) {
  seedCounter = 1;
  const laid = positioned(nodes);
  const elements = [];
  const rectIdByNode = /* @__PURE__ */ new Map();
  for (const n of laid) {
    const rectId = `rect-${n.id}`;
    const textId = `text-${n.id}`;
    rectIdByNode.set(n.id, rectId);
    elements.push({
      ...baseEl(rectId),
      type: "rectangle",
      x: n.x,
      y: n.y,
      width: RECT_W,
      height: RECT_H,
      roundness: { type: 3 },
      backgroundColor: "#f8fafc",
      customData: { nodeId: n.id }
    });
    elements.push({
      ...baseEl(textId),
      type: "text",
      x: n.x,
      y: n.y + RECT_H / 2 - 10,
      width: RECT_W,
      height: 20,
      text: n.label,
      fontSize: 14,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 16,
      containerId: null,
      originalText: n.label
    });
  }
  for (const e of edges) {
    const a = laid.find((n) => n.id === e.from);
    const b = laid.find((n) => n.id === e.to);
    if (!a || !b) continue;
    const startId = rectIdByNode.get(e.from);
    const endId = rectIdByNode.get(e.to);
    const arrowId = `arrow-${e.from}-${e.to}`;
    const startCx = a.x + RECT_W / 2;
    const startCy = a.y + RECT_H / 2;
    const endCx = b.x + RECT_W / 2;
    const endCy = b.y + RECT_H / 2;
    elements.push({
      ...baseEl(arrowId),
      type: "arrow",
      x: startCx,
      y: startCy,
      width: endCx - startCx,
      height: endCy - startCy,
      points: [
        [0, 0],
        [endCx - startCx, endCy - startCy]
      ],
      lastCommittedPoint: null,
      startBinding: startId ? { elementId: startId, focus: 0, gap: 4 } : null,
      endBinding: endId ? { elementId: endId, focus: 0, gap: 4 } : null,
      startArrowhead: null,
      endArrowhead: "arrow"
    });
  }
  return {
    elements,
    appState: { viewBackgroundColor: "transparent" },
    files: {}
  };
}
export {
  PathwaySceneSVG as P,
  RxBlock as R,
  SEVERITY_COLORS as S,
  SEVERITY_ORDER as a,
  buildAutoScene as b,
  getTemplate as g,
  templateToScene as t
};
