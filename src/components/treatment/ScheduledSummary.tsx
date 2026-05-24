import { useMemo } from "react";
import type { PlanItem } from "./PlanItemRow";
import { expandDays } from "@/lib/dayPattern";

interface Props {
  items: PlanItem[];
  durationDays: number;
}

export function ScheduledSummary({ items, durationDays }: Props) {
  const stats = useMemo(() => {
    const ivCats: PlanItem["section_category"][] = ["iv_drip", "iv_bolus"];
    const ivItems = items.filter(i => ivCats.includes(i.section_category));
    const ivDays = new Set<number>();
    ivItems.forEach(it => expandDays(it.day_pattern, durationDays).forEach(d => ivDays.add(d)));
    const supplementsDaily = items.filter(i => i.section_category === "oral_supplement" &&
      expandDays(i.day_pattern, durationDays).length === durationDays).length;
    const procedures = items.filter(i => i.section_category === "procedure").length;
    const unique = new Set(items.map(i => i.inn_snapshot).filter(Boolean));
    return {
      ivDays: ivDays.size,
      ivCount: ivItems.length,
      supplementsDaily,
      procedures,
      uniqueInn: unique.size,
    };
  }, [items, durationDays]);

  return (
    <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 py-1">
      Дней с инфузиями: <b className="text-foreground">{stats.ivDays}</b> · Препаратов IV: <b className="text-foreground">{stats.ivCount}</b> · БАД ежедневно: <b className="text-foreground">{stats.supplementsDaily}</b> · Процедур: <b className="text-foreground">{stats.procedures}</b> · Уникальных МНН: <b className="text-foreground">{stats.uniqueInn}</b>
    </div>
  );
}
