import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, B as Button, I as Input, C as Card, a as CardContent, b as Badge, w as Sheet, y as SheetContent, z as SheetHeader, A as SheetTitle, L as Label, T as Textarea, G as SheetFooter, s as supabase, t as toast } from "../main.mjs";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { Loader2, ArrowLeft, FlaskConical, RefreshCw, Plus, Bot, Pencil, ExternalLink } from "lucide-react";
import { p as priceFreshness, f as formatRub } from "./cost-B-oW-Erb.js";
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
import "@radix-ui/react-switch";
const empty = { is_active: true, category: "Гормоны" };
const FRESHNESS_STYLES = {
  fresh: { dot: "bg-emerald-500", label: "цена свежая (≤30 дн.)" },
  stale: { dot: "bg-amber-500", label: "цена устарела (30–90 дн.)" },
  old: { dot: "bg-red-500", label: "цена давно не обновлялась (>90 дн.)" },
  missing: { dot: "bg-muted-foreground/30", label: "цена не задана" }
};
function AdminLabTestsCatalog() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(empty);
  const [refreshingId, setRefreshingId] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/lab-tests-catalog" } });
    }
  }, [user, isAdmin, loading, navigate]);
  const load = async () => {
    setBusy(true);
    const { data } = await supabase.from("lab_tests_catalog").select("id, name, short_name, category, unit, ref_range_male, is_active, notes, kdl_slug, price_avg, price_auto, price_auto_updated_at, price_auto_sources").order("category", { nullsFirst: true }).order("name");
    setRows(data || []);
    setBusy(false);
  };
  useEffect(() => {
    load();
  }, []);
  const categories = Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).sort();
  const refreshPrice = async (id) => {
    var _a, _b;
    setRefreshingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("parse-lab-prices", { body: { lab_id: id } });
      if (error) throw error;
      const r = (_a = data == null ? void 0 : data.results) == null ? void 0 : _a[0];
      if (r == null ? void 0 : r.ok) {
        toast({ title: "Цена обновлена", description: `${formatRub(r.price)} · источников: ${((_b = r.sources) == null ? void 0 : _b.length) || 0}` });
        await load();
        if (draft.id === id) {
          const { data: fresh } = await supabase.from("lab_tests_catalog").select("*").eq("id", id).single();
          if (fresh) setDraft(fresh);
        }
      } else {
        toast({ title: "Не удалось получить цену", description: (r == null ? void 0 : r.error) || "источники не вернули цены", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Ошибка обновления", description: e.message, variant: "destructive" });
    } finally {
      setRefreshingId(null);
    }
  };
  const refreshAll = async () => {
    setBatchBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-lab-prices", { body: { batch: true, limit: 20 } });
      if (error) throw error;
      const ok = ((data == null ? void 0 : data.results) || []).filter((r) => r.ok).length;
      toast({ title: `Обновлено: ${ok} из ${(data == null ? void 0 : data.processed) || 0}` });
      load();
    } catch (e) {
      toast({ title: "Ошибка batch", description: e.message, variant: "destructive" });
    } finally {
      setBatchBusy(false);
    }
  };
  const save = async () => {
    if (!draft.name) {
      toast({ title: "Название обязательно", variant: "destructive" });
      return;
    }
    const payload = { ...draft };
    if (draft.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("lab_tests_catalog").update(rest).eq("id", id);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("lab_tests_catalog").insert(payload);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
    }
    setEditOpen(false);
    setDraft(empty);
    toast({ title: "Сохранено" });
    load();
  };
  const startEdit = (r) => {
    setDraft(r);
    setEditOpen(true);
  };
  const startNew = () => {
    setDraft(empty);
    setEditOpen(true);
  };
  const filtered = rows.filter((r) => {
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (q && !(r.name.toLowerCase().includes(q.toLowerCase()) || (r.short_name || "").toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin/treatment-plans", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К листам назначений"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FlaskConical, { className: "w-6 h-6 text-primary" }),
            "Каталог лабораторных анализов"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            rows.length,
            " анализов · цены с kdlmed.ru"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: refreshAll, disabled: batchBusy, variant: "outline", className: "gap-2", children: [
            batchBusy ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
            "Обновить цены (20)"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: startNew, className: "gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            "Новый анализ"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-4 flex-wrap items-center", children: [
        /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск...", className: "max-w-xs" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: categoryFilter,
            onChange: (e) => setCategoryFilter(e.target.value),
            className: "h-9 rounded-md border border-input bg-background px-3 text-sm",
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "Все категории" }),
              categories.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
            ]
          }
        )
      ] }),
      busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        filtered.map((r) => {
          const eff = r.price_auto ?? r.price_avg ?? null;
          const usingAuto = r.price_auto != null;
          const fr = priceFreshness(usingAuto ? r.price_auto_updated_at : null);
          const frInfo = FRESHNESS_STYLES[fr];
          return /* @__PURE__ */ jsx(Card, { className: r.is_active ? "" : "opacity-60", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 flex items-center justify-between gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: r.name }),
                r.short_name && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  "(",
                  r.short_name,
                  ")"
                ] }),
                r.category && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: r.category }),
                r.unit && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: r.unit }),
                !r.is_active && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "не активен" }),
                eff != null ? /* @__PURE__ */ jsxs("span", { title: `${usingAuto ? "Автоцена (KDL)" : "Средняя цена"} · ${frInfo.label}`, className: "inline-flex items-center gap-1 text-xs", children: [
                  /* @__PURE__ */ jsx("span", { className: `inline-block w-2 h-2 rounded-full ${frInfo.dot}` }),
                  usingAuto && /* @__PURE__ */ jsx(Bot, { className: "w-3 h-3 text-muted-foreground" }),
                  formatRub(eff)
                ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsx("span", { className: `inline-block w-2 h-2 rounded-full ${frInfo.dot}` }),
                  "без цены"
                ] })
              ] }),
              r.ref_range_male && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
                "Норма: ",
                r.ref_range_male
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => refreshPrice(r.id),
                disabled: refreshingId === r.id,
                title: "Обновить автоцену",
                children: refreshingId === r.id ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => startEdit(r), children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }) })
          ] }) }, r.id);
        }),
        filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground py-8 text-sm", children: "Ничего не найдено" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: editOpen, onOpenChange: setEditOpen, children: /* @__PURE__ */ jsxs(SheetContent, { className: "w-full sm:max-w-xl overflow-y-auto", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: draft.id ? "Редактировать анализ" : "Новый анализ" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 py-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Название *" }),
            /* @__PURE__ */ jsx(Input, { value: draft.name ?? "", onChange: (e) => setDraft((d) => ({ ...d, name: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Короткое имя" }),
            /* @__PURE__ */ jsx(Input, { value: draft.short_name ?? "", onChange: (e) => setDraft((d) => ({ ...d, short_name: e.target.value })), placeholder: "Т общий" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Категория" }),
            /* @__PURE__ */ jsx(Input, { value: draft.category ?? "", onChange: (e) => setDraft((d) => ({ ...d, category: e.target.value })), placeholder: "Гормоны" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Ед. измерения" }),
            /* @__PURE__ */ jsx(Input, { value: draft.unit ?? "", onChange: (e) => setDraft((d) => ({ ...d, unit: e.target.value })), placeholder: "нмоль/л" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Норма (мужчины)" }),
            /* @__PURE__ */ jsx(Input, { value: draft.ref_range_male ?? "", onChange: (e) => setDraft((d) => ({ ...d, ref_range_male: e.target.value })), placeholder: "12.0–35.0" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Заметка" }),
            /* @__PURE__ */ jsx(Textarea, { value: draft.notes ?? "", onChange: (e) => setDraft((d) => ({ ...d, notes: e.target.value })), rows: 2 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border/60 bg-muted/30 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold text-sm", children: [
            /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-primary" }),
            "💰 Цена и автопарсинг (KDL)"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Средняя цена, ₽" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  step: "any",
                  value: draft.price_avg ?? "",
                  onChange: (e) => setDraft((d) => ({ ...d, price_avg: e.target.value === "" ? null : Number(e.target.value) }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "KDL slug или URL" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "testosteron-obshchii",
                  value: draft.kdl_slug ?? "",
                  onChange: (e) => setDraft((d) => ({ ...d, kdl_slug: e.target.value || null }))
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
            "Slug — последняя часть URL на kdlmed.ru (например, для ",
            /* @__PURE__ */ jsx("code", { children: "kdlmed.ru/patsientam/vse-issledovaniya/testosteron-obshchii" }),
            " укажите ",
            /* @__PURE__ */ jsx("code", { children: "testosteron-obshchii" }),
            "). Если не задан — будет использован поиск по названию."
          ] }),
          draft.price_auto != null && /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Автоцена:" }),
              /* @__PURE__ */ jsx("span", { children: formatRub(draft.price_auto) }),
              draft.price_auto_updated_at && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                "· ",
                new Date(draft.price_auto_updated_at).toLocaleDateString("ru-RU")
              ] })
            ] }),
            Array.isArray(draft.price_auto_sources) && draft.price_auto_sources.length > 0 && /* @__PURE__ */ jsxs("details", { className: "text-[11px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer", children: [
                "Источники (",
                draft.price_auto_sources.length,
                ")"
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "pl-3 mt-1 space-y-0.5", children: draft.price_auto_sources.map((s, i) => /* @__PURE__ */ jsxs("li", { children: [
                s.source,
                ": ",
                formatRub(s.price),
                s.url && /* @__PURE__ */ jsx("a", { href: s.url, target: "_blank", rel: "noreferrer", className: "ml-1 inline-flex items-center gap-0.5 underline", children: /* @__PURE__ */ jsx(ExternalLink, { className: "w-2.5 h-2.5" }) })
              ] }, i)) })
            ] })
          ] }),
          draft.id && /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              type: "button",
              onClick: () => refreshPrice(draft.id),
              disabled: refreshingId === draft.id,
              className: "gap-1.5 text-xs h-7",
              children: [
                refreshingId === draft.id ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
                "Обновить автоцену сейчас"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm pt-1", children: [
          /* @__PURE__ */ jsx(Switch, { checked: draft.is_active ?? true, onCheckedChange: (v) => setDraft((d) => ({ ...d, is_active: v })) }),
          "Активен"
        ] })
      ] }),
      /* @__PURE__ */ jsx(SheetFooter, { children: /* @__PURE__ */ jsx(Button, { onClick: save, children: "Сохранить" }) })
    ] }) })
  ] });
}
export {
  AdminLabTestsCatalog as default
};
