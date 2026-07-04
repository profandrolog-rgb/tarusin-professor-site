// Конвертер фиксированного шаблона пути (pathwayTemplates.ts) в сцену
// Excalidraw. Каждому подсвечиваемому узлу проставляется
// customData.nodeId (стабильный ключ находки), каждой стрелке —
// customData.edge = "<from>__<to>", а также startBinding/endBinding,
// чтобы PathwaySceneSVG перекрашивал линии по тяжести узлов.
//
// Координаты берутся из TemplateSVG (единый computeLayout), чтобы
// редактор и рендер карты всегда стартовали с одной и той же геометрии.

import type { SceneJson } from "@/components/metabolic/PathwaySceneSVG";
import type { Template } from "@/lib/metabolic/pathwayTemplates";

const NODE_W = 130;
const NODE_H = 52;
const CANVAS_W = 720;

type Geom = { x: number; y: number; w: number; h: number; cx: number; cy: number };

function layout(t: Template, targetH = 320): { width: number; height: number; nodes: Map<string, Geom> } {
  const nodes = new Map<string, Geom>();

  if (t.archetype === "ring") {
    const H = targetH;
    const cx = CANVAS_W / 2;
    const cy = H / 2;
    const rx = CANVAS_W / 2 - NODE_W / 2 - 20;
    const ry = H / 2 - NODE_H / 2 - 20;
    const N = t.nodes.length;
    t.nodes.forEach((n, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * rx - NODE_W / 2;
      const y = cy + Math.sin(a) * ry - NODE_H / 2;
      nodes.set(n.id, { x, y, w: NODE_W, h: NODE_H, cx: x + NODE_W / 2, cy: y + NODE_H / 2 });
    });
    return { width: CANVAS_W, height: H, nodes };
  }

  if (t.archetype === "cascade") {
    const tiers = new Map<number, typeof t.nodes>();
    for (const n of t.nodes) {
      const arr = tiers.get(n.col) || [];
      arr.push(n);
      tiers.set(n.col, arr);
    }
    const tierKeys = [...tiers.keys()].sort((a, b) => a - b);
    const H = Math.max(targetH, tierKeys.length * 110);
    const yStep = H / (tierKeys.length + 1);
    tierKeys.forEach((k, tIdx) => {
      const arr = tiers.get(k)!.slice().sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
      const step = CANVAS_W / (arr.length + 1);
      arr.forEach((n, i) => {
        const cx = step * (i + 1);
        const cy = yStep * (tIdx + 1);
        nodes.set(n.id, { x: cx - NODE_W / 2, y: cy - NODE_H / 2, w: NODE_W, h: NODE_H, cx, cy });
      });
    });
    return { width: CANVAS_W, height: H, nodes };
  }

  // conveyor
  const cols = new Map<number, typeof t.nodes>();
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
    const arr = cols.get(k)!.slice().sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
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
const nextSeed = () => (seed = (seed + 9973) % 2_147_483_647);

function baseEl(id: string) {
  return {
    id,
    angle: 0,
    strokeColor: "#334155",
    backgroundColor: "#ffffff",
    fillStyle: "solid" as const,
    strokeWidth: 1.5,
    strokeStyle: "solid" as const,
    roughness: 0,
    opacity: 100,
    groupIds: [] as string[],
    frameId: null as null,
    roundness: null as null,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    boundElements: [] as any[],
    updated: 1,
    link: null as null,
    locked: false,
  };
}

/**
 * Из фиксированного шаблона строит сцену Excalidraw.
 * У каждого прямоугольника — customData.nodeId, у каждой стрелки — customData.edge.
 */
export function templateToScene(template: Template): SceneJson {
  seed = 1;
  const geom = layout(template);
  const elements: any[] = [];
  const rectIdByNode = new Map<string, string>();
  const bindByRect = new Map<string, any[]>();

  for (const n of template.nodes) {
    const g = geom.nodes.get(n.id);
    if (!g) continue;
    const rectId = `rect-${n.id}`;
    const textId = `text-${n.id}`;
    rectIdByNode.set(n.id, rectId);

    const rectEl: any = {
      ...baseEl(rectId),
      type: "rectangle",
      x: g.x,
      y: g.y,
      width: g.w,
      height: g.h,
      roundness: { type: 3 },
      backgroundColor: "#f8fafc",
      strokeColor: "#94a3b8",
      customData: { nodeId: n.id },
      boundElements: [{ id: textId, type: "text" }],
    };
    bindByRect.set(rectId, rectEl.boundElements);
    elements.push(rectEl);

    elements.push({
      ...baseEl(textId),
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
      lineHeight: 1.2,
    });
  }

  for (const e of template.edges) {
    const a = geom.nodes.get(e.from);
    const b = geom.nodes.get(e.to);
    const startId = rectIdByNode.get(e.from);
    const endId = rectIdByNode.get(e.to);
    if (!a || !b || !startId || !endId) continue;

    const arrowId = `arrow-${e.from}-${e.to}`;
    const arrowEl: any = {
      ...baseEl(arrowId),
      type: "arrow",
      x: a.cx,
      y: a.cy,
      width: b.cx - a.cx,
      height: b.cy - a.cy,
      points: [
        [0, 0],
        [b.cx - a.cx, b.cy - a.cy],
      ],
      lastCommittedPoint: null,
      startBinding: { elementId: startId, focus: 0, gap: 6 },
      endBinding: { elementId: endId, focus: 0, gap: 6 },
      startArrowhead: null,
      endArrowhead: "arrow" as const,
      strokeColor: "#94a3b8",
      strokeWidth: 1.5,
      customData: { edge: `${e.from}__${e.to}` },
    };
    if (e.dashed) arrowEl.strokeStyle = "dashed";
    elements.push(arrowEl);

    // фиксируем bindings со стороны прямоугольников
    bindByRect.get(startId)?.push({ id: arrowId, type: "arrow" });
    bindByRect.get(endId)?.push({ id: arrowId, type: "arrow" });
  }

  return {
    elements,
    appState: { viewBackgroundColor: "#ffffff", gridSize: null },
    files: {},
  };
}
