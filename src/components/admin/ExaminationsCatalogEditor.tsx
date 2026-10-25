import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface Exam { id: string; name: string; category: string; is_active: boolean; sort_order: number }
interface Link { id: string; diagnosis_group: string; examination_id: string }

const db = supabase as any;

/** Единый каталог обследований + привязка к заболеваниям галочками. */
export function ExaminationsCatalogEditor() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [extraGroups, setExtraGroups] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [e, l] = await Promise.all([
      db.from("examinations_catalog").select("*").limit(5000),
      db.from("diagnosis_examinations").select("id, diagnosis_group, examination_id").limit(10000),
    ]);
    if (e.error || l.error) {
      toast({ title: "Не удалось загрузить", description: (e.error || l.error).message, variant: "destructive" });
    }
    setExams(((e.data as Exam[]) || []).sort((a, b) => a.name.localeCompare(b.name, "ru")));
    setLinks((l.data as Link[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const groups = useMemo(
    () => Array.from(new Set([...links.map((l) => l.diagnosis_group), ...extraGroups])).sort((a, b) => a.localeCompare(b, "ru")),
    [links, extraGroups],
  );
  const groupsByExam = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of links) m.set(l.examination_id, [...(m.get(l.examination_id) || []), l.diagnosis_group]);
    return m;
  }, [links]);
  const linkedSet = useMemo(
    () => new Set(links.filter((l) => l.diagnosis_group === group).map((l) => l.examination_id)),
    [links, group],
  );
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ql ? exams.filter((e) => e.name.toLowerCase().includes(ql)) : exams;
  }, [exams, q]);
  const groupList = useMemo(
    () => [...filtered].sort((a, b) => Number(linkedSet.has(b.id)) - Number(linkedSet.has(a.id)) || a.name.localeCompare(b.name, "ru")),
    [filtered, linkedSet],
  );

  const toggleLink = async (examId: string) => {
    if (!group) return;
    const existing = links.find((l) => l.diagnosis_group === group && l.examination_id === examId);
    if (existing) {
      const { error } = await db.from("diagnosis_examinations").delete().eq("id", existing.id);
      if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      setLinks((p) => p.filter((l) => l.id !== existing.id));
    } else {
      const { data, error } = await db.from("diagnosis_examinations")
        .insert({ diagnosis_group: group, examination_id: examId }).select("id, diagnosis_group, examination_id").single();
      if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      setLinks((p) => [...p, data as Link]);
    }
  };

  const addExam = async (linkToGroup: boolean) => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      let exam = exams.find((e) => e.name.trim().toLowerCase() === name.toLowerCase());
      if (!exam) {
        const { data, error } = await db.from("examinations_catalog").insert({ name }).select("*").single();
        if (error) throw error;
        exam = data as Exam;
        setExams((p) => [...p, exam!].sort((a, b) => a.name.localeCompare(b.name, "ru")));
      }
      if (linkToGroup && group && !linkedSet.has(exam.id)) await toggleLink(exam.id);
      setNewName("");
      toast({ title: "Добавлено", description: exam.name });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const saveName = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    const { error } = await db.from("examinations_catalog").update({ name }).eq("id", id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setExams((p) => p.map((e) => (e.id === id ? { ...e, name } : e)).sort((a, b) => a.name.localeCompare(b.name, "ru")));
    setEditId(null);
  };

  const toggleActive = async (ex: Exam) => {
    const { error } = await db.from("examinations_catalog").update({ is_active: !ex.is_active }).eq("id", ex.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setExams((p) => p.map((e) => (e.id === ex.id ? { ...e, is_active: !e.is_active } : e)));
  };

  const remove = async (ex: Exam) => {
    if (!confirm(`Удалить «${ex.name}» из каталога и всех заболеваний?`)) return;
    const { error } = await db.from("examinations_catalog").delete().eq("id", ex.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setExams((p) => p.filter((e) => e.id !== ex.id));
    setLinks((p) => p.filter((l) => l.examination_id !== ex.id));
  };

  const addGroup = () => {
    const g = newGroup.trim();
    if (!g) return;
    if (!groups.includes(g)) setExtraGroups((p) => [...p, g]);
    setGroup(g);
    setNewGroup("");
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const nameCell = (ex: Exam) =>
    editId === ex.id ? (
      <div className="flex gap-1 flex-1">
        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8"
          onKeyDown={(e) => { if (e.key === "Enter") saveName(ex.id); if (e.key === "Escape") setEditId(null); }} autoFocus />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveName(ex.id)}><Check className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
      </div>
    ) : (
      <span className={`flex-1 text-sm leading-snug ${ex.is_active ? "" : "text-muted-foreground line-through"}`}>{ex.name}</span>
    );

  return (
    <Tabs defaultValue="by-diagnosis">
      <TabsList className="mb-3">
        <TabsTrigger value="by-diagnosis">По заболеваниям</TabsTrigger>
        <TabsTrigger value="all">Единый список ({exams.length})</TabsTrigger>
      </TabsList>

      <div className="flex gap-2 mb-3 flex-wrap">
        <Input placeholder="Поиск обследования…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      </div>

      <TabsContent value="by-diagnosis" className="space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Выберите заболевание" /></SelectTrigger>
            <SelectContent className="max-h-80">
              {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Новое заболевание…" value={newGroup} onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGroup()} className="w-56" />
          <Button size="sm" variant="outline" onClick={addGroup} disabled={!newGroup.trim()}><Plus className="h-4 w-4 mr-1" />Заболевание</Button>
        </div>

        {!group ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Выберите заболевание — появится весь перечень обследований с галочками.</p>
        ) : (
          <>
            <div className="flex gap-2">
              <Input placeholder={`Новое обследование для «${group}»…`} value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExam(true)} />
              <Button size="sm" onClick={() => addExam(true)} disabled={busy || !newName.trim()}><Plus className="h-4 w-4 mr-1" />Добавить</Button>
            </div>
            <p className="text-xs text-muted-foreground">Отмечено для «{group}»: {linkedSet.size}. Галочка сохраняется сразу.</p>
            <div className="border rounded-md divide-y max-h-[60vh] overflow-y-auto">
              {groupList.map((ex) => (
                <label key={ex.id} className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={linkedSet.has(ex.id)} onCheckedChange={() => toggleLink(ex.id)} className="mt-0.5" />
                  <span className={`text-sm leading-snug ${ex.is_active ? "" : "text-muted-foreground line-through"}`}>{ex.name}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="all" className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Новое обследование…" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExam(false)} />
          <Button size="sm" onClick={() => addExam(false)} disabled={busy || !newName.trim()}><Plus className="h-4 w-4 mr-1" />Добавить</Button>
        </div>
        <div className="border rounded-md divide-y max-h-[60vh] overflow-y-auto">
          {filtered.map((ex) => (
            <div key={ex.id} className="flex items-start gap-2 px-3 py-2">
              <div className="flex-1 min-w-0 space-y-1">
                {nameCell(ex)}
                <div className="flex flex-wrap gap-1">
                  {(groupsByExam.get(ex.id) || []).map((g) => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => toggleActive(ex)}>{ex.is_active ? "Скрыть" : "Показать"}</Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditId(ex.id); setEditName(ex.name); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(ex)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
