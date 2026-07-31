import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { Library } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  fetchAssignmentLibrary,
  ASSIGNMENT_CATEGORY_LABEL,
  type AssignmentCategory,
} from "@/lib/visits/assignmentLibrary";

/**
 * «Из библиотеки» — формулировки, которые врач уже писал руками.
 * Пополняется автоматически при сохранении визита, сортировка — по частоте.
 */
export function LibraryPicker({
  category,
  onAdd,
}: {
  category: AssignmentCategory;
  onAdd: (texts: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["assignment_library", category],
    queryFn: () => fetchAssignmentLibrary(category),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ql ? items.filter((i) => i.item_text.toLowerCase().includes(ql)) : items;
  }, [items, q]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const apply = () => {
    const texts = filtered.filter((i) => selected.has(i.id)).map((i) => i.item_text);
    if (texts.length === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    onAdd(texts);
    setSelected(new Set());
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Library className="h-4 w-4 mr-1" />
          Из библиотеки
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>Библиотека: {ASSIGNMENT_CATEGORY_LABEL[category]}</SheetTitle>
        </SheetHeader>
        <div className="py-3">
          <Input placeholder="Поиск по формулировкам…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <ScrollArea className="flex-1 pr-3 -mr-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Загрузка…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Библиотека пока пуста. Всё, что вы впишете вручную, попадёт сюда после сохранения визита.
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((it) => (
                <label
                  key={it.id}
                  className="flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.has(it.id)}
                    onCheckedChange={() => toggle(it.id)}
                    className="mt-0.5"
                  />
                  <span className="leading-snug flex-1">
                    {it.item_text}
                    <span className="text-xs text-muted-foreground ml-2">×{it.usage_count}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>
        <SheetFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs text-muted-foreground">Выбрано: {selected.size}</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Отмена</Button>
              <Button type="button" size="sm" onClick={apply} disabled={selected.size === 0}>Добавить</Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default LibraryPicker;
