import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, C as Card, c as CardHeader, d as CardTitle, a as CardContent, I as Input, B as Button, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, T as Textarea, r as Checkbox, l as DialogFooter, s as supabase, t as toast } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { Loader2, ArrowLeft, Search, Plus, Pencil, Trash2 } from "lucide-react";
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
import "@radix-ui/react-tabs";
const CATALOGS = [
  {
    key: "medications",
    title: "Препараты",
    description: "Справочник медикаментов для назначений",
    table: "medications",
    select: "id, latin_name, trade_name, dosage_form, dosage",
    displayField: "latin_name",
    searchFields: ["latin_name", "trade_name", "dosage_form"],
    fields: [
      { key: "latin_name", label: "Латинское название", type: "text" },
      { key: "trade_name", label: "Торговое название", type: "text" },
      { key: "dosage_form", label: "Форма выпуска", type: "text", placeholder: "табл., капс., р-р…" },
      { key: "dosage", label: "Дозировка", type: "text", placeholder: "50 мг" }
    ],
    orderBy: "latin_name",
    ascending: true
  },
  {
    key: "surgery_catalog",
    title: "Операции",
    description: "Список названий операций для назначения оперативного лечения",
    table: "surgery_catalog",
    select: "id, name, short_code, indications, description, notes, sort_order, is_active",
    displayField: "name",
    searchFields: ["name", "short_code", "indications"],
    fields: [
      { key: "name", label: "Название операции", type: "text" },
      { key: "short_code", label: "Короткий код / шифр", type: "text" },
      { key: "indications", label: "Показания", type: "textarea" },
      { key: "description", label: "Описание", type: "textarea" },
      { key: "notes", label: "Примечания", type: "textarea" },
      { key: "sort_order", label: "Порядок сортировки", type: "number" }
    ],
    hasIsActive: true,
    orderBy: "sort_order",
    ascending: true
  },
  {
    key: "examinations",
    title: "Обследования",
    description: "Каталог обследований (УЗИ, МРТ, ЭКГ и т.д.) — используется во вкладке «Обследование» назначений",
    table: "diagnosis_recommendations",
    select: "id, diagnosis_group, subtype, category, item_text, sort_order",
    displayField: "item_text",
    searchFields: ["item_text", "diagnosis_group", "subtype"],
    fields: [
      { key: "item_text", label: "Название обследования", type: "textarea", placeholder: "УЗИ органов малого таза" },
      { key: "diagnosis_group", label: "Группа диагнозов", type: "text", placeholder: "общее / варикоцеле / фимоз…" },
      { key: "subtype", label: "Подгруппа", type: "text", placeholder: "напр. первичный осмотр" },
      { key: "sort_order", label: "Порядок сортировки", type: "number" }
    ],
    orderBy: "sort_order",
    ascending: true,
    fixedFilter: { field: "category", value: "обследование" }
  },
  {
    key: "physical_activity_programs",
    title: "Физическая нагрузка",
    description: "Программы ЛФК / кардио / реабилитации",
    table: "physical_activity_programs",
    select: "id, name, category, age_range, description, weekly_plan, restrictions, sort_order, is_active",
    displayField: "name",
    searchFields: ["name", "category", "age_range"],
    fields: [
      { key: "name", label: "Название программы", type: "text" },
      { key: "category", label: "Категория", type: "text", placeholder: "ЛФК / Кардио / После операции" },
      { key: "age_range", label: "Возраст", type: "text", placeholder: "5-10 лет" },
      { key: "description", label: "Описание", type: "textarea" },
      { key: "weekly_plan", label: "Недельный план", type: "textarea" },
      { key: "restrictions", label: "Ограничения", type: "textarea" },
      { key: "sort_order", label: "Порядок сортировки", type: "number" }
    ],
    hasIsActive: true,
    orderBy: "sort_order",
    ascending: true
  },
  {
    key: "diet_recommendations",
    title: "Диеты",
    description: "Пункты диетических рекомендаций",
    table: "diet_recommendations",
    select: "id, diet_type, diet_label, category, item_text, is_recommended, sort_order",
    displayField: "item_text",
    searchFields: ["diet_type", "diet_label", "item_text", "category"],
    fields: [
      { key: "diet_type", label: "Ключ диеты", type: "text", placeholder: "low_carb, no_dairy, …" },
      { key: "diet_label", label: "Название диеты", type: "text" },
      { key: "category", label: "Категория", type: "text", placeholder: "рекомендуется / ограничить / исключить / режим" },
      { key: "item_text", label: "Текст пункта", type: "textarea" },
      { key: "sort_order", label: "Порядок сортировки", type: "number" }
    ],
    orderBy: "sort_order",
    ascending: true
  }
];
function CatalogEditor({ cfg }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      let query = supabase.from(cfg.table).select(cfg.select);
      if (cfg.fixedFilter) query = query.eq(cfg.fixedFilter.field, cfg.fixedFilter.value);
      if (cfg.orderBy) query = query.order(cfg.orderBy, { ascending: cfg.ascending ?? true });
      const { data, error } = await query.limit(2e3);
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      toast({ title: "Не удалось загрузить", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [cfg.table]);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return rows;
    return rows.filter(
      (r) => cfg.searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(ql))
    );
  }, [rows, q, cfg.searchFields]);
  const openNew = () => {
    setEditing(null);
    const empty = {};
    for (const f of cfg.fields) empty[f.key] = "";
    if (cfg.hasIsActive) empty.is_active = true;
    setForm(empty);
    setDialogOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    const val = {};
    for (const f of cfg.fields) val[f.key] = row[f.key] ?? "";
    if (cfg.hasIsActive) val.is_active = row.is_active !== false;
    setForm(val);
    setDialogOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      for (const f of cfg.fields) {
        const raw = form[f.key];
        if (f.type === "number") {
          payload[f.key] = raw === "" || raw == null ? null : Number(raw);
        } else {
          payload[f.key] = raw === "" ? null : raw;
        }
      }
      if (cfg.hasIsActive) payload.is_active = form.is_active !== false;
      if (cfg.fixedFilter) payload[cfg.fixedFilter.field] = cfg.fixedFilter.value;
      if (editing) {
        const { error } = await supabase.from(cfg.table).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Сохранено" });
      } else {
        const { error } = await supabase.from(cfg.table).insert(payload);
        if (error) throw error;
        toast({ title: "Добавлено" });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({ title: "Ошибка сохранения", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const remove = async (row) => {
    try {
      const { error } = await supabase.from(cfg.table).delete().eq("id", row.id);
      if (error) throw error;
      toast({ title: "Удалено" });
      await load();
    } catch (e) {
      toast({ title: "Ошибка удаления", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: cfg.description }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: q,
              onChange: (e) => setQ(e.target.value),
              placeholder: "Поиск…",
              className: "pl-8 w-64"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: openNew, size: "sm", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
          "Добавить"
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground py-12 border border-dashed rounded-md", children: rows.length === 0 ? "Записей ещё нет — добавьте первую." : "Ничего не найдено" }) : /* @__PURE__ */ jsx("div", { className: "border rounded-md overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "max-h-[65vh] overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/60 sticky top-0", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 font-medium", children: "Название" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 font-medium", children: "Детали" }),
        cfg.hasIsActive && /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 font-medium w-20", children: "Активно" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium w-28", children: "Действия" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: filtered.map((row) => /* @__PURE__ */ jsxs("tr", { className: "border-t hover:bg-muted/30", children: [
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 align-top font-medium", children: row[cfg.displayField] || "—" }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 align-top text-muted-foreground", children: cfg.fields.filter((f) => f.key !== cfg.displayField && row[f.key]).slice(0, 3).map((f) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs opacity-70", children: [
            f.label,
            ":"
          ] }),
          " ",
          String(row[f.key]).slice(0, 100)
        ] }, f.key)) }),
        cfg.hasIsActive && /* @__PURE__ */ jsx("td", { className: "px-3 py-2 align-top", children: row.is_active === false ? /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "нет" }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-emerald-600", children: "да" }) }),
        /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 align-top text-right whitespace-nowrap", children: [
          /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", onClick: () => openEdit(row), children: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7 text-destructive", onClick: () => remove(row), children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }, row.id)) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
        editing ? "Редактировать" : "Добавить",
        " — ",
        cfg.title
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 max-h-[65vh] overflow-y-auto pr-2", children: [
        cfg.fields.map((f) => /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { children: f.label }),
          f.type === "textarea" ? /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 3,
              value: form[f.key] ?? "",
              onChange: (e) => setForm({ ...form, [f.key]: e.target.value }),
              placeholder: f.placeholder
            }
          ) : /* @__PURE__ */ jsx(
            Input,
            {
              type: f.type === "number" ? "number" : "text",
              value: form[f.key] ?? "",
              onChange: (e) => setForm({ ...form, [f.key]: e.target.value }),
              placeholder: f.placeholder
            }
          )
        ] }, f.key)),
        cfg.hasIsActive && /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer pt-2", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: form.is_active !== false,
              onCheckedChange: (v) => setForm({ ...form, is_active: v === true })
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Активно (показывать при выборе в протоколе)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setDialogOpen(false), children: "Отмена" }),
        /* @__PURE__ */ jsxs(Button, { onClick: save, disabled: saving, children: [
          saving && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }),
          "Сохранить"
        ] })
      ] })
    ] }) })
  ] });
}
function AdminMedicalReferences() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(CATALOGS[0].key);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/medical-references" } });
    }
  }, [user, isAdmin, loading, navigate]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) });
  }
  if (!user || !isAdmin) return null;
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-6xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      " Назад к панели администратора"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-2", children: "Медицинские справочники" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Единое место для редактирования каталогов, которые используются в назначениях протоколов: препараты, операции, программы физ. нагрузки, диеты." })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Каталоги" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { value: tab, onValueChange: setTab, children: [
        /* @__PURE__ */ jsx(TabsList, { className: "mb-4 flex-wrap h-auto", children: CATALOGS.map((c) => /* @__PURE__ */ jsx(TabsTrigger, { value: c.key, children: c.title }, c.key)) }),
        CATALOGS.map((c) => /* @__PURE__ */ jsx(TabsContent, { value: c.key, children: /* @__PURE__ */ jsx(CatalogEditor, { cfg: c }) }, c.key))
      ] }) })
    ] })
  ] }) });
}
export {
  AdminMedicalReferences as default
};
