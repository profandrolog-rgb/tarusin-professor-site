import { SEVERITY_COLORS } from "@/lib/metabolic/severityColors";
import type { Severity } from "@/lib/metabolic/aggregator";
import { cn } from "@/lib/utils";

export type MetroPathway = {
  id: string;
  slug: string;
  name: string;
  status: Severity;
};

const STATUS_ORDER: Record<Severity, number> = {
  severe: 0,
  moderate: 1,
  mild: 2,
  norm: 3,
  no_data: 4,
};

/**
 * Обзорная карта путей — читаемая адаптивная сетка карточек.
 * Каждая карточка = один путь, цвет фона/бордера = тяжесть.
 * Сортировка: сначала критичные → «нет данных» в конце.
 */
export function MetroOverview({
  pathways,
  onSelect,
}: {
  pathways: MetroPathway[];
  onSelect?: (slug: string) => void;
}) {
  if (!pathways.length) {
    return <div className="text-sm text-muted-foreground italic px-3 py-6">Пути не заданы</div>;
  }
  const sorted = [...pathways].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name, "ru"),
  );

  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {sorted.map((p) => {
        const c = SEVERITY_COLORS[p.status];
        const clickable = !!onSelect;
        const isHot = p.status === "mild" || p.status === "moderate" || p.status === "severe";
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect?.(p.slug)}
            className={cn(
              "text-left rounded-lg border p-2.5 transition-all",
              clickable && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
              isHot ? "border-2" : "border",
            )}
            style={{
              background: c.fill,
              borderColor: c.stroke,
            }}
            title={`${p.name} — ${c.label}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: c.stroke }}
              />
              <span
                className="text-[10px] uppercase tracking-wide font-semibold"
                style={{ color: c.stroke }}
              >
                {c.label}
              </span>
            </div>
            <div className="text-xs font-medium leading-tight text-foreground line-clamp-3">
              {p.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
