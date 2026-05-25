import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sun, Beaker, AlertTriangle } from "lucide-react";
import type { CatalogItem } from "./CatalogPicker";
import { SECTION_MAP, TreatmentCategory } from "./sections";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeSection: TreatmentCategory;
  onPick: (section: TreatmentCategory, item: CatalogItem) => void;
}

export function CommandPaletteDialog({ open, onOpenChange, activeSection, onPick }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) { setQ(""); return; }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      let req = supabase.from("treatment_catalog").select("*").eq("is_active", true).order("name").limit(30);
      if (q.trim().length >= 1) req = req.or(`name.ilike.%${q}%,inn.ilike.%${q}%,subcategory.ilike.%${q}%`);
      const { data } = await req;
      if (!cancelled) setItems((data as any) || []);
      setBusy(false);
    })();
    return () => { cancelled = true; };
  }, [open, q]);

  const sectionLabel = SECTION_MAP[activeSection]?.label || activeSection;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl gap-0 overflow-hidden">
        <Command shouldFilter={false}>
          <div className="px-3 pt-3 pb-1 text-xs text-muted-foreground">
            Добавить в раздел: <span className="font-medium text-foreground">{sectionLabel}</span>
          </div>
          <CommandInput value={q} onValueChange={setQ} placeholder="Поиск по названию, МНН, подкатегории..." />
          <CommandList className="max-h-[60vh]">
            {!busy && items.length === 0 && <CommandEmpty>Ничего не найдено</CommandEmpty>}
            <CommandGroup heading={busy ? "Поиск..." : `Найдено: ${items.length}`}>
              {items.map(it => (
                <CommandItem
                  key={it.id}
                  value={`${it.name} ${it.inn || ""} ${it.subcategory || ""}`}
                  onSelect={() => { onPick(activeSection, it); onOpenChange(false); }}
                  className="flex items-start gap-2 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{it.name}</span>
                      {it.is_off_label && <Badge variant="outline" className="text-[10px] h-4 px-1 gap-1"><AlertTriangle className="w-2.5 h-2.5"/>off-label</Badge>}
                      {it.light_sensitive && <Sun className="w-3 h-3 text-amber-500"/>}
                      {it.glucose_only && <Beaker className="w-3 h-3 text-blue-500"/>}
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">{SECTION_MAP[it.category]?.short || it.category}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {it.inn ? `${it.inn} · ` : ""}{it.form || ""}
                      {it.default_dose ? ` · ${it.default_dose} ${it.dose_unit || ""}` : ""}
                      {it.default_frequency ? ` · ${it.default_frequency}` : ""}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
