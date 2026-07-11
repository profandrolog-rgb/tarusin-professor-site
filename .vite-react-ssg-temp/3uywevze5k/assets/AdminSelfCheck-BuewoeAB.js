import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, C as Card, a as CardContent, c as CardHeader, d as CardTitle, b as Badge, B as Button, w as Sheet, y as SheetContent, z as SheetHeader, A as SheetTitle, s as supabase } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-0irROHuF.js";
import { Loader2, ArrowLeft, Hash, CalendarDays, BarChart3, Users, Trash2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, CartesianGrid, XAxis, YAxis, Line, BarChart, Bar } from "recharts";
import { startOfDay, subDays, isAfter, format } from "date-fns";
import { ru } from "date-fns/locale";
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
import "@radix-ui/react-select";
const LEVEL_COLORS = { low: "#22c55e", medium: "#eab308", high: "#ef4444" };
const LEVEL_LABELS = { low: "Низкий", medium: "Умеренный", high: "Высокий" };
const AdminSelfCheck = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [slugFilter, setSlugFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const PAGE_SIZE = 50;
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/self-check" } });
  }, [user, isAdmin, authLoading, navigate]);
  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from("checklist_responses").select("*").order("created_at", { ascending: false }).limit(5e3);
    if (!error && rows) setData(rows);
    setLoading(false);
  };
  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);
  const filterDate = useMemo(() => {
    if (periodFilter === "today") return startOfDay(/* @__PURE__ */ new Date());
    if (periodFilter === "7d") return subDays(/* @__PURE__ */ new Date(), 7);
    if (periodFilter === "30d") return subDays(/* @__PURE__ */ new Date(), 30);
    return null;
  }, [periodFilter]);
  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filterDate && !isAfter(new Date(r.created_at), filterDate)) return false;
      if (slugFilter !== "all" && r.checklist_slug !== slugFilter) return false;
      if (levelFilter !== "all" && r.result_level !== levelFilter) return false;
      return true;
    });
  }, [data, filterDate, slugFilter, levelFilter]);
  const uniqueSlugs = useMemo(() => [...new Set(data.map((r) => r.checklist_slug))], [data]);
  filtered.length;
  const last7 = data.filter((r) => isAfter(new Date(r.created_at), subDays(/* @__PURE__ */ new Date(), 7))).length;
  const last30 = data.filter((r) => isAfter(new Date(r.created_at), subDays(/* @__PURE__ */ new Date(), 30))).length;
  const uniqueUsers = new Set(data.filter((r) => r.anonymous_id).map((r) => r.anonymous_id)).size;
  const pieData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    filtered.forEach((r) => {
      if (counts[r.result_level] !== void 0) counts[r.result_level]++;
    });
    return Object.entries(counts).map(([k, v]) => ({ name: LEVEL_LABELS[k], value: v, fill: LEVEL_COLORS[k] }));
  }, [filtered]);
  const lineData = useMemo(() => {
    const days = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(/* @__PURE__ */ new Date(), i), "dd.MM");
      days[d] = 0;
    }
    filtered.forEach((r) => {
      const d = format(new Date(r.created_at), "dd.MM");
      if (days[d] !== void 0) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [filtered]);
  const barData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => {
      counts[r.checklist_slug] = (counts[r.checklist_slug] || 0) + 1;
    });
    return Object.entries(counts).map(([slug, count]) => ({ slug, count }));
  }, [filtered]);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const handleDelete = async (id) => {
    await supabase.from("checklist_responses").delete().eq("id", id);
    setData((prev) => prev.filter((r) => r.id !== id));
    setSelectedRow(null);
  };
  if (authLoading || loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user || !isAdmin) return null;
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      " Админ-панель"
    ] }),
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Самодиагностика — Статистика" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-8", children: "Результаты прохождений тестов" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: [
      { label: "Всего прохождений", value: data.length, icon: Hash },
      { label: "За 7 дней", value: last7, icon: CalendarDays },
      { label: "За 30 дней", value: last30, icon: BarChart3 },
      { label: "Уникальных пользователей", value: uniqueUsers, icon: Users }
    ].map((m) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsx(m.icon, { className: "w-5 h-5 text-primary" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: m.value }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: m.label })
      ] })
    ] }) }, m.label)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 mb-6", children: [
      /* @__PURE__ */ jsxs(Select, { value: periodFilter, onValueChange: (v) => {
        setPeriodFilter(v);
        setPage(0);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[160px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "today", children: "Сегодня" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "7d", children: "7 дней" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "30d", children: "30 дней" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Всё время" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: slugFilter, onValueChange: (v) => {
        setSlugFilter(v);
        setPage(0);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[200px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все чек-листы" }),
          uniqueSlugs.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s))
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: levelFilter, onValueChange: (v) => {
        setLevelFilter(v);
        setPage(0);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[160px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все уровни" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "low", children: "Низкий" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "medium", children: "Умеренный" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "high", children: "Высокий" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-6 mb-8", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Распределение по уровню" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-[200px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(Pie, { data: pieData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", innerRadius: 40, outerRadius: 70, paddingAngle: 3, children: pieData.map((e, i) => /* @__PURE__ */ jsx(Cell, { fill: e.fill }, i)) }),
          /* @__PURE__ */ jsx(Tooltip, {})
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Прохождения по дням" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-[200px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: lineData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(YAxis, { allowDecimals: false, tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "count", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: false })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "По чек-листам" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-[200px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: barData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "slug", tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(YAxis, { allowDecimals: false, tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "hsl(var(--primary))", radius: [4, 4, 0, 0] })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
        "Последние прохождения (",
        filtered.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "Дата" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Чек-лист" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Уровень" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Баллы" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Длительность" }),
            /* @__PURE__ */ jsx(TableHead, { children: "ID" })
          ] }) }),
          /* @__PURE__ */ jsxs(TableBody, { children: [
            paged.map((r) => {
              var _a;
              return /* @__PURE__ */ jsxs(TableRow, { className: "cursor-pointer hover:bg-muted/50", onClick: () => setSelectedRow(r), children: [
                /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: format(new Date(r.created_at), "dd.MM.yyyy HH:mm", { locale: ru }) }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: r.checklist_slug }),
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: "outline", style: { borderColor: LEVEL_COLORS[r.result_level], color: LEVEL_COLORS[r.result_level] }, children: LEVEL_LABELS[r.result_level] || r.result_level }) }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: r.result_score ?? "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: r.duration_sec ? `${r.duration_sec}с` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-sm font-mono text-muted-foreground", children: ((_a = r.anonymous_id) == null ? void 0 : _a.slice(0, 8)) || "—" })
              ] }, r.id);
            }),
            paged.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "text-center text-muted-foreground py-8", children: "Нет данных" }) })
          ] })
        ] }) }),
        totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-4", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", disabled: page === 0, onClick: () => setPage((p) => p - 1), children: "Назад" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "Страница ",
            page + 1,
            " из ",
            totalPages
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", disabled: page >= totalPages - 1, onClick: () => setPage((p) => p + 1), children: "Вперёд" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: !!selectedRow, onOpenChange: () => setSelectedRow(null), children: /* @__PURE__ */ jsxs(SheetContent, { className: "overflow-y-auto", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: "Детали прохождения" }) }),
      selectedRow && /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Дата:" }),
            " ",
            format(new Date(selectedRow.created_at), "dd.MM.yyyy HH:mm:ss")
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Чек-лист:" }),
            " ",
            selectedRow.checklist_slug
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Уровень:" }),
            " ",
            /* @__PURE__ */ jsx(Badge, { variant: "outline", style: { borderColor: LEVEL_COLORS[selectedRow.result_level], color: LEVEL_COLORS[selectedRow.result_level] }, children: LEVEL_LABELS[selectedRow.result_level] })
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Баллы:" }),
            " ",
            selectedRow.result_score ?? "—"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Длительность:" }),
            " ",
            selectedRow.duration_sec ? `${selectedRow.duration_sec}с` : "—"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Anonymous ID:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono text-xs", children: selectedRow.anonymous_id || "—" })
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "User Agent:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-xs break-all", children: selectedRow.user_agent || "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: "Ответы" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1", children: Object.entries(selectedRow.answers || {}).map(([q, a]) => /* @__PURE__ */ jsxs("div", { className: "text-sm p-2 rounded bg-muted/50", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              q,
              ":"
            ] }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: String(a) })
          ] }, q)) })
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "destructive", size: "sm", onClick: () => handleDelete(selectedRow.id), className: "w-full", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
          " Удалить запись"
        ] })
      ] })
    ] }) })
  ] }) });
};
export {
  AdminSelfCheck as default
};
