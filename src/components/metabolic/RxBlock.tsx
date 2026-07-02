import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

export interface RxRec {
  id: string;
  catalog_id: string | null;
  pathway_id: string | null;
  target_node_id: string | null;
  application_point: string | null;
  rationale: string | null;
  priority: number;
  evidence_level: number;
  age_warning: string | null;
  contra_warning: string | null;
  include_in_print: boolean;
  is_manual: boolean;
  catalog?: {
    name: string;
    subcategory: string | null;
    category: string | null;
    default_dose: number | null;
    dose_unit: string | null;
    default_route_label: string | null;
    default_frequency: string | null;
  } | null;
}

export function RxBlock({
  recs,
  affectedNodes,
  onTogglePrint,
  compact = false,
  showEmpty = true,
}: {
  recs: RxRec[];
  /** Список затронутых node_id этого пути — чтобы показать «в каталоге нет средства» */
  affectedNodes?: string[];
  onTogglePrint?: (id: string, v: boolean) => void;
  compact?: boolean;
  showEmpty?: boolean;
}) {
  // группируем по target_node_id
  const byNode = new Map<string, RxRec[]>();
  for (const r of recs) {
    const k = r.target_node_id || "_";
    if (!byNode.has(k)) byNode.set(k, []);
    byNode.get(k)!.push(r);
  }
  const nodesFromRecs = new Set(byNode.keys());
  const missingNodes = (affectedNodes || []).filter((n) => !nodesFromRecs.has(n));

  if (recs.length === 0 && missingNodes.length === 0 && !showEmpty) return null;

  return (
    <div className={compact ? "text-xs space-y-2 pt-2 border-t" : "text-sm space-y-3 pt-3 border-t"}>
      <div className="font-medium flex items-center gap-1.5">
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">℞</span>
        Точки приложения терапии (из каталога)
      </div>

      {recs.length === 0 && (
        <div className="italic text-muted-foreground">
          В каталоге нет средств, привязанных к сработавшим показателям этого пути.
          Пополните <code>targets</code> в каталоге лечения.
        </div>
      )}

      {[...byNode.entries()].map(([node, items]) => (
        <div key={node} className="rounded border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 space-y-1.5">
          <div className="font-medium text-emerald-900 dark:text-emerald-200">
            {items[0].application_point || node}
          </div>
          <ul className="space-y-1.5">
            {items.map((r) => (
              <li key={r.id} className="flex items-start gap-2">
                {onTogglePrint && (
                  <Checkbox
                    className="mt-0.5"
                    checked={r.include_in_print}
                    onCheckedChange={(v) => onTogglePrint(r.id, !!v)}
                    aria-label="Включить в печать"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">{r.catalog?.name || "—"}</span>
                    {r.catalog?.category && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {r.catalog.category}
                      </Badge>
                    )}
                    {r.priority > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">P{r.priority}</Badge>
                    )}
                    {r.evidence_level > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">EL{r.evidence_level}</Badge>
                    )}
                    {r.is_manual && <Badge variant="secondary" className="text-[10px] px-1 py-0">ручное</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {[
                      r.catalog?.default_dose != null
                        ? `${r.catalog.default_dose}${r.catalog.dose_unit ? " " + r.catalog.dose_unit : ""}`
                        : null,
                      r.catalog?.default_route_label,
                      r.catalog?.default_frequency,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                  {r.rationale && <div className="text-[11px] italic opacity-80">{r.rationale}</div>}
                  {(r.age_warning || r.contra_warning) && (
                    <div className="text-[11px] mt-1 flex items-start gap-1 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>
                        {r.age_warning && <div>{r.age_warning}</div>}
                        {r.contra_warning && <div>{r.contra_warning}</div>}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {missingNodes.map((n) => (
        <div key={n} className="italic text-muted-foreground text-[12px] pl-2 border-l-2 border-muted">
          {n}: в каталоге нет средства для этой точки.
        </div>
      ))}
    </div>
  );
}
