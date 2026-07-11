import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { u as useAuth, C as Card, a as CardContent, L as Label, I as Input, B as Button, c as CardHeader, d as CardTitle, b as Badge, s as supabase } from "../main.mjs";
import { useNavigate } from "react-router-dom";
import { Loader2, FlaskConical, RefreshCw, Download } from "lucide-react";
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
function AdminMetabolicCohort() {
  var _a;
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [icd10, setIcd10] = useState("");
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);
  const run = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("cohort_pathway_stats", {
        _age_min: ageMin ? Number(ageMin) : null,
        _age_max: ageMax ? Number(ageMax) : null,
        _icd10: icd10.trim() || null,
        _sex: null
      });
      if (error) throw error;
      setRows(data || []);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (isAdmin) run();
  }, [isAdmin]);
  const totalPatients = ((_a = rows[0]) == null ? void 0 : _a.patients_total) ?? 0;
  const csv = useMemo(() => {
    const head = ["pathway_slug", "pathway_name", "patients_total", "patients_affected", "severity_mild", "severity_moderate", "severity_severe"];
    const body = rows.map(
      (r) => head.map((k) => JSON.stringify(r[k] ?? "")).join(",")
    );
    return [head.join(","), ...body].join("\n");
  }, [rows]);
  const download = () => {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metabolic-cohort-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: "Когортная аналитика — метаболические пути" }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 space-y-5 max-w-6xl", children: [
      /* @__PURE__ */ jsxs("header", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FlaskConical, { className: "w-6 h-6 text-primary" }),
          "Когортная аналитика (метаболические пути)"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Агрегаты по путям в выбранной когорте пациентов. Данные обезличены." })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex flex-wrap items-end gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "w-28", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Возраст от" }),
          /* @__PURE__ */ jsx(Input, { type: "number", value: ageMin, onChange: (e) => setAgeMin(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-28", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "до" }),
          /* @__PURE__ */ jsx(Input, { type: "number", value: ageMax, onChange: (e) => setAgeMax(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[180px]", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Диагноз (ICD-10 префикс)" }),
          /* @__PURE__ */ jsx(Input, { value: icd10, onChange: (e) => setIcd10(e.target.value), placeholder: "напр. E22" })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: run, disabled: busy, className: "gap-2", children: [
          busy ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
          "Пересчитать"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: download, variant: "outline", className: "gap-2", disabled: rows.length === 0, children: [
          /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
          "CSV"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          "Результаты",
          /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
            "пациентов в когорте: ",
            totalPatients
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: rows.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic", children: "Нет данных для выбранных фильтров." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
            /* @__PURE__ */ jsx("th", { className: "p-2", children: "Путь" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Затронуто" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "% когорты" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Лёгкое" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Умеренное" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Тяжёлое" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: rows.map((r) => {
            const pct = totalPatients ? (100 * r.patients_affected / totalPatients).toFixed(0) : "0";
            return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-b-0 hover:bg-muted/30", children: [
              /* @__PURE__ */ jsxs("td", { className: "p-2", children: [
                r.pathway_name,
                " ",
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  "(",
                  r.pathway_slug,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-medium", children: r.patients_affected }),
              /* @__PURE__ */ jsxs("td", { className: "p-2 text-right", children: [
                pct,
                "%"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-right text-blue-700", children: r.severity_mild }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-right text-amber-700", children: r.severity_moderate }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-right text-red-700", children: r.severity_severe })
            ] }, r.pathway_slug);
          }) })
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  AdminMetabolicCohort as default
};
