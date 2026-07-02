// Auto-layout: строит сцену Excalidraw из nodes/edges пути,
// чтобы отображать её через PathwaySceneSVG даже если врач ещё не рисовал.

import type { SceneJson } from "@/components/metabolic/PathwaySceneSVG";

type Node = { id: string; label: string; x?: number; y?: number };
type Edge = { from: string; to: string; label?: string };

const RECT_W = 130;
const RECT_H = 52;

let seedCounter = 1;
function nextSeed() {
  seedCounter = (seedCounter + 9973) % 2_147_483_647;
  return seedCounter;
}

function baseEl(id: string) {
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

/** Сгенерировать простую сетку узлов, если у части нет координат */
function positioned(nodes: Node[]) {
  return nodes.map((n, i) => {
    if (typeof n.x === "number" && typeof n.y === "number") return n;
    const col = i % 4;
    const row = Math.floor(i / 4);
    return { ...n, x: 40 + col * 160, y: 40 + row * 120 };
  });
}

/** Строит Excalidraw-сцену для авто-отображения (можно потом отредактировать) */
export function buildAutoScene(nodes: Node[], edges: Edge[]): SceneJson {
  seedCounter = 1;
  const laid = positioned(nodes);
  const elements: any[] = [];
  const rectIdByNode = new Map<string, string>();

  // Прямоугольники + подписи узлов
  for (const n of laid) {
    const rectId = `rect-${n.id}`;
    const textId = `text-${n.id}`;
    rectIdByNode.set(n.id, rectId);
    elements.push({
      ...baseEl(rectId),
      type: "rectangle",
      x: n.x!,
      y: n.y!,
      width: RECT_W,
      height: RECT_H,
      roundness: { type: 3 },
      backgroundColor: "#f8fafc",
      customData: { nodeId: n.id },
    });
    elements.push({
      ...baseEl(textId),
      type: "text",
      x: n.x!,
      y: n.y! + RECT_H / 2 - 10,
      width: RECT_W,
      height: 20,
      text: n.label,
      fontSize: 14,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 16,
      containerId: null,
      originalText: n.label,
    });
  }

  // Стрелки
  for (const e of edges) {
    const a = laid.find((n) => n.id === e.from);
    const b = laid.find((n) => n.id === e.to);
    if (!a || !b) continue;
    const startId = rectIdByNode.get(e.from);
    const endId = rectIdByNode.get(e.to);
    const arrowId = `arrow-${e.from}-${e.to}`;
    const startCx = a.x! + RECT_W / 2;
    const startCy = a.y! + RECT_H / 2;
    const endCx = b.x! + RECT_W / 2;
    const endCy = b.y! + RECT_H / 2;
    elements.push({
      ...baseEl(arrowId),
      type: "arrow",
      x: startCx,
      y: startCy,
      width: endCx - startCx,
      height: endCy - startCy,
      points: [
        [0, 0],
        [endCx - startCx, endCy - startCy],
      ],
      lastCommittedPoint: null,
      startBinding: startId ? { elementId: startId, focus: 0, gap: 4 } : null,
      endBinding: endId ? { elementId: endId, focus: 0, gap: 4 } : null,
      startArrowhead: null,
      endArrowhead: "arrow",
    });
  }

  return {
    elements,
    appState: { viewBackgroundColor: "transparent" },
    files: {},
  };
}
