import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { s as supabase, L as Label, I as Input, B as Button, C as Card, c as CardHeader, d as CardTitle, a as CardContent, b as Badge, u as useAuth } from "../main.mjs";
import { Helmet } from "react-helmet-async";
import { Download, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-0irROHuF.js";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { f as fileSaver } from "./FileSaver.min-DtJWvt7f.js";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
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
import "@radix-ui/react-select";
const CACHE_TTL_MS = 60 * 60 * 1e3;
function hashFilters(f) {
  const raw = JSON.stringify([f.from, f.to, f.status, f.doctor]);
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = (h << 5) + h + raw.charCodeAt(i) | 0;
  return (h >>> 0).toString(36);
}
const RPC_MAP = {
  top_catalog: "analytics_top_catalog",
  top_templates: "analytics_top_templates",
  cost_by_tag: "analytics_avg_cost_by_tag",
  plans_per_month: "analytics_plans_per_month",
  duration_histogram: "analytics_duration_histogram",
  section_usage: "analytics_section_usage"
};
function useAnalyticsSection(section, filters) {
  const cacheKey = `${section}:${hashFilters(filters)}`;
  return useQuery({
    queryKey: ["analytics", section, filters],
    queryFn: async () => {
      const { data: cached } = await supabase.from("analytics_cache").select("payload, computed_at").eq("cache_key", cacheKey).maybeSingle();
      if (cached && Date.now() - new Date(cached.computed_at).getTime() < CACHE_TTL_MS) {
        return cached.payload;
      }
      const rpcName = RPC_MAP[section];
      const { data, error } = await supabase.rpc(rpcName, {
        _from: filters.from,
        _to: filters.to,
        _status: filters.status,
        _doctor: filters.doctor
      });
      if (error) throw error;
      await supabase.from("analytics_cache").upsert({
        cache_key: cacheKey,
        payload: data,
        computed_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      return data;
    },
    staleTime: CACHE_TTL_MS
  });
}
function useDoctorsList() {
  return useQuery({
    queryKey: ["analytics-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("analytics_doctors_list");
      if (error) throw error;
      return data ?? [];
    }
  });
}
function todayStr() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function daysAgoStr(d) {
  const dt = /* @__PURE__ */ new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().slice(0, 10);
}
function applyPeriod(period, custom) {
  if (period === "all") return { from: null, to: null };
  if (period === "custom") return { from: null, to: null };
  return { from: daysAgoStr(Number(period)), to: todayStr() };
}
function FiltersBar({ filters, setFilters, period, setPeriod, onExport }) {
  const { data: doctors } = useDoctorsList();
  const updatePeriod = (p) => {
    setPeriod(p);
    if (p !== "custom") {
      const { from, to } = applyPeriod(p);
      setFilters({ ...filters, from, to });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-3 p-4 bg-card border rounded-lg", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Период" }),
      /* @__PURE__ */ jsxs(Select, { value: period, onValueChange: (v) => updatePeriod(v), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[160px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "30", children: "Последние 30 дней" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "90", children: "Последние 90 дней" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "365", children: "Последний год" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Всё время" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "custom", children: "Произвольный" })
        ] })
      ] })
    ] }),
    period === "custom" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "С" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: filters.from ?? "", onChange: (e) => setFilters({ ...filters, from: e.target.value || null }), className: "w-[150px]" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "По" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: filters.to ?? "", onChange: (e) => setFilters({ ...filters, to: e.target.value || null }), className: "w-[150px]" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Статус" }),
      /* @__PURE__ */ jsxs(Select, { value: filters.status, onValueChange: (v) => setFilters({ ...filters, status: v }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[140px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "issued", children: "Выданные" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все" })
        ] })
      ] })
    ] }),
    ((doctors == null ? void 0 : doctors.length) ?? 0) > 1 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Врач" }),
      /* @__PURE__ */ jsxs(Select, { value: filters.doctor, onValueChange: (v) => setFilters({ ...filters, doctor: v }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[220px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все врачи" }),
          doctors.map((d) => /* @__PURE__ */ jsxs(SelectItem, { value: d.id, children: [
            d.email,
            " (",
            d.plans_count,
            ")"
          ] }, d.id))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: onExport, children: [
      /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-2" }),
      "Экспорт CSV"
    ] }) })
  ] });
}
function TopCatalogTable({ filters }) {
  const { data, isLoading } = useAnalyticsSection("top_catalog", filters);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "ТОП-20 позиций каталога" }) }),
    /* @__PURE__ */ jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto" }) : /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "w-12", children: "#" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Название" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Секция" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Применений" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "% листов" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        (data ?? []).map((r) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: r.rank }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: r.name }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground", children: r.section }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: r.usage_count }),
          /* @__PURE__ */ jsxs(TableCell, { className: "text-right", children: [
            r.pct_of_plans,
            "%"
          ] })
        ] }, r.rank)),
        (data ?? []).length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "text-center text-muted-foreground", children: "Нет данных" }) })
      ] })
    ] }) })
  ] });
}
function TopTemplatesTable({ filters }) {
  const { data, isLoading } = useAnalyticsSection("top_templates", filters);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "ТОП-10 шаблонов" }) }),
    /* @__PURE__ */ jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto" }) : /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "w-12", children: "#" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Название" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Применений" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Ср. длит-сть, дн" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Ср. стоимость, ₽" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        (data ?? []).map((r) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: r.rank }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: r.name }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: r.usage_count }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: r.avg_duration_days ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: r.avg_cost ? Number(r.avg_cost).toLocaleString("ru-RU") : "—" })
        ] }, r.rank)),
        (data ?? []).length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "text-center text-muted-foreground", children: "Нет данных" }) })
      ] })
    ] }) })
  ] });
}
function CostByTagChart({ filters }) {
  const { data, isLoading } = useAnalyticsSection("cost_by_tag", filters);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Средняя стоимость курса по тегам" }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "h-[300px]", children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: data ?? [], margin: { top: 8, right: 8, bottom: 40, left: 8 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
      /* @__PURE__ */ jsx(XAxis, { dataKey: "tag", angle: -30, textAnchor: "end", interval: 0, className: "text-xs" }),
      /* @__PURE__ */ jsx(YAxis, { className: "text-xs" }),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          formatter: (v) => [`${Number(v).toLocaleString("ru-RU")} ₽`, "Ср. стоимость"],
          contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
        }
      ),
      /* @__PURE__ */ jsx(Bar, { dataKey: "avg_cost", fill: "hsl(var(--primary))", radius: [4, 4, 0, 0] })
    ] }) }) })
  ] });
}
function PlansPerMonthChart({ filters }) {
  const { data, isLoading } = useAnalyticsSection("plans_per_month", filters);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Динамика по месяцам (12 мес)" }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "h-[300px]", children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: data ?? [], margin: { top: 8, right: 8, bottom: 8, left: 8 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
      /* @__PURE__ */ jsx(XAxis, { dataKey: "month", className: "text-xs" }),
      /* @__PURE__ */ jsx(YAxis, { allowDecimals: false, className: "text-xs" }),
      /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" } }),
      /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "count", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: true })
    ] }) }) })
  ] });
}
function DurationHistogram({ filters }) {
  const { data, isLoading } = useAnalyticsSection("duration_histogram", filters);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Распределение длительности (дни)" }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "h-[300px]", children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: data ?? [], margin: { top: 8, right: 8, bottom: 8, left: 8 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
      /* @__PURE__ */ jsx(XAxis, { dataKey: "bucket", className: "text-xs" }),
      /* @__PURE__ */ jsx(YAxis, { allowDecimals: false, className: "text-xs" }),
      /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" } }),
      /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "hsl(var(--accent))", radius: [4, 4, 0, 0] })
    ] }) }) })
  ] });
}
const COLORS$1 = [
  "hsl(210, 80%, 55%)",
  "hsl(25, 85%, 55%)",
  "hsl(140, 60%, 45%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(190, 70%, 50%)",
  "hsl(45, 85%, 55%)",
  "hsl(320, 60%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(260, 60%, 60%)",
  "hsl(15, 75%, 55%)",
  "hsl(200, 70%, 60%)",
  "hsl(100, 50%, 50%)"
];
const SECTION_LABELS = {
  iv_drip: "в/в кап.",
  iv_bolus: "в/в стр.",
  im: "в/м",
  sc: "п/к",
  oral_rx: "Перорал.Rx",
  oral_supplement: "Перорал. БАД",
  rectal: "Ректально",
  topical: "Топически",
  nasal: "Назально",
  sublingual: "Сублингв.",
  peptide: "Пептиды",
  procedure: "Процедуры",
  lifestyle: "Образ жизни"
};
function SectionUsagePie({ filters }) {
  const { data, isLoading } = useAnalyticsSection("section_usage", filters);
  const chartData = (data ?? []).map((r) => ({ ...r, label: SECTION_LABELS[r.section] ?? r.section }));
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Использование секций" }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "h-[300px]", children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
      /* @__PURE__ */ jsx(Pie, { data: chartData, dataKey: "count", nameKey: "label", cx: "40%", cy: "50%", outerRadius: 90, label: (e) => `${e.pct}%`, children: chartData.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: COLORS$1[i % COLORS$1.length] }, i)) }),
      /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" } }),
      /* @__PURE__ */ jsx(Legend, { layout: "vertical", align: "right", verticalAlign: "middle", wrapperStyle: { fontSize: 12 } })
    ] }) }) })
  ] });
}
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444"];
function Section({ title, children, loading }) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: title }) }),
    /* @__PURE__ */ jsx(CardContent, { children: loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin" }) }) : children })
  ] });
}
function IrtAnalyticsSection({ filters }) {
  var _a, _b, _c, _d, _e, _f, _g;
  const qc = useQueryClient();
  const dash = useQuery({
    queryKey: ["irt-dashboard", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("analytics_irt_dashboard", {
        _from: filters.from,
        _to: filters.to,
        _status: filters.status,
        _doctor: filters.doctor
      });
      if (error) throw error;
      return data ?? {};
    },
    staleTime: 60 * 60 * 1e3
  });
  const loading = dash.isLoading;
  const d = dash.data ?? {};
  const protocols = { isLoading: loading, data: d.protocols ?? [] };
  const points = { isLoading: loading, data: d.points ?? [] };
  const meridians = { isLoading: loading, data: d.meridians ?? [] };
  const modality = { isLoading: loading, data: d.modality ?? [] };
  const perMonth = { isLoading: loading, data: d.per_month ?? [] };
  const nosology = { isLoading: loading, data: d.nosology ?? [] };
  const last12 = { isLoading: loading, data: d.last_12m ?? [] };
  const meridianTrendsRaw = d.meridian_trends ?? [];
  const compare = d.compare ?? null;
  const cacheStatus = d._cache;
  const meridianTrendData = (() => {
    const map = /* @__PURE__ */ new Map();
    const codes = /* @__PURE__ */ new Set();
    for (const row of meridianTrendsRaw) {
      codes.add(row.meridian_code);
      if (!map.has(row.month)) map.set(row.month, { month: row.month });
      map.get(row.month)[row.meridian_code] = Number(row.points_count) || 0;
    }
    const data = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    const totals = Array.from(codes).map((c) => ({ c, sum: data.reduce((s, r) => s + (r[c] || 0), 0) }));
    const top = totals.sort((a, b) => b.sum - a.sum).slice(0, 6).map((x) => x.c);
    return { data, codes: top };
  })();
  const renderDelta = (cur, prev) => {
    const diff = cur - prev;
    const pct = prev > 0 ? Math.round(diff / prev * 100) : cur > 0 ? 100 : 0;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground";
    return /* @__PURE__ */ jsxs("span", { className: `text-xs ${cls}`, children: [
      sign,
      diff,
      " (",
      sign,
      pct,
      "%)"
    ] });
  };
  const handleRefresh = async () => {
    const { error } = await supabase.from("analytics_cache").delete().like("cache_key", "irt_dashboard:%");
    if (error) {
      toast.error("Не удалось сбросить кэш");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["irt-dashboard"] });
    toast.success("Кэш ИРТ-аналитики сброшен");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "🪡 Аналитика ИРТ" }),
      /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "иглорефлексотерапия" }),
      cacheStatus && /* @__PURE__ */ jsxs(Badge, { variant: cacheStatus === "hit" ? "default" : "secondary", className: "text-[10px]", children: [
        "cache: ",
        cacheStatus
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "ml-auto gap-1 h-7", onClick: handleRefresh, disabled: dash.isFetching, children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 ${dash.isFetching ? "animate-spin" : ""}` }),
        "Пересчитать"
      ] })
    ] }),
    compare && /* @__PURE__ */ jsx(Section, { title: "Сравнение с предыдущим периодом", loading, children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
      ["Планов с ИРТ", "plans"],
      ["Точек назначено", "points"],
      ["Уникальных протоколов", "protocols"]
    ].map(([label, key]) => {
      var _a2, _b2, _c2, _d2;
      const cur = Number(((_a2 = compare.current) == null ? void 0 : _a2[key]) ?? 0);
      const prev = Number(((_b2 = compare.previous) == null ? void 0 : _b2[key]) ?? 0);
      return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xl font-semibold font-mono", children: cur }),
          renderDelta(cur, prev)
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground mt-1", children: [
          "Пред. период: ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: prev }),
          " (",
          (_c2 = compare.previous) == null ? void 0 : _c2.from,
          " — ",
          (_d2 = compare.previous) == null ? void 0 : _d2.to,
          ")"
        ] })
      ] }, key);
    }) }) }),
    /* @__PURE__ */ jsx(Section, { title: "ТОП-10 протоколов ИРТ", loading: protocols.isLoading, children: (((_a = protocols.data) == null ? void 0 : _a.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных за выбранный период" }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-muted-foreground border-b", children: [
        /* @__PURE__ */ jsx("th", { className: "py-2", children: "Протокол" }),
        /* @__PURE__ */ jsx("th", { className: "py-2", children: "Тип" }),
        /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Использований" }),
        /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "В планах" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: protocols.data.map((p) => /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
        /* @__PURE__ */ jsx("td", { className: "py-2", children: p.name }),
        /* @__PURE__ */ jsx("td", { className: "py-2", children: /* @__PURE__ */ jsx(Badge, { variant: p.is_template ? "default" : "secondary", children: p.is_template ? "Встроенный" : "Пользовательский" }) }),
        /* @__PURE__ */ jsx("td", { className: "py-2 text-right font-mono", children: p.usage_count }),
        /* @__PURE__ */ jsx("td", { className: "py-2 text-right font-mono", children: p.plans_count })
      ] }, p.protocol_id)) })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(Section, { title: "ТОП-15 точек акупунктуры", loading: points.isLoading, children: (((_b = points.data) == null ? void 0 : _b.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 360, children: /* @__PURE__ */ jsxs(BarChart, { data: points.data, layout: "vertical", margin: { left: 60 }, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { type: "number" }),
        /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "who_code", width: 70 }),
        /* @__PURE__ */ jsx(Tooltip, { formatter: (v, _n, p) => {
          var _a2, _b2;
          return [v, ((_a2 = p.payload) == null ? void 0 : _a2.name_ru) || ((_b2 = p.payload) == null ? void 0 : _b2.who_code)];
        } }),
        /* @__PURE__ */ jsx(Bar, { dataKey: "usage_count", fill: "hsl(var(--primary))" })
      ] }) }) }),
      /* @__PURE__ */ jsx(Section, { title: "Распределение по меридианам", loading: meridians.isLoading, children: (((_c = meridians.data) == null ? void 0 : _c.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 360, children: /* @__PURE__ */ jsxs(PieChart, { children: [
        /* @__PURE__ */ jsx(Pie, { data: meridians.data, dataKey: "points_count", nameKey: "meridian_name", cx: "50%", cy: "50%", outerRadius: 120, label: (e) => `${e.meridian_code}: ${e.points_count}`, children: meridians.data.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: COLORS[i % COLORS.length] }, i)) }),
        /* @__PURE__ */ jsx(Tooltip, {})
      ] }) }) }),
      /* @__PURE__ */ jsx(Section, { title: "ЭАП / Мокса / Классическая ИРТ", loading: modality.isLoading, children: (((_d = modality.data) == null ? void 0 : _d.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 280, children: /* @__PURE__ */ jsxs(BarChart, { data: modality.data, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "modality", tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsx(YAxis, {}),
        /* @__PURE__ */ jsx(Tooltip, {}),
        /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "hsl(var(--accent))" })
      ] }) }) }),
      /* @__PURE__ */ jsx(Section, { title: "Динамика ИРТ-планов по месяцам", loading: perMonth.isLoading, children: (((_e = perMonth.data) == null ? void 0 : _e.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 280, children: /* @__PURE__ */ jsxs(LineChart, { data: perMonth.data, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "month" }),
        /* @__PURE__ */ jsx(YAxis, {}),
        /* @__PURE__ */ jsx(Tooltip, {}),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "plans_count", stroke: "hsl(var(--primary))", strokeWidth: 2, name: "Планов с ИРТ" })
      ] }) }) }),
      /* @__PURE__ */ jsx(Section, { title: "Фиксированный 12-месячный тренд ИРТ", loading, children: (((_f = last12.data) == null ? void 0 : _f.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 280, children: /* @__PURE__ */ jsxs(LineChart, { data: last12.data, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "month", tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsx(YAxis, { allowDecimals: false }),
        /* @__PURE__ */ jsx(Tooltip, {}),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "plans_count", stroke: "hsl(var(--accent))", strokeWidth: 2, name: "Планов с ИРТ (12 мес.)", dot: true })
      ] }) }) }),
      /* @__PURE__ */ jsx(Section, { title: "Тренды по меридианам (ТОП-6)", loading, children: meridianTrendData.data.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 280, children: /* @__PURE__ */ jsxs(LineChart, { data: meridianTrendData.data, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "month", tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsx(YAxis, { allowDecimals: false }),
        /* @__PURE__ */ jsx(Tooltip, {}),
        /* @__PURE__ */ jsx(Legend, {}),
        meridianTrendData.codes.map((c, i) => /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: c, stroke: COLORS[i % COLORS.length], strokeWidth: 2, name: c, dot: false }, c))
      ] }) }) }),
      /* @__PURE__ */ jsx(Section, { title: "Распределение по нозологиям (теги протоколов)", loading: nosology.isLoading, children: (((_g = nosology.data) == null ? void 0 : _g.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет данных" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 280, children: /* @__PURE__ */ jsxs(BarChart, { data: nosology.data, layout: "vertical", margin: { left: 80 }, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { type: "number" }),
        /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "tag", width: 120, tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsx(Tooltip, {}),
        /* @__PURE__ */ jsx(Bar, { dataKey: "usage_count", fill: "#8b5cf6" })
      ] }) }) })
    ] })
  ] });
}
const { saveAs } = fileSaver;
function escapeCsv(v) {
  if (v === null || v === void 0) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return "(нет данных)\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(";")];
  for (const r of rows) lines.push(headers.map((h) => escapeCsv(r[h])).join(";"));
  return lines.join("\n");
}
function downloadAnalyticsCsv(filename, sections) {
  const parts = [];
  for (const s of sections) {
    parts.push(`=== ${s.title} ===`);
    parts.push(rowsToCsv(s.rows));
    parts.push("");
  }
  const blob = new Blob(["\uFEFF" + parts.join("\n")], { type: "text/csv;charset=utf-8" });
  saveAs(blob, filename);
}
function AdminAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);
  const [period, setPeriod] = useState("90");
  const initial = applyPeriod("90");
  const [filters, setFilters] = useState({
    from: initial.from,
    to: initial.to,
    status: "issued",
    doctor: "all"
  });
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (!data) {
        navigate("/");
        return;
      }
      setIsAdmin(true);
    });
  }, [user, loading, navigate]);
  const handleExport = async () => {
    const callRpc = async (name) => {
      const { data, error } = await supabase.rpc(name, {
        _from: filters.from,
        _to: filters.to,
        _status: filters.status,
        _doctor: filters.doctor
      });
      if (error) throw error;
      return data ?? [];
    };
    try {
      const [
        topCatalog,
        topTemplates,
        costByTag,
        plansPerMonth,
        duration,
        sectionUsage,
        irtProtocols,
        irtPoints,
        irtMeridians,
        irtModality,
        irtPerMonth,
        irtNosology
      ] = await Promise.all([
        callRpc("analytics_top_catalog"),
        callRpc("analytics_top_templates"),
        callRpc("analytics_avg_cost_by_tag"),
        callRpc("analytics_plans_per_month"),
        callRpc("analytics_duration_histogram"),
        callRpc("analytics_section_usage"),
        callRpc("analytics_irt_top_protocols"),
        callRpc("analytics_irt_top_points"),
        callRpc("analytics_irt_meridian_distribution"),
        callRpc("analytics_irt_modality_usage"),
        callRpc("analytics_irt_plans_per_month"),
        callRpc("analytics_irt_nosology_distribution")
      ]);
      downloadAnalyticsCsv(`analytics_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, [
        { title: "ТОП-20 позиций каталога", rows: topCatalog },
        { title: "ТОП-10 шаблонов", rows: topTemplates },
        { title: "Средняя стоимость по тегам", rows: costByTag },
        { title: "Динамика по месяцам", rows: plansPerMonth },
        { title: "Распределение длительности", rows: duration },
        { title: "Использование секций", rows: sectionUsage },
        { title: "ИРТ: ТОП-10 протоколов", rows: irtProtocols },
        { title: "ИРТ: ТОП-15 точек", rows: irtPoints },
        { title: "ИРТ: распределение по меридианам", rows: irtMeridians },
        { title: "ИРТ: ЭАП / Мокса / Классика", rows: irtModality },
        { title: "ИРТ: динамика по месяцам", rows: irtPerMonth },
        { title: "ИРТ: распределение по нозологиям", rows: irtNosology }
      ]);
      toast.success("CSV выгружен");
    } catch (e) {
      toast.error("Не удалось выгрузить CSV", { description: e == null ? void 0 : e.message });
    }
  };
  if (loading || isAdmin === null) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: "Аналитика — Админ" }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto py-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate("/admin"), children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
          "Назад в админку"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "📊 Аналитика лечебных листов" }),
        /* @__PURE__ */ jsx("div", { className: "w-32" })
      ] }),
      /* @__PURE__ */ jsx(
        FiltersBar,
        {
          filters,
          setFilters,
          period,
          setPeriod,
          onExport: handleExport
        }
      ),
      /* @__PURE__ */ jsx(TopCatalogTable, { filters }),
      /* @__PURE__ */ jsx(TopTemplatesTable, { filters }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsx(CostByTagChart, { filters }),
        /* @__PURE__ */ jsx(SectionUsagePie, { filters }),
        /* @__PURE__ */ jsx(PlansPerMonthChart, { filters }),
        /* @__PURE__ */ jsx(DurationHistogram, { filters })
      ] }),
      /* @__PURE__ */ jsx(IrtAnalyticsSection, { filters })
    ] })
  ] });
}
export {
  AdminAnalytics as default
};
