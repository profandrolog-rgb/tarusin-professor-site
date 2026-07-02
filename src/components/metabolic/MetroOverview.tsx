import { useMemo } from "react";
import { SEVERITY_COLORS, severityRank } from "@/lib/metabolic/severityColors";
import type { Severity } from "@/lib/metabolic/aggregator";

export type MetroPathway = {
  id: string;
  slug: string;
  name: string;
  status: Severity;
};

// Обзорная карта-«метро»: узел = путь, цвет = тяжесть.
// Раскладка: круговая по количеству путей + связи по эмпирическим смежностям.
// Если связей нет — рисуем «кольцевую линию».
const KNOWN_EDGES: Array<[string, string]> = [
  ["iron", "energy_tca"],
  ["methylation", "energy_tca"],
  ["methylation", "hpg"],
  ["micronutrients", "methylation"],
  ["micronutrients", "iron"],
  ["micronutrients", "energy_tca"],
  ["hpg", "energy_tca"],
];

export function MetroOverview({
  pathways,
  onSelect,
  height = 320,
}: {
  pathways: MetroPathway[];
  onSelect?: (slug: string) => void;
  height?: number;
}) {
  const layout = useMemo(() => {
    const n = pathways.length;
    if (!n) return { W: 600, H: height, nodes: [] as any[], edges: [] as any[] };
    const W = 720, H = height;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.36;
    const nodes = pathways.map((p, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return {
        ...p,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
    const bySlug = new Map(nodes.map((n) => [n.slug, n]));
    // 1) явно известные связи
    const edgeSet = new Set<string>();
    const edges: Array<{ a: any; b: any; sev: Severity }> = [];
    for (const [aSlug, bSlug] of KNOWN_EDGES) {
      const a = bySlug.get(aSlug), b = bySlug.get(bSlug);
      if (!a || !b) continue;
      const key = [aSlug, bSlug].sort().join("|");
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      const sev: Severity = severityRank(a.status) >= severityRank(b.status) ? a.status : b.status;
      edges.push({ a, b, sev });
    }
    // 2) добавим кольцо для видимой цепочки
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i], b = nodes[(i + 1) % nodes.length];
      const key = [a.slug, b.slug].sort().join("|");
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      const sev: Severity = severityRank(a.status) >= severityRank(b.status) ? a.status : b.status;
      edges.push({ a, b, sev });
    }
    return { W, H, nodes, edges };
  }, [pathways, height]);

  if (!pathways.length) {
    return <div className="text-sm text-muted-foreground italic px-3 py-6">Пути не заданы</div>;
  }

  const { W, H, nodes, edges } = layout;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Обзорная метаболическая карта">
      {/* линии связей */}
      {edges.map((e, i) => {
        const isHot = e.sev !== "no_data" && e.sev !== "norm";
        const stroke = isHot ? SEVERITY_COLORS[e.sev].stroke : "#cbd5e1";
        return (
          <line
            key={i}
            x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
            stroke={stroke}
            strokeWidth={isHot ? 5 : 3}
            strokeLinecap="round"
            opacity={isHot ? 0.9 : 0.55}
          />
        );
      })}
      {/* станции — пути */}
      {nodes.map((n) => {
        const c = SEVERITY_COLORS[n.status as Severity];
        return (
          <g
            key={n.id}
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onClick={() => onSelect?.(n.slug)}
          >
            <circle cx={n.x} cy={n.y} r={22} fill={c.fill} stroke={c.stroke} strokeWidth={3} />
            <circle cx={n.x} cy={n.y} r={7} fill={c.stroke} />
            <text
              x={n.x}
              y={n.y + 42}
              textAnchor="middle"
              fontSize="13"
              fontWeight={600}
              fill="hsl(var(--foreground))"
            >
              {n.name}
            </text>
            <text
              x={n.x}
              y={n.y + 58}
              textAnchor="middle"
              fontSize="10"
              fill={c.stroke}
            >
              {c.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
