import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, t as toast, J as TooltipProvider, B as Button, C as Card, c as CardHeader, d as CardTitle, I as Input, a as CardContent, r as Checkbox, b as Badge, K as Tooltip, M as TooltipTrigger, N as TooltipContent } from "../main.mjs";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { Loader2, ArrowLeft, BookOpen, Sparkles, Zap, BookMarked, X, Search, ChevronRight } from "lucide-react";
import { P as Progress } from "./progress-Y5q1JT93.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "react-i18next";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-progress";
const PAGE_SIZE = 1e3;
function AdminRepertory() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [chapterStats, setChapterStats] = useState(/* @__PURE__ */ new Map());
  const [remedies, setRemedies] = useState([]);
  const [openChapter, setOpenChapter] = useState(null);
  const [chapterRubrics, setChapterRubrics] = useState(/* @__PURE__ */ new Map());
  const [chapterLoading, setChapterLoading] = useState(/* @__PURE__ */ new Set());
  const [rubricMeta, setRubricMeta] = useState(/* @__PURE__ */ new Map());
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/repertory" } });
    }
  }, [user, isAdmin, loading, navigate]);
  const [embedTotal, setEmbedTotal] = useState(0);
  const [embedDone, setEmbedDone] = useState(0);
  const [embedStatus, setEmbedStatus] = useState(null);
  const [enqueueing, setEnqueueing] = useState(false);
  const embedBaselineRef = useRef(null);
  const [embedRate, setEmbedRate] = useState(0);
  const wasProcessingRef = useRef(false);
  async function refreshEmbedStats() {
    const [{ count: totalCount }, { count: doneCount }, { data: lastBatch }] = await Promise.all([
      supabase.from("repertory_rubrics").select("id", { count: "exact", head: true }).not("name_ru", "is", null),
      supabase.from("rubric_embeddings").select("rubric_id", { count: "exact", head: true }),
      supabase.from("embedding_batches").select("id,status,processed_rubrics,total_rubrics").order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);
    const total = totalCount || 0;
    const done = doneCount || 0;
    setEmbedTotal(total);
    setEmbedDone(done);
    const status = (lastBatch == null ? void 0 : lastBatch.status) ?? null;
    setEmbedStatus(status);
    if (status === "processing") {
      if (!embedBaselineRef.current) {
        embedBaselineRef.current = { done, ts: Date.now() };
      } else {
        const elapsed = (Date.now() - embedBaselineRef.current.ts) / 1e3;
        const delta = done - embedBaselineRef.current.done;
        if (elapsed > 5 && delta > 0) setEmbedRate(delta / elapsed);
      }
      wasProcessingRef.current = true;
    } else {
      if (wasProcessingRef.current && total > 0 && (status === "completed" || done >= total)) {
        toast({ title: "Эмбеддинг завершён", description: `Обработано ${done.toLocaleString("ru")} рубрик` });
      }
      wasProcessingRef.current = false;
      embedBaselineRef.current = null;
      setEmbedRate(0);
    }
  }
  const [mmJob, setMmJob] = useState(null);
  const [mmStarting, setMmStarting] = useState(false);
  async function refreshMmJob() {
    const { data } = await supabase.from("mm_import_jobs").select("id,status,processed_remedies,total_remedies,inserted_sections").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data) setMmJob({ id: data.id, status: data.status, processed: data.processed_remedies, total: data.total_remedies, inserted: data.inserted_sections });
  }
  useEffect(() => {
    refreshMmJob();
    refreshEmbedStats();
  }, []);
  useEffect(() => {
    if ((mmJob == null ? void 0 : mmJob.status) !== "processing") return;
    const t = setInterval(refreshMmJob, 5e3);
    return () => clearInterval(t);
  }, [mmJob == null ? void 0 : mmJob.status]);
  useEffect(() => {
    if (embedStatus !== "processing") return;
    const t = setInterval(refreshEmbedStats, 4e3);
    return () => clearInterval(t);
  }, [embedStatus]);
  async function startMmImport() {
    setMmStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-boericke-mm", { body: {} });
      if (error) throw error;
      toast({ title: "Импорт Materia Medica запущен", description: `Всего средств: ${(data == null ? void 0 : data.total) ?? "?"}` });
      await refreshMmJob();
    } catch (e) {
      toast({ title: "Ошибка запуска импорта", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setMmStarting(false);
    }
  }
  async function startEmbedding() {
    setEnqueueing(true);
    try {
      const { data: batchId, error: e1 } = await supabase.rpc("enqueue_all_missing_embeddings");
      if (e1) throw e1;
      if (!batchId) {
        toast({ title: "Все переведённые рубрики уже эмбеддированы" });
        setEnqueueing(false);
        return;
      }
      const { error: e4 } = await supabase.functions.invoke("embed-rubrics-batch", { body: { batchId, subbatchIndex: 0 } });
      if (e4) throw e4;
      toast({ title: "Эмбеддинг запущен" });
      setEmbedStatus("processing");
      await refreshEmbedStats();
    } catch (e) {
      toast({ title: "Ошибка запуска", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setEnqueueing(false);
    }
  }
  useEffect(() => {
    (async () => {
      setBusy(true);
      const [c, m, s] = await Promise.all([
        supabase.from("repertory_chapters").select("*").order("ord"),
        supabase.from("repertory_remedies").select("id, slug, name_latin, abbrev, name_ru").order("name_latin").range(0, 1999),
        supabase.rpc("get_repertory_chapter_stats")
      ]);
      setChapters(c.data || []);
      setRemedies(m.data || []);
      const sMap = /* @__PURE__ */ new Map();
      (s.data || []).forEach((row) => {
        sMap.set(row.chapter_id, { total: Number(row.total_rubrics), roots: Number(row.root_rubrics), links: Number(row.total_links) });
      });
      setChapterStats(sMap);
      setBusy(false);
    })();
  }, []);
  async function loadChapter(chapterId) {
    if (chapterRubrics.has(chapterId) || chapterLoading.has(chapterId)) return;
    setChapterLoading((prev) => new Set(prev).add(chapterId));
    try {
      const all = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase.from("repertory_rubrics").select("id, chapter_id, parent_id, name, name_ru, kent_page").eq("chapter_id", chapterId).order("name").range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const batch = data || [];
        all.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
        if (from > 3e4) break;
      }
      setChapterRubrics((prev) => new Map(prev).set(chapterId, all));
      setRubricMeta((prev) => {
        const n = new Map(prev);
        all.forEach((r) => n.set(r.id, r));
        return n;
      });
    } catch (e) {
      toast({ title: "Ошибка загрузки рубрик", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setChapterLoading((prev) => {
        const n = new Set(prev);
        n.delete(chapterId);
        return n;
      });
    }
  }
  useEffect(() => {
    if (selected.size === 0) {
      setLinks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLinksLoading(true);
      try {
        const ids = Array.from(selected);
        const acc = [];
        for (let i = 0; i < ids.length; i += 200) {
          const slice = ids.slice(i, i + 200);
          let from = 0;
          while (true) {
            const { data, error } = await supabase.from("repertory_rubric_remedies").select("rubric_id, remedy_id, grade").in("rubric_id", slice).range(from, from + PAGE_SIZE - 1);
            if (error) throw error;
            const batch = data || [];
            acc.push(...batch);
            if (batch.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
          }
        }
        if (!cancelled) setLinks(acc);
      } catch (e) {
        if (!cancelled) toast({ title: "Ошибка загрузки связей", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
      } finally {
        if (!cancelled) setLinksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase.from("repertory_rubrics").select("id, chapter_id, parent_id, name, name_ru, kent_page").or(`name.ilike.%${term}%,name_ru.ilike.%${term}%`).limit(300);
        if (error) throw error;
        if (cancelled) return;
        const rows = data || [];
        setSearchResults(rows);
        setRubricMeta((prev) => {
          const n = new Map(prev);
          rows.forEach((r) => n.set(r.id, r));
          return n;
        });
      } catch (e) {
        if (!cancelled) toast({ title: "Ошибка поиска", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);
  const remedyById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    remedies.forEach((r) => m.set(r.id, r));
    return m;
  }, [remedies]);
  function groupRubrics(rubrics) {
    const roots = [];
    const children = /* @__PURE__ */ new Map();
    rubrics.forEach((r) => {
      if (r.parent_id) {
        const arr = children.get(r.parent_id) || [];
        arr.push(r);
        children.set(r.parent_id, arr);
      } else roots.push(r);
    });
    return { roots, children };
  }
  const ranking = useMemo(() => {
    if (selected.size === 0) return [];
    const stats = /* @__PURE__ */ new Map();
    links.forEach((l) => {
      if (!selected.has(l.rubric_id)) return;
      const s = stats.get(l.remedy_id) || { sum: 0, count: 0, perRubric: /* @__PURE__ */ new Map() };
      s.sum += l.grade;
      s.count += 1;
      s.perRubric.set(l.rubric_id, l.grade);
      stats.set(l.remedy_id, s);
    });
    return Array.from(stats.entries()).map(([rid, s]) => ({ remedy: remedyById.get(rid), ...s })).filter((x) => x.remedy).sort((a, b) => b.count - a.count || b.sum - a.sum);
  }, [selected, links, remedyById]);
  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  async function handleChapterOpen(chapterId, open) {
    if (open) {
      setOpenChapter(chapterId);
      await loadChapter(chapterId);
    } else if (openChapter === chapterId) {
      setOpenChapter(null);
    }
  }
  const searchByChapter = useMemo(() => {
    if (!searchResults) return null;
    const m = /* @__PURE__ */ new Map();
    searchResults.forEach((r) => {
      const arr = m.get(r.chapter_id) || [];
      arr.push(r);
      m.set(r.chapter_id, arr);
    });
    return m;
  }, [searchResults]);
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  const totalRubrics = Array.from(chapterStats.values()).reduce((a, s) => a + s.total, 0);
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-[1400px]", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Назад к панели администратора"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-1 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "w-7 h-7 text-primary" }),
          " Реперториум Кента"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          chapters.length,
          " глав · ",
          totalRubrics.toLocaleString("ru"),
          " рубрик · ",
          remedies.length,
          " препаратов"
        ] }),
        embedTotal > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2 max-w-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground mb-1", children: [
            /* @__PURE__ */ jsx("span", { children: "Эмбеддинги рубрик" }),
            /* @__PURE__ */ jsxs("span", { className: "font-mono", children: [
              embedDone.toLocaleString("ru"),
              " / ",
              embedTotal.toLocaleString("ru"),
              " · ",
              (embedTotal ? embedDone / embedTotal * 100 : 0).toFixed(1),
              "%",
              embedStatus === "processing" && " · идёт…"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: embedTotal ? embedDone / embedTotal * 100 : 0, className: "h-1.5" }),
          embedStatus === "processing" && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] text-muted-foreground mt-1 font-mono", children: [
            /* @__PURE__ */ jsx("span", { children: embedRate > 0 ? `${(embedRate * 60).toFixed(0)} рубрик/мин` : "оценка скорости…" }),
            /* @__PURE__ */ jsx("span", { children: embedRate > 0 && embedDone < embedTotal ? (() => {
              const secs = Math.max(0, Math.round((embedTotal - embedDone) / embedRate));
              const h = Math.floor(secs / 3600);
              const m = Math.floor(secs % 3600 / 60);
              const s = secs % 60;
              return `осталось ~${h > 0 ? `${h}ч ` : ""}${m}м ${s}с`;
            })() : "" })
          ] })
        ] }),
        mmJob && mmJob.total > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2 max-w-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground mb-1", children: [
            /* @__PURE__ */ jsx("span", { children: "Materia Medica (Бёрике)" }),
            /* @__PURE__ */ jsxs("span", { className: "font-mono", children: [
              mmJob.processed,
              " / ",
              mmJob.total,
              " · ",
              mmJob.inserted,
              " разделов",
              mmJob.status === "processing" && " · импорт…"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: mmJob.total ? mmJob.processed / mmJob.total * 100 : 0, className: "h-1.5" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "gap-2", children: /* @__PURE__ */ jsxs(Link, { to: "/admin/repertory/by-complaint", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
          "Поиск по жалобам"
        ] }) }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: startEmbedding, disabled: enqueueing || embedStatus === "processing", className: "gap-2", children: [
          enqueueing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4" }),
          embedStatus === "processing" ? "Эмбеддинг идёт…" : embedDone >= embedTotal && embedTotal > 0 ? "Все рубрики эмбеддированы" : `Эмбеддировать все рубрики (осталось ${(embedTotal - embedDone).toLocaleString("ru")})`
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: startMmImport, disabled: mmStarting || (mmJob == null ? void 0 : mmJob.status) === "processing", className: "gap-2", children: [
          mmStarting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(BookMarked, { className: "w-4 h-4" }),
          "Импорт Materia Medica"
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, className: "gap-2", children: /* @__PURE__ */ jsxs(Link, { to: "/admin/translation-queue", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4" }),
          "Очередь переводов"
        ] }) }),
        selected.size > 0 && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setSelected(/* @__PURE__ */ new Set()), className: "gap-2", children: [
          /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
          "Сбросить выбор (",
          selected.size,
          ")"
        ] })
      ] })
    ] }),
    busy ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Главы и рубрики" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск по рубрикам (EN/RU)…", className: "pl-9" }),
            searching && /* @__PURE__ */ jsx(Loader2, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsx(ScrollArea, { className: "h-[calc(100vh-360px)] min-h-[400px] pr-3", children: searchResults ? searchResults.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground py-10", children: "Ничего не найдено." }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Найдено: ",
            searchResults.length,
            searchResults.length === 300 && " (показаны первые 300)"
          ] }),
          chapters.map((ch) => {
            const rows = searchByChapter == null ? void 0 : searchByChapter.get(ch.id);
            if (!rows || rows.length === 0) return null;
            return /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1", children: ch.name_ru }),
              /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: rows.map((r) => /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm", children: [
                /* @__PURE__ */ jsx(Checkbox, { checked: selected.has(r.id), onCheckedChange: () => toggle(r.id), className: "mt-0.5" }),
                /* @__PURE__ */ jsxs("span", { className: "flex-1", children: [
                  r.name_ru || r.name,
                  r.name_ru && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-2", children: r.name })
                ] })
              ] }, r.id)) })
            ] }, ch.id);
          })
        ] }) : (
          /* BROWSE MODE: chapters → lazy rubrics */
          /* @__PURE__ */ jsx("div", { className: "space-y-1", children: chapters.map((ch) => {
            const stat = chapterStats.get(ch.id);
            const total = (stat == null ? void 0 : stat.total) || 0;
            const isOpen = openChapter === ch.id;
            const isLoading = chapterLoading.has(ch.id);
            const rubrics = chapterRubrics.get(ch.id) || [];
            const { roots, children } = isOpen ? groupRubrics(rubrics) : { roots: [], children: /* @__PURE__ */ new Map() };
            return /* @__PURE__ */ jsxs(Collapsible, { open: isOpen, onOpenChange: (o) => handleChapterOpen(ch.id, o), children: [
              /* @__PURE__ */ jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/60 group", children: [
                /* @__PURE__ */ jsx(ChevronRight, { className: `w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}` }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: ch.name_ru }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-auto", children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : total.toLocaleString("ru") })
              ] }),
              /* @__PURE__ */ jsx(CollapsibleContent, { className: "pl-6 space-y-0.5 mt-1", children: isLoading && rubrics.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground py-2", children: "Загрузка…" }) : roots.map((r) => /* @__PURE__ */ jsx(
                RubricRow,
                {
                  rubric: r,
                  selected,
                  toggle,
                  children: children.get(r.id) || []
                },
                r.id
              )) })
            ] }, ch.id);
          }) })
        ) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Ранжирование препаратов" }),
            ranking.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
              ranking.length,
              " препаратов"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Сортировка: совпадения рубрик ↓, затем сумма грейдов ↓" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: selected.size === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground py-16 text-sm", children: "Отметьте одну или несколько рубрик слева — препараты автоматически ранжируются по совпадениям." }) : linksLoading && links.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-16", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ jsx(ScrollArea, { className: "h-[calc(100vh-360px)] min-h-[400px] pr-3", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mb-3 pb-3 border-b", children: Array.from(selected).map((id) => {
            const r = rubricMeta.get(id);
            return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1 cursor-pointer", onClick: () => toggle(id), children: [
              (r == null ? void 0 : r.name_ru) || (r == null ? void 0 : r.name) || id.slice(0, 6),
              /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
            ] }, id);
          }) }),
          ranking.map((row, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground w-6 text-right", children: [
              i + 1,
              "."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-sm truncate", children: row.remedy.name_latin }),
              row.remedy.name_ru && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: row.remedy.name_ru })
            ] }),
            /* @__PURE__ */ jsxs(Tooltip, { children: [
              /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 cursor-help", children: [
                /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "font-mono text-xs", children: [
                  row.count,
                  "/",
                  selected.size
                ] }),
                /* @__PURE__ */ jsxs(Badge, { className: "font-mono text-xs", children: [
                  "Σ ",
                  row.sum
                ] })
              ] }) }),
              /* @__PURE__ */ jsx(TooltipContent, { side: "left", className: "max-w-xs", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: Array.from(row.perRubric.entries()).map(([rid, g]) => {
                const r = rubricMeta.get(rid);
                return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 text-xs", children: [
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: (r == null ? void 0 : r.name_ru) || (r == null ? void 0 : r.name) || "—" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-mono font-semibold", children: [
                    "grade ",
                    g
                  ] })
                ] }, rid);
              }) }) })
            ] })
          ] }, row.remedy.id))
        ] }) }) })
      ] })
    ] })
  ] }) }) });
}
function RubricRow({ rubric, children, selected, toggle }) {
  const [open, setOpen] = useState(false);
  const hasChildren = children.length > 0;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1", children: [
      hasChildren ? /* @__PURE__ */ jsx("button", { onClick: () => setOpen((o) => !o), className: "mt-1 text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsx(ChevronRight, { className: `w-3 h-3 transition-transform ${open ? "rotate-90" : ""}` }) }) : /* @__PURE__ */ jsx("span", { className: "w-3 mt-1" }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm flex-1", children: [
        /* @__PURE__ */ jsx(Checkbox, { checked: selected.has(rubric.id), onCheckedChange: () => toggle(rubric.id), className: "mt-0.5" }),
        /* @__PURE__ */ jsxs("span", { className: "flex-1", children: [
          rubric.name_ru || rubric.name,
          rubric.name_ru && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-2", children: rubric.name })
        ] }),
        hasChildren && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: children.length })
      ] })
    ] }),
    open && hasChildren && /* @__PURE__ */ jsx("div", { className: "pl-6 space-y-0.5", children: children.map((c) => /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm", children: [
      /* @__PURE__ */ jsx(Checkbox, { checked: selected.has(c.id), onCheckedChange: () => toggle(c.id), className: "mt-0.5" }),
      /* @__PURE__ */ jsxs("span", { className: "flex-1 text-muted-foreground", children: [
        c.name_ru || c.name,
        c.name_ru && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground/70 ml-2", children: c.name })
      ] })
    ] }, c.id)) })
  ] });
}
export {
  AdminRepertory as default
};
