import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, Search, FlaskConical, Copy, Save, Trash2 } from "lucide-react";
import { u as useAuth, B as Button, C as Card, a as CardContent, L as Label, I as Input, c as CardHeader, T as Textarea, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, s as supabase, t as toast } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { a as PROTOCOL_TYPES } from "./protocolTypes-BWCSK0Md.js";
import { a as rankTemplates } from "./templates-B4T4fWBm.js";
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
const FIELD_KEYS = [
  { key: "complaints", label: "Жалобы" },
  { key: "general_status", label: "Соматический / общее состояние" },
  { key: "local_status", label: "Локальный статус" },
  { key: "wound_status", label: "Состояние раны" },
  { key: "uzi_express", label: "Экспресс-УЗИ" },
  { key: "conclusion", label: "Заключение" },
  { key: "recommendations", label: "Рекомендации" },
  { key: "neuro_status", label: "Неврологический статус" },
  { key: "psych_status", label: "Психологический статус" },
  { key: "sport_limit", label: "Ограничения по спорту" }
];
const DAY_RANGES = ["any", "3", "7", "10", "5-7", "7-10"];
function AdminVisitTemplates() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("__all__");
  const [filterField, setFilterField] = useState("__all__");
  const [testTpl, setTestTpl] = useState(null);
  const [testOp, setTestOp] = useState("");
  const [testType, setTestType] = useState("postop_day7");
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin) navigate("/");
  }, [authLoading, user, isAdmin, navigate]);
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("visit_text_templates").select("*").order("sort_order", { ascending: true });
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setList(data || []);
    setLoading(false);
  };
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((t) => {
      if (filterType !== "__all__") {
        if (filterType === "__null__" ? t.protocol_type !== null : t.protocol_type !== filterType) return false;
      }
      if (filterField !== "__all__" && t.field_key !== filterField) return false;
      if (!q) return true;
      return t.label.toLowerCase().includes(q) || t.template_text.toLowerCase().includes(q) || (t.operation_keywords || []).some((k) => k.toLowerCase().includes(q));
    });
  }, [list, search, filterType, filterField]);
  const update = (id, patch) => setList((l) => l.map((t) => t.id === id ? { ...t, ...patch } : t));
  const save = async (t) => {
    setSavingId(t.id);
    const { error } = await supabase.from("visit_text_templates").update({
      protocol_type: t.protocol_type || null,
      operation_keywords: t.operation_keywords && t.operation_keywords.length ? t.operation_keywords : null,
      day_range: t.day_range || "any",
      field_key: t.field_key,
      template_text: t.template_text,
      label: t.label,
      sort_order: t.sort_order
    }).eq("id", t.id);
    setSavingId(null);
    if (error) toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
    else toast({ title: "Сохранено" });
  };
  const remove = async (id) => {
    if (!confirm("Удалить шаблон?")) return;
    const { error } = await supabase.from("visit_text_templates").delete().eq("id", id);
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else {
      setList((l) => l.filter((t) => t.id !== id));
      toast({ title: "Удалено" });
    }
  };
  const duplicate = async (t) => {
    const { id, ...rest } = t;
    const { data, error } = await supabase.from("visit_text_templates").insert({ ...rest, label: `${rest.label} (копия)`, sort_order: rest.sort_order + 1 }).select().single();
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else if (data) {
      setList((l) => [...l, data]);
      toast({ title: "Скопировано" });
    }
  };
  const add = async () => {
    const { data, error } = await supabase.from("visit_text_templates").insert({
      protocol_type: null,
      operation_keywords: null,
      day_range: "any",
      field_key: "recommendations",
      template_text: "",
      label: "Новый шаблон",
      sort_order: 999
    }).select().single();
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else if (data) setList((l) => [...l, data]);
  };
  const testWinner = useMemo(() => {
    if (!testTpl) return null;
    const ranked = rankTemplates(list, testType, testTpl.field_key, testOp);
    return { ranked, willWin: ranked[0] };
  }, [testTpl, list, testType, testOp]);
  if (authLoading || loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background p-4 md:p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
            " В админку"
          ] }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Шаблоны текстов протоколов" })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: add, children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
          " Добавить шаблон"
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Шаблоны вставляются по кнопке ⚡ в формах визитов. Приоритет: операционный (по ключевому слову и сутке) → универсальный по типу → универсальный для всех." }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 grid md:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Поиск" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                className: "pl-8",
                placeholder: "По названию, тексту, ключевому слову",
                value: search,
                onChange: (e) => setSearch(e.target.value)
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Тип протокола" }),
          /* @__PURE__ */ jsxs(Select, { value: filterType, onValueChange: setFilterType, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "__all__", children: "Все" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "__null__", children: "— Универсальные —" }),
              PROTOCOL_TYPES.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.key, children: p.title }, p.key))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Поле" }),
          /* @__PURE__ */ jsxs(Select, { value: filterField, onValueChange: setFilterField, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "__all__", children: "Все" }),
              FIELD_KEYS.map((f) => /* @__PURE__ */ jsx(SelectItem, { value: f.key, children: f.label }, f.key))
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        "Показано: ",
        filtered.length,
        " из ",
        list.length
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        filtered.map((t) => /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                className: "text-base font-semibold flex-1 min-w-[240px]",
                value: t.label,
                onChange: (e) => update(t.id, { label: e.target.value })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
                var _a;
                setTestTpl(t);
                setTestType(t.protocol_type || "postop_day7");
                setTestOp(((_a = t.operation_keywords) == null ? void 0 : _a[0]) || "");
              }, title: "Тест приоритета", children: /* @__PURE__ */ jsx(FlaskConical, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => duplicate(t), title: "Дублировать", children: /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => save(t), disabled: savingId === t.id, children: savingId === t.id ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "text-destructive", onClick: () => remove(t.id), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-4 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { children: "Тип протокола" }),
                /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: t.protocol_type || "__all__",
                    onValueChange: (v) => update(t.id, { protocol_type: v === "__all__" ? null : v }),
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "__all__", children: "Все типы" }),
                        PROTOCOL_TYPES.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.key, children: p.title }, p.key))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { children: "Сутки" }),
                /* @__PURE__ */ jsxs(Select, { value: t.day_range, onValueChange: (v) => update(t.id, { day_range: v }), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: DAY_RANGES.map((d) => /* @__PURE__ */ jsx(SelectItem, { value: d, children: d }, d)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { children: "Поле" }),
                /* @__PURE__ */ jsxs(Select, { value: t.field_key, onValueChange: (v) => update(t.id, { field_key: v }), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: FIELD_KEYS.map((f) => /* @__PURE__ */ jsx(SelectItem, { value: f.key, children: f.label }, f.key)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { children: "Порядок" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "number",
                    value: t.sort_order,
                    onChange: (e) => update(t.id, { sort_order: Number(e.target.value) || 0 })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { children: "Ключевые слова операции (через запятую, пусто = универсальный)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: (t.operation_keywords || []).join(", "),
                  placeholder: "пластика крайней плоти, обрезание",
                  onChange: (e) => {
                    const kw = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                    update(t.id, { operation_keywords: kw.length ? kw : null });
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { children: "Текст шаблона" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  rows: 5,
                  value: t.template_text,
                  onChange: (e) => update(t.id, { template_text: e.target.value })
                }
              )
            ] })
          ] })
        ] }, t.id)),
        filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground py-12", children: list.length === 0 ? "Нет шаблонов" : "Ничего не найдено по фильтру" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: !!testTpl, onOpenChange: (o) => !o && setTestTpl(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Тест приоритета шаблона" }) }),
      testTpl && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          "Поле: ",
          /* @__PURE__ */ jsx("strong", { children: testTpl.field_key }),
          ". Выберите тип протокола и название операции, чтобы увидеть, какой шаблон выиграет."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Тип протокола" }),
            /* @__PURE__ */ jsxs(Select, { value: testType, onValueChange: setTestType, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: PROTOCOL_TYPES.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.key, children: p.title }, p.key)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Название операции" }),
            /* @__PURE__ */ jsx(Input, { value: testOp, onChange: (e) => setTestOp(e.target.value), placeholder: "напр. пластика крайней плоти" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
            "Ранжирование (",
            (testWinner == null ? void 0 : testWinner.ranked.length) || 0,
            "):"
          ] }),
          (testWinner == null ? void 0 : testWinner.ranked.length) === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Ни один шаблон не подходит." }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1 max-h-72 overflow-auto", children: testWinner == null ? void 0 : testWinner.ranked.map((t, i) => {
            var _a;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: `text-sm border rounded-md p-2 ${i === 0 ? "border-primary bg-primary/5" : ""}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                    /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                      i === 0 ? "🏆 " : `${i + 1}. `,
                      t.label
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                      t.protocol_type || "—",
                      " / ",
                      t.day_range,
                      " ",
                      ((_a = t.operation_keywords) == null ? void 0 : _a.length) ? `/ ${t.operation_keywords.join(", ")}` : ""
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: t.template_text })
                ]
              },
              t.id
            );
          }) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  AdminVisitTemplates as default
};
