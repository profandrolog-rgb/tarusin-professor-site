import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, B as Button, C as Card, c as CardHeader, d as CardTitle, a as CardContent, b as Badge, s as supabase } from "../main.mjs";
import { P as Progress } from "./progress-Y5q1JT93.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-0irROHuF.js";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
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
import "@radix-ui/react-progress";
function AdminTranslationQueue() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [chapters, setChapters] = useState({});
  const [stats, setStats] = useState([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);
  const load = async () => {
    setRefreshing(true);
    const [bRes, cRes, rRes] = await Promise.all([
      supabase.from("translation_batches").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("repertory_chapters").select("id,name_en,name_ru").order("ord"),
      supabase.from("repertory_rubrics").select("chapter_id,name_ru")
    ]);
    const ch = {};
    (cRes.data || []).forEach((c) => {
      ch[c.id] = c;
    });
    setChapters(ch);
    setBatches(bRes.data || []);
    const totals = {};
    (rRes.data || []).forEach((r) => {
      const k = r.chapter_id;
      if (!totals[k]) totals[k] = { total: 0, translated: 0 };
      totals[k].total += 1;
      if (r.name_ru && r.name_ru.trim()) totals[k].translated += 1;
    });
    const s = (cRes.data || []).map((c) => {
      var _a, _b;
      return {
        id: c.id,
        name_en: c.name_en,
        name_ru: c.name_ru,
        total: ((_a = totals[c.id]) == null ? void 0 : _a.total) || 0,
        translated: ((_b = totals[c.id]) == null ? void 0 : _b.translated) || 0
      };
    }).filter((x) => x.total > 0);
    setStats(s);
    setBusy(false);
    setRefreshing(false);
  };
  useEffect(() => {
    if (!user || !isAdmin) return;
    load();
    const t = setInterval(load, 1e4);
    return () => clearInterval(t);
  }, [user, isAdmin]);
  if (loading || busy) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin h-8 w-8" }) });
  }
  const activeBatches = batches.filter((b) => b.status === "processing" || b.status === "queued");
  const statusVariant = (s) => {
    if (s === "all_done" || s === "completed" || s === "done") return "default";
    if (s === "processing" || s === "queued") return "secondary";
    if (s === "failed" || s === "error") return "destructive";
    return "outline";
  };
  const startParallel = async () => {
    setRefreshing(true);
    const { data, error } = await supabase.functions.invoke("translate-queue-runner", {
      body: { parallelism: 3 }
    });
    setRefreshing(false);
    if (error) console.error(error);
    else console.log("runner:", data);
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto p-6 max-w-7xl space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
          "Админка"
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Очередь переводов реперториума" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "default", onClick: startParallel, disabled: refreshing, children: "Запустить × 3" }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: load, disabled: refreshing, children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}` }),
          "Обновить"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
        "Активные батчи (",
        activeBatches.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: activeBatches.length ? /* @__PURE__ */ jsx("div", { className: "space-y-4", children: activeBatches.map((active) => {
        const activeChapter = active.chapter_id ? chapters[active.chapter_id] : null;
        const pct = active.total_rubrics ? 100 * (active.processed_rubrics || 0) / active.total_rubrics : 0;
        return /* @__PURE__ */ jsxs("div", { className: "space-y-2 pb-3 border-b last:border-0 last:pb-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx(Badge, { variant: statusVariant(active.status), children: active.status }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: (activeChapter == null ? void 0 : activeChapter.name_ru) || (activeChapter == null ? void 0 : activeChapter.name_en) || "—" }),
            active.model && /* @__PURE__ */ jsx(Badge, { variant: "outline", children: active.model })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                active.processed_rubrics || 0,
                " / ",
                active.total_rubrics || 0,
                " рубрик"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                Math.round(pct),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsx(Progress, { value: pct })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Обновлено: ",
            new Date(active.updated_at).toLocaleString("ru-RU")
          ] })
        ] }, active.id);
      }) }) : /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Нет активных батчей. Cron-watchdog запустит до 3 параллельных в течение часа, либо нажмите «Запустить × 3»." }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Главы — прогресс перевода" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Глава" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-32 text-right", children: "Переведено" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-32 text-right", children: "Всего" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-48", children: "Прогресс" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: stats.map((s) => {
          const pct = s.total ? Math.round(100 * s.translated / s.total) : 0;
          return /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxs(TableCell, { children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: s.name_en }),
              s.name_ru && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: s.name_ru })
            ] }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right tabular-nums", children: s.translated }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right tabular-nums", children: s.total }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Progress, { value: pct, className: "flex-1" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs w-10 text-right", children: [
                pct,
                "%"
              ] })
            ] }) })
          ] }, s.id);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "История батчей (последние 50)" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Создан" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Глава" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Статус" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Модель" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Рубрики" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Ошибка" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: batches.map((b) => {
          const c = b.chapter_id ? chapters[b.chapter_id] : null;
          return /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs whitespace-nowrap", children: new Date(b.created_at).toLocaleString("ru-RU") }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: (c == null ? void 0 : c.name_ru) || (c == null ? void 0 : c.name_en) || "—" }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: statusVariant(b.status), children: b.status }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs", children: b.model || "—" }),
            /* @__PURE__ */ jsxs(TableCell, { className: "text-right tabular-nums text-sm", children: [
              b.processed_rubrics || 0,
              " / ",
              b.total_rubrics || 0
            ] }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-destructive max-w-xs truncate", title: b.error || "", children: b.error || "" })
          ] }, b.id);
        }) })
      ] }) })
    ] })
  ] });
}
export {
  AdminTranslationQueue as default
};
