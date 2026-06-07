import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X, Phone, ClipboardList, Salad } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

function AutoTextarea({ value, onChange, onRemove }: { value: string; onChange: (v: string) => void; onRemove: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <div className="flex items-start gap-2 group">
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        className="flex-1 text-sm leading-snug min-h-0 py-1.5 resize-none overflow-hidden"
      />
      <button
        type="button"
        onClick={onRemove}
        className="opacity-60 hover:opacity-100 text-destructive shrink-0 mt-1.5"
        title="Удалить"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export interface AssignmentsData {
  examinations: string[];
  treatments: string[];
  referrals: string[];
  diet: string[];
}

export const EMPTY_ASSIGNMENTS: AssignmentsData = {
  examinations: [],
  treatments: [],
  referrals: [],
  diet: [],
};

interface DR {
  id: string;
  diagnosis_group: string;
  subtype: string;
  category: string;
  item_text: string;
}

interface Med {
  id: string;
  latin_name: string;
  trade_name: string | null;
  dosage_form: string | null;
  dosage: string | null;
}

function formatMedication(m: Med): string {
  const head = m.trade_name?.trim() || m.latin_name;
  const extras = [m.dosage_form, m.dosage].filter(Boolean).join(" ");
  return extras ? `${head} — ${extras}` : head;
}


interface RS {
  id: string;
  specialty: string;
  doctor_name: string;
  phone: string | null;
  contact_note: string | null;
}

export function normalizeAssignments(raw: any): AssignmentsData {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ASSIGNMENTS };
  return {
    examinations: Array.isArray(raw.examinations) ? raw.examinations.filter(Boolean) : [],
    treatments: Array.isArray(raw.treatments) ? raw.treatments.filter(Boolean) : [],
    referrals: Array.isArray(raw.referrals) ? raw.referrals.filter(Boolean) : [],
    diet: Array.isArray(raw.diet) ? raw.diet.filter(Boolean) : [],
  };
}

function formatReferral(s: RS): string {
  const parts: string[] = [`Консультация ${s.specialty.toLowerCase()} — ${s.doctor_name}`];
  if (s.phone) parts.push(`тел. ${s.phone}`);
  if (s.contact_note) parts.push(s.contact_note);
  return parts.join(", ");
}

interface PickerProps {
  title: string;
  categories: string[];
  onAdd: (texts: string[]) => void;
}

function ItemPicker({ title, categories, onAdd }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: items = [] } = useQuery({
    queryKey: ["diagnosis_recommendations", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnosis_recommendations" as any)
        .select("id, diagnosis_group, subtype, category, item_text")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any) as DR[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const includesMeds = categories.includes("медикамент");

  const { data: meds = [] } = useQuery({
    queryKey: ["medications", "all-alpha"],
    enabled: includesMeds,
    queryFn: async () => {
      const all: Med[] = [];
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("medications")
          .select("id, latin_name, trade_name, dosage_form, dosage")
          .order("trade_name", { ascending: true, nullsFirst: false })
          .order("latin_name", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...(data as Med[]));
        if (data.length < pageSize) break;
      }
      return all;
    },
    staleTime: 10 * 60 * 1000,
  });

  type PickItem = { id: string; text: string; meta?: string };

  const filtered = useMemo<PickItem[]>(() => {
    const ql = q.trim().toLowerCase();
    const dr: PickItem[] = items
      .filter((i) => categories.includes(i.category))
      .filter((i) => (group === "all" ? true : i.diagnosis_group === group))
      .map((i) => ({ id: `dr:${i.id}`, text: i.item_text, meta: `${i.diagnosis_group} / ${i.subtype}` }));

    // When "Все диагнозы" — append the entire medications catalog (alphabetic)
    const medItems: PickItem[] =
      includesMeds && group === "all"
        ? meds.map((m) => ({ id: `med:${m.id}`, text: formatMedication(m), meta: "Справочник препаратов" }))
        : [];

    const merged = [...dr, ...medItems];
    // Alphabetic sort (RU-aware)
    merged.sort((a, b) => a.text.localeCompare(b.text, "ru"));
    return ql ? merged.filter((i) => i.text.toLowerCase().includes(ql)) : merged;
  }, [items, meds, categories, q, group, includesMeds]);

  const groups = useMemo(
    () =>
      Array.from(
        new Set(items.filter((i) => categories.includes(i.category)).map((i) => i.diagnosis_group)),
      ).sort(),
    [items, categories],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const apply = () => {
    if (selected.size === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const texts = filtered.filter((i) => selected.has(i.id)).map((i) => i.text);
    onAdd(texts);
    setSelected(new Set());
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Добавить из списка
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 py-3">
          <Input placeholder="Поиск по тексту…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Все диагнозы</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1 pr-3 -mr-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Ничего не найдено</p>
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
                    {it.text}
                    {it.meta && (
                      <span className="text-xs text-muted-foreground ml-2">{it.meta}</span>
                    )}
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
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="button" size="sm" onClick={apply} disabled={selected.size === 0}>
                Добавить выбранные
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ReferralsPicker({ onAdd }: { onAdd: (texts: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: specialists = [] } = useQuery({
    queryKey: ["referral_specialists", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_specialists" as any)
        .select("id, specialty, doctor_name, phone, contact_note")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any) as RS[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const apply = () => {
    if (selected.size === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const texts = specialists.filter((s) => selected.has(s.id)).map(formatReferral);
    onAdd(texts);
    setSelected(new Set());
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Выбрать специалистов
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader><SheetTitle>Консультации специалистов</SheetTitle></SheetHeader>
        <ScrollArea className="flex-1 pr-3 -mr-3 mt-3">
          <div className="space-y-1">
            {specialists.map((s) => (
              <label
                key={s.id}
                className="flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.has(s.id)}
                  onCheckedChange={() => toggle(s.id)}
                  className="mt-0.5"
                />
                <span className="leading-snug flex-1">
                  <span className="font-medium">{s.specialty}</span> — {s.doctor_name}
                  {s.phone && (
                    <span className="inline-flex items-center gap-1 ml-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />{s.phone}
                    </span>
                  )}
                  {s.contact_note && (
                    <div className="text-xs text-muted-foreground mt-0.5">{s.contact_note}</div>
                  )}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs text-muted-foreground">Выбрано: {selected.size}</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="button" size="sm" onClick={apply} disabled={selected.size === 0}>
                Добавить
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface DietRow {
  id: string;
  diet_type: string;
  diet_label: string;
  category: string;
  item_text: string;
  is_recommended: boolean;
  sort_order: number | null;
}

const CATEGORY_META: Record<string, { icon: string; label: string; order: number }> = {
  "рекомендуется": { icon: "✅", label: "Рекомендуется", order: 1 },
  "ограничить":    { icon: "⚠️", label: "Ограничить", order: 2 },
  "исключить":     { icon: "❌", label: "Исключить", order: 3 },
  "режим":         { icon: "📋", label: "Режим", order: 4 },
};

function DietPicker({ onAdd }: { onAdd: (texts: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data: rows = [] } = useQuery({
    queryKey: ["diet_recommendations", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diet_recommendations" as any)
        .select("id, diet_type, diet_label, category, item_text, is_recommended, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any) as DietRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const dietsList = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.diet_type, r.diet_label));
    return Array.from(map.entries()).map(([type, label]) => ({ type, label }));
  }, [rows]);

  const toggleDiet = (t: string) => {
    setSelectedDiets((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t); else n.add(t);
      return n;
    });
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // Grouped by diet → category
  const grouped = useMemo(() => {
    const visible = rows.filter((r) => selectedDiets.has(r.diet_type));
    const byDiet = new Map<string, { label: string; cats: Map<string, DietRow[]> }>();
    visible.forEach((r) => {
      if (!byDiet.has(r.diet_type)) byDiet.set(r.diet_type, { label: r.diet_label, cats: new Map() });
      const entry = byDiet.get(r.diet_type)!;
      if (!entry.cats.has(r.category)) entry.cats.set(r.category, []);
      entry.cats.get(r.category)!.push(r);
    });
    return Array.from(byDiet.entries()).map(([type, e]) => ({
      type,
      label: e.label,
      categories: Array.from(e.cats.entries())
        .sort((a, b) => (CATEGORY_META[a[0]]?.order ?? 99) - (CATEGORY_META[b[0]]?.order ?? 99))
        .map(([cat, items]) => ({ cat, items })),
    }));
  }, [rows, selectedDiets]);

  const apply = () => {
    if (selectedItems.size === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const out: string[] = [];
    grouped.forEach((d) => {
      const dietItems: string[] = [];
      d.categories.forEach(({ cat, items }) => {
        items.forEach((it) => {
          if (selectedItems.has(it.id)) {
            const prefix = cat === "рекомендуется" ? "✓ " :
                           cat === "ограничить" ? "⚠ Ограничить: " :
                           cat === "исключить" ? "✗ Исключить: " : "• ";
            dietItems.push(`${prefix}${it.item_text}`);
          }
        });
      });
      if (dietItems.length > 0) {
        out.push(`Диета — ${d.label}:`);
        out.push(...dietItems);
      }
    });
    onAdd(out);
    setSelectedItems(new Set());
    setSelectedDiets(new Set());
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Salad className="h-4 w-4 mr-1" />
          Выбрать диету
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>Диетические рекомендации</SheetTitle>
        </SheetHeader>

        <div className="py-3">
          <p className="text-xs text-muted-foreground mb-2">Выберите одну или несколько диет:</p>
          <div className="flex flex-wrap gap-1.5">
            {dietsList.map((d) => (
              <Badge
                key={d.type}
                variant={selectedDiets.has(d.type) ? "default" : "outline"}
                className="cursor-pointer text-xs py-1"
                onClick={() => toggleDiet(d.type)}
              >
                {d.label}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-3 -mr-3">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Выберите диету выше, чтобы увидеть пункты
            </p>
          ) : (
            <div className="space-y-4">
              {grouped.map((d) => (
                <div key={d.type} className="space-y-2">
                  <h4 className="text-sm font-semibold border-b pb-1">{d.label}</h4>
                  {d.categories.map(({ cat, items }) => (
                    <div key={cat} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        {CATEGORY_META[cat]?.icon} {CATEGORY_META[cat]?.label ?? cat}
                      </div>
                      {items.map((it) => (
                        <label
                          key={it.id}
                          className="flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedItems.has(it.id)}
                            onCheckedChange={() => toggleItem(it.id)}
                            className="mt-0.5"
                          />
                          <span className="leading-snug flex-1">{it.item_text}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs text-muted-foreground">Выбрано: {selectedItems.size}</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="button" size="sm" onClick={apply} disabled={selectedItems.size === 0}>
                Вставить выбранное
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface ListEditorProps {
  items: string[];
  onChange: (next: string[]) => void;
  addPlaceholder: string;
  picker: React.ReactNode;
}

function ListEditor({ items, onChange, addPlaceholder, picker }: ListEditorProps) {
  const [draft, setDraft] = useState("");

  const removeAt = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {picker}
      </div>

      {items.length > 0 && (
        <ol className="space-y-1.5 list-decimal pl-5">
          {items.map((t, i) => (
            <li key={i} className="text-sm leading-snug">
              <AutoTextarea
                value={t}
                onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
                onRemove={() => removeAt(i)}
              />
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-end gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addDraft(); }
          }}
          placeholder={addPlaceholder}
        />
        <Button type="button" size="sm" variant="secondary" onClick={addDraft} disabled={!draft.trim()}>
          <Plus className="h-4 w-4 mr-1" />Своё
        </Button>
      </div>
    </div>
  );
}

interface PanelProps {
  value: AssignmentsData | undefined;
  onChange: (next: AssignmentsData) => void;
}

export function AssignmentsPanel({ value, onChange }: PanelProps) {
  const data = normalizeAssignments(value);
  const patch = (p: Partial<AssignmentsData>) => onChange({ ...data, ...p });

  const totalCount = data.examinations.length + data.treatments.length + data.referrals.length + data.diet.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          Назначения и консультации
          {totalCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({totalCount})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exam">
          <TabsList className="mb-3 flex-wrap h-auto">
            <TabsTrigger value="exam">Обследование {data.examinations.length > 0 && `(${data.examinations.length})`}</TabsTrigger>
            <TabsTrigger value="treat">Медикаменты и лечение {data.treatments.length > 0 && `(${data.treatments.length})`}</TabsTrigger>
            <TabsTrigger value="ref">Консультации {data.referrals.length > 0 && `(${data.referrals.length})`}</TabsTrigger>
            <TabsTrigger value="diet">🥗 Диета {data.diet.length > 0 && `(${data.diet.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="exam">
            <ListEditor
              items={data.examinations}
              onChange={(next) => patch({ examinations: next })}
              addPlaceholder="Добавить своё обследование…"
              picker={
                <ItemPicker
                  title="Обследования"
                  categories={["обследование"]}
                  onAdd={(texts) => patch({ examinations: [...data.examinations, ...texts] })}
                />
              }
            />
          </TabsContent>

          <TabsContent value="treat">
            <ListEditor
              items={data.treatments}
              onChange={(next) => patch({ treatments: next })}
              addPlaceholder="Добавить медикамент / режим…"
              picker={
                <ItemPicker
                  title="Медикаменты, местное лечение, режим"
                  categories={["медикамент", "местное", "режим"]}
                  onAdd={(texts) => patch({ treatments: [...data.treatments, ...texts] })}
                />
              }
            />
          </TabsContent>

          <TabsContent value="ref">
            <ListEditor
              items={data.referrals}
              onChange={(next) => patch({ referrals: next })}
              addPlaceholder="Добавить консультацию вручную…"
              picker={<ReferralsPicker onAdd={(texts) => patch({ referrals: [...data.referrals, ...texts] })} />}
            />
          </TabsContent>

          <TabsContent value="diet">
            <ListEditor
              items={data.diet}
              onChange={(next) => patch({ diet: next })}
              addPlaceholder="Добавить свой пункт диеты…"
              picker={<DietPicker onAdd={(texts) => patch({ diet: [...data.diet, ...texts] })} />}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
