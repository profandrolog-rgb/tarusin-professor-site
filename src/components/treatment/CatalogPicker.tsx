import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Sun, Beaker } from "lucide-react";
import { TreatmentCategory } from "./sections";

export interface CatalogItem {
  id: string;
  category: TreatmentCategory;
  subcategory: string | null;
  name: string;
  inn: string | null;
  form: string | null;
  default_dose: number | null;
  dose_unit: string | null;
  default_dilution_volume: number | null;
  default_dilution_solvent: string | null;
  default_frequency: string | null;
  default_duration_days: number | null;
  default_route_label: string | null;
  time_of_day_default: string[] | null;
  notes: string | null;
  infusion_rate: string | null;
  is_rx: boolean;
  is_off_label: boolean;
  light_sensitive: boolean;
  glucose_only: boolean;
  dose_range_min: number | null;
  dose_range_max: number | null;
  tags: string[] | null;
}

interface Props {
  section: TreatmentCategory;
  onPick: (item: CatalogItem) => void;
  allowAllCategories?: boolean;
}

export function CatalogPicker({ section, onPick, allowAllCategories }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [scope, setScope] = useState<"section" | "all">("section");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      let req = supabase.from("treatment_catalog").select("*").eq("is_active", true).order("name").limit(40);
      if (scope === "section") req = req.eq("category", section);
      if (q.trim().length >= 1) req = req.or(`name.ilike.%${q}%,inn.ilike.%${q}%,subcategory.ilike.%${q}%`);
      const { data } = await req;
      setItems((data as any) || []);
    })();
  }, [open, q, scope, section]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setOpen(o => !o)}>
        + Добавить
      </Button>
      {open && (
        <div className="absolute z-40 mt-1 w-[420px] max-w-[90vw] bg-popover text-popover-foreground border rounded-md shadow-lg">
          <div className="p-2 border-b flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground"/>
            <Input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по названию или МНН..." className="h-8 border-0 focus-visible:ring-0"/>
          </div>
          {allowAllCategories && (
            <div className="px-2 py-1 border-b flex gap-1 text-xs">
              <button onClick={()=>setScope("section")} className={`px-2 py-0.5 rounded ${scope==="section"?"bg-primary text-primary-foreground":"hover:bg-muted"}`}>Только эта секция</button>
              <button onClick={()=>setScope("all")} className={`px-2 py-0.5 rounded ${scope==="all"?"bg-primary text-primary-foreground":"hover:bg-muted"}`}>Все категории</button>
            </div>
          )}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">Ничего не найдено</div>
            ) : items.map(it => (
              <button key={it.id}
                onClick={() => { onPick(it); setOpen(false); setQ(""); }}
                className="w-full text-left px-3 py-2 hover:bg-muted/60 border-b last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{it.name}</span>
                  <span className="flex items-center gap-1">
                    {it.is_off_label && <Badge variant="outline" className="text-[10px] h-4 px-1"><AlertTriangle className="w-2.5 h-2.5 mr-0.5"/>off-label</Badge>}
                    {it.light_sensitive && <Sun className="w-3 h-3 text-amber-500"/>}
                    {it.glucose_only && <Beaker className="w-3 h-3 text-blue-500"/>}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {it.inn ? `${it.inn} · ` : ""}{it.form || ""}
                  {it.default_dose ? ` · ${it.default_dose} ${it.dose_unit || ""}` : ""}
                  {it.default_frequency ? ` · ${it.default_frequency}` : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
