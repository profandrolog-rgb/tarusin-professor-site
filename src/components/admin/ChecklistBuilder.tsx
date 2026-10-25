import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, Pencil, ExternalLink, X, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ChecklistQuestion, ChecklistResultRule } from "@/data/checklists/types";
import type { ChecklistRow } from "@/hooks/useChecklists";
import { CHECKLIST_LEVELS } from "@/data/checklists/levels";

const ICONS = ["HeartPulse", "Droplets", "Activity", "ClipboardCheck"];
const LEVELS = CHECKLIST_LEVELS.map(x => ({ v: x.v, l: x.label, c: x.color }));

type Draft = Omit<ChecklistRow, "id" | "questions" | "results"> & {
  id?: string;
  questions: ChecklistQuestion[];
  results: ChecklistResultRule[];
};

const emptyDraft = (order: number): Draft => ({
  slug: "", title: "", short_title: "", description: "", icon: "ClipboardCheck", intro: "",
  is_active: false, sort_order: order,
  questions: [{ id: "q1", text: "", options: [{ label: "", value: "0", score: 0 }] }],
  results: [{ level: "low", minScore: 0, maxScore: 10, title: "", text: "" }],
});

function SortableOption({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-card">
      <button type="button" {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none" title="Перетащите, чтобы изменить порядок">
        <GripVertical className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

function validate(d: Draft): string | null {
  if (!/^[a-z0-9_-]{2,64}$/.test(d.slug)) return "Адрес теста: только латиница в нижнем регистре, цифры, «-» и «_»";
  if (!d.title.trim()) return "Укажите название";
  if (d.questions.length === 0) return "Добавьте хотя бы один вопрос";
  for (const [i, q] of d.questions.entries()) {
    if (!q.text.trim()) return `Вопрос ${i + 1}: пустой текст`;
    if (q.options.length < 2) return `Вопрос ${i + 1}: нужно минимум 2 варианта ответа`;
    if (q.options.some(o => !o.label.trim())) return `Вопрос ${i + 1}: есть пустой вариант ответа`;
  }
  if (d.results.length === 0) return "Добавьте хотя бы одно заключение";
  for (const [i, r] of d.results.entries()) {
    if (!r.title.trim()) return `Заключение ${i + 1}: пустой заголовок`;
    if (r.minScore > r.maxScore) return `Заключение ${i + 1}: «от» больше «до»`;
  }
  return null;
}

function scoreRange(qs: ChecklistQuestion[]) {
  let min = 0, max = 0;
  for (const q of qs) {
    if (q.scored === false || q.options.length === 0) continue;
    const s = q.options.map(o => Number(o.score) || 0);
    min += Math.min(...s); max += Math.max(...s);
  }
  return { min, max };
}

export default function ChecklistBuilder() {
  const { toast } = useToast();
  const [list, setList] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const [initial, setInitial] = useState("");
  const draftKey = (id?: string) => `checklist-draft:${id || "new"}`;
  const dirty = !!draft && JSON.stringify(draft) !== initial;

  const openDraft = (dr: Draft) => {
    const key = draftKey(dr.id);
    const snap = JSON.stringify(dr);
    const saved = localStorage.getItem(key);
    if (saved && saved !== snap && confirm("Найден несохранённый черновик этого теста. Восстановить его?")) {
      try { setDraft(JSON.parse(saved)); } catch { setDraft(dr); }
    } else {
      localStorage.removeItem(key);
      setDraft(dr);
    }
    setInitial(snap);
  };

  const cancelEdit = () => {
    if (dirty && !confirm("Есть несохранённые изменения. Выйти без сохранения?")) return;
    if (draft) localStorage.removeItem(draftKey(draft.id));
    setDraft(null);
  };

  useEffect(() => {
    if (draft && dirty) localStorage.setItem(draftKey(draft.id), JSON.stringify(draft));
  }, [draft, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("checklists").select("*").order("sort_order");
    setList((data as unknown as ChecklistRow[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (row: ChecklistRow) => {
    const { error } = await supabase.from("checklists").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) return toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
    setList(l => l.map(r => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)));
  };

  const reorder = async (i: number, d: number) => {
    const next = move(list, i, d);
    if (next === list) return;
    setList(next);
    await Promise.all(next.map((r, idx) => supabase.from("checklists").update({ sort_order: (idx + 1) * 10 }).eq("id", r.id)));
  };

  const remove = async (row: ChecklistRow) => {
    if (!confirm(`Удалить тест «${row.title}»? Результаты прохождений сохранятся.`)) return;
    await supabase.from("checklists").delete().eq("id", row.id);
    load();
  };

  const save = async () => {
    if (!draft) return;
    const err = validate(draft);
    if (err) return toast({ title: "Проверьте тест", description: err, variant: "destructive" });
    setSaving(true);
    const payload = {
      slug: draft.slug, title: draft.title.trim(), short_title: draft.short_title.trim(),
      description: draft.description, icon: draft.icon, intro: draft.intro,
      is_active: draft.is_active, sort_order: draft.sort_order,
      questions: draft.questions.map(q => ({ ...q, options: q.options.map(o => ({ ...o, score: Number(o.score) || 0 })) })) as any,
      results: draft.results.map(r => ({ ...r, minScore: Number(r.minScore) || 0, maxScore: Number(r.maxScore) || 0 })) as any,
      updated_at: new Date().toISOString(),
    };
    const res = draft.id
      ? await supabase.from("checklists").update(payload).eq("id", draft.id)
      : await supabase.from("checklists").insert(payload);
    setSaving(false);
    if (res.error) return toast({ title: "Ошибка сохранения", description: res.error.message, variant: "destructive" });
    toast({ title: "Тест сохранён" });
    localStorage.removeItem(draftKey(draft.id));
    setDraft(null);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!draft) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => openDraft(emptyDraft((list.length + 1) * 10))}><Plus className="w-4 h-4 mr-2" />Новый тест</Button>
        </div>
        {list.map((r, i) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder(i, -1)}><ArrowUp className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder(i, 1)}><ArrowDown className="w-3 h-3" /></Button>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold text-foreground">{r.title}</div>
                <div className="text-xs text-muted-foreground">/self-check/{r.slug} · вопросов: {Array.isArray(r.questions) ? r.questions.length : 0}</div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                {r.is_active ? "Опубликован" : "Скрыт"}
              </label>
              <Button size="sm" variant="outline" asChild><a href={`/self-check/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
              <Button size="sm" variant="outline" onClick={() => openDraft({ ...r, questions: (r.questions as any) || [], results: (r.results as any) || [] })}><Pencil className="w-4 h-4 mr-1" />Редактировать</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && <p className="text-center text-muted-foreground py-8">Тестов пока нет</p>}
      </div>
    );
  }

  const d = draft;
  const set = (patch: Partial<Draft>) => setDraft({ ...d, ...patch });
  const setQ = (i: number, patch: Partial<ChecklistQuestion>) => set({ questions: d.questions.map((q, k) => (k === i ? { ...q, ...patch } : q)) });
  const setR = (i: number, patch: Partial<ChecklistResultRule>) => set({ results: d.results.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const range = scoreRange(d.questions);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{d.id ? "Редактирование теста" : "Новый тест"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={cancelEdit}><X className="w-4 h-4 mr-1" />Отмена</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Сохранить</Button>
        </div>
      </div>

      <Card><CardContent className="p-4 grid gap-3 md:grid-cols-2">
        <div><label className="text-sm font-medium">Полное название</label><Input value={d.title} onChange={e => set({ title: e.target.value })} /></div>
        <div><label className="text-sm font-medium">Короткое название (для карточки)</label><Input value={d.short_title} onChange={e => set({ short_title: e.target.value })} /></div>
        <div><label className="text-sm font-medium">Адрес теста (латиница)</label><Input value={d.slug} onChange={e => set({ slug: e.target.value.toLowerCase() })} placeholder="iief-5" /></div>
        <div><label className="text-sm font-medium">Значок</label>
          <Select value={d.icon} onValueChange={v => set({ icon: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2"><label className="text-sm font-medium">Описание для карточки</label><Textarea rows={2} value={d.description} onChange={e => set({ description: e.target.value })} /></div>
        <div className="md:col-span-2"><label className="text-sm font-medium">Вступление (инструкция пациенту)</label><Textarea rows={3} value={d.intro} onChange={e => set({ intro: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={d.is_active} onCheckedChange={v => set({ is_active: v })} />Опубликован на сайте</label>
      </CardContent></Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Вопросы ({d.questions.length}) · диапазон баллов {range.min}–{range.max}</h3>
          <Button size="sm" variant="outline" onClick={() => set({ questions: [...d.questions, { id: `q${Date.now().toString(36)}`, text: "", options: [{ label: "", value: "0", score: 0 }, { label: "", value: "1", score: 1 }] }] })}><Plus className="w-4 h-4 mr-1" />Вопрос</Button>
        </div>
        {d.questions.map((q, i) => (
          <Card key={q.id + i}><CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-2">{i + 1}</Badge>
              <div className="flex-1 space-y-2">
                <Textarea rows={2} placeholder="Текст вопроса" value={q.text} onChange={e => setQ(i, { text: e.target.value })} />
                <Input placeholder="Пояснение (необязательно)" value={q.description || ""} onChange={e => setQ(i, { description: e.target.value || undefined })} />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={q.scored !== false} onCheckedChange={v => setQ(i, { scored: v ? undefined : false })} />
                  Учитывать в сумме баллов
                </label>
              </div>
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => set({ questions: move(d.questions, i, -1) })}><ArrowUp className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => set({ questions: move(d.questions, i, 1) })}><ArrowDown className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => set({ questions: d.questions.filter((_, k) => k !== i) })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Добавить вопрос ниже" onClick={() => { const nq = { id: `q${Date.now().toString(36)}`, text: "", options: [{ label: "", value: "0", score: 0 }, { label: "", value: "1", score: 1 }] }; const qs = [...d.questions]; qs.splice(i + 1, 0, nq); set({ questions: qs }); }}><Plus className="w-3 h-3 text-primary" /></Button>
              </div>
            </div>
            <div className="space-y-2 pl-8">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => {
                if (!e.over || e.active.id === e.over.id) return;
                const from = Number(String(e.active.id).split("::")[1]);
                const to = Number(String(e.over.id).split("::")[1]);
                setQ(i, { options: arrayMove(q.options, from, to) });
              }}>
                <SortableContext items={q.options.map((_, j) => `${i}::${j}`)} strategy={verticalListSortingStrategy}>
                  {q.options.map((o, j) => (
                    <SortableOption key={`${i}::${j}`} id={`${i}::${j}`}>
                      <Input className="flex-1" placeholder="Вариант ответа" value={o.label} onChange={e => setQ(i, { options: q.options.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)) })} />
                      <Input type="number" className="w-20" title="Баллы" value={o.score} onChange={e => setQ(i, { options: q.options.map((x, k) => (k === j ? { ...x, score: Number(e.target.value) } : x)) })} />
                      <span className="text-xs text-muted-foreground">балл.</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQ(i, { options: q.options.filter((_, k) => k !== j) })}><Trash2 className="w-3 h-3" /></Button>
                    </SortableOption>
                  ))}
                </SortableContext>
              </DndContext>
              <Button size="sm" variant="ghost" onClick={() => setQ(i, { options: [...q.options, { label: "", value: String(q.options.length), score: q.options.length }] })}><Plus className="w-3 h-3 mr-1" />Вариант</Button>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Заключения по сумме баллов</h3>
          <Button size="sm" variant="outline" onClick={() => set({ results: [...d.results, { level: "medium", minScore: 0, maxScore: 0, title: "", text: "" }] })}><Plus className="w-4 h-4 mr-1" />Заключение</Button>
        </div>
        {d.results.map((r, i) => (
          <Card key={i}><CardContent className="p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">от</span>
              <Input type="number" className="w-20" value={r.minScore} onChange={e => setR(i, { minScore: Number(e.target.value) })} />
              <span className="text-sm">до</span>
              <Input type="number" className="w-20" value={r.maxScore} onChange={e => setR(i, { maxScore: Number(e.target.value) })} />
              <Select value={r.level} onValueChange={v => setR(i, { level: v as any })}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l.v} value={l.v}><span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: l.c }} />{l.l}</span></SelectItem>)}</SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="ml-auto" onClick={() => set({ results: d.results.filter((_, k) => k !== i) })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
            <Input placeholder="Заголовок заключения" value={r.title} onChange={e => setR(i, { title: e.target.value })} />
            <Textarea rows={2} placeholder="Текст заключения и рекомендации" value={r.text} onChange={e => setR(i, { text: e.target.value })} />
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
