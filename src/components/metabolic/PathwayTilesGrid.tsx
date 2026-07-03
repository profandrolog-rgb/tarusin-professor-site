import { SEVERITY_COLORS } from "@/lib/metabolic/severityColors";
import type { Severity } from "@/lib/metabolic/aggregator";
import { cn } from "@/lib/utils";

export type TilePathway = {
  id: string;
  slug: string;
  name: string;
  status: Severity;
  group: string | null;
  group_order: number | null;
  /** Короткое доказательство: 1-2 маркера, «Ферритин 6, Hb 108» */
  evidence?: string;
};

const GROUPS: Array<{ key: string; title: string }> = [
  { key: "energy_substrates", title: "Энергия и субстраты" },
  { key: "hormonal_axes", title: "Гормональные оси" },
  { key: "blood_iron_inflammation", title: "Кровь, железо, воспаление" },
  { key: "micronutrients_methylation", title: "Микронутриенты и метилирование" },
  { key: "amino_defense", title: "Аминокислоты и защита" },
  { key: "water_electrolytes", title: "Водно-электролитный баланс" },
  { key: "other", title: "Прочее" },
];

const STATUS_RANK: Record<Severity, number> = {
  severe: 0,
  moderate: 1,
  mild: 2,
  norm: 3,
  no_data: 4,
};

/**
 * Обзорная карта путей — плитки по 6 группам обмена (по прототипу).
 * Каждая плитка = карточка с левой цветной полосой = severity + название + подпись статуса
 * + опциональное короткое evidence (первые маркеры).
 */
export function PathwayTilesGrid({
  pathways,
  onSelect,
}: {
  pathways: TilePathway[];
  onSelect?: (slug: string) => void;
}) {
  if (!pathways.length) {
    return <div className="text-sm text-muted-foreground italic px-3 py-6">Пути не заданы</div>;
  }

  // Группируем и сортируем группы по group_order.
  const byGroup = new Map<string, TilePathway[]>();
  for (const p of pathways) {
    const g = p.group || "other";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(p);
  }
  const orderedGroups = GROUPS.filter((g) => byGroup.has(g.key)).concat(
    [...byGroup.keys()]
      .filter((k) => !GROUPS.find((g) => g.key === k))
      .map((k) => ({ key: k, title: k })),
  );

  return (
    <div className="space-y-4">
      {orderedGroups.map((g) => {
        const items = (byGroup.get(g.key) || []).sort(
          (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.name.localeCompare(b.name, "ru"),
        );
        return (
          <div key={g.key} className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-1">
              {g.title}
            </div>
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
              {items.map((p) => {
                const c = SEVERITY_COLORS[p.status];
                const clickable = !!onSelect;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelect?.(p.slug)}
                    className={cn(
                      "group text-left rounded-md border bg-card overflow-hidden transition-all flex",
                      clickable && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                    )}
                    style={{ borderColor: c.stroke + "55" }}
                    title={`${p.name} — ${c.label}`}
                  >
                    <span
                      className="w-1.5 shrink-0"
                      style={{ background: c.stroke }}
                      aria-hidden
                    />
                    <span className="flex-1 min-w-0 px-3 py-2">
                      <span className="block text-sm font-medium leading-tight text-foreground line-clamp-2">
                        {p.name}
                      </span>
                      <span
                        className="mt-1 inline-block text-[10px] uppercase tracking-wide font-semibold"
                        style={{ color: c.stroke }}
                      >
                        {c.label}
                      </span>
                      {p.evidence && (p.status === "mild" || p.status === "moderate" || p.status === "severe") && (
                        <span className="block mt-1 text-[11px] text-muted-foreground line-clamp-2">
                          {p.evidence}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
