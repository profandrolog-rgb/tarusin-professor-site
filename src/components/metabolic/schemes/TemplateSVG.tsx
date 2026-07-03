import { useMemo } from "react";
import { SEVERITY_COLORS } from "@/lib/metabolic/severityColors";
import type { Severity } from "@/lib/metabolic/aggregator";
import type { Template } from "@/lib/metabolic/pathwayTemplates";

/**
 * Отрисовщик 3-х архетипов схем: cascade / conveyor / ring.
 * Координаты вычисляются по col/row из Template; узлы одинаковые по размеру,
 * подписи в две строки максимум. Всё гарантированно помещается в viewBox.
 */
export function TemplateSVG({
  template,
  highlights,
  rxNodes,
  rxLabelByNode,
  height = 260,
}: {
  template: Template;
  highlights?: Map<string, Severity>;
  rxNodes?: Set<string>;
  rxLabelByNode?: Map<string, string>;
  height?: number;
}) {
  const layout = useMemo(() => computeLayout(template, height), [template, height]);

  return (
    <div className="w-full rounded bg-muted/20 overflow-hidden">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width="100%"
        height="100%"
        style={{ display: "block", maxHeight: height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Стрелки */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="#64748b" />
          </marker>
          <marker id="arrow-hl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="#dc2626" />
          </marker>
        </defs>

        {/* Рёбра */}
        {template.edges.map((e, i) => {
          const a = layout.nodes.get(e.from);
          const b = layout.nodes.get(e.to);
          if (!a || !b) return null;
          const sevA = highlights?.get(e.from);
          const sevB = highlights?.get(e.to);
          const worst = pickWorst(sevA, sevB);
          const isHl = worst && worst !== "no_data" && worst !== "norm";
          const stroke = isHl ? SEVERITY_COLORS[worst].stroke : "#94a3b8";
          const sw = isHl ? 2 : 1.25;
          const path = edgePath(a, b, template.archetype);
          return (
            <g key={i}>
              <path d={path} fill="none" stroke={stroke} strokeWidth={sw} markerEnd={isHl ? "url(#arrow-hl)" : "url(#arrow)"} strokeDasharray={e.dashed ? "4 3" : undefined} />
              {e.label && (
                <text x={(a.cx + b.cx) / 2} y={(a.cy + b.cy) / 2 - 4} fontSize="9" fill="#64748b" textAnchor="middle">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Узлы */}
        {template.nodes.map((n) => {
          const p = layout.nodes.get(n.id)!;
          const sev = highlights?.get(n.id);
          const c = sev ? SEVERITY_COLORS[sev] : { stroke: "#cbd5e1", fill: "#f8fafc" };
          const hasRx = rxNodes?.has(n.id);
          return (
            <g key={n.id}>
              <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="8" ry="8" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
              {wrapText(n.label, p.w - 10).map((line, li, arr) => (
                <text
                  key={li}
                  x={p.cx}
                  y={p.cy + (li - (arr.length - 1) / 2) * 12}
                  fontSize="10.5"
                  fontWeight="600"
                  fill="#1e293b"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {line}
                </text>
              ))}
              {hasRx && (
                <g transform={`translate(${p.x + p.w - 8}, ${p.y + 8})`}>
                  <circle r="10" fill="#10b981" stroke="#065f46" strokeWidth="1.2" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="white">℞</text>
                  {rxLabelByNode?.get(n.id) && (
                    <text x="14" y="4" fontSize="9" fill="#065f46">
                      {truncate(rxLabelByNode.get(n.id)!, 26)}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────── helpers ─────────────────────────────
type NodeGeom = { x: number; y: number; w: number; h: number; cx: number; cy: number };

function computeLayout(t: Template, targetHeight: number) {
  const W = 640;
  const nodeW = 118;
  const nodeH = 44;
  const nodes = new Map<string, NodeGeom>();

  if (t.archetype === "ring") {
    const H = targetHeight;
    const cx = W / 2;
    const cy = H / 2;
    const rx = W / 2 - nodeW / 2 - 12;
    const ry = H / 2 - nodeH / 2 - 12;
    const N = t.nodes.length;
    t.nodes.forEach((n, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * rx - nodeW / 2;
      const y = cy + Math.sin(a) * ry - nodeH / 2;
      nodes.set(n.id, { x, y, w: nodeW, h: nodeH, cx: x + nodeW / 2, cy: y + nodeH / 2 });
    });
    return { width: W, height: H, nodes };
  }

  if (t.archetype === "cascade") {
    // col = ярус (0..N сверху вниз), row = позиция в ярусе
    const tiers = new Map<number, typeof t.nodes>();
    for (const n of t.nodes) {
      const arr = tiers.get(n.col) || [];
      arr.push(n);
      tiers.set(n.col, arr);
    }
    const tierKeys = [...tiers.keys()].sort((a, b) => a - b);
    const H = Math.max(targetHeight, tierKeys.length * 90);
    const yStep = H / (tierKeys.length + 1);
    tierKeys.forEach((k, tIdx) => {
      const arr = tiers.get(k)!.sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
      const step = W / (arr.length + 1);
      arr.forEach((n, i) => {
        const cx = step * (i + 1);
        const cy = yStep * (tIdx + 1);
        nodes.set(n.id, { x: cx - nodeW / 2, y: cy - nodeH / 2, w: nodeW, h: nodeH, cx, cy });
      });
    });
    return { width: W, height: H, nodes };
  }

  // conveyor: col = слева направо, row = сверху вниз в колонке
  const cols = new Map<number, typeof t.nodes>();
  for (const n of t.nodes) {
    const arr = cols.get(n.col) || [];
    arr.push(n);
    cols.set(n.col, arr);
  }
  const colKeys = [...cols.keys()].sort((a, b) => a - b);
  const maxRow = Math.max(1, ...t.nodes.map((n) => (n.row ?? 0) + 1));
  const H = Math.max(targetHeight, maxRow * 70);
  const xStep = W / (colKeys.length + 1);
  colKeys.forEach((k, cIdx) => {
    const arr = cols.get(k)!.sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
    const yStep = H / (arr.length + 1);
    arr.forEach((n, i) => {
      const cx = xStep * (cIdx + 1);
      const cy = yStep * (i + 1);
      nodes.set(n.id, { x: cx - nodeW / 2, y: cy - nodeH / 2, w: nodeW, h: nodeH, cx, cy });
    });
  });
  return { width: W, height: H, nodes };
}

function edgePath(a: NodeGeom, b: NodeGeom, arch: "cascade" | "conveyor" | "ring"): string {
  if (arch === "ring") {
    // прямая по ободу от края к краю
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const len = Math.hypot(dx, dy) || 1;
    const rA = Math.min(a.w, a.h) / 2;
    const rB = Math.min(b.w, b.h) / 2;
    const sx = a.cx + (dx / len) * rA;
    const sy = a.cy + (dy / len) * rA;
    const ex = b.cx - (dx / len) * rB;
    const ey = b.cy - (dy / len) * rB;
    return `M${sx},${sy} L${ex},${ey}`;
  }
  // Прямоугольные подключения: от края к краю ближайшей стороны
  let sx: number, sy: number, ex: number, ey: number;
  if (arch === "cascade") {
    sx = a.cx; sy = a.y + a.h;
    ex = b.cx; ey = b.y;
  } else {
    sx = a.x + a.w; sy = a.cy;
    ex = b.x; ey = b.cy;
  }
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  return arch === "cascade"
    ? `M${sx},${sy} C${sx},${my} ${ex},${my} ${ex},${ey}`
    : `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`;
}

function pickWorst(a?: Severity, b?: Severity): Severity | undefined {
  const rank: Record<Severity, number> = { no_data: 0, norm: 1, mild: 2, moderate: 3, severe: 4 };
  const arr = [a, b].filter(Boolean) as Severity[];
  if (!arr.length) return undefined;
  return arr.reduce((x, y) => (rank[x] >= rank[y] ? x : y));
}

function wrapText(s: string, maxWidthPx: number): string[] {
  const maxChars = Math.max(8, Math.floor(maxWidthPx / 6.2));
  if (s.length <= maxChars) return [s];
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= maxChars) cur = (cur + " " + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
    if (lines.length === 1 && cur.length > maxChars) { lines.push(cur); cur = ""; break; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2).map((l, i, arr) => (i === 1 && arr.length === 2 && s.length > l.length + arr[0].length + 1 ? truncate(l, maxChars - 1) + "…" : l));
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, Math.max(0, n - 1)) + "…";
}
