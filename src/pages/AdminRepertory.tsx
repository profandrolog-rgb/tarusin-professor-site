import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Loader2, ChevronRight, BookOpen, X, Search } from "lucide-react";

interface Chapter { id: string; ord: number; name_en: string; name_ru: string }
interface Rubric { id: string; chapter_id: string; parent_id: string | null; name: string; kent_page: number | null }
interface Remedy { id: string; slug: string; name_latin: string; abbrev: string | null; name_ru: string | null }
interface Link { rubric_id: string; remedy_id: string; grade: number }

export default function AdminRepertory() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/repertory" } });
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const [c, r, m, l] = await Promise.all([
        supabase.from("repertory_chapters").select("*").order("ord"),
        supabase.from("repertory_rubrics").select("*").order("name"),
        supabase.from("repertory_remedies").select("*").order("name_latin"),
        supabase.from("repertory_rubric_remedies").select("rubric_id, remedy_id, grade"),
      ]);
      setChapters((c.data as any) || []);
      setRubrics((r.data as any) || []);
      setRemedies((m.data as any) || []);
      setLinks((l.data as any) || []);
      setBusy(false);
    })();
  }, []);

  const remedyById = useMemo(() => {
    const m = new Map<string, Remedy>();
    remedies.forEach(r => m.set(r.id, r));
    return m;
  }, [remedies]);

  const rubricById = useMemo(() => {
    const m = new Map<string, Rubric>();
    rubrics.forEach(r => m.set(r.id, r));
    return m;
  }, [rubrics]);

  // Group rubrics by chapter + nest by parent_id (1 level enough for Kent seed)
  const rubricsByChapter = useMemo(() => {
    const m = new Map<string, { roots: Rubric[]; children: Map<string, Rubric[]> }>();
    chapters.forEach(c => m.set(c.id, { roots: [], children: new Map() }));
    rubrics.forEach(r => {
      const bucket = m.get(r.chapter_id);
      if (!bucket) return;
      if (r.parent_id) {
        const arr = bucket.children.get(r.parent_id) || [];
        arr.push(r);
        bucket.children.set(r.parent_id, arr);
      } else {
        bucket.roots.push(r);
      }
    });
    return m;
  }, [chapters, rubrics]);

  // Repertorization: for each selected rubric, sum grades; track which rubrics matched each remedy
  const ranking = useMemo(() => {
    if (selected.size === 0) return [];
    const stats = new Map<string, { sum: number; count: number; perRubric: Map<string, number> }>();
    links.forEach(l => {
      if (!selected.has(l.rubric_id)) return;
      const s = stats.get(l.remedy_id) || { sum: 0, count: 0, perRubric: new Map() };
      s.sum += l.grade;
      s.count += 1;
      s.perRubric.set(l.rubric_id, l.grade);
      stats.set(l.remedy_id, s);
    });
    return Array.from(stats.entries())
      .map(([rid, s]) => ({ remedy: remedyById.get(rid)!, ...s }))
      .filter(x => x.remedy)
      .sort((a, b) => b.count - a.count || b.sum - a.sum);
  }, [selected, links, remedyById]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Search filter for rubrics (case-insensitive, in any chapter)
  const filteredRubricIds = useMemo(() => {
    if (!q.trim()) return null;
    const needle = q.toLowerCase();
    const ids = new Set<string>();
    rubrics.forEach(r => {
      if (r.name.toLowerCase().includes(needle)) {
        ids.add(r.id);
        if (r.parent_id) ids.add(r.parent_id);
      }
    });
    return ids;
  }, [q, rubrics]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-[1400px]">
          <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4"/>Назад к панели администратора
          </Link>

          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-primary"/> Реперториум Кента
              </h1>
              <p className="text-muted-foreground">
                {chapters.length} глав · {rubrics.length} рубрик · {remedies.length} препаратов
              </p>
            </div>
            {selected.size > 0 && (
              <Button variant="outline" onClick={() => setSelected(new Set())} className="gap-2">
                <X className="w-4 h-4"/>Сбросить выбор ({selected.size})
              </Button>
            )}
          </div>

          {busy ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT: chapters + rubrics */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Главы и рубрики</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <Input
                      value={q}
                      onChange={e => setQ(e.target.value)}
                      placeholder="Поиск по рубрикам…"
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[calc(100vh-340px)] min-h-[400px] pr-3">
                    <div className="space-y-1">
                      {chapters.map(ch => {
                        const bucket = rubricsByChapter.get(ch.id);
                        if (!bucket) return null;
                        // If filtering, hide chapter with no matches
                        if (filteredRubricIds) {
                          const hasMatch = [...bucket.roots, ...rubrics.filter(r => r.chapter_id === ch.id)]
                            .some(r => filteredRubricIds.has(r.id));
                          if (!hasMatch) return null;
                        }
                        const isOpen = openChapter === ch.id || !!filteredRubricIds;
                        return (
                          <Collapsible
                            key={ch.id}
                            open={isOpen}
                            onOpenChange={(o) => setOpenChapter(o ? ch.id : null)}
                          >
                            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/60 group">
                              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}/>
                              <span className="font-medium text-sm">{ch.name_ru}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{bucket.roots.length}</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-6 space-y-0.5 mt-1">
                              {bucket.roots
                                .filter(r => !filteredRubricIds || filteredRubricIds.has(r.id) || (bucket.children.get(r.id) || []).some(c => filteredRubricIds.has(c.id)))
                                .map(r => (
                                  <RubricRow
                                    key={r.id}
                                    rubric={r}
                                    selected={selected}
                                    toggle={toggle}
                                    children={bucket.children.get(r.id) || []}
                                    filterIds={filteredRubricIds}
                                  />
                                ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* RIGHT: ranking */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Ранжирование препаратов</span>
                    {ranking.length > 0 && (
                      <Badge variant="secondary">{ranking.length} препаратов</Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Сортировка: совпадения рубрик ↓, затем сумма грейдов ↓
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  {selected.size === 0 ? (
                    <div className="text-center text-muted-foreground py-16 text-sm">
                      Отметьте одну или несколько рубрик слева — препараты автоматически ранжируются по совпадениям.
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-340px)] min-h-[400px] pr-3">
                      <div className="space-y-1">
                        {/* selected rubrics chips */}
                        <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b">
                          {Array.from(selected).map(id => {
                            const r = rubricById.get(id);
                            if (!r) return null;
                            return (
                              <Badge key={id} variant="outline" className="gap-1 cursor-pointer" onClick={() => toggle(id)}>
                                {r.name}<X className="w-3 h-3"/>
                              </Badge>
                            );
                          })}
                        </div>
                        {ranking.map((row, i) => (
                          <div key={row.remedy.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50">
                            <div className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{row.remedy.name_latin}</div>
                              {row.remedy.name_ru && (
                                <div className="text-xs text-muted-foreground truncate">{row.remedy.name_ru}</div>
                              )}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {row.count}/{selected.size}
                                  </Badge>
                                  <Badge className="font-mono text-xs">Σ {row.sum}</Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-1">
                                  {Array.from(row.perRubric.entries()).map(([rid, g]) => {
                                    const r = rubricById.get(rid);
                                    return (
                                      <div key={rid} className="flex items-center justify-between gap-3 text-xs">
                                        <span className="truncate">{r?.name || "—"}</span>
                                        <span className="font-mono font-semibold">grade {g}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function RubricRow({
  rubric, children, selected, toggle, filterIds,
}: {
  rubric: Rubric;
  children: Rubric[];
  selected: Set<string>;
  toggle: (id: string) => void;
  filterIds: Set<string> | null;
}) {
  const visible = !filterIds || filterIds.has(rubric.id) || children.some(c => filterIds.has(c.id));
  if (!visible) return null;
  return (
    <div>
      <label className="flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm">
        <Checkbox
          checked={selected.has(rubric.id)}
          onCheckedChange={() => toggle(rubric.id)}
          className="mt-0.5"
        />
        <span className="flex-1">{rubric.name}</span>
        {rubric.kent_page && (
          <span className="text-[10px] text-muted-foreground font-mono">с.{rubric.kent_page}</span>
        )}
      </label>
      {children.length > 0 && (
        <div className="pl-6 space-y-0.5">
          {children
            .filter(c => !filterIds || filterIds.has(c.id))
            .map(c => (
              <label key={c.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm">
                <Checkbox
                  checked={selected.has(c.id)}
                  onCheckedChange={() => toggle(c.id)}
                  className="mt-0.5"
                />
                <span className="flex-1 text-muted-foreground">{c.name}</span>
                {c.kent_page && (
                  <span className="text-[10px] text-muted-foreground font-mono">с.{c.kent_page}</span>
                )}
              </label>
            ))}
        </div>
      )}
    </div>
  );
}
