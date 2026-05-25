import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import type { PlanItem } from "./PlanItemRow";
import type { TreatmentCategory } from "./sections";

interface TemplateLite {
  id: string;
  name: string;
  description: string | null;
  mode: "flat" | "scheduled";
  duration_days: number | null;
  tags: string[] | null;
  items_count: number;
}

interface TemplateItemRow {
  catalog_id: string | null;
  section_category: TreatmentCategory;
  order_index: number;
  name_snapshot: string | null;
  dose: number | null;
  dose_unit: string | null;
  dilution_volume: number | null;
  dilution_solvent: string | null;
  frequency: string | null;
  duration_days: number | null;
  day_pattern: string | null;
  time_of_day: string[] | null;
  infusion_rate: string | null;
  route_override: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentItemsCount: number;
  currentMode: "flat" | "scheduled";
  currentDuration: number;
  onApply: (newItems: PlanItem[], strategy: "replace" | "merge", suggestedMode: "flat" | "scheduled", suggestedDuration: number | null) => void;
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export function ApplyTemplateDialog({ open, onOpenChange, currentItemsCount, currentMode, currentDuration, onApply }: Props) {
  const [templates, setTemplates] = useState<TemplateLite[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TemplateLite | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!open) { setSelected(null); setQ(""); return; }
    (async () => {
      setBusy(true);
      const { data } = await supabase
        .from("protocol_templates")
        .select("id, name, description, mode, duration_days, tags, items:protocol_template_items(count)")
        .eq("is_archived", false)
        .order("name");
      setTemplates((data || []).map((r: any) => ({ ...r, items_count: r.items?.[0]?.count ?? 0 })));
      setBusy(false);
    })();
  }, [open]);

  const filtered = templates.filter(t => !q || t.name.toLowerCase().includes(q.toLowerCase()) || (t.tags || []).some(tag => tag.toLowerCase().includes(q.toLowerCase())));

  const loadAndApply = async (strategy: "replace" | "merge") => {
    if (!selected) return;
    setLoadingItems(true);
    try {
      const { data: rows } = await supabase
        .from("protocol_template_items")
        .select("*")
        .eq("template_id", selected.id)
        .order("order_index");
      const items = (rows || []) as TemplateItemRow[];

      // Re-hydrate flags from catalog where catalog_id present.
      const catalogIds = items.map(r => r.catalog_id).filter(Boolean) as string[];
      let catalogMap = new Map<string, any>();
      if (catalogIds.length) {
        const { data: cat } = await supabase.from("treatment_catalog").select("*").in("id", catalogIds);
        catalogMap = new Map((cat || []).map((c: any) => [c.id, c]));
      }

      const planItems: PlanItem[] = items.map(r => {
        const c = r.catalog_id ? catalogMap.get(r.catalog_id) : null;
        return {
          client_id: newId(),
          catalog_id: r.catalog_id,
          section_category: r.section_category,
          name_snapshot: r.name_snapshot || c?.name || "—",
          inn_snapshot: c?.inn ?? null,
          form_snapshot: c?.form ?? null,
          dose: r.dose,
          dose_unit: r.dose_unit,
          dilution_volume: r.dilution_volume,
          dilution_solvent: r.dilution_solvent,
          frequency: r.frequency,
          duration_days: r.duration_days,
          day_pattern: r.day_pattern,
          time_of_day: r.time_of_day || [],
          infusion_rate: r.infusion_rate,
          route_override: r.route_override,
          notes: r.notes,
          is_off_label: !!c?.is_off_label,
          light_sensitive: !!c?.light_sensitive,
          glucose_only: !!c?.glucose_only,
          dose_range_min: c?.dose_range_min ?? null,
          dose_range_max: c?.dose_range_max ?? null,
          repertory_remedy_id: (r as any).repertory_remedy_id ?? c?.repertory_remedy_id ?? null,
          potency: (r as any).potency ?? c?.potency ?? null,
        };

      });

      // Handle flat→scheduled coercion of day_pattern
      if (selected.mode === "flat" && currentMode === "scheduled") {
        const dur = selected.duration_days || currentDuration;
        planItems.forEach(it => { if (!it.day_pattern) it.day_pattern = `1-${dur}`; });
      }

      onApply(planItems, strategy, selected.mode, selected.duration_days);
      onOpenChange(false);
    } finally {
      setLoadingItems(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Применить шаблон протокола</DialogTitle>
          <DialogDescription>
            Выберите шаблон, затем — заменить текущие позиции или добавить к ним.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground"/>
              <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по названию или тегу..." className="pl-8"/>
            </div>
            {busy ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-6">Шаблонов не найдено</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.map(t => (
                  <button key={t.id} onClick={() => setSelected(t)}
                    className="w-full text-left border rounded-md p-3 hover:border-primary hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-medium">{t.name}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[10px]">{t.mode === "flat" ? "плоский" : "по дням"}</Badge>
                        <Badge variant="outline" className="text-[10px]">{t.items_count} поз.</Badge>
                        {t.duration_days && <Badge variant="outline" className="text-[10px]">{t.duration_days} дн.</Badge>}
                      </div>
                    </div>
                    {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>}
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {t.tags.map(tag => <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{tag}</span>)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="border rounded-md p-3 bg-muted/30">
              <div className="font-medium">{selected.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                режим: {selected.mode === "flat" ? "плоский" : "по дням"} · {selected.items_count} позиций
                {selected.duration_days ? ` · ${selected.duration_days} дн.` : ""}
              </div>
            </div>

            {selected.mode !== currentMode && (
              <div className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded p-2">
                {selected.mode === "scheduled"
                  ? "⚠ Шаблон создан в режиме «Расписание по дням», а лист — в плоском. Рекомендуется переключить лист после применения."
                  : `⚠ Шаблон в плоском режиме. Для каждой позиции day_pattern будет установлен как 1–${selected.duration_days || currentDuration}.`}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              В листе сейчас: <b>{currentItemsCount}</b> позиций.
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelected(null)} disabled={loadingItems}>← Назад</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => loadAndApply("merge")} disabled={loadingItems}>
                  Добавить к текущему
                </Button>
                <Button onClick={() => loadAndApply("replace")} disabled={loadingItems}>
                  {loadingItems && <Loader2 className="w-4 h-4 animate-spin mr-1"/>}
                  Заменить
                </Button>
              </div>
            </div>
          </div>
        )}

        {!selected && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
