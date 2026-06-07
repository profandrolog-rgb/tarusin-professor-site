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
import { Plus, X, Phone, ClipboardList } from "lucide-react";
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
}

export const EMPTY_ASSIGNMENTS: AssignmentsData = {
  examinations: [],
  treatments: [],
  referrals: [],
};

interface DR {
  id: string;
  diagnosis_group: string;
  subtype: string;
  category: string;
  item_text: string;
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

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items
      .filter((i) => categories.includes(i.category))
      .filter((i) => (group === "all" ? true : i.diagnosis_group === group))
      .filter((i) => (ql ? i.item_text.toLowerCase().includes(ql) : true));
  }, [items, categories, q, group]);

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
    const texts = items.filter((i) => selected.has(i.id)).map((i) => i.item_text);
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
                    {it.item_text}
                    <span className="text-xs text-muted-foreground ml-2">
                      {it.diagnosis_group} / {it.subtype}
                    </span>
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
            <li key={`${i}-${t}`} className="text-sm leading-snug group">
              <div className="flex items-start gap-2">
                <span className="flex-1 whitespace-pre-wrap">{t}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="opacity-60 hover:opacity-100 text-destructive shrink-0"
                  title="Удалить"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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

  const totalCount = data.examinations.length + data.treatments.length + data.referrals.length;

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
          <TabsList className="mb-3">
            <TabsTrigger value="exam">Обследование {data.examinations.length > 0 && `(${data.examinations.length})`}</TabsTrigger>
            <TabsTrigger value="treat">Медикаменты и лечение {data.treatments.length > 0 && `(${data.treatments.length})`}</TabsTrigger>
            <TabsTrigger value="ref">Консультации {data.referrals.length > 0 && `(${data.referrals.length})`}</TabsTrigger>
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
