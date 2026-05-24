import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Loader2, BookMarked, Pencil, Trash2, Archive, Copy, FilePlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface T {
  id: string;
  name: string;
  description: string | null;
  target_patient: string | null;
  mode: "flat" | "scheduled";
  duration_days: number | null;
  tags: string[] | null;
  is_archived: boolean;
  items_count?: number;
}

export default function TreatmentTemplates() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<T[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/treatment-templates" } });
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    setBusy(true);
    const { data } = await supabase
      .from("protocol_templates")
      .select("*, items:protocol_template_items(count)")
      .order("created_at", { ascending: false });
    setRows((data || []).map((r: any) => ({ ...r, items_count: r.items?.[0]?.count ?? 0 })));
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const create = () => navigate("/admin/treatment-templates/new");

  const duplicate = async (r: T) => {
    if (!user) return;
    const { data: tpl, error } = await supabase.from("protocol_templates").insert({
      name: r.name + " (копия)", description: r.description, target_patient: r.target_patient,
      mode: r.mode, duration_days: r.duration_days, tags: r.tags, created_by: user.id,
    } as any).select("id").single();
    if (error || !tpl) { toast({ title: "Ошибка", description: error?.message, variant: "destructive" }); return; }
    const { data: src } = await supabase.from("protocol_template_items").select("*").eq("template_id", r.id);
    if (src && src.length) {
      const rows = src.map((s: any) => { const { id, created_at, ...rest } = s; return { ...rest, template_id: tpl.id }; });
      await supabase.from("protocol_template_items").insert(rows as any);
    }
    toast({ title: "Шаблон скопирован" });
    load();
  };

  const toggleArchive = async (r: T) => {
    const { error } = await supabase.from("protocol_templates").update({ is_archived: !r.is_archived } as any).eq("id", r.id);
    if (!error) load();
  };

  const remove = async (r: T) => {
    if (!confirm(`Удалить шаблон «${r.name}»?`)) return;
    const { error } = await supabase.from("protocol_templates").delete().eq("id", r.id);
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else load();
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => (r.tags || []).forEach(t => t && set.add(t)));
    return Array.from(set).sort();
  }, [rows]);

  const toggleTag = (t: string) => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const filtered = rows.filter(r => {
    if (!showArchived && r.is_archived) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase()) && !(r.target_patient || "").toLowerCase().includes(q.toLowerCase())) return false;
    if (activeTags.length && !activeTags.every(t => (r.tags || []).includes(t))) return false;
    return true;
  });

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/admin/treatment-plans" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4"/>К листам назначений</Link>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2"><BookMarked className="w-7 h-7 text-primary"/>Шаблоны протоколов</h1>
            <p className="text-muted-foreground">Готовые наборы назначений для типовых случаев</p>
          </div>
          <Button onClick={create} className="gap-2"><Plus className="w-4 h-4"/>Новый шаблон</Button>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск..." className="max-w-md"/>
          <label className="text-sm flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>
            показать архив
          </label>
          <div className="text-sm text-muted-foreground ml-auto">{filtered.length} из {rows.length}</div>
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-1.5 mb-4 flex-wrap items-center">
            <span className="text-xs text-muted-foreground mr-1">Теги:</span>
            {allTags.map(t => (
              <Badge
                key={t}
                variant={activeTags.includes(t) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => toggleTag(t)}
              >
                {t}
              </Badge>
            ))}
            {activeTags.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setActiveTags([])} className="h-6 gap-1 text-xs">
                <X className="w-3 h-3"/>сбросить
              </Button>
            )}
          </div>
        )}

        {busy ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-50"/>
            Шаблонов пока нет. Создайте первый или сохраните существующий лист как шаблон.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(r => (
              <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.is_archived ? "opacity-60" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/admin/treatment-templates/${r.id}`} className="font-medium hover:text-primary">{r.name}</Link>
                      <Badge variant="outline">{r.mode === "flat" ? "плоский" : "по дням"}</Badge>
                      <Badge variant="outline">{r.items_count} позиций</Badge>
                      {r.duration_days && <Badge variant="outline">{r.duration_days} дн.</Badge>}
                      {r.is_archived && <Badge variant="secondary">архив</Badge>}
                    </div>
                    {(r.tags || []).length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {(r.tags || []).map(t => (
                          <Badge
                            key={t}
                            variant={activeTags.includes(t) ? "default" : "secondary"}
                            className="text-[10px] cursor-pointer"
                            onClick={(e) => { e.preventDefault(); toggleTag(t); }}
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {r.target_patient && <div className="text-sm text-muted-foreground mt-1">{r.target_patient}</div>}
                    {r.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</div>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Link to={`/admin/treatment-plans/new?templateId=${r.id}`}><Button size="sm" className="gap-1"><FilePlus className="w-3.5 h-3.5"/>Применить к новому листу</Button></Link>
                    <Link to={`/admin/treatment-templates/${r.id}`}><Button size="sm" variant="outline" className="gap-1"><Pencil className="w-3.5 h-3.5"/>Открыть</Button></Link>
                    <Button size="icon" variant="ghost" onClick={()=>duplicate(r)} title="Дублировать"><Copy className="w-4 h-4"/></Button>
                    <Button size="icon" variant="ghost" onClick={()=>toggleArchive(r)} title="В архив / из архива"><Archive className="w-4 h-4"/></Button>
                    <Button size="icon" variant="ghost" onClick={()=>remove(r)} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
