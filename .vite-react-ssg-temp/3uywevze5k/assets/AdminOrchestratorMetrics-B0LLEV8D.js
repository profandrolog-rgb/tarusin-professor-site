import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { B as Button, C as Card, c as CardHeader, d as CardTitle, a as CardContent, Y as Skeleton, b as Badge, s as supabase } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { RefreshCw } from "lucide-react";
import "vite-react-ssg";
import "react-router-dom";
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
const WINDOWS = {
  "1ч": 1,
  "6ч": 6,
  "24ч": 24,
  "7д": 24 * 7,
  "30д": 24 * 30
};
function AdminOrchestratorMetrics() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [windowKey, setWindowKey] = useState("24ч");
  async function load() {
    setLoading(true);
    const sinceIso = new Date(Date.now() - WINDOWS[windowKey] * 3600 * 1e3).toISOString();
    const { data, error } = await supabase.from("orchestrator_call_metrics").select("*").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(2e3);
    if (error) console.error(error);
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [windowKey]);
  const agg = useMemo(() => {
    var _a;
    const perModel = {};
    for (const r of rows) {
      const a = perModel[_a = r.model] ?? (perModel[_a] = {
        model: r.model,
        calls: 0,
        attempts: 0,
        failedAttempts: 0,
        finalFailures: 0,
        avgAttempts: 0,
        avgDurationMs: 0,
        p95DurationMs: 0,
        kinds: {}
      });
      a.attempts += 1;
      if (!r.ok) {
        a.failedAttempts += 1;
        const k = r.error_kind || "other";
        a.kinds[k] = (a.kinds[k] ?? 0) + 1;
      }
    }
    const bySeries = /* @__PURE__ */ new Map();
    for (const r of [...rows].reverse()) {
      const key = `${r.model}::${r.purpose}`;
      const arr = bySeries.get(key) ?? [];
      arr.push(r);
      bySeries.set(key, arr);
    }
    for (const [key, arr] of bySeries) {
      const model = key.split("::")[0];
      const a = perModel[model];
      if (!a) continue;
      let chain = [];
      const finalizeChain = () => {
        if (!chain.length) return;
        a.calls += 1;
        const last = chain[chain.length - 1];
        if (!last.ok) a.finalFailures += 1;
        chain = [];
      };
      for (let i = 0; i < arr.length; i++) {
        const cur = arr[i];
        const prev = arr[i - 1];
        if (prev) {
          const gap = new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
          if (cur.attempt <= prev.attempt || gap > 12e4 || prev.ok) {
            finalizeChain();
          }
        }
        chain.push(cur);
        if (cur.ok || cur.attempt >= 3) finalizeChain();
      }
      finalizeChain();
    }
    const list = Object.values(perModel).map((a) => {
      const durations = rows.filter((r) => r.model === a.model).map((r) => r.duration_ms).sort((x, y) => x - y);
      a.avgDurationMs = durations.length ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length) : 0;
      a.p95DurationMs = durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))] : 0;
      a.avgAttempts = a.calls ? +(a.attempts / a.calls).toFixed(2) : 0;
      return a;
    });
    list.sort((a, b) => b.finalFailures - a.finalFailures || b.failedAttempts - a.failedAttempts);
    return list;
  }, [rows]);
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Метрики оркестратора" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Каждая строка — одна попытка вызова модели. Ретрай = отдельная запись с бóльшим номером attempt." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Select, { value: windowKey, onValueChange: setWindowKey, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-24", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: Object.keys(WINDOWS).map((k) => /* @__PURE__ */ jsx(SelectItem, { value: k, children: k }, k)) })
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: load, children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
          " Обновить"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Сводка по моделям" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: loading ? /* @__PURE__ */ jsx(Skeleton, { className: "h-40 w-full" }) : agg.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-muted-foreground text-sm", children: "Нет данных за выбранный период." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Модель" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Вызовов" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Fail rate" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Попыток" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Ø попыток" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Ø длит." }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "p95 длит." }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Ошибки" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: agg.map((a) => {
          const failRate = a.calls ? Math.round(a.finalFailures / a.calls * 100) : 0;
          return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 font-mono text-xs", children: a.model }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4", children: a.calls }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4", children: /* @__PURE__ */ jsxs(Badge, { variant: failRate > 30 ? "destructive" : failRate > 10 ? "secondary" : "outline", children: [
              failRate,
              "% (",
              a.finalFailures,
              "/",
              a.calls,
              ")"
            ] }) }),
            /* @__PURE__ */ jsxs("td", { className: "py-2 pr-4", children: [
              a.attempts,
              " (",
              a.failedAttempts,
              " fail)"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4", children: a.avgAttempts }),
            /* @__PURE__ */ jsxs("td", { className: "py-2 pr-4", children: [
              (a.avgDurationMs / 1e3).toFixed(1),
              "s"
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "py-2 pr-4", children: [
              (a.p95DurationMs / 1e3).toFixed(1),
              "s"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: Object.entries(a.kinds).sort((x, y) => y[1] - x[1]).map(([k, n]) => /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
              k,
              ": ",
              n
            ] }, k)) }) })
          ] }, a.model);
        }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Последние 200 попыток" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: loading ? /* @__PURE__ */ jsx(Skeleton, { className: "h-40 w-full" }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Время" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Модель" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Задача" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "#" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Длит." }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Статус" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Ошибка" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: rows.slice(0, 200).map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0", children: [
          /* @__PURE__ */ jsx("td", { className: "py-1 pr-3 whitespace-nowrap text-muted-foreground", children: new Date(r.created_at).toLocaleString("ru-RU") }),
          /* @__PURE__ */ jsx("td", { className: "py-1 pr-3 font-mono", children: r.model }),
          /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: r.purpose }),
          /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: r.attempt }),
          /* @__PURE__ */ jsxs("td", { className: "py-1 pr-3", children: [
            (r.duration_ms / 1e3).toFixed(1),
            "s"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: r.ok ? /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "ok" }) : /* @__PURE__ */ jsx(Badge, { variant: "destructive", children: r.error_kind || "fail" }) }),
          /* @__PURE__ */ jsx("td", { className: "py-1 pr-3 max-w-[420px] truncate text-muted-foreground", children: r.error_message || "" })
        ] }, r.id)) })
      ] }) }) })
    ] })
  ] });
}
export {
  AdminOrchestratorMetrics as default
};
