import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, AlertTriangle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import {
  calculatePlanCost, formatRub, type CostCatalog, type CostItemInput,
} from "@/lib/treatment/cost";
import type { PlanItem } from "@/components/treatment/PlanItemRow";

interface Props {
  items: PlanItem[];
  durationDays: number;
  mode: "flat" | "scheduled";
  showInPrint: boolean;
  onShowInPrintChange: (v: boolean) => void;
}

export function PlanCostBlock({ items, durationDays, mode, showInPrint, onShowInPrintChange }: Props) {
  const [open, setOpen] = useState(true);
  const [showMissing, setShowMissing] = useState(false);
  const [catalogMap, setCatalogMap] = useState<Map<string, CostCatalog>>(new Map());

  const catalogIds = useMemo(() => {
    return Array.from(new Set(items.map(i => i.catalog_id).filter(Boolean) as string[]));
  }, [items]);

  useEffect(() => {
    if (catalogIds.length === 0) { setCatalogMap(new Map()); return; }
    (async () => {
      const { data } = await supabase
        .from("treatment_catalog")
        .select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_source_preference")
        .in("id", catalogIds);
      const m = new Map<string, CostCatalog>();
      (data || []).forEach((r: any) => m.set(r.id, r));
      setCatalogMap(m);
    })();
  }, [catalogIds]);

  const breakdown = useMemo(() => {
    const input: Array<CostItemInput & { name_snapshot: string }> = items.map(it => ({
      catalog_id: it.catalog_id,
      section_category: it.section_category,
      frequency: it.frequency,
      day_pattern: it.day_pattern,
      duration_days: it.duration_days,
      prn_estimated_doses: (it as any).prn_estimated_doses,
      name_snapshot: it.name_snapshot,
    }));
    return calculatePlanCost(input, catalogMap, durationDays, mode);
  }, [items, catalogMap, durationDays, mode]);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-2 font-semibold">
            <Wallet className="w-4 h-4 text-primary"/>
            💰 Ориентировочная стоимость курса
            <Badge variant="secondary" className="ml-1">{formatRub(breakdown.total)}</Badge>
            {breakdown.missing.length > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600">
                <AlertTriangle className="w-3 h-3"/>{breakdown.missing.length} без цены
              </Badge>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
        </button>

        {open && (
          <div className="mt-3 space-y-3 text-sm">
            <div className="text-xs text-muted-foreground">
              Москва, по данным на {new Date().toLocaleDateString("ru-RU")}
            </div>
            <div className="space-y-1">
              {Object.entries(breakdown.byGroup).map(([k, g]) => (
                <div key={k} className="flex justify-between border-b border-dashed border-border/50 py-1">
                  <span>{g.emoji} {g.label}</span>
                  <span className="font-mono">{formatRub(g.sum)}</span>
                </div>
              ))}
              {Object.keys(breakdown.byGroup).length === 0 && (
                <div className="text-muted-foreground italic">Нет позиций с заданной ценой.</div>
              )}
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Итого:</span>
              <span className="font-mono">{formatRub(breakdown.total)}</span>
            </div>

            {breakdown.missing.length > 0 && (
              <div className="rounded-md bg-amber-500/10 p-2">
                <button
                  type="button"
                  className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1"
                  onClick={() => setShowMissing(s => !s)}
                >
                  ⚠ {breakdown.missing.length} позиций без цены — см. список
                  {showMissing ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                </button>
                {showMissing && (
                  <ul className="mt-1 text-xs space-y-0.5">
                    {breakdown.missing.map((m, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span>• {m.name}</span>
                        {m.catalog_id && (
                          <Link
                            to={`/admin/treatment-catalog?edit=${m.catalog_id}`}
                            className="text-primary hover:underline shrink-0"
                          >
                            задать цену →
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="text-[11px] text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-2">
              Стоимость процедур (УВТ, ВЛОК, массаж и др.), расходных материалов (растворы, шприцы, системы)
              и услуг клиники в расчёт не включена. Возможны отклонения ±15–20% в зависимости от аптеки.
            </div>

            <label className="flex items-center gap-2 text-sm pt-1">
              <Checkbox checked={showInPrint} onCheckedChange={(v) => onShowInPrintChange(!!v)}/>
              Печатать стоимость в листе назначений
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
