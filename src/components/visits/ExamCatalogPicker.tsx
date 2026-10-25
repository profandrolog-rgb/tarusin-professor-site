import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

/** Выбор обследований из единого алфавитного каталога; заболевание — только быстрый набор. */
export function ExamCatalogPicker({ onAdd }: { onAdd: (texts: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: exams = [] } = useQuery({
    queryKey: ["examinations_catalog", "active"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await db.from("examinations_catalog").select("id, name").eq("is_active", true).limit(5000);
      if (error) throw error;
      return ((data as { id: string; name: string }[]) || []).sort((a, b) => a.name.localeCompare(b.name, "ru"));
    },
    staleTime: 5 * 60 * 1000,
  });
  const { data: links = [] } = useQuery({
    queryKey: ["diagnosis_examinations"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await db.from("diagnosis_examinations").select("diagnosis_group, examination_id").limit(10000);
      if (error) throw error;
      return (data as { diagnosis_group: string; examination_id: string }[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const groups = useMemo(() => Array.from(new Set(links.map((l) => l.diagnosis_group))).sort((a, b) => a.localeCompare(b, "ru")), [links]);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ql ? exams.filter((e) => e.name.toLowerCase().includes(ql)) : exams;
  }, [exams, q]);

  const applyGroup = (g: string) => {
    const ids = links.filter((l) => l.diagnosis_group === g).map((l) => l.examination_id);
    setSelected((p) => new Set([...p, ...ids]));
  };
  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const apply = () => {
    if (selected.size === 0) return toast({ title: "Ничего не выбрано" });
    onAdd(exams.filter((e) => selected.has(e.id)).map((e) => e.name));
    setSelected(new Set());
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Добавить из списка</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader><SheetTitle>Обследования</SheetTitle></SheetHeader>
        <div className="grid grid-cols-2 gap-2 py-3">
          <Input placeholder="Поиск…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value="" onValueChange={applyGroup}>
            <SelectTrigger><SelectValue placeholder="Отметить набор заболевания" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1 pr-3 -mr-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Ничего не найдено</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((it) => (
                <label key={it.id} className="flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50">
                  <Checkbox checked={selected.has(it.id)} onCheckedChange={() => toggle(it.id)} className="mt-0.5" />
                  <span className="leading-snug flex-1">{it.name}</span>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>
        <SheetFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs text-muted-foreground">Выбрано: {selected.size}</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Сбросить</Button>
              <Button type="button" size="sm" onClick={apply} disabled={selected.size === 0}>Добавить выбранные</Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
