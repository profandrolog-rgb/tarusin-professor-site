import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { s as supabase, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, I as Input, B as Button, l as DialogFooter, t as toast, u as useAuth, C as Card, a as CardContent, n as cn, b as Badge } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { C as Calendar } from "./calendar-Cfljuh-A.js";
import { UserPlus, Search, Loader2, ArrowLeft, Database, BookOpen, MapPin, BookMarked, Plus, Download, X, CalendarIcon, Printer, FileText } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast as toast$1 } from "sonner";
import DOMPurify from "dompurify";
import "vite-react-ssg";
import "@tanstack/react-query";
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
import "react-helmet-async";
import "@radix-ui/react-select";
import "@radix-ui/react-popover";
import "react-day-picker";
function DuplicatePlanDialog({ open, onOpenChange, sourcePlanId, sourcePatientName, userId }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cloning, setCloning] = useState(false);
  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setPicked(null);
    }
  }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase.from("patients").select("id, full_name, birth_date").ilike("full_name", `%${q}%`).limit(10);
      setResults(data || []);
      setBusy(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);
  const clone = async () => {
    if (!picked) return;
    setCloning(true);
    try {
      const { data: src, error: e1 } = await supabase.from("treatment_plans").select("*").eq("id", sourcePlanId).maybeSingle();
      if (e1 || !src) throw e1 || new Error("Источник не найден");
      const newPlan = {
        patient_id: picked.id,
        issued_at: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        mode: src.mode,
        duration_days: src.duration_days,
        diagnosis_short: src.diagnosis_short,
        clinical_summary: src.clinical_summary,
        based_on_template: src.based_on_template,
        status: "draft",
        created_by: userId
      };
      const { data: created, error: e2 } = await supabase.from("treatment_plans").insert(newPlan).select("id").single();
      if (e2 || !created) throw e2 || new Error("Не удалось создать лист");
      const { data: items, error: e3 } = await supabase.from("treatment_plan_items").select("*").eq("plan_id", sourcePlanId);
      if (e3) throw e3;
      if (items && items.length) {
        const cloned = items.map((it) => {
          const { id, plan_id, created_at, ...rest } = it;
          return { ...rest, plan_id: created.id };
        });
        const { error: e4 } = await supabase.from("treatment_plan_items").insert(cloned);
        if (e4) throw e4;
      }
      toast({ title: "Лист продублирован", description: `Создан новый лист для ${picked.full_name}` });
      onOpenChange(false);
      navigate(`/admin/treatment-plans/${created.id}`);
    } catch (e) {
      toast({ title: "Ошибка", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setCloning(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (v) => {
    if (!cloning) onOpenChange(v);
  }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(UserPlus, { className: "w-5 h-5" }),
        "Дублировать на другого пациента"
      ] }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        sourcePatientName ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "Исходный лист: ",
          /* @__PURE__ */ jsx("b", { children: sourcePatientName }),
          ". "
        ] }) : null,
        "Новый лист будет создан как черновик с автонумерацией курса."
      ] })
    ] }),
    !picked && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск пациента (минимум 2 символа)...", className: "pl-9", autoFocus: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border rounded max-h-64 overflow-y-auto", children: [
        busy && /* @__PURE__ */ jsx("div", { className: "p-4 text-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin inline" }) }),
        !busy && q.trim().length >= 2 && results.length === 0 && /* @__PURE__ */ jsx("div", { className: "p-4 text-sm text-muted-foreground text-center", children: "Не найдено" }),
        results.map((p) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setPicked(p),
            className: "w-full text-left px-3 py-2 hover:bg-accent border-b last:border-0",
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: p.full_name }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: p.birth_date })
            ]
          },
          p.id
        ))
      ] })
    ] }),
    picked && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "border rounded p-3 bg-secondary/30", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: picked.full_name }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Дата рождения: ",
          picked.birth_date
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setPicked(null), children: "← Выбрать другого" })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: cloning, children: "Отмена" }),
      picked && /* @__PURE__ */ jsxs(Button, { onClick: clone, disabled: cloning, className: "gap-2", children: [
        cloning && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
        "Создать копию"
      ] })
    ] })
  ] }) });
}
const MONTHS = {
  "январ": 0,
  "феврал": 1,
  "март": 2,
  "апрел": 3,
  "ма": 4,
  "июн": 5,
  "июл": 6,
  "август": 7,
  "сентябр": 8,
  "октябр": 9,
  "ноябр": 10,
  "декабр": 11
};
function ymd(d) {
  return d.toISOString().slice(0, 10);
}
function parseSearchQuery(input) {
  let text = " " + input.toLowerCase() + " ";
  const out = { text: "" };
  const now = /* @__PURE__ */ new Date();
  const relMap = [
    [/(?:^|\s)(последн\w+|прошл\w+)\s+(месяц\w*)\b/g, () => {
      const f = new Date(now);
      f.setMonth(now.getMonth() - 1);
      out.from = ymd(f);
      out.to = ymd(now);
    }],
    [/(?:^|\s)(последн\w+|прошл\w+)\s+(недел\w*)\b/g, () => {
      const f = new Date(now);
      f.setDate(now.getDate() - 7);
      out.from = ymd(f);
      out.to = ymd(now);
    }],
    [/(?:^|\s)(последн\w+|прошл\w+)\s+(год|года)\b/g, () => {
      const f = new Date(now);
      f.setFullYear(now.getFullYear() - 1);
      out.from = ymd(f);
      out.to = ymd(now);
    }],
    [/(?:^|\s)за\s+(?:последн\w+\s+)?(\d{1,3})\s+дн\w*/g, (m) => {
    }]
  ];
  for (const [re, fn] of relMap) {
    if (re.test(text)) {
      fn();
      text = text.replace(re, " ");
    }
  }
  text = text.replace(/(?:^|\s)за\s+(?:последн\w+\s+)?(\d{1,3})\s+дн\w*/g, (_m, n) => {
    const days = Math.max(1, parseInt(n, 10));
    const f = new Date(now);
    f.setDate(now.getDate() - days);
    out.from = ymd(f);
    out.to = ymd(now);
    return " ";
  });
  text = text.replace(/(?:^|\s)(?:в\s+)?([а-яё]{3,9})(?:\s+(\d{4}))?\b/g, (m, word, year) => {
    const lc = word.toLowerCase();
    let monthIdx = -1;
    for (const [stem, idx] of Object.entries(MONTHS)) {
      if (lc.startsWith(stem)) {
        monthIdx = idx;
        break;
      }
    }
    if (monthIdx < 0) return m;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const f = new Date(Date.UTC(y, monthIdx, 1));
    const t = new Date(Date.UTC(y, monthIdx + 1, 0));
    out.from = ymd(f);
    out.to = ymd(t);
    return " ";
  });
  text = text.replace(/(?:^|\s)(20\d{2})\b/g, (_m, y) => {
    if (!out.from) {
      out.from = `${y}-01-01`;
      out.to = `${y}-12-31`;
    }
    return " ";
  });
  text = text.replace(/(?:от\s+)?(\d{1,3})\s*(?:-|—|до)\s*(\d{1,3})\s*лет\b/g, (_m, a, b) => {
    out.ageMin = +a;
    out.ageMax = +b;
    return " ";
  });
  text = text.replace(/(?:^|\s)(\d{1,3})\s*лет\b/g, (_m, a) => {
    const n = +a;
    out.ageMin = n;
    out.ageMax = n;
    return " ";
  });
  text = text.replace(/>\s*(\d[\d\s]*)/g, (_m, n) => {
    out.costMin = +n.replace(/\s/g, "");
    return " ";
  });
  text = text.replace(/<\s*(\d[\d\s]*)/g, (_m, n) => {
    out.costMax = +n.replace(/\s/g, "");
    return " ";
  });
  text = text.replace(/(?:^|\s)от\s+(\d[\d\s]*)\s*(?:руб|₽)?\b/g, (_m, n) => {
    out.costMin = +n.replace(/\s/g, "");
    return " ";
  });
  text = text.replace(/(?:^|\s)до\s+(\d[\d\s]*)\s*(?:руб|₽)?\b/g, (_m, n) => {
    out.costMax = +n.replace(/\s/g, "");
    return " ";
  });
  if (/\bдешёв\w*|\bдешев\w*|\bнедорог\w*/.test(text)) {
    out.costMax = Math.min(out.costMax ?? 2e4, 2e4);
    text = text.replace(/\bдешёв\w*|\bдешев\w*|\bнедорог\w*/g, " ");
  }
  if (/\bдорог\w*/.test(text)) {
    out.costMin = Math.max(out.costMin ?? 5e4, 5e4);
    text = text.replace(/\bдорог\w*/g, " ");
  }
  out.text = text.replace(/\s+/g, " ").trim();
  return out;
}
const fmtCost = (n) => n == null ? "—" : new Intl.NumberFormat("ru-RU").format(n) + " ₽";
function escapeCsv(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function searchToCsv(rows) {
  const headers = ["Дата", "№ курса", "Пациент", "Возраст", "Диагноз", "Шаблон", "Теги", "Препараты", "Длит. (дн)", "Статус", "Стоимость, ₽"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.issued_at,
      r.course_number ?? "",
      r.patient_full_name ?? "",
      r.patient_age_years ?? "",
      r.diagnosis_short ?? "",
      r.template_name ?? "",
      (r.template_tags || []).join("; "),
      (r.item_names || []).join("; "),
      r.duration_days,
      r.status,
      r.total_cost_estimate ?? ""
    ].map(escapeCsv).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}
function TreatmentPlans() {
  var _a;
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [dateRange, setDateRange] = useState();
  const [dupTarget, setDupTarget] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [parsedInfo, setParsedInfo] = useState("");
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/treatment-plans" } });
    }
  }, [user, isAdmin, loading, navigate]);
  useEffect(() => {
    (async () => {
      setBusy(true);
      const { data } = await supabase.from("treatment_plans").select("id, issued_at, diagnosis_short, duration_days, status, mode, course_number, patient:patients(id, full_name), items:treatment_plan_items(count)").order("issued_at", { ascending: false }).limit(200);
      const mapped = (data || []).map((r) => {
        var _a2, _b;
        return {
          ...r,
          items_count: ((_b = (_a2 = r.items) == null ? void 0 : _a2[0]) == null ? void 0 : _b.count) ?? 0
        };
      });
      setRows(mapped);
      setBusy(false);
    })();
  }, []);
  const runAdvancedSearch = async (input) => {
    if (!input.trim()) {
      setSearchResults(null);
      setParsedInfo("");
      return;
    }
    setSearching(true);
    try {
      const parsed = parseSearchQuery(input);
      const info = [];
      if (parsed.from || parsed.to) info.push(`📅 ${parsed.from ?? "…"} → ${parsed.to ?? "…"}`);
      if (parsed.costMin != null) info.push(`≥ ${parsed.costMin} ₽`);
      if (parsed.costMax != null) info.push(`≤ ${parsed.costMax} ₽`);
      if (parsed.ageMin != null || parsed.ageMax != null) info.push(`возраст ${parsed.ageMin ?? "…"}–${parsed.ageMax ?? "…"}`);
      if (parsed.text) info.push(`🔤 "${parsed.text}"`);
      setParsedInfo(info.join(" · "));
      const { data, error } = await supabase.rpc("search_treatment_plans", {
        _q: parsed.text || null,
        _from: parsed.from || null,
        _to: parsed.to || null,
        _cost_min: parsed.costMin ?? null,
        _cost_max: parsed.costMax ?? null,
        _age_min: parsed.ageMin ?? null,
        _age_max: parsed.ageMax ?? null,
        _limit: 500
      });
      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      toast$1.error("Ошибка поиска: " + ((e == null ? void 0 : e.message) || e));
    } finally {
      setSearching(false);
    }
  };
  const onSearchSubmit = (e) => {
    e.preventDefault();
    runAdvancedSearch(q);
  };
  const exportCsv = () => {
    if (!(searchResults == null ? void 0 : searchResults.length)) return;
    const blob = new Blob([searchToCsv(searchResults)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treatment-plans-search-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (modeFilter !== "all" && r.mode !== modeFilter) return false;
    if (dateRange == null ? void 0 : dateRange.from) {
      const d = new Date(r.issued_at);
      if (d < dateRange.from) return false;
      if (dateRange.to && d > new Date(dateRange.to.getTime() + 864e5 - 1)) return false;
    }
    return true;
  }), [rows, statusFilter, modeFilter, dateRange]);
  const hasFilters = statusFilter !== "all" || modeFilter !== "all" || !!(dateRange == null ? void 0 : dateRange.from);
  const clearFilters = () => {
    setStatusFilter("all");
    setModeFilter("all");
    setDateRange(void 0);
  };
  const clearSearch = () => {
    setQ("");
    setSearchResults(null);
    setParsedInfo("");
  };
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "Назад к панели администратора"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-1", children: "Листы назначений" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Комплексная метаболическая, антиоксидантная, гормональная и пептидная терапия" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx(Link, { to: "/admin/treatment-catalog", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Database, { className: "w-4 h-4" }),
            "Каталог"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/lab-tests-catalog", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Database, { className: "w-4 h-4" }),
            "Анализы"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/repertory", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4" }),
            "Реперториум"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/acupoints", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
            "Точки ИРТ"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/acupuncture-protocols", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
            "Протоколы ИРТ"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/treatment-templates", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(BookMarked, { className: "w-4 h-4" }),
            "Шаблоны"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/treatment-plans/new", children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            "Новый лист"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "mb-4", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: onSearchSubmit, className: "flex gap-2 flex-wrap items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[280px]", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: q,
                onChange: (e) => setQ(e.target.value),
                placeholder: "🔍 Найти курсы — по препарату, диагнозу, тегу, дате…",
                className: "pl-9"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: searching, className: "gap-2", children: [
            searching ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
            "Найти"
          ] }),
          searchResults && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: exportCsv, className: "gap-2", children: [
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
              "CSV"
            ] }),
            /* @__PURE__ */ jsxs(Button, { type: "button", variant: "ghost", size: "sm", onClick: clearSearch, className: "gap-1", children: [
              /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
              "Очистить"
            ] })
          ] })
        ] }),
        parsedInfo && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Распознано: ",
          parsedInfo
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Примеры: ",
          /* @__PURE__ */ jsx("code", { children: "Берлитион 2025" }),
          " · ",
          /* @__PURE__ */ jsx("code", { children: "диабет последний месяц" }),
          " · ",
          /* @__PURE__ */ jsx("code", { children: "март >50000" }),
          " · ",
          /* @__PURE__ */ jsx("code", { children: "40-50 лет дорогие" })
        ] })
      ] }) }),
      !searchResults && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex gap-2 flex-wrap items-center", children: [
        /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: (v) => setStatusFilter(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[160px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Статус" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все статусы" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "draft", children: "Черновик" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "issued", children: "Выписан" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "archived", children: "Архив" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: modeFilter, onValueChange: (v) => setModeFilter(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[160px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Режим" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Любой режим" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "flat", children: "Плоский" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "scheduled", children: "По дням" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: cn("gap-2", !(dateRange == null ? void 0 : dateRange.from) && "text-muted-foreground"), children: [
            /* @__PURE__ */ jsx(CalendarIcon, { className: "w-4 h-4" }),
            (dateRange == null ? void 0 : dateRange.from) ? dateRange.to ? `${format(dateRange.from, "d MMM", { locale: ru })} — ${format(dateRange.to, "d MMM yyyy", { locale: ru })}` : format(dateRange.from, "d MMM yyyy", { locale: ru }) : "Период"
          ] }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(Calendar, { mode: "range", selected: dateRange, onSelect: setDateRange, numberOfMonths: 2, className: "p-3 pointer-events-auto", locale: ru }) })
        ] }),
        hasFilters && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: clearFilters, className: "gap-1", children: [
          /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
          "Сбросить"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground ml-auto", children: [
          filtered.length,
          " из ",
          rows.length
        ] })
      ] }),
      searchResults ? searchResults.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-10 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-10 h-10 mx-auto mb-3 opacity-50" }),
        "Ничего не найдено по запросу."
      ] }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mb-3", children: [
          "Найдено ",
          searchResults.length,
          " курсов"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: searchResults.map((r) => /* @__PURE__ */ jsx(Card, { className: "hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              r.course_number != null && /* @__PURE__ */ jsxs(Badge, { variant: "default", className: "font-mono", children: [
                "№ ",
                r.course_number
              ] }),
              r.patient_id ? /* @__PURE__ */ jsx(Link, { to: `/admin/patients/${r.patient_id}`, className: "font-medium hover:text-primary", children: r.patient_full_name }) : /* @__PURE__ */ jsx("span", { className: "font-medium", children: r.patient_full_name || "Без пациента" }),
              r.patient_age_years != null && /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
                r.patient_age_years,
                " лет"
              ] }),
              /* @__PURE__ */ jsx(Badge, { variant: r.status === "issued" ? "default" : r.status === "archived" ? "secondary" : "outline", children: r.status }),
              r.template_name && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1", children: [
                /* @__PURE__ */ jsx(BookMarked, { className: "w-3 h-3" }),
                r.template_name
              ] }),
              (r.template_tags || []).slice(0, 4).map((t) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: t }, t)),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: fmtCost(r.total_cost_estimate) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mt-1", children: [
              format(new Date(r.issued_at), "d MMMM yyyy", { locale: ru }),
              " · ",
              r.duration_days,
              " дн.",
              r.diagnosis_short ? ` · ${r.diagnosis_short}` : ""
            ] }),
            r.snippet && /* @__PURE__ */ jsx(
              "div",
              {
                className: "text-sm mt-2 text-muted-foreground [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800/60 [&_mark]:text-foreground [&_mark]:rounded [&_mark]:px-0.5",
                dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(r.snippet ?? "", { ALLOWED_TAGS: ["mark", "b", "strong", "em", "i"], ALLOWED_ATTR: [] }) }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${r.plan_id}`, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Открыть" }) }),
            /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${r.plan_id}/print`, target: "_blank", children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "gap-1", children: [
              /* @__PURE__ */ jsx(Printer, { className: "w-3.5 h-3.5" }),
              "Печать"
            ] }) })
          ] })
        ] }) }, r.plan_id)) })
      ] }) : busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-10 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-10 h-10 mx-auto mb-3 opacity-50" }),
        "Пока нет ни одного листа. Нажмите «Новый лист», чтобы создать первый."
      ] }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: filtered.map((r) => {
        var _a2;
        return /* @__PURE__ */ jsx(Card, { className: "hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              r.course_number != null && /* @__PURE__ */ jsxs(Badge, { variant: "default", className: "font-mono", children: [
                "№ ",
                r.course_number
              ] }),
              ((_a2 = r.patient) == null ? void 0 : _a2.id) ? /* @__PURE__ */ jsx(Link, { to: `/admin/patients/${r.patient.id}`, className: "font-medium text-foreground hover:text-primary", title: "Курсы пациента", children: r.patient.full_name }) : /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${r.id}`, className: "font-medium text-foreground hover:text-primary", children: "Без пациента" }),
              /* @__PURE__ */ jsx(Badge, { variant: r.status === "issued" ? "default" : r.status === "archived" ? "secondary" : "outline", children: r.status === "draft" ? "черновик" : r.status === "issued" ? "выписан" : "архив" }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: r.mode === "flat" ? "плоский" : "по дням" }),
              /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
                r.items_count,
                " позиций"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mt-1", children: [
              format(new Date(r.issued_at), "d MMMM yyyy", { locale: ru }),
              " · курс ",
              r.duration_days,
              " дн.",
              r.diagnosis_short ? ` · ${r.diagnosis_short}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${r.id}`, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Открыть" }) }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", className: "gap-1", onClick: () => setDupTarget(r), title: "Дублировать на другого пациента", children: /* @__PURE__ */ jsx(UserPlus, { className: "w-3.5 h-3.5" }) }),
            /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${r.id}/print`, target: "_blank", children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "gap-1", children: [
              /* @__PURE__ */ jsx(Printer, { className: "w-3.5 h-3.5" }),
              "Печать"
            ] }) })
          ] })
        ] }) }, r.id);
      }) })
    ] }),
    dupTarget && user && /* @__PURE__ */ jsx(
      DuplicatePlanDialog,
      {
        open: !!dupTarget,
        onOpenChange: (v) => {
          if (!v) setDupTarget(null);
        },
        sourcePlanId: dupTarget.id,
        sourcePatientName: (_a = dupTarget.patient) == null ? void 0 : _a.full_name,
        userId: user.id
      }
    )
  ] });
}
export {
  TreatmentPlans as default
};
