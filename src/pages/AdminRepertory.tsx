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
import { ArrowLeft, Loader2, ChevronRight, BookOpen, X, Search, Sparkles, Zap, BookMarked } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface Chapter { id: string; ord: number; name_en: string; name_ru: string }
interface Rubric { id: string; chapter_id: string; parent_id: string | null; name: string; name_ru: string | null; kent_page: number | null }
interface Remedy { id: string; slug: string; name_latin: string; abbrev: string | null; name_ru: string | null }
interface LinkRow { rubric_id: string; remedy_id: string; grade: number }

const PAGE_SIZE = 1000;

export default function AdminRepertory() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterStats, setChapterStats] = useState<Map<string, { total: number; roots: number; links: number }>>(new Map());
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [openChapter, setOpenChapter] = useState<string | null>(null);

  // Lazy data
  const [chapterRubrics, setChapterRubrics] = useState<Map<string, Rubric[]>>(new Map());
  const [chapterLoading, setChapterLoading] = useState<Set<string>>(new Set());
  const [rubricMeta, setRubricMeta] = useState<Map<string, Rubric>>(new Map());
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  // Search (server-side)
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<Rubric[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/repertory" } });
    }
  }, [user, isAdmin, loading, navigate]);

  // Embedding progress
  const [embedTotal, setEmbedTotal] = useState(0);
  const [embedDone, setEmbedDone] = useState(0);
  const [embedStatus, setEmbedStatus] = useState<string | null>(null);
  const [enqueueing, setEnqueueing] = useState(false);

  async function refreshEmbedStats() {
    const [{ count: totalCount }, { count: doneCount }, { data: lastBatch }] = await Promise.all([
      supabase.from("repertory_rubrics").select("id", { count: "exact", head: true }).not("name_ru", "is", null),
      supabase.from("rubric_embeddings").select("rubric_id", { count: "exact", head: true }),
      supabase.from("embedding_batches").select("id,status,processed_rubrics,total_rubrics").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setEmbedTotal(totalCount || 0);
    setEmbedDone(doneCount || 0);
    if (lastBatch) setEmbedStatus(lastBatch.status);
  }

  // Materia Medica import (Boericke)
  const [mmJob, setMmJob] = useState<{ id: string; status: string; processed: number; total: number; inserted: number } | null>(null);
  const [mmStarting, setMmStarting] = useState(false);

  async function refreshMmJob() {
    const { data } = await supabase.from("mm_import_jobs")
      .select("id,status,processed_remedies,total_remedies,inserted_sections")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data) setMmJob({ id: data.id, status: data.status, processed: data.processed_remedies, total: data.total_remedies, inserted: data.inserted_sections });
  }
  useEffect(() => { refreshMmJob(); refreshEmbedStats(); }, []);
  useEffect(() => {
    if (mmJob?.status !== "processing") return;
    const t = setInterval(refreshMmJob, 5000);
    return () => clearInterval(t);
  }, [mmJob?.status]);
  useEffect(() => {
    if (embedStatus !== "processing") return;
    const t = setInterval(refreshEmbedStats, 4000);
    return () => clearInterval(t);
  }, [embedStatus]);

  async function startMmImport() {
    setMmStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-boericke-mm", { body: {} });
      if (error) throw error;
      toast({ title: "Импорт Materia Medica запущен", description: `Всего средств: ${data?.total ?? "?"}` });
      await refreshMmJob();
    } catch (e: any) {
      toast({ title: "Ошибка запуска импорта", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setMmStarting(false);
    }
  }

  async function startEmbedding() {
    setEnqueueing(true);
    try {
      // Fetch ALL translated rubric IDs (PostgREST caps at 1000/req — paginate)
      const PAGE = 1000;
      const translatedIds: string[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("repertory_rubrics")
          .select("id")
          .not("name_ru", "is", null)
          .order("id", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        translatedIds.push(...data.map((x: any) => x.id));
        if (data.length < PAGE) break;
      }
      // Fetch ALL existing embedding IDs (paginate too)
      const doneSet = new Set<string>();
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("rubric_embeddings")
          .select("rubric_id")
          .order("rubric_id", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach((x: any) => doneSet.add(x.rubric_id));
        if (data.length < PAGE) break;
      }
      const ids = translatedIds.filter((id) => !doneSet.has(id));
      if (ids.length === 0) { toast({ title: "Все переведённые рубрики уже эмбеддированы" }); setEnqueueing(false); return; }
      const { data: batch, error: e3 } = await supabase.from("embedding_batches").insert({ rubric_ids: ids, subbatch_size: 200, total_rubrics: ids.length }).select("id").single();
      if (e3) throw e3;
      const { error: e4 } = await supabase.functions.invoke("embed-rubrics-batch", { body: { batchId: batch.id, subbatchIndex: 0 } });
      if (e4) throw e4;
      toast({ title: `Запущено: ${ids.length.toLocaleString("ru")} рубрик` });
      setEmbedStatus("processing");
      await refreshEmbedStats();
    } catch (e: any) {
      toast({ title: "Ошибка запуска", description: e?.message || String(e), variant: "destructive" });
    } finally { setEnqueueing(false); }
  }

  // Initial load — chapters + stats + remedies (no rubrics, no links)
  useEffect(() => {
    (async () => {
      setBusy(true);
      const [c, m, s] = await Promise.all([
        supabase.from("repertory_chapters").select("*").order("ord"),
        supabase.from("repertory_remedies").select("id, slug, name_latin, abbrev, name_ru").order("name_latin").range(0, 1999),
        supabase.rpc("get_repertory_chapter_stats"),
      ]);
      setChapters((c.data as any) || []);
      setRemedies((m.data as any) || []);
      const sMap = new Map<string, { total: number; roots: number; links: number }>();
      ((s.data as any[]) || []).forEach((row) => {
        sMap.set(row.chapter_id, { total: Number(row.total_rubrics), roots: Number(row.root_rubrics), links: Number(row.total_links) });
      });
      setChapterStats(sMap);
      setBusy(false);
    })();
  }, []);

  async function loadChapter(chapterId: string) {
    if (chapterRubrics.has(chapterId) || chapterLoading.has(chapterId)) return;
    setChapterLoading((prev) => new Set(prev).add(chapterId));
    try {
      const all: Rubric[] = [];
      let from = 0;
      // Page through up to ~20k rubrics per chapter
      while (true) {
        const { data, error } = await supabase
          .from("repertory_rubrics")
          .select("id, chapter_id, parent_id, name, name_ru, kent_page")
          .eq("chapter_id", chapterId)
          .order("name")
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const batch = (data as any[]) || [];
        all.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
        if (from > 30000) break;
      }
      setChapterRubrics((prev) => new Map(prev).set(chapterId, all));
      setRubricMeta((prev) => {
        const n = new Map(prev);
        all.forEach((r) => n.set(r.id, r));
        return n;
      });
    } catch (e: any) {
      toast({ title: "Ошибка загрузки рубрик", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setChapterLoading((prev) => { const n = new Set(prev); n.delete(chapterId); return n; });
    }
  }

  // Load links when selected changes
  useEffect(() => {
    if (selected.size === 0) { setLinks([]); return; }
    let cancelled = false;
    (async () => {
      setLinksLoading(true);
      try {
        const ids = Array.from(selected);
        const acc: LinkRow[] = [];
        // Batch .in() in chunks of 200 ids
        for (let i = 0; i < ids.length; i += 200) {
          const slice = ids.slice(i, i + 200);
          let from = 0;
          while (true) {
            const { data, error } = await supabase
              .from("repertory_rubric_remedies")
              .select("rubric_id, remedy_id, grade")
              .in("rubric_id", slice)
              .range(from, from + PAGE_SIZE - 1);
            if (error) throw error;
            const batch = (data as any[]) || [];
            acc.push(...batch);
            if (batch.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
          }
        }
        if (!cancelled) setLinks(acc);
      } catch (e: any) {
        if (!cancelled) toast({ title: "Ошибка загрузки связей", description: e?.message || String(e), variant: "destructive" });
      } finally {
        if (!cancelled) setLinksLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected]);

  // Server-side rubric search (debounced)
  useEffect(() => {
    const term = q.trim();
    if (!term) { setSearchResults(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("repertory_rubrics")
          .select("id, chapter_id, parent_id, name, name_ru, kent_page")
          .or(`name.ilike.%${term}%,name_ru.ilike.%${term}%`)
          .limit(300);
        if (error) throw error;
        if (cancelled) return;
        const rows = (data as any[]) || [];
        setSearchResults(rows);
        setRubricMeta((prev) => {
          const n = new Map(prev);
          rows.forEach((r) => n.set(r.id, r));
          return n;
        });
      } catch (e: any) {
        if (!cancelled) toast({ title: "Ошибка поиска", description: e?.message || String(e), variant: "destructive" });
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const remedyById = useMemo(() => {
    const m = new Map<string, Remedy>();
    remedies.forEach((r) => m.set(r.id, r));
    return m;
  }, [remedies]);

  // Group loaded rubrics for a chapter by parent_id
  function groupRubrics(rubrics: Rubric[]) {
    const roots: Rubric[] = [];
    const children = new Map<string, Rubric[]>();
    rubrics.forEach((r) => {
      if (r.parent_id) {
        const arr = children.get(r.parent_id) || [];
        arr.push(r);
        children.set(r.parent_id, arr);
      } else roots.push(r);
    });
    return { roots, children };
  }

  // Repertorization
  const ranking = useMemo(() => {
    if (selected.size === 0) return [];
    const stats = new Map<string, { sum: number; count: number; perRubric: Map<string, number> }>();
    links.forEach((l) => {
      if (!selected.has(l.rubric_id)) return;
      const s = stats.get(l.remedy_id) || { sum: 0, count: 0, perRubric: new Map() };
      s.sum += l.grade;
      s.count += 1;
      s.perRubric.set(l.rubric_id, l.grade);
      stats.set(l.remedy_id, s);
    });
    return Array.from(stats.entries())
      .map(([rid, s]) => ({ remedy: remedyById.get(rid)!, ...s }))
      .filter((x) => x.remedy)
      .sort((a, b) => b.count - a.count || b.sum - a.sum);
  }, [selected, links, remedyById]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  async function handleChapterOpen(chapterId: string, open: boolean) {
    if (open) {
      setOpenChapter(chapterId);
      await loadChapter(chapterId);
    } else if (openChapter === chapterId) {
      setOpenChapter(null);
    }
  }

  // Group search results by chapter
  const searchByChapter = useMemo(() => {
    if (!searchResults) return null;
    const m = new Map<string, Rubric[]>();
    searchResults.forEach((r) => {
      const arr = m.get(r.chapter_id) || [];
      arr.push(r);
      m.set(r.chapter_id, arr);
    });
    return m;
  }, [searchResults]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  const totalRubrics = Array.from(chapterStats.values()).reduce((a, s) => a + s.total, 0);

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
                {chapters.length} глав · {totalRubrics.toLocaleString("ru")} рубрик · {remedies.length} препаратов
              </p>
              {embedTotal > 0 && (
                <div className="mt-2 max-w-md">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Эмбеддинги рубрик</span>
                    <span className="font-mono">{embedDone} / {embedTotal}{embedStatus === "processing" && " · обрабатывается…"}</span>
                  </div>
                  <Progress value={embedTotal ? (embedDone / embedTotal) * 100 : 0} className="h-1.5" />
                </div>
              )}
              {mmJob && mmJob.total > 0 && (
                <div className="mt-2 max-w-md">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Materia Medica (Бёрике)</span>
                    <span className="font-mono">{mmJob.processed} / {mmJob.total} · {mmJob.inserted} разделов{mmJob.status === "processing" && " · импорт…"}</span>
                  </div>
                  <Progress value={mmJob.total ? (mmJob.processed / mmJob.total) * 100 : 0} className="h-1.5" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button asChild className="gap-2">
                <Link to="/admin/repertory/by-complaint"><Sparkles className="w-4 h-4"/>Поиск по жалобам</Link>
              </Button>
              <Button variant="outline" onClick={startEmbedding} disabled={enqueueing || embedStatus === "processing"} className="gap-2">
                {enqueueing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
                {embedStatus === "processing"
                  ? "Эмбеддинг идёт…"
                  : embedDone >= embedTotal && embedTotal > 0
                    ? "Все рубрики эмбеддированы"
                    : `Эмбеддировать все рубрики (осталось ${(embedTotal - embedDone).toLocaleString("ru")})`}
              </Button>
              <Button variant="outline" onClick={startMmImport} disabled={mmStarting || mmJob?.status === "processing"} className="gap-2">
                {mmStarting ? <Loader2 className="w-4 h-4 animate-spin"/> : <BookMarked className="w-4 h-4"/>}
                Импорт Materia Medica
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/admin/translation-queue"><Loader2 className="w-4 h-4"/>Очередь переводов</Link>
              </Button>
              {selected.size > 0 && (
                <Button variant="outline" onClick={() => setSelected(new Set())} className="gap-2">
                  <X className="w-4 h-4"/>Сбросить выбор ({selected.size})
                </Button>
              )}
            </div>
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
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по рубрикам (EN/RU)…" className="pl-9"/>
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground"/>}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[calc(100vh-360px)] min-h-[400px] pr-3">
                    {/* SEARCH MODE: flat list grouped by chapter */}
                    {searchResults ? (
                      searchResults.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-10">Ничего не найдено.</div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs text-muted-foreground">Найдено: {searchResults.length}{searchResults.length === 300 && " (показаны первые 300)"}</div>
                          {chapters.map((ch) => {
                            const rows = searchByChapter?.get(ch.id);
                            if (!rows || rows.length === 0) return null;
                            return (
                              <div key={ch.id}>
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">{ch.name_ru}</div>
                                <div className="space-y-0.5">
                                  {rows.map((r) => (
                                    <label key={r.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm">
                                      <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} className="mt-0.5"/>
                                      <span className="flex-1">
                                        {r.name_ru || r.name}
                                        {r.name_ru && <span className="text-xs text-muted-foreground ml-2">{r.name}</span>}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      /* BROWSE MODE: chapters → lazy rubrics */
                      <div className="space-y-1">
                        {chapters.map((ch) => {
                          const stat = chapterStats.get(ch.id);
                          const total = stat?.total || 0;
                          const isOpen = openChapter === ch.id;
                          const isLoading = chapterLoading.has(ch.id);
                          const rubrics = chapterRubrics.get(ch.id) || [];
                          const { roots, children } = isOpen ? groupRubrics(rubrics) : { roots: [] as Rubric[], children: new Map<string, Rubric[]>() };
                          return (
                            <Collapsible key={ch.id} open={isOpen} onOpenChange={(o) => handleChapterOpen(ch.id, o)}>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/60 group">
                                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}/>
                                <span className="font-medium text-sm">{ch.name_ru}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : total.toLocaleString("ru")}
                                </span>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pl-6 space-y-0.5 mt-1">
                                {isLoading && rubrics.length === 0 ? (
                                  <div className="text-xs text-muted-foreground py-2">Загрузка…</div>
                                ) : (
                                  roots.map((r) => (
                                    <RubricRow
                                      key={r.id}
                                      rubric={r}
                                      selected={selected}
                                      toggle={toggle}
                                      children={children.get(r.id) || []}
                                    />
                                  ))
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* RIGHT: ranking */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Ранжирование препаратов</span>
                    {ranking.length > 0 && <Badge variant="secondary">{ranking.length} препаратов</Badge>}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Сортировка: совпадения рубрик ↓, затем сумма грейдов ↓</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {selected.size === 0 ? (
                    <div className="text-center text-muted-foreground py-16 text-sm">
                      Отметьте одну или несколько рубрик слева — препараты автоматически ранжируются по совпадениям.
                    </div>
                  ) : linksLoading && links.length === 0 ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-360px)] min-h-[400px] pr-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b">
                          {Array.from(selected).map((id) => {
                            const r = rubricMeta.get(id);
                            return (
                              <Badge key={id} variant="outline" className="gap-1 cursor-pointer" onClick={() => toggle(id)}>
                                {r?.name_ru || r?.name || id.slice(0, 6)}<X className="w-3 h-3"/>
                              </Badge>
                            );
                          })}
                        </div>
                        {ranking.map((row, i) => (
                          <div key={row.remedy.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50">
                            <div className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{row.remedy.name_latin}</div>
                              {row.remedy.name_ru && <div className="text-xs text-muted-foreground truncate">{row.remedy.name_ru}</div>}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <Badge variant="secondary" className="font-mono text-xs">{row.count}/{selected.size}</Badge>
                                  <Badge className="font-mono text-xs">Σ {row.sum}</Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-1">
                                  {Array.from(row.perRubric.entries()).map(([rid, g]) => {
                                    const r = rubricMeta.get(rid);
                                    return (
                                      <div key={rid} className="flex items-center justify-between gap-3 text-xs">
                                        <span className="truncate">{r?.name_ru || r?.name || "—"}</span>
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

function RubricRow({ rubric, children, selected, toggle }: {
  rubric: Rubric;
  children: Rubric[];
  selected: Set<string>;
  toggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = children.length > 0;
  return (
    <div>
      <div className="flex items-start gap-1">
        {hasChildren ? (
          <button onClick={() => setOpen((o) => !o)} className="mt-1 text-muted-foreground hover:text-foreground">
            <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}/>
          </button>
        ) : <span className="w-3 mt-1"/>}
        <label className="flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm flex-1">
          <Checkbox checked={selected.has(rubric.id)} onCheckedChange={() => toggle(rubric.id)} className="mt-0.5"/>
          <span className="flex-1">
            {rubric.name_ru || rubric.name}
            {rubric.name_ru && <span className="text-xs text-muted-foreground ml-2">{rubric.name}</span>}
          </span>
          {hasChildren && <span className="text-[10px] text-muted-foreground">{children.length}</span>}
        </label>
      </div>
      {open && hasChildren && (
        <div className="pl-6 space-y-0.5">
          {children.map((c) => (
            <label key={c.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm">
              <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} className="mt-0.5"/>
              <span className="flex-1 text-muted-foreground">
                {c.name_ru || c.name}
                {c.name_ru && <span className="text-xs text-muted-foreground/70 ml-2">{c.name}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
