import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { s as supabase, D as Dialog, h as DialogContent, b as Badge, i as DialogHeader, j as DialogTitle, k as DialogDescription, I as Input, B as Button, l as DialogFooter, L as Label, T as Textarea, t as toast, w as Sheet, y as SheetContent, z as SheetHeader, A as SheetTitle, V as SheetDescription, C as Card, a as CardContent, r as Checkbox, x as SheetTrigger, n as cn, u as useAuth, O as DropdownMenu, Q as DropdownMenuTrigger, R as DropdownMenuContent, U as DropdownMenuItem, W as DropdownMenuSeparator, c as CardHeader, d as CardTitle } from "../main.mjs";
import { AlertTriangle, Sun, Beaker, Search, Loader2, X, Save, History, ArrowLeft, GitCompare, RotateCcw, Wallet, ChevronUp, ChevronDown, FlaskConical, Plus, GripVertical, Link2, Check, Copy, Download, Share2, FileDown, Mail, Send, Link as Link$1, Menu, ChevronRight, ChevronLeft, BookMarked, Printer, ClipboardList, RefreshCw, Trash2, MoreHorizontal, List, CalendarDays, Keyboard } from "lucide-react";
import { C as Command, a as CommandInput, b as CommandList, c as CommandEmpty, d as CommandGroup, e as CommandItem } from "./command-o9G8Kzt4.js";
import { S as SECTION_MAP, a as SECTIONS } from "./sections-BdvyTZRY.js";
import { P as PatientSelect } from "./PatientSelect-GQWx7tp3.js";
import { e as expandDays, G as GanttHeader, C as CatalogPicker, P as PlanItemRow } from "./PlanItemRow-DhvuHdes.js";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { c as calculatePlanCost, f as formatRub } from "./cost-B-oW-Erb.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import QRCode from "qrcode";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-CM9YN36E.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { g as generatePlanDocx } from "./docxExport-CPpJ-UJC.js";
import { f as fetchIrtForCatalogIds } from "./acupunctureExpand-DBa3GykD.js";
import { f as subscribePlanItems, h as popQueuedPlanItems, s as setActiveContext, c as clearActiveContextIfMatches } from "./protocolBridge-4TuhSmsW.js";
import { u as useProtocolFragmentReceiver } from "./useProtocolFragmentReceiver-B3USCy2g.js";
import { W as WritePrescriptionsButton } from "./WritePrescriptionsButton-DmxG7UKp.js";
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
import "cmdk";
import "./select-BFDaalEn.js";
import "@radix-ui/react-select";
import "@radix-ui/react-popover";
import "@radix-ui/react-switch";
import "@radix-ui/react-radio-group";
import "@radix-ui/react-tabs";
import "docx";
import "./FileSaver.min-DtJWvt7f.js";
import "./RxItemsPreviewDialog-DH8JlDo_.js";
import "./scroll-area-DtgkI4MV.js";
import "@radix-ui/react-scroll-area";
function CommandPaletteDialog({ open, onOpenChange, activeSection, onPick }) {
  var _a;
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      let req = supabase.from("treatment_catalog").select("*").eq("is_active", true).order("name").limit(30);
      if (q.trim().length >= 1) req = req.or(`name.ilike.%${q}%,inn.ilike.%${q}%,subcategory.ilike.%${q}%`);
      const { data } = await req;
      if (!cancelled) setItems(data || []);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, q]);
  const sectionLabel = ((_a = SECTION_MAP[activeSection]) == null ? void 0 : _a.label) || activeSection;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsx(DialogContent, { className: "p-0 max-w-2xl gap-0 overflow-hidden", children: /* @__PURE__ */ jsxs(Command, { shouldFilter: false, children: [
    /* @__PURE__ */ jsxs("div", { className: "px-3 pt-3 pb-1 text-xs text-muted-foreground", children: [
      "Добавить в раздел: ",
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: sectionLabel })
    ] }),
    /* @__PURE__ */ jsx(CommandInput, { value: q, onValueChange: setQ, placeholder: "Поиск по названию, МНН, подкатегории..." }),
    /* @__PURE__ */ jsxs(CommandList, { className: "max-h-[60vh]", children: [
      !busy && items.length === 0 && /* @__PURE__ */ jsx(CommandEmpty, { children: "Ничего не найдено" }),
      /* @__PURE__ */ jsx(CommandGroup, { heading: busy ? "Поиск..." : `Найдено: ${items.length}`, children: items.map((it) => {
        var _a2;
        return /* @__PURE__ */ jsx(
          CommandItem,
          {
            value: `${it.name} ${it.inn || ""} ${it.subcategory || ""}`,
            onSelect: () => {
              onPick(activeSection, it);
              onOpenChange(false);
            },
            className: "flex items-start gap-2 cursor-pointer",
            children: /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: it.name }),
                it.is_off_label && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] h-4 px-1 gap-1", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { className: "w-2.5 h-2.5" }),
                  "off-label"
                ] }),
                it.light_sensitive && /* @__PURE__ */ jsx(Sun, { className: "w-3 h-3 text-amber-500" }),
                it.glucose_only && /* @__PURE__ */ jsx(Beaker, { className: "w-3 h-3 text-blue-500" }),
                /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] h-4 px-1", children: ((_a2 = SECTION_MAP[it.category]) == null ? void 0 : _a2.short) || it.category })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
                it.inn ? `${it.inn} · ` : "",
                it.form || "",
                it.default_dose ? ` · ${it.default_dose} ${it.dose_unit || ""}` : "",
                it.default_frequency ? ` · ${it.default_frequency}` : ""
              ] })
            ] })
          },
          it.id
        );
      }) })
    ] })
  ] }) }) });
}
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";
const SHORTCUTS = [
  [`${mod} + S`, "Сохранить лист"],
  [`${mod} + P`, "Превью печати (новая вкладка)"],
  [`${mod} + K`, "Командная палитра: добавить позицию"],
  [`${mod} + E`, "Меню экспорта (Печать / DOCX / Памятка)"],
  [`${mod} + H`, "История версий (для выписанных)"],
  [`${mod} + D`, "Дублировать активную позицию"],
  [`${mod} + Z`, "Отменить последнее действие (до 10 шагов)"],
  ["Tab / Shift+Tab", "Навигация между полями"],
  ["Esc", "Закрыть открытое окно"],
  ["?", "Показать эту справку"]
];
function HotkeysHelpDialog({ open, onOpenChange }) {
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { className: "flex items-center gap-2", children: "⌨ Горячие клавиши" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Ускорьте работу с листом назначений." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "divide-y", children: SHORTCUTS.map(([k, label]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-2 gap-3 text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("kbd", { className: "px-2 py-1 rounded border bg-muted font-mono text-xs whitespace-nowrap", children: k })
    ] }, k)) })
  ] }) });
}
const newId$2 = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
function ApplyTemplateDialog({ open, onOpenChange, currentItemsCount, currentMode, currentDuration, onApply }) {
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQ("");
      return;
    }
    (async () => {
      setBusy(true);
      const { data } = await supabase.from("protocol_templates").select("id, name, description, mode, duration_days, tags, items:protocol_template_items(count)").eq("is_archived", false).order("name");
      setTemplates((data || []).map((r) => {
        var _a, _b;
        return { ...r, items_count: ((_b = (_a = r.items) == null ? void 0 : _a[0]) == null ? void 0 : _b.count) ?? 0 };
      }));
      setBusy(false);
    })();
  }, [open]);
  const filtered = templates.filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()) || (t.tags || []).some((tag) => tag.toLowerCase().includes(q.toLowerCase())));
  const loadAndApply = async (strategy) => {
    if (!selected) return;
    setLoadingItems(true);
    try {
      const { data: rows } = await supabase.from("protocol_template_items").select("*").eq("template_id", selected.id).order("order_index");
      const items = rows || [];
      const catalogIds = items.map((r) => r.catalog_id).filter(Boolean);
      let catalogMap = /* @__PURE__ */ new Map();
      if (catalogIds.length) {
        const { data: cat } = await supabase.from("treatment_catalog").select("*").in("id", catalogIds);
        catalogMap = new Map((cat || []).map((c) => [c.id, c]));
      }
      const planItems = items.map((r) => {
        const c = r.catalog_id ? catalogMap.get(r.catalog_id) : null;
        return {
          client_id: newId$2(),
          catalog_id: r.catalog_id,
          section_category: r.section_category,
          name_snapshot: r.name_snapshot || (c == null ? void 0 : c.name) || "—",
          inn_snapshot: (c == null ? void 0 : c.inn) ?? null,
          form_snapshot: (c == null ? void 0 : c.form) ?? null,
          dose: r.dose,
          dose_unit: r.dose_unit,
          dilution_volume: r.dilution_volume,
          dilution_solvent: r.dilution_solvent,
          frequency: r.frequency,
          duration_days: r.duration_days,
          day_pattern: r.day_pattern,
          time_of_day: r.time_of_day || [],
          infusion_rate: r.infusion_rate,
          route_override: r.route_override,
          notes: r.notes,
          is_off_label: !!(c == null ? void 0 : c.is_off_label),
          light_sensitive: !!(c == null ? void 0 : c.light_sensitive),
          glucose_only: !!(c == null ? void 0 : c.glucose_only),
          dose_range_min: (c == null ? void 0 : c.dose_range_min) ?? null,
          dose_range_max: (c == null ? void 0 : c.dose_range_max) ?? null,
          repertory_remedy_id: r.repertory_remedy_id ?? (c == null ? void 0 : c.repertory_remedy_id) ?? null,
          potency: r.potency ?? (c == null ? void 0 : c.potency) ?? null,
          dosing_schedule: r.dosing_schedule ?? (c == null ? void 0 : c.dosing_schedule) ?? null
        };
      });
      if (selected.mode === "flat" && currentMode === "scheduled") {
        const dur = selected.duration_days || currentDuration;
        planItems.forEach((it) => {
          if (!it.day_pattern) it.day_pattern = `1-${dur}`;
        });
      }
      onApply(planItems, strategy, selected.mode, selected.duration_days);
      onOpenChange(false);
    } finally {
      setLoadingItems(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Применить шаблон протокола" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Выберите шаблон, затем — заменить текущие позиции или добавить к ним." })
    ] }),
    !selected ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск по названию или тегу...", className: "pl-8" })
      ] }),
      busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground py-6", children: "Шаблонов не найдено" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: filtered.map((t) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSelected(t),
          className: "w-full text-left border rounded-md p-3 hover:border-primary hover:bg-muted/40 transition-colors",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: t.name }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: t.mode === "flat" ? "плоский" : "по дням" }),
                /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
                  t.items_count,
                  " поз."
                ] }),
                t.duration_days && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
                  t.duration_days,
                  " дн."
                ] })
              ] })
            ] }),
            t.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: t.description }),
            t.tags && t.tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex gap-1 mt-1 flex-wrap", children: t.tags.map((tag) => /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded", children: tag }, tag)) })
          ]
        },
        t.id
      )) })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3 bg-muted/30", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: selected.name }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [
          "режим: ",
          selected.mode === "flat" ? "плоский" : "по дням",
          " · ",
          selected.items_count,
          " позиций",
          selected.duration_days ? ` · ${selected.duration_days} дн.` : ""
        ] })
      ] }),
      selected.mode !== currentMode && /* @__PURE__ */ jsx("div", { className: "text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded p-2", children: selected.mode === "scheduled" ? "⚠ Шаблон создан в режиме «Расписание по дням», а лист — в плоском. Рекомендуется переключить лист после применения." : `⚠ Шаблон в плоском режиме. Для каждой позиции day_pattern будет установлен как 1–${selected.duration_days || currentDuration}.` }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
        "В листе сейчас: ",
        /* @__PURE__ */ jsx("b", { children: currentItemsCount }),
        " позиций."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setSelected(null), disabled: loadingItems, children: "← Назад" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => loadAndApply("merge"), disabled: loadingItems, children: "Добавить к текущему" }),
          /* @__PURE__ */ jsxs(Button, { onClick: () => loadAndApply("replace"), disabled: loadingItems, children: [
            loadingItems && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-1" }),
            "Заменить"
          ] })
        ] })
      ] })
    ] }),
    !selected && /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => onOpenChange(false), children: "Отмена" }) })
  ] }) });
}
function SaveAsTemplateDialog({ open, onOpenChange, items, mode, durationDays, userId, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const reset = () => {
    setName("");
    setDescription("");
    setTarget("");
    setTags([]);
    setTagInput("");
  };
  const save = async () => {
    if (!name.trim()) {
      toast({ title: "Введите название шаблона", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: tpl, error: e1 } = await supabase.from("protocol_templates").insert({
        name: name.trim(),
        description: description.trim() || null,
        target_patient: target.trim() || null,
        tags: tags.length ? tags : null,
        mode,
        duration_days: durationDays,
        created_by: userId
      }).select("id").single();
      if (e1 || !tpl) throw e1 || new Error("save failed");
      if (items.length) {
        const rows = items.map((it, idx) => ({
          template_id: tpl.id,
          catalog_id: it.catalog_id || null,
          section_category: it.section_category,
          order_index: idx,
          name_snapshot: it.name_snapshot,
          dose: it.dose,
          dose_unit: it.dose_unit,
          dilution_volume: it.dilution_volume,
          dilution_solvent: it.dilution_solvent,
          frequency: it.frequency,
          duration_days: it.duration_days,
          day_pattern: it.day_pattern || null,
          time_of_day: it.time_of_day,
          infusion_rate: it.infusion_rate,
          route_override: it.route_override,
          notes: it.notes,
          repertory_remedy_id: it.repertory_remedy_id ?? null,
          potency: it.potency ?? null,
          dosing_schedule: it.dosing_schedule ?? null
        }));
        const { error: e2 } = await supabase.from("protocol_template_items").insert(rows);
        if (e2) throw e2;
      }
      toast({ title: "Шаблон создан" });
      reset();
      onOpenChange(false);
      onSaved == null ? void 0 : onSaved();
    } catch (e) {
      toast({ title: "Ошибка", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (v) => {
    if (!saving) {
      onOpenChange(v);
      if (!v) reset();
    }
  }, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Сохранить как шаблон" }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        items.length,
        " позиций будут сохранены в библиотеке шаблонов (режим: ",
        mode === "flat" ? "плоский" : "по дням",
        ")."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Название *" }),
        /* @__PURE__ */ jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "Например: Базовая метаболическая поддержка" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Целевой профиль пациента" }),
        /* @__PURE__ */ jsx(Input, { value: target, onChange: (e) => setTarget(e.target.value), placeholder: "Мужчина 37–50, гипогонадизм, метаболический синдром" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Описание" }),
        /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value), rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Теги" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              value: tagInput,
              onChange: (e) => setTagInput(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              },
              placeholder: "введите тег и Enter"
            }
          ),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: addTag, children: "+" })
        ] }),
        tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: tags.map((t) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs", children: [
          t,
          /* @__PURE__ */ jsx(X, { className: "w-3 h-3 cursor-pointer hover:text-destructive", onClick: () => setTags(tags.filter((x) => x !== t)) })
        ] }, t)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => onOpenChange(false), disabled: saving, children: "Отмена" }),
      /* @__PURE__ */ jsxs(Button, { onClick: save, disabled: saving, className: "gap-2", children: [
        saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        "Сохранить шаблон"
      ] })
    ] })
  ] }) });
}
function ScheduledSummary({ items, durationDays }) {
  const stats = useMemo(() => {
    const ivCats = ["iv_drip", "iv_bolus"];
    const ivItems = items.filter((i) => ivCats.includes(i.section_category));
    const ivDays = /* @__PURE__ */ new Set();
    ivItems.forEach((it) => expandDays(it.day_pattern, durationDays).forEach((d) => ivDays.add(d)));
    const supplementsDaily = items.filter((i) => i.section_category === "oral_supplement" && expandDays(i.day_pattern, durationDays).length === durationDays).length;
    const procedures = items.filter((i) => i.section_category === "procedure").length;
    const unique = new Set(items.map((i) => i.inn_snapshot).filter(Boolean));
    return {
      ivDays: ivDays.size,
      ivCount: ivItems.length,
      supplementsDaily,
      procedures,
      uniqueInn: unique.size
    };
  }, [items, durationDays]);
  return /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 py-1", children: [
    "Дней с инфузиями: ",
    /* @__PURE__ */ jsx("b", { className: "text-foreground", children: stats.ivDays }),
    " · Препаратов IV: ",
    /* @__PURE__ */ jsx("b", { className: "text-foreground", children: stats.ivCount }),
    " · БАД ежедневно: ",
    /* @__PURE__ */ jsx("b", { className: "text-foreground", children: stats.supplementsDaily }),
    " · Процедур: ",
    /* @__PURE__ */ jsx("b", { className: "text-foreground", children: stats.procedures }),
    " · Уникальных МНН: ",
    /* @__PURE__ */ jsx("b", { className: "text-foreground", children: stats.uniqueInn })
  ] });
}
function summarize(items) {
  const byCat = {};
  items.forEach((i) => {
    byCat[i.section_category] = (byCat[i.section_category] || 0) + 1;
  });
  const parts = Object.entries(byCat).map(([k, n]) => {
    const s = SECTIONS.find((s2) => s2.key === k);
    return `${(s == null ? void 0 : s.short) || k}: ${n}`;
  });
  return parts.join(" · ");
}
function PlanVersionHistoryDrawer({ open, onOpenChange, planId, userId }) {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [restoring, setRestoring] = useState(false);
  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    (async () => {
      setBusy(true);
      const { data } = await supabase.from("treatment_plan_versions").select("*").eq("plan_id", planId).order("version_no", { ascending: false });
      setVersions(data || []);
      setBusy(false);
    })();
  }, [open, planId]);
  const restore = async () => {
    if (!selected) return;
    if (!confirm("Создать новый черновик на основе этой версии? Текущий лист не будет затронут.")) return;
    setRestoring(true);
    try {
      const snap = selected.snapshot || {};
      const srcPlan = snap.plan || {};
      const srcItems = snap.items || [];
      const newPlan = {
        patient_id: srcPlan.patient_id,
        issued_at: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        mode: srcPlan.mode,
        duration_days: srcPlan.duration_days,
        diagnosis_short: srcPlan.diagnosis_short,
        clinical_summary: srcPlan.clinical_summary,
        based_on_template: srcPlan.based_on_template,
        status: "draft",
        created_by: userId
      };
      const { data: created, error } = await supabase.from("treatment_plans").insert(newPlan).select("id").single();
      if (error || !created) throw error || new Error("Не удалось создать");
      if (srcItems.length) {
        const cloned = srcItems.map((it) => {
          const { id, plan_id, created_at, ...rest } = it;
          return { ...rest, plan_id: created.id };
        });
        const { error: e2 } = await supabase.from("treatment_plan_items").insert(cloned);
        if (e2) throw e2;
      }
      toast({ title: "Версия восстановлена", description: `Создан новый черновик из версии №${selected.version_no}` });
      onOpenChange(false);
      navigate(`/admin/treatment-plans/${created.id}`);
    } catch (e) {
      toast({ title: "Ошибка", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange, children: /* @__PURE__ */ jsxs(SheetContent, { className: "w-full sm:max-w-2xl overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(SheetHeader, { children: [
      /* @__PURE__ */ jsxs(SheetTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(History, { className: "w-5 h-5" }),
        selected ? `Версия №${selected.version_no}` : "История версий"
      ] }),
      /* @__PURE__ */ jsx(SheetDescription, { children: selected ? `Снапшот от ${format(new Date(selected.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}` : "Версии создаются при каждом сохранении выписанного листа." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "py-4", children: [
      busy && /* @__PURE__ */ jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }),
      !busy && !selected && versions.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground py-8", children: "История пуста. Версии появятся после первой выписки листа." }),
      !busy && !selected && versions.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: versions.map((v) => {
        var _a;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            className: "w-full text-left border rounded-md p-3 hover:bg-accent transition-colors",
            onClick: () => setSelected(v),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsxs(Badge, { variant: "default", children: [
                  "№",
                  v.version_no
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: format(new Date(v.created_at), "d MMM yyyy, HH:mm", { locale: ru }) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: summarize(((_a = v.snapshot) == null ? void 0 : _a.items) || []) })
            ]
          },
          v.id
        );
      }) }),
      selected && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setSelected(null), className: "gap-1", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          "К списку версий"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-amber-50 dark:bg-amber-900/20 border-amber-300/50 p-2 text-xs text-amber-800 dark:text-amber-200", children: [
          "Это версия №",
          selected.version_no,
          ". Только просмотр. Чтобы вернуться к этому состоянию — нажмите «Восстановить» (создастся новый черновик)."
        ] }),
        /* @__PURE__ */ jsx(ReadOnlySnapshot, { snap: selected.snapshot }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => {
                onOpenChange(false);
                navigate(`/admin/treatment-plans/compare?a=version:${selected.id}&b=${planId}`);
              },
              className: "flex-1 gap-2",
              children: [
                /* @__PURE__ */ jsx(GitCompare, { className: "w-4 h-4" }),
                "Сравнить с текущей"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(Button, { onClick: restore, disabled: restoring, className: "flex-1 gap-2", children: [
            restoring ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4" }),
            "Восстановить (новый черновик)"
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
function ReadOnlySnapshot({ snap }) {
  const plan = (snap == null ? void 0 : snap.plan) || {};
  const items = (snap == null ? void 0 : snap.items) || [];
  const grouped = SECTIONS.map((s) => ({ section: s, list: items.filter((i) => i.section_category === s.key) }));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2 opacity-95", children: [
    /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-xs space-y-1 bg-muted/30", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("b", { children: "Режим:" }),
        " ",
        plan.mode === "scheduled" ? "по дням" : "плоский"
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("b", { children: "Длительность:" }),
        " ",
        plan.duration_days,
        " дн."
      ] }),
      plan.diagnosis_short && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("b", { children: "Диагноз:" }),
        " ",
        plan.diagnosis_short
      ] })
    ] }),
    grouped.filter((g) => g.list.length > 0).map(({ section, list }) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1", children: section.label }),
      /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-0.5", children: list.map((it, idx) => /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: it.name_snapshot }),
        it.dose != null && /* @__PURE__ */ jsxs(Fragment, { children: [
          " — ",
          it.dose,
          " ",
          it.dose_unit
        ] }),
        it.frequency && /* @__PURE__ */ jsxs(Fragment, { children: [
          ", ",
          it.frequency
        ] }),
        it.day_pattern && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          " · дни: ",
          it.day_pattern
        ] })
      ] }, idx)) })
    ] }, section.key))
  ] });
}
function PlanCostBlock({ items, durationDays, mode, showInPrint, onShowInPrintChange, onTotalChange }) {
  const [open, setOpen] = useState(true);
  const [showMissing, setShowMissing] = useState(false);
  const [catalogMap, setCatalogMap] = useState(/* @__PURE__ */ new Map());
  const catalogIds = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.catalog_id).filter(Boolean)));
  }, [items]);
  useEffect(() => {
    if (catalogIds.length === 0) {
      setCatalogMap(/* @__PURE__ */ new Map());
      return;
    }
    (async () => {
      const { data } = await supabase.from("treatment_catalog").select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_updated_at, price_source_preference").in("id", catalogIds);
      const m = /* @__PURE__ */ new Map();
      (data || []).forEach((r) => m.set(r.id, r));
      setCatalogMap(m);
    })();
  }, [catalogIds]);
  const breakdown = useMemo(() => {
    const input = items.map((it) => ({
      catalog_id: it.catalog_id,
      section_category: it.section_category,
      frequency: it.frequency,
      day_pattern: it.day_pattern,
      duration_days: it.duration_days,
      prn_estimated_doses: it.prn_estimated_doses,
      name_snapshot: it.name_snapshot
    }));
    return calculatePlanCost(input, catalogMap, durationDays, mode);
  }, [items, catalogMap, durationDays, mode]);
  useEffect(() => {
    onTotalChange == null ? void 0 : onTotalChange(breakdown.total);
  }, [breakdown.total, onTotalChange]);
  return /* @__PURE__ */ jsx(Card, { className: "mt-4", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setOpen((o) => !o), className: "w-full flex items-center justify-between text-left", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
        /* @__PURE__ */ jsx(Wallet, { className: "w-4 h-4 text-primary" }),
        "💰 Ориентировочная стоимость курса",
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1", children: formatRub(breakdown.total) }),
        breakdown.missing.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3" }),
          breakdown.missing.length,
          " без цены"
        ] })
      ] }),
      open ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-3 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        "Москва, по данным на ",
        (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU")
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        Object.entries(breakdown.byGroup).map(([k, g]) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-dashed border-border/50 py-1", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            g.emoji,
            " ",
            g.label
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: formatRub(g.sum) })
        ] }, k)),
        Object.keys(breakdown.byGroup).length === 0 && /* @__PURE__ */ jsx("div", { className: "text-muted-foreground italic", children: "Нет позиций с заданной ценой." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-semibold border-t pt-2", children: [
        /* @__PURE__ */ jsx("span", { children: "Итого:" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono", children: formatRub(breakdown.total) })
      ] }),
      breakdown.missing.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-amber-500/10 p-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1",
            onClick: () => setShowMissing((s) => !s),
            children: [
              "⚠ ",
              breakdown.missing.length,
              " позиций без цены — см. список",
              showMissing ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-3 h-3" })
            ]
          }
        ),
        showMissing && /* @__PURE__ */ jsx("ul", { className: "mt-1 text-xs space-y-0.5", children: breakdown.missing.map((m, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "• ",
            m.name
          ] }),
          m.catalog_id && /* @__PURE__ */ jsx(
            Link,
            {
              to: `/admin/treatment-catalog?edit=${m.catalog_id}`,
              className: "text-primary hover:underline shrink-0",
              children: "задать цену →"
            }
          )
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-2", children: "Стоимость процедур (УВТ, ВЛОК, массаж и др.), расходных материалов (растворы, шприцы, системы) и услуг клиники в расчёт не включена. Возможны отклонения ±15–20% в зависимости от аптеки." }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm pt-1", children: [
        /* @__PURE__ */ jsx(Checkbox, { checked: showInPrint, onCheckedChange: (v) => onShowInPrintChange(!!v) }),
        "Печатать стоимость в листе назначений"
      ] })
    ] })
  ] }) });
}
const POINT_PRESETS = [
  "На 14-й день",
  "Через 4 недели",
  "Через 8 недель",
  "Через 3 месяца",
  "После окончания курса"
];
const PRESETS = [
  {
    key: "basic",
    label: "Базовый андрологический",
    points: [{
      control_point: "Через 4 недели",
      at_day: 28,
      tests: ["Т общий", "Т свободный", "ГСПГ", "E2", "ЛГ", "ФСГ", "25(OH)D", "АЛТ", "АСТ", "Креатинин", "Липиды"]
    }]
  },
  {
    key: "extended",
    label: "Расширенный",
    points: [{
      control_point: "Через 4 недели",
      at_day: 28,
      tests: ["Т общий", "Т свободный", "ГСПГ", "E2", "ЛГ", "ФСГ", "25(OH)D", "АЛТ", "АСТ", "Креатинин", "Липиды", "Пролактин", "ТТГ", "ДГЭА-С", "Кортизол", "Гомоцистеин", "Ферритин", "HbA1c"]
    }]
  },
  {
    key: "hepato",
    label: "Гепатопротекторный",
    points: [
      { control_point: "На 14-й день", at_day: 14, tests: ["АЛТ", "АСТ", "Креатинин"] },
      { control_point: "На 42-й день", at_day: 42, tests: ["АЛТ", "АСТ", "Креатинин"] }
    ]
  },
  {
    key: "trt",
    label: "На фоне TRT",
    points: [{
      control_point: "Через 6 недель",
      at_day: 42,
      tests: ["Т общий", "ОАК", "ПСА общий", "E2", "ЛГ", "ФСГ"]
    }]
  },
  {
    key: "serm",
    label: "На фоне SERM",
    points: [{
      control_point: "Через 4 недели",
      at_day: 28,
      tests: ["Т общий", "E2", "ЛГ", "ФСГ", "ОАК"]
    }]
  }
];
const newId$1 = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
function PointCard({ point, allTests, onChange, onRemove }) {
  const sort = useSortable({ id: point.client_id });
  const style = {
    transform: CSS.Transform.toString(sort.transform),
    transition: sort.transition,
    opacity: sort.isDragging ? 0.5 : 1
  };
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedTests = allTests.filter((t) => point.test_ids.includes(t.id));
  return /* @__PURE__ */ jsxs("div", { ref: sort.setNodeRef, style, className: "border rounded-md p-3 bg-card space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", ...sort.attributes, ...sort.listeners, className: "cursor-grab active:cursor-grabbing text-muted-foreground p-0.5 mt-1", children: /* @__PURE__ */ jsx(GripVertical, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-1 md:grid-cols-4 gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px]", children: "Срок" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              list: "lab-point-presets",
              value: point.control_point,
              onChange: (e) => onChange({ control_point: e.target.value }),
              placeholder: "Через 4 недели",
              className: "h-8"
            }
          ),
          /* @__PURE__ */ jsx("datalist", { id: "lab-point-presets", children: POINT_PRESETS.map((p) => /* @__PURE__ */ jsx("option", { value: p }, p)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[11px]", children: "День (для сортировки)" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              min: 1,
              value: point.at_day ?? "",
              onChange: (e) => onChange({ at_day: e.target.value === "" ? null : Number(e.target.value) }),
              className: "h-8"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: onRemove, className: "h-8 w-8 text-destructive", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { className: "text-[11px]", children: "Анализы из каталога" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1 mb-1", children: [
        selectedTests.map((t) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
          t.short_name || t.name,
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onChange({ test_ids: point.test_ids.filter((id) => id !== t.id) }), children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
        ] }, t.id)),
        /* @__PURE__ */ jsxs(Popover, { open: pickerOpen, onOpenChange: setPickerOpen, children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "h-7 gap-1", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
            "Добавить"
          ] }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "p-0 w-80", align: "start", children: /* @__PURE__ */ jsxs(Command, { children: [
            /* @__PURE__ */ jsx(CommandInput, { placeholder: "Поиск теста..." }),
            /* @__PURE__ */ jsxs(CommandList, { children: [
              /* @__PURE__ */ jsx(CommandEmpty, { children: "Не найдено" }),
              /* @__PURE__ */ jsx(CommandGroup, { children: allTests.map((t) => /* @__PURE__ */ jsxs(
                CommandItem,
                {
                  onSelect: () => {
                    const has = point.test_ids.includes(t.id);
                    onChange({ test_ids: has ? point.test_ids.filter((id) => id !== t.id) : [...point.test_ids, t.id] });
                  },
                  children: [
                    /* @__PURE__ */ jsx(Checkbox, { checked: point.test_ids.includes(t.id), className: "mr-2" }),
                    /* @__PURE__ */ jsx("span", { className: "flex-1", children: t.name }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-2", children: t.category })
                  ]
                },
                t.id
              )) })
            ] })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-[11px]", children: "Произвольные тесты (через запятую)" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: point.custom_tests.join(", "),
            onChange: (e) => onChange({ custom_tests: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }),
            className: "h-8",
            placeholder: "Гликемическая кривая, Альбумин..."
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-[11px]", children: "Заметка" }),
        /* @__PURE__ */ jsx(Input, { value: point.notes ?? "", onChange: (e) => onChange({ notes: e.target.value }), className: "h-8" })
      ] })
    ] })
  ] });
}
function LabControlSection({ enabled, onEnabledChange, points, onChange }) {
  const [allTests, setAllTests] = useState([]);
  const [presetOpen, setPresetOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  useEffect(() => {
    if (!enabled) return;
    if (allTests.length) return;
    supabase.from("lab_tests_catalog").select("id, name, short_name, category, unit").eq("is_active", true).order("category").order("name").then(({ data }) => setAllTests(data || []));
  }, [enabled, allTests.length]);
  const addPoint = () => {
    onChange([...points, {
      client_id: newId$1(),
      control_point: "Через 4 недели",
      at_day: 28,
      test_ids: [],
      custom_tests: [],
      notes: "",
      order_index: points.length
    }]);
  };
  const applyPreset = (presetKey) => {
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    const newPoints = preset.points.map((p, i) => {
      const ids = [];
      p.tests.forEach((name) => {
        const t = allTests.find((t2) => (t2.short_name || t2.name) === name);
        if (t) ids.push(t.id);
      });
      return {
        client_id: newId$1(),
        control_point: p.control_point,
        at_day: p.at_day,
        test_ids: ids,
        custom_tests: [],
        notes: null,
        order_index: points.length + i
      };
    });
    onChange([...points, ...newPoints]);
    setPresetOpen(false);
  };
  const updatePoint = (cid, patch) => {
    onChange(points.map((p) => p.client_id === cid ? { ...p, ...patch } : p));
  };
  const removePoint = (cid) => onChange(points.filter((p) => p.client_id !== cid));
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = points.findIndex((p) => p.client_id === active.id);
    const newIdx = points.findIndex((p) => p.client_id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(points, oldIdx, newIdx).map((p, i) => ({ ...p, order_index: i })));
  };
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 font-semibold", children: [
        /* @__PURE__ */ jsx(FlaskConical, { className: "w-4 h-4 text-primary" }),
        "📊 Контроль на фоне терапии",
        /* @__PURE__ */ jsx(Checkbox, { checked: enabled, onCheckedChange: (v) => onEnabledChange(!!v), className: "ml-2" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-normal", children: "включить блок" })
      ] }),
      enabled && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Popover, { open: presetOpen, onOpenChange: setPresetOpen, children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", children: [
            "Пресет ",
            /* @__PURE__ */ jsx(ChevronDown, { className: "w-3 h-3" })
          ] }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "p-1 w-64", align: "end", children: PRESETS.map((p) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded",
              onClick: () => applyPreset(p.key),
              children: p.label
            },
            p.key
          )) })
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: addPoint, className: "gap-1", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
          "Точка контроля"
        ] })
      ] })
    ] }),
    enabled && /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd, children: /* @__PURE__ */ jsx(SortableContext, { items: points.map((p) => p.client_id), strategy: verticalListSortingStrategy, children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      points.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic py-3 text-center", children: "Добавьте точку контроля или примените пресет." }),
      points.map((p) => /* @__PURE__ */ jsx(
        PointCard,
        {
          point: p,
          allTests,
          onChange: (patch) => updatePoint(p.client_id, patch),
          onRemove: () => removePoint(p.client_id)
        },
        p.client_id
      ))
    ] }) }) })
  ] }) });
}
function PublicLinkPopover({ planId, publicHash, isPublic, onChange }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const canvasRef = useRef(null);
  const url = publicHash ? `${window.location.origin}/p/${publicHash}` : "";
  useEffect(() => {
    if (!open || !isPublic || !url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1, color: { dark: "#000", light: "#fff" } }).catch(() => {
    });
  }, [open, isPublic, url]);
  const togglePublic = async (v) => {
    setBusy(true);
    const { error } = await supabase.from("treatment_plans").update({ is_public: v }).eq("id", planId);
    setBusy(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    onChange({ is_public: v });
    toast({ title: v ? "Публичная ссылка активирована" : "Публичная ссылка отключена" });
  };
  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const downloadQR = async () => {
    if (!url) return;
    const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-pamyatka-${publicHash}.png`;
    a.click();
  };
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
      /* @__PURE__ */ jsx(Link2, { className: "w-4 h-4" }),
      "Публичная ссылка",
      isPublic && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1" })
    ] }) }),
    /* @__PURE__ */ jsx(PopoverContent, { className: "w-80", align: "end", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Опубликовать памятку" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Доступ без авторизации по ссылке" })
        ] }),
        /* @__PURE__ */ jsx(Switch, { checked: isPublic, onCheckedChange: togglePublic, disabled: busy || !publicHash })
      ] }),
      isPublic && url && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Публичная ссылка" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
            /* @__PURE__ */ jsx(Input, { value: url, readOnly: true, className: "text-xs font-mono" }),
            /* @__PURE__ */ jsx(Button, { size: "icon", variant: "outline", onClick: copy, className: "shrink-0", children: copied ? /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-emerald-500" }) : /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 pt-1", children: [
          /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: "border border-border rounded" }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: downloadQR, className: "gap-2", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
            "Скачать QR (PNG)"
          ] })
        ] })
      ] }),
      !isPublic && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "При выключении — ссылка перестаёт работать, по адресу будет 404." })
    ] }) })
  ] });
}
function buildProfileLine(p) {
  const parts = [];
  if (p.sex) {
    const s = String(p.sex).toLowerCase();
    if (s.startsWith("м") || s === "male" || s === "m") parts.push("мужчина");
    else if (s.startsWith("ж") || s === "female" || s === "f") parts.push("женщина");
  }
  if (p.age != null) parts.push(`${p.age} лет`);
  let head = parts.join(", ");
  if (p.diagnosisShort) head = head ? `${head}, ${p.diagnosisShort}` : p.diagnosisShort;
  return head || "Клиническая ситуация не уточнена";
}
const LIFESTYLE_CATS = ["lifestyle"];
function filterItems(input) {
  return input.items.filter((i) => {
    if (LIFESTYLE_CATS.includes(i.section_category)) return input.include.lifestyle;
    return true;
  });
}
function groupBySection(items) {
  return SECTIONS.map((s) => ({
    section: s,
    list: items.filter((i) => i.section_category === s.key)
  })).filter((g) => g.list.length > 0);
}
function itemLine(it) {
  const bits = [it.name_snapshot];
  if (it.dose != null) bits.push(`${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`);
  if (it.frequency) bits.push(it.frequency);
  if (it.duration_days != null) bits.push(`${it.duration_days} дн.`);
  if (it.day_pattern) bits.push(`дни: ${it.day_pattern}`);
  if (it.time_of_day && it.time_of_day.length) bits.push(it.time_of_day.join("/"));
  return bits.join(" · ");
}
function buildMarkdown(input) {
  const lines = [];
  lines.push(`# Терапевтический паттерн`);
  lines.push("");
  lines.push(`**Клиническая ситуация:** ${input.anonLevel === "profile" ? buildProfileLine(input.profile) : "—"}`);
  if (input.clinicalSummary.trim()) {
    lines.push("");
    lines.push(`## Клиническое назначение`);
    lines.push(input.clinicalSummary.trim());
  }
  if (input.include.duration) {
    lines.push("");
    lines.push(`**Длительность курса:** ${input.durationDays} дн.`);
  }
  lines.push("");
  lines.push(`## Состав терапии`);
  const groups = groupBySection(filterItems(input));
  groups.forEach((g) => {
    lines.push("");
    lines.push(`### ${g.section.label}`);
    g.list.forEach((it) => lines.push(`- ${itemLine(it)}`));
  });
  if (input.include.lab && input.lab.length > 0) {
    lines.push("");
    lines.push(`## Лабораторный контроль`);
    input.lab.forEach((l) => {
      const d = l.at_day != null ? ` (день ${l.at_day})` : "";
      lines.push(`- ${l.control_point || "—"}${d}`);
    });
  }
  if (input.include.cost && input.totalCost != null) {
    lines.push("");
    lines.push(`**Ориентировочная стоимость курса:** ${new Intl.NumberFormat("ru-RU").format(Math.round(input.totalCost))} ₽`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("**МАЦ — Медико-академический центр.** Автор: проф. Д.И. Тарусин.");
  lines.push("");
  lines.push("> _Информация представлена в образовательных целях, не является инструкцией к применению._");
  return lines.join("\n");
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
const FOOTER_DISCLAIMER = "Информация представлена в образовательных целях, не является инструкцией к применению.";
function PatternExportDialog({
  open,
  onOpenChange,
  items,
  durationDays,
  totalCost,
  lab,
  clinicalSummary,
  profile
}) {
  const [format2, setFormat] = useState("pdf");
  const [anonLevel, setAnonLevel] = useState("profile");
  const [incLab, setIncLab] = useState(true);
  const [incLifestyle, setIncLifestyle] = useState(true);
  const [incCost, setIncCost] = useState(true);
  const [incDuration, setIncDuration] = useState(true);
  const [summary, setSummary] = useState(clinicalSummary || "");
  const [busy, setBusy] = useState(false);
  const pngRef = useRef(null);
  const input = useMemo(() => ({
    format: format2,
    anonLevel,
    include: { items: true, lab: incLab, lifestyle: incLifestyle, cost: incCost, duration: incDuration },
    clinicalSummary: summary,
    durationDays,
    items,
    totalCost,
    lab,
    profile
  }), [format2, anonLevel, incLab, incLifestyle, incCost, incDuration, summary, durationDays, items, totalCost, lab, profile]);
  const groups = useMemo(() => groupBySection(filterItems(input)), [input]);
  const profileLine = useMemo(() => buildProfileLine(profile), [profile]);
  const pdfRef = useRef(null);
  const handleExport = async () => {
    setBusy(true);
    try {
      const ts = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      if (format2 === "markdown") {
        const md = buildMarkdown(input);
        downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `pattern-${ts}.md`);
      } else if (format2 === "png") {
        if (!pngRef.current) throw new Error("PNG layout not ready");
        const dataUrl = await toPng(pngRef.current, { pixelRatio: 1, cacheBust: true, width: 1080, height: 1080 });
        const blob = await (await fetch(dataUrl)).blob();
        downloadBlob(blob, `pattern-${ts}.png`);
      } else {
        if (!pdfRef.current) throw new Error("PDF layout not ready");
        await exportPdfFromHtml(pdfRef.current, `pattern-${ts}.pdf`);
      }
      toast({ title: "Экспортировано", description: `Файл pattern-${ts}.${format2 === "markdown" ? "md" : format2}` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Ошибка экспорта", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Share2, { className: "w-5 h-5" }),
        "Экспорт паттерна для презентации"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Анонимизированный паттерн без ФИО, № карты, дат и контактов. Для презентаций, блога, Telegram." })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: format2, onValueChange: (v) => setFormat(v), className: "mt-2", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid grid-cols-3 w-full", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "pdf", children: "PDF (A4)" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "png", children: "PNG (1080×1080)" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "markdown", children: "Markdown" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4 mt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Что включить" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsx(Checkbox, { checked: true, disabled: true }),
                " Назначения (всегда)"
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
                /* @__PURE__ */ jsx(Checkbox, { checked: incLab, onCheckedChange: (v) => setIncLab(!!v) }),
                " Лабконтроль"
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
                /* @__PURE__ */ jsx(Checkbox, { checked: incLifestyle, onCheckedChange: (v) => setIncLifestyle(!!v) }),
                " Образ жизни"
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
                /* @__PURE__ */ jsx(Checkbox, { checked: incCost, onCheckedChange: (v) => setIncCost(!!v) }),
                " Стоимость (агрегированно)"
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
                /* @__PURE__ */ jsx(Checkbox, { checked: incDuration, onCheckedChange: (v) => setIncDuration(!!v) }),
                " Длительность курса"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Уровень анонимизации" }),
            /* @__PURE__ */ jsxs(RadioGroup, { value: anonLevel, onValueChange: (v) => setAnonLevel(v), className: "mt-2 space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 text-sm cursor-pointer", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "full", id: "anon-full", className: "mt-0.5" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { children: "Полная" }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Только структура, без профиля" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 text-sm cursor-pointer", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "profile", id: "anon-profile", className: "mt-0.5" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { children: "Профильная" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground italic", children: [
                    "«",
                    profileLine,
                    "»"
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "cs", className: "text-xs font-semibold uppercase text-muted-foreground", children: "Клиническое назначение (редактируется)" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "cs",
              value: summary,
              onChange: (e) => setSummary(e.target.value),
              rows: 10,
              placeholder: "Краткое клиническое обоснование назначения (по умолчанию — из clinical_summary)…"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Будет показано как раздел «Клиническое назначение». Удаление поля скроет раздел." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "pdf", className: "mt-3", children: /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground border rounded-md p-2 bg-muted/30", children: "А4 портрет · брендирование МАЦ · подвал с подписью автора и дисклеймером." }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "png", className: "mt-3", children: /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground border rounded-md p-2 bg-muted/30", children: "1080×1080 для Instagram · тёмный фон, белая типографика, акцент МАЦ." }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "markdown", className: "mt-3", children: /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground border rounded-md p-2 bg-muted/30", children: ".md с заголовками — для Telegram-постов и блога." }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { position: "fixed", left: -99999, top: 0, pointerEvents: "none" }, children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: pngRef,
          style: {
            width: 1080,
            height: 1080,
            padding: 56,
            boxSizing: "border-box",
            background: "linear-gradient(135deg, #0a1a3a 0%, #0d2756 60%, #1a3c7a 100%)",
            color: "#ffffff",
            fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          },
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 800, letterSpacing: 1, color: "#9bc7ff" }, children: "МАЦ" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 14, opacity: 0.8, textTransform: "uppercase", letterSpacing: 2 }, children: "Терапевтический паттерн" })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 18, opacity: 0.85, marginBottom: 8 }, children: "Клиническая ситуация" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 28, fontWeight: 600, lineHeight: 1.25, marginBottom: 22 }, children: anonLevel === "profile" ? profileLine : "Структурный паттерн" }),
              summary.trim() && /* @__PURE__ */ jsx("div", { style: { fontSize: 15, opacity: 0.9, lineHeight: 1.45, marginBottom: 22, maxHeight: 130, overflow: "hidden" }, children: summary.trim() }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 16, opacity: 0.8, marginBottom: 6 }, children: "Состав терапии" }),
              /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", maxHeight: 460, overflow: "hidden" }, children: groups.map((g) => /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, lineHeight: 1.35 }, children: [
                /* @__PURE__ */ jsx("div", { style: { color: "#9bc7ff", fontWeight: 700, marginBottom: 2 }, children: g.section.label }),
                g.list.slice(0, 6).map((it, i) => /* @__PURE__ */ jsxs("div", { style: { opacity: 0.95 }, children: [
                  "• ",
                  compactItem(it)
                ] }, i)),
                g.list.length > 6 && /* @__PURE__ */ jsxs("div", { style: { opacity: 0.6 }, children: [
                  "+ ещё ",
                  g.list.length - 6
                ] })
              ] }, g.section.key)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 16, fontSize: 14, marginBottom: 14, opacity: 0.9 }, children: [
                incDuration && /* @__PURE__ */ jsxs("span", { children: [
                  "⏱ ",
                  durationDays,
                  " дн."
                ] }),
                incCost && totalCost != null && /* @__PURE__ */ jsxs("span", { children: [
                  "💵 ≈ ",
                  new Intl.NumberFormat("ru-RU").format(Math.round(totalCost)),
                  " ₽"
                ] }),
                incLab && lab.length > 0 && /* @__PURE__ */ jsxs("span", { children: [
                  "🧪 контроль: ",
                  lab.length
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 12 } }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "#9bc7ff" }, children: "Автор: проф. Д.И. Тарусин" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, opacity: 0.7, marginTop: 4, fontStyle: "italic" }, children: FOOTER_DISCLAIMER })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { ref: pdfRef, style: {
        width: 794,
        minHeight: 1123,
        padding: "56px 64px",
        boxSizing: "border-box",
        background: "#ffffff",
        color: "#0d172a",
        fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
        fontSize: 13,
        lineHeight: 1.45
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderBottom: "1.5px solid #143c82",
          paddingBottom: 8,
          marginBottom: 14
        }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 800, color: "#143c82", letterSpacing: 0.4 }, children: "МАЦ — Медико-академический центр" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#5b6b85", textTransform: "uppercase", letterSpacing: 1.4 }, children: "Терапевтический паттерн" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: "#143c82", marginBottom: 4 }, children: "Клиническая ситуация" }),
        /* @__PURE__ */ jsx("div", { style: { marginBottom: 14 }, children: anonLevel === "profile" ? profileLine : "Структурный паттерн без профилирования." }),
        summary.trim() && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: "#143c82", marginBottom: 4 }, children: "Клиническое назначение" }),
          /* @__PURE__ */ jsx("div", { style: { marginBottom: 14, whiteSpace: "pre-wrap" }, children: summary.trim() })
        ] }),
        incDuration && /* @__PURE__ */ jsxs("div", { style: { marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx("strong", { children: "Длительность курса:" }),
          " ",
          durationDays,
          " дн."
        ] }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: "#143c82", marginBottom: 6 }, children: "Состав терапии" }),
        groups.map((g) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: 10 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, color: "#143c82", marginBottom: 2 }, children: g.section.label }),
          g.list.map((it, i) => /* @__PURE__ */ jsxs("div", { style: { paddingLeft: 12, position: "relative" }, children: [
            /* @__PURE__ */ jsx("span", { style: { position: "absolute", left: 2 }, children: "•" }),
            formatItemLine(it)
          ] }, i))
        ] }, g.section.key)),
        incLab && lab.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: "#143c82", marginTop: 8, marginBottom: 4 }, children: "Лабораторный контроль" }),
          lab.map((l, i) => /* @__PURE__ */ jsxs("div", { style: { paddingLeft: 12, position: "relative" }, children: [
            /* @__PURE__ */ jsx("span", { style: { position: "absolute", left: 2 }, children: "•" }),
            l.control_point || "—",
            l.at_day != null ? ` (день ${l.at_day})` : ""
          ] }, i))
        ] }),
        incCost && totalCost != null && /* @__PURE__ */ jsxs("div", { style: { marginTop: 14, fontSize: 14 }, children: [
          /* @__PURE__ */ jsx("strong", { children: "Ориентировочная стоимость курса:" }),
          " ",
          new Intl.NumberFormat("ru-RU").format(Math.round(totalCost)),
          " ₽"
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { borderTop: "1px solid #c9d2e1", marginTop: 24, paddingTop: 8 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#143c82" }, children: "МАЦ · Автор: проф. Д.И. Тарусин" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontStyle: "italic", color: "#6b7a93", marginTop: 2 }, children: FOOTER_DISCLAIMER })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => onOpenChange(false), disabled: busy, children: "Отмена" }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleExport, disabled: busy || items.length === 0, className: "gap-2", children: [
        busy ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(FileDown, { className: "w-4 h-4" }),
        "Скачать ",
        format2.toUpperCase()
      ] })
    ] })
  ] }) });
}
function formatItemLine(it) {
  const bits = [it.name_snapshot];
  if (it.dose != null) bits.push(`${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`);
  if (it.frequency) bits.push(it.frequency);
  if (it.duration_days != null) bits.push(`${it.duration_days} дн.`);
  if (it.day_pattern) bits.push(`дни: ${it.day_pattern}`);
  return bits.join(" · ");
}
function compactItem(it) {
  const bits = [it.name_snapshot];
  if (it.dose != null) bits.push(`${it.dose}${it.dose_unit ? it.dose_unit : ""}`);
  if (it.frequency) bits.push(it.frequency);
  return bits.join(" · ");
}
async function exportPdfFromHtml(node, filename) {
  const pxWidth = node.offsetWidth || 794;
  const pxHeight = node.scrollHeight || 1123;
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    width: pxWidth,
    height: pxHeight,
    backgroundColor: "#ffffff"
  });
  const mmPerPx = 210 / pxWidth;
  const fullHeightMm = pxHeight * mmPerPx;
  const pageMm = 297;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let consumedMm = 0;
  let isFirst = true;
  while (consumedMm < fullHeightMm - 0.5) {
    if (!isFirst) doc.addPage();
    isFirst = false;
    doc.addImage(dataUrl, "PNG", 0, -consumedMm, 210, fullHeightMm, void 0, "FAST");
    consumedMm += pageMm;
  }
  doc.save(filename);
}
const CLINIC_PHONE = "+7 (495) 933-66-55";
function firstNamePatronymic(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 3) return `${parts[1]} ${parts[2]}`;
  if (parts.length === 2) return parts[1];
  return parts[0] || "";
}
function SendMemoDialog({ open, onOpenChange, planId, publicHash, durationDays, patient }) {
  const memoUrl = useMemo(() => {
    if (!publicHash) return "";
    return `${window.location.origin}/p/${publicHash}`;
  }, [publicHash]);
  const defaultMessage = useMemo(() => {
    const name = patient ? firstNamePatronymic(patient.full_name) : "";
    return `${name ? name + ", " : ""}выслана памятка по программе на ближайшие ${durationDays} дней. По вопросам — контакты МАЦ: ${CLINIC_PHONE}`;
  }, [patient, durationDays]);
  const hasTelegram = !!(patient == null ? void 0 : patient.telegram_username);
  const hasEmail = !!(patient == null ? void 0 : patient.email);
  const [channel, setChannel] = useState("link");
  const [contentKind, setContentKind] = useState("link");
  const [message, setMessage] = useState(defaultMessage);
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);
  useEffect(() => {
    if (!open) return;
    if (channel === "email") setRecipient((patient == null ? void 0 : patient.email) || "");
    else if (channel === "telegram") setRecipient((patient == null ? void 0 : patient.telegram_username) || "");
    else setRecipient("");
  }, [channel, patient, open]);
  async function buildPdfAndUpload() {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFontSize(16);
      doc.text("Памятка по курсу лечения", 40, 60);
      doc.setFontSize(11);
      doc.text(`Пациент: ${(patient == null ? void 0 : patient.full_name) || ""}`, 40, 90);
      doc.text(`Длительность: ${durationDays} дн.`, 40, 108);
      doc.setFontSize(10);
      const split = doc.splitTextToSize(
        "Подробная памятка доступна по онлайн-ссылке. Этот PDF — краткая справка. МАЦ Тарусин. " + CLINIC_PHONE,
        500
      );
      doc.text(split, 40, 140);
      if (memoUrl) doc.textWithLink("Открыть онлайн-памятку", 40, 200, { url: memoUrl });
      const blob = doc.output("blob");
      const path = `${planId}/memo-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("memo-pdfs").upload(path, blob, {
        contentType: "application/pdf",
        upsert: true
      });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage.from("memo-pdfs").createSignedUrl(path, 60 * 60 * 24 * 14);
      if (sErr) throw sErr;
      return signed.signedUrl;
    } catch (e) {
      console.error(e);
      toast({ title: "Не удалось подготовить PDF", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      return null;
    }
  }
  async function handleCopyLink() {
    if (!memoUrl) {
      toast({ title: "Сделайте лист публичным", variant: "destructive" });
      return;
    }
    await navigator.clipboard.writeText(memoUrl);
    toast({ title: "Ссылка скопирована" });
    await supabase.functions.invoke("send-patient-memo", {
      body: {
        plan_id: planId,
        channel: "link",
        content_kind: "link",
        message: "",
        memo_url: memoUrl
      }
    });
  }
  async function handleSend() {
    if (channel === "link") {
      await handleCopyLink();
      return;
    }
    if (!memoUrl && contentKind !== "pdf") {
      toast({ title: "Сделайте лист публичным или выберите только PDF", variant: "destructive" });
      return;
    }
    if (!recipient.trim()) {
      toast({ title: `Укажите ${channel === "email" ? "email" : "Telegram"} получателя`, variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      let pdfUrl;
      if (contentKind !== "link") {
        const u = await buildPdfAndUpload();
        if (!u) {
          setSending(false);
          return;
        }
        pdfUrl = u;
      }
      const { data, error } = await supabase.functions.invoke("send-patient-memo", {
        body: {
          plan_id: planId,
          channel,
          content_kind: contentKind,
          message,
          recipient: recipient.trim(),
          memo_url: memoUrl,
          pdf_url: pdfUrl
        }
      });
      if (error) throw error;
      if ((data == null ? void 0 : data.ok) === false) throw new Error((data == null ? void 0 : data.error) || "Ошибка отправки");
      toast({ title: "Памятка отправлена" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Не удалось отправить",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Отправить памятку пациенту" }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-sm mb-2 block", children: "Канал" }),
        /* @__PURE__ */ jsxs(RadioGroup, { value: channel, onValueChange: (v) => setChannel(v), className: "flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ jsx(RadioGroupItem, { value: "email", id: "ch-email" }),
            /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4" }),
            " Email ",
            !hasEmail && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "(нет в карте)" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ jsx(RadioGroupItem, { value: "telegram", id: "ch-tg" }),
            /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
            " Telegram ",
            !hasTelegram && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "(нет в карте)" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ jsx(RadioGroupItem, { value: "link", id: "ch-link" }),
            /* @__PURE__ */ jsx(Link$1, { className: "w-4 h-4" }),
            " Скопировать ссылку"
          ] })
        ] })
      ] }),
      channel !== "link" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm mb-2 block", children: "Что отправить" }),
          /* @__PURE__ */ jsxs(RadioGroup, { value: contentKind, onValueChange: (v) => setContentKind(v), className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx(RadioGroupItem, { value: "link", id: "ck-link" }),
              " Только ссылка"
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx(RadioGroupItem, { value: "pdf", id: "ck-pdf" }),
              " Только PDF"
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx(RadioGroupItem, { value: "both", id: "ck-both" }),
              " Оба"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Получатель" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: recipient,
              onChange: (e) => setRecipient(e.target.value),
              placeholder: channel === "email" ? "patient@example.com" : "@username или chat_id"
            }
          ),
          channel === "telegram" && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Бот должен иметь доступ к чату/пользователю. Лучше указывать числовой chat_id." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Сообщение" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 4, value: message, onChange: (e) => setMessage(e.target.value) })
        ] })
      ] }),
      channel === "link" && /* @__PURE__ */ jsx("div", { className: "rounded-md border p-3 bg-muted/30 text-sm break-all", children: memoUrl || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Лист ещё не публичный — включите публичную ссылку." }) })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => onOpenChange(false), disabled: sending, children: "Отмена" }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleSend, disabled: sending, className: "gap-2", children: [
        sending ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : channel === "link" ? /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
        channel === "link" ? "Скопировать" : "Отправить"
      ] })
    ] })
  ] }) });
}
function buildEntries(p) {
  const list = SECTIONS.map((s) => ({
    key: s.key,
    label: s.short,
    icon: s.icon,
    count: p.counts[s.key] || 0
  }));
  if (p.labControlEnabled) list.push({ key: "lab-control", label: "Лабконтроль", icon: FlaskConical });
  if (p.hasPlan) list.push({ key: "cost", label: "Стоимость", icon: Wallet });
  if (p.isPublic) list.push({ key: "public", label: "Публикация", icon: Share2 });
  return list;
}
function scrollToSection(key) {
  const el = document.querySelector(`[data-section-key="${key}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function useActiveSection(keys) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    const targets = keys.map((k) => document.querySelector(`[data-section-key="${k}"]`)).filter((x) => !!x);
    if (!targets.length) return;
    const visible = /* @__PURE__ */ new Map();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const k = e.target.getAttribute("data-section-key");
          if (!k) continue;
          if (e.isIntersecting) visible.set(k, e.intersectionRatio);
          else visible.delete(k);
        }
        let best = null;
        let bestRatio = -1;
        for (const [k, r] of visible) {
          if (r > bestRatio) {
            bestRatio = r;
            best = k;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, [keys.join("|")]);
  return active;
}
function TOCList({ entries, active, collapsed, onPick }) {
  return /* @__PURE__ */ jsx("nav", { className: "flex flex-col gap-0.5", children: entries.map((e) => {
    const Icon = e.icon;
    const isActive = active === e.key;
    const empty = e.count === 0;
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => onPick(e.key),
        title: collapsed ? `${e.label}${e.count ? ` (${e.count})` : ""}` : void 0,
        className: cn(
          "group flex items-center gap-2 rounded-md text-left transition-colors min-h-[36px]",
          collapsed ? "justify-center px-0 w-10" : "px-2",
          isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          empty && !isActive && "opacity-60"
        ),
        children: [
          /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 shrink-0" }),
          !collapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm truncate flex-1", children: e.label }),
            e.count != null && e.count > 0 && /* @__PURE__ */ jsx(Badge, { variant: isActive ? "default" : "secondary", className: "h-5 px-1.5 text-[10px]", children: e.count })
          ] })
        ]
      },
      e.key
    );
  }) });
}
function EditorTOC(props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const entries = buildEntries(props);
  const active = useActiveSection(entries.map((e) => e.key));
  const handlePick = (k) => {
    scrollToSection(k);
    setMobileOpen(false);
  };
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileOpen(false);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "lg:hidden fixed bottom-4 left-4 z-30", children: /* @__PURE__ */ jsxs(Sheet, { open: mobileOpen, onOpenChange: setMobileOpen, children: [
      /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "icon", className: "h-12 w-12 rounded-full shadow-lg", "aria-label": "Содержание", children: /* @__PURE__ */ jsx(Menu, { className: "w-5 h-5" }) }) }),
      /* @__PURE__ */ jsxs(SheetContent, { side: "left", className: "w-72 p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-2", children: "Содержание" }),
        /* @__PURE__ */ jsx(TOCList, { entries, active, collapsed: false, onPick: handlePick }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 pt-3 border-t", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "w-full justify-start gap-2", onClick: scrollTop, children: [
          /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }),
          "К началу"
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: cn(
          "hidden lg:flex flex-col shrink-0 sticky self-start top-4 max-h-[calc(100vh-2rem)] overflow-y-auto",
          "border rounded-lg bg-card p-2 transition-[width] duration-200",
          collapsed ? "w-12" : "w-60"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: cn("flex items-center mb-2", collapsed ? "justify-center" : "justify-between px-1"), children: [
            !collapsed && /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Содержание" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-7 w-7",
                onClick: () => setCollapsed((c) => !c),
                title: collapsed ? "Развернуть" : "Свернуть",
                children: collapsed ? /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(TOCList, { entries, active, collapsed, onPick: handlePick }),
          /* @__PURE__ */ jsx("div", { className: cn("mt-3 pt-2 border-t", collapsed ? "px-0" : "px-1"), children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: scrollTop,
              className: cn("w-full gap-2", collapsed ? "px-0 justify-center" : "justify-start"),
              title: "К началу",
              children: [
                /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }),
                !collapsed && /* @__PURE__ */ jsx("span", { children: "К началу" })
              ]
            }
          ) })
        ]
      }
    )
  ] });
}
const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
function fromCatalog(c, section) {
  return {
    client_id: newId(),
    catalog_id: c.id,
    section_category: section,
    name_snapshot: c.name,
    inn_snapshot: c.inn,
    form_snapshot: c.form,
    dose: c.default_dose,
    dose_unit: c.dose_unit,
    dilution_volume: c.default_dilution_volume,
    dilution_solvent: c.default_dilution_solvent,
    frequency: c.default_frequency,
    duration_days: c.default_duration_days,
    time_of_day: c.time_of_day_default || [],
    infusion_rate: c.infusion_rate,
    notes: c.notes,
    is_off_label: c.is_off_label,
    light_sensitive: c.light_sensitive,
    glucose_only: c.glucose_only,
    dose_range_min: c.dose_range_min,
    dose_range_max: c.dose_range_max,
    repertory_remedy_id: c.repertory_remedy_id ?? null,
    potency: c.potency ?? null,
    dosing_schedule: c.dosing_schedule ?? null
  };
}
function TreatmentPlanEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [issuedAt, setIssuedAt] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [durationDays, setDurationDays] = useState(10);
  const [mode, setMode] = useState("flat");
  const [diagnosis, setDiagnosis] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [patternExportOpen, setPatternExportOpen] = useState(false);
  const [sendMemoOpen, setSendMemoOpen] = useState(false);
  const [currentTotalCost, setCurrentTotalCost] = useState(0);
  const [courseNumber, setCourseNumber] = useState(null);
  const [patientAge, setPatientAge] = useState(null);
  const [showCostInPrint, setShowCostInPrint] = useState(false);
  const [labControlEnabled, setLabControlEnabled] = useState(false);
  const [labPoints, setLabPoints] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [publicHash, setPublicHash] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("iv_drip");
  const activeItemRef = useRef(null);
  const isNew = !id;
  useProtocolFragmentReceiver({ patientId: patient == null ? void 0 : patient.id, kind: "treatment_plan" });
  const ingestParsedItems = useCallback(async (parsed) => {
    if (!parsed.length) return;
    const names = Array.from(new Set(parsed.map((p) => p.name).filter(Boolean)));
    let catalogRows = [];
    if (names.length) {
      const orExpr = names.map((n) => `name.ilike.%${n.replace(/[,()]/g, " ").trim().split(/\s+/)[0]}%`).join(",");
      const { data } = await supabase.from("treatment_catalog").select("*").eq("is_active", true).or(orExpr).limit(200);
      catalogRows = data || [];
    }
    const findMatch = (name, section) => {
      const lname = name.toLowerCase();
      const candidates = catalogRows.filter((c) => {
        const n = (c.name || "").toLowerCase();
        const inn = (c.inn || "").toLowerCase();
        return n && (lname.includes(n) || n.includes(lname) || inn && lname.includes(inn));
      });
      return candidates.find((c) => c.category === section) || candidates[0] || null;
    };
    const newItems = parsed.map((p) => {
      var _a;
      const match = findMatch(p.name, p.section_category);
      const base = match ? {
        client_id: newId(),
        catalog_id: match.id,
        section_category: p.section_category || match.category,
        name_snapshot: match.name,
        inn_snapshot: match.inn,
        form_snapshot: match.form,
        dose: p.dose ?? match.default_dose,
        dose_unit: p.dose_unit ?? match.dose_unit,
        dilution_volume: match.default_dilution_volume,
        dilution_solvent: match.default_dilution_solvent,
        frequency: p.frequency ?? match.default_frequency,
        duration_days: p.duration_days ?? match.default_duration_days,
        time_of_day: ((_a = p.time_of_day) == null ? void 0 : _a.length) ? p.time_of_day : match.time_of_day_default || [],
        infusion_rate: match.infusion_rate,
        notes: p.notes ?? match.notes,
        is_off_label: !!match.is_off_label,
        light_sensitive: match.light_sensitive,
        glucose_only: match.glucose_only,
        dose_range_min: match.dose_range_min,
        dose_range_max: match.dose_range_max,
        repertory_remedy_id: match.repertory_remedy_id ?? null,
        potency: match.potency ?? null,
        dosing_schedule: match.dosing_schedule ?? null
      } : {
        client_id: newId(),
        catalog_id: null,
        section_category: p.section_category,
        name_snapshot: p.name,
        inn_snapshot: null,
        form_snapshot: null,
        dose: p.dose,
        dose_unit: p.dose_unit,
        dilution_volume: null,
        dilution_solvent: null,
        frequency: p.frequency,
        duration_days: p.duration_days,
        time_of_day: p.time_of_day || [],
        notes: p.notes,
        is_off_label: false
      };
      if (mode === "scheduled" && !base.day_pattern) base.day_pattern = `1-${durationDays}`;
      return base;
    });
    setItems((prev) => [...prev, ...newItems]);
    const matched = newItems.filter((i) => i.catalog_id).length;
    toast({
      title: `Добавлено ${newItems.length} позиций из ИИ-ассистента`,
      description: matched > 0 ? `${matched} из каталога, ${newItems.length - matched} как свободный текст` : "все позиции как свободный текст"
    });
  }, [mode, durationDays]);
  useEffect(() => {
    const unsub = subscribePlanItems((msg) => ingestParsedItems(msg.items), { patientId: patient == null ? void 0 : patient.id });
    const queued = popQueuedPlanItems({ patientId: patient == null ? void 0 : patient.id });
    if (queued.length) {
      setTimeout(() => queued.forEach((m) => ingestParsedItems(m.items)), 300);
    }
    return () => unsub();
  }, [patient == null ? void 0 : patient.id, ingestParsedItems]);
  useEffect(() => {
    if (!patient) return;
    setActiveContext({
      patientId: patient.id,
      patientName: patient.full_name,
      targetId: id || "new",
      kind: "treatment_plan",
      url: window.location.pathname + window.location.search
    });
    return () => clearActiveContextIfMatches(id || "new");
  }, [patient == null ? void 0 : patient.id, patient == null ? void 0 : patient.full_name, id]);
  const undoStackRef = useRef([]);
  const prevItemsRef = useRef([]);
  const skipNextSnapshotRef = useRef(false);
  useEffect(() => {
    if (skipNextSnapshotRef.current) {
      skipNextSnapshotRef.current = false;
      prevItemsRef.current = items;
      return;
    }
    if (prevItemsRef.current !== items && prevItemsRef.current.length + items.length > 0) {
      undoStackRef.current.push(prevItemsRef.current);
      if (undoStackRef.current.length > 10) undoStackRef.current.shift();
    }
    prevItemsRef.current = items;
  }, [items]);
  const undo = useCallback(() => {
    const snap = undoStackRef.current.pop();
    if (!snap) {
      toast({ title: "Нечего отменять" });
      return;
    }
    skipNextSnapshotRef.current = true;
    setItems(snap);
    toast({ title: "Действие отменено" });
  }, []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: id ? `/admin/treatment-plans/${id}` : "/admin/treatment-plans/new" } });
    }
  }, [user, isAdmin, loading, navigate, id]);
  useEffect(() => {
    (async () => {
      setBusy(true);
      if (isNew) {
        const pid = params.get("patientId");
        if (pid) {
          const { data } = await supabase.from("patients").select("*").eq("id", pid).maybeSingle();
          if (data) setPatient(data);
        }
        setBusy(false);
        return;
      }
      const { data: plan } = await supabase.from("treatment_plans").select("*, patient:patients(*)").eq("id", id).maybeSingle();
      if (plan) {
        setPatient(plan.patient);
        setIssuedAt(plan.issued_at);
        setDurationDays(plan.duration_days);
        setMode(plan.mode || "flat");
        setDiagnosis(plan.diagnosis_short || "");
        setSummary(plan.clinical_summary || "");
        setStatus(plan.status);
        setCourseNumber(plan.course_number ?? null);
        setShowCostInPrint(!!plan.show_cost_in_print);
        setLabControlEnabled(!!plan.lab_control_enabled);
        setIsPublic(!!plan.is_public);
        setPublicHash(plan.public_hash || null);
        const { data: rows } = await supabase.from("treatment_plan_items").select("*").eq("plan_id", id).order("section_category").order("order_index");
        setItems((rows || []).map((r) => ({
          client_id: newId(),
          catalog_id: r.catalog_id,
          section_category: r.section_category,
          name_snapshot: r.name_snapshot,
          inn_snapshot: r.inn_snapshot,
          form_snapshot: r.form_snapshot,
          dose: r.dose,
          dose_unit: r.dose_unit,
          dilution_volume: r.dilution_volume,
          dilution_solvent: r.dilution_solvent,
          frequency: r.frequency,
          duration_days: r.duration_days,
          day_pattern: r.day_pattern,
          time_of_day: r.time_of_day || [],
          infusion_rate: r.infusion_rate,
          route_override: r.route_override,
          notes: r.notes,
          is_off_label: r.is_off_label,
          prn_estimated_doses: r.prn_estimated_doses,
          repertory_remedy_id: r.repertory_remedy_id,
          potency: r.potency,
          dosing_schedule: r.dosing_schedule
        })));
        const { data: lc } = await supabase.from("treatment_plan_lab_control").select("*").eq("plan_id", id).order("order_index");
        setLabPoints((lc || []).map((p) => ({
          client_id: newId(),
          id: p.id,
          control_point: p.control_point || "",
          at_day: p.at_day,
          test_ids: p.test_ids || [],
          custom_tests: p.custom_tests || [],
          notes: p.notes,
          order_index: p.order_index
        })));
      }
      setBusy(false);
    })();
  }, [id, isNew, params]);
  useEffect(() => {
    if (!(patient == null ? void 0 : patient.birth_date)) {
      setPatientAge(null);
      return;
    }
    const b = new Date(patient.birth_date);
    const d = new Date(issuedAt);
    let a = d.getFullYear() - b.getFullYear();
    const m = d.getMonth() - b.getMonth();
    if (m < 0 || m === 0 && d.getDate() < b.getDate()) a--;
    setPatientAge(a);
  }, [patient, issuedAt]);
  const bulkUpdate = (updater) => {
    setItems((prev) => prev.map((it) => {
      const p = updater(it);
      return p ? { ...it, ...p } : it;
    }));
  };
  const innCounts = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    items.forEach((it) => {
      if (it.inn_snapshot) m.set(it.inn_snapshot, (m.get(it.inn_snapshot) || 0) + 1);
    });
    return m;
  }, [items]);
  const addItem = (section, c) => {
    setItems((prev) => {
      const it = fromCatalog(c, section);
      if (mode === "scheduled" && !it.day_pattern) it.day_pattern = `1-${durationDays}`;
      return [...prev, it];
    });
  };
  const updateItem = (cid, patch) => setItems((prev) => prev.map((i) => i.client_id === cid ? { ...i, ...patch } : i));
  const removeItem = (cid) => setItems((prev) => prev.filter((i) => i.client_id !== cid));
  const toggleMode = () => {
    if (mode === "flat") {
      setItems((prev) => prev.map((it) => ({ ...it, day_pattern: it.day_pattern || `1-${durationDays}` })));
      setMode("scheduled");
    } else {
      setMode("flat");
    }
  };
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const a = prev.find((i) => i.client_id === active.id);
      const b = prev.find((i) => i.client_id === over.id);
      if (!a || !b || a.section_category !== b.section_category) return prev;
      const oldIdx = prev.findIndex((i) => i.client_id === active.id);
      const newIdx = prev.findIndex((i) => i.client_id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };
  const applyTemplate = (newItems, strategy, suggestedMode, suggestedDuration) => {
    if (suggestedMode === "scheduled" && mode === "flat") {
      if (confirm("Шаблон создан в режиме «Расписание по дням». Переключить лист в этот режим?")) {
        setMode("scheduled");
        if (suggestedDuration) setDurationDays(suggestedDuration);
      }
    }
    setItems((prev) => strategy === "replace" ? newItems : [...prev, ...newItems]);
    toast({ title: strategy === "replace" ? "Лист заменён шаблоном" : `Добавлено ${newItems.length} позиций` });
  };
  const save = async (newStatus) => {
    if (!patient) {
      toast({ title: "Выберите пациента", variant: "destructive" });
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const planPayload = {
        patient_id: patient.id,
        issued_at: issuedAt,
        mode,
        duration_days: durationDays,
        diagnosis_short: diagnosis || null,
        clinical_summary: summary || null,
        status: newStatus || status,
        created_by: user.id,
        show_cost_in_print: showCostInPrint,
        lab_control_enabled: labControlEnabled
      };
      if (courseNumber !== null && !isNew) planPayload.course_number = courseNumber;
      let planId = id;
      if (isNew) {
        const { data, error } = await supabase.from("treatment_plans").insert(planPayload).select("id").single();
        if (error) throw error;
        planId = data.id;
      } else {
        const { error } = await supabase.from("treatment_plans").update(planPayload).eq("id", id);
        if (error) throw error;
        await supabase.from("treatment_plan_items").delete().eq("plan_id", id);
        await supabase.from("treatment_plan_lab_control").delete().eq("plan_id", id);
      }
      if (items.length) {
        const rows = items.map((it, idx) => ({
          plan_id: planId,
          catalog_id: it.catalog_id || null,
          section_category: it.section_category,
          order_index: idx,
          name_snapshot: it.name_snapshot,
          inn_snapshot: it.inn_snapshot,
          form_snapshot: it.form_snapshot,
          dose: it.dose,
          dose_unit: it.dose_unit,
          dilution_volume: it.dilution_volume,
          dilution_solvent: it.dilution_solvent,
          frequency: it.frequency,
          duration_days: it.duration_days ?? durationDays,
          day_pattern: it.day_pattern || null,
          time_of_day: it.time_of_day,
          infusion_rate: it.infusion_rate,
          route_override: it.route_override,
          notes: it.notes,
          is_off_label: it.is_off_label,
          prn_estimated_doses: it.prn_estimated_doses ?? null,
          repertory_remedy_id: it.repertory_remedy_id ?? null,
          potency: it.potency ?? null,
          dosing_schedule: it.dosing_schedule ?? null
        }));
        const { error: e2 } = await supabase.from("treatment_plan_items").insert(rows);
        if (e2) throw e2;
      }
      if (labControlEnabled && labPoints.length) {
        const lcRows = labPoints.map((p, idx) => ({
          plan_id: planId,
          control_point: p.control_point || null,
          at_day: p.at_day,
          test_ids: p.test_ids,
          custom_tests: p.custom_tests,
          notes: p.notes,
          order_index: idx
        }));
        const { error: e3 } = await supabase.from("treatment_plan_lab_control").insert(lcRows);
        if (e3) throw e3;
      }
      if (newStatus) setStatus(newStatus);
      toast({ title: "Сохранено" });
      if (isNew && planId) navigate(`/admin/treatment-plans/${planId}`, { replace: true });
    } catch (e) {
      toast({ title: "Ошибка сохранения", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!id || !confirm("Удалить лист назначений?")) return;
    const { error } = await supabase.from("treatment_plans").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/admin/treatment-plans");
  };
  const exportDocx = async () => {
    if (!patient) {
      toast({ title: "Выберите пациента", variant: "destructive" });
      return;
    }
    try {
      const catIds = Array.from(new Set(items.map((i) => i.catalog_id).filter(Boolean)));
      const [{ data: cat }, { data: lc }] = await Promise.all([
        catIds.length ? supabase.from("treatment_catalog").select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_source_preference").in("id", catIds) : Promise.resolve({ data: [] }),
        id ? supabase.from("treatment_plan_lab_control").select("*, lab_tests_catalog(*)").eq("plan_id", id).order("order_index") : Promise.resolve({ data: [] })
      ]);
      const catalogMap = /* @__PURE__ */ new Map();
      const catalogPatientMap = /* @__PURE__ */ new Map();
      (cat || []).forEach((c) => {
        catalogMap.set(c.id, c);
        if (c.patient_info) catalogPatientMap.set(c.id, c.patient_info);
      });
      const acupunctureMap = await fetchIrtForCatalogIds(catIds);
      const allTestIds = /* @__PURE__ */ new Set();
      (lc || []).forEach((row) => (row.test_ids || []).forEach((tid) => allTestIds.add(tid)));
      let testNameMap = /* @__PURE__ */ new Map();
      if (allTestIds.size) {
        const { data: lt } = await supabase.from("lab_tests_catalog").select("id, name, short_name").in("id", Array.from(allTestIds));
        (lt || []).forEach((t) => testNameMap.set(t.id, t.short_name || t.name));
      }
      const labControl = (lc || []).map((row) => ({
        control_point: row.control_point,
        at_day: row.at_day,
        tests: [
          ...(row.test_ids || []).map((tid) => testNameMap.get(tid)).filter(Boolean),
          ...row.custom_tests || []
        ],
        notes: row.notes
      }));
      await generatePlanDocx({
        plan: {
          id: id || "",
          issued_at: issuedAt,
          duration_days: durationDays,
          diagnosis_short: diagnosis || null,
          clinical_summary: summary || null,
          mode,
          course_number: courseNumber,
          show_cost_in_print: showCostInPrint,
          lab_control_enabled: labControlEnabled
        },
        patient: { full_name: patient.full_name, birth_date: patient.birth_date },
        patientAge,
        items: items.map((i) => ({
          catalog_id: i.catalog_id,
          section_category: i.section_category,
          name_snapshot: i.name_snapshot,
          inn_snapshot: i.inn_snapshot,
          dose: i.dose,
          dose_unit: i.dose_unit,
          dilution_volume: i.dilution_volume,
          dilution_solvent: i.dilution_solvent,
          frequency: i.frequency,
          duration_days: i.duration_days,
          time_of_day: i.time_of_day,
          infusion_rate: i.infusion_rate,
          route_override: i.route_override,
          notes: i.notes,
          is_off_label: i.is_off_label,
          day_pattern: i.day_pattern,
          prn_estimated_doses: i.prn_estimated_doses
        })),
        labControl,
        catalogMap,
        catalogPatientMap,
        acupunctureMap
      });
      toast({ title: "DOCX скачан" });
    } catch (e) {
      toast({ title: "Ошибка экспорта DOCX", description: e.message, variant: "destructive" });
    }
  };
  const duplicateActive = useCallback(() => {
    const cid = activeItemRef.current;
    if (!cid) {
      toast({ title: "Нет активной позиции" });
      return;
    }
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.client_id === cid);
      if (idx < 0) return prev;
      const src = prev[idx];
      const copy = { ...src, client_id: newId() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    toast({ title: "Позиция продублирована" });
  }, []);
  const addFromPalette = useCallback((section, c) => {
    setItems((prev) => {
      const it = fromCatalog(c, section);
      if (mode === "scheduled" && !it.day_pattern) it.day_pattern = `1-${durationDays}`;
      activeItemRef.current = it.client_id;
      return [...prev, it];
    });
    setActiveSection(section);
    toast({ title: `Добавлено: ${c.name}` });
  }, [mode, durationDays]);
  useEffect(() => {
    const onFocus = (e) => {
      var _a, _b, _c, _d;
      const el = (_b = (_a = e.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, "[data-item-id]");
      if (el) {
        activeItemRef.current = el.getAttribute("data-item-id");
        const sec = el.getAttribute("data-item-section");
        if (sec) setActiveSection(sec);
      }
      const secEl = (_d = (_c = e.target) == null ? void 0 : _c.closest) == null ? void 0 : _d.call(_c, "[data-section-key]");
      if (secEl) {
        const sk = secEl.getAttribute("data-section-key");
        if (sk) setActiveSection(sk);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      const mod2 = e.metaKey || e.ctrlKey;
      const target = e.target;
      const inField = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (!mod2 && !inField && (e.key === "?" || e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHotkeysOpen(true);
        return;
      }
      if (!mod2) return;
      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          save();
          break;
        case "p":
          if (!id) return;
          e.preventDefault();
          window.open(`/admin/treatment-plans/${id}/print`, "_blank");
          break;
        case "k":
          e.preventDefault();
          setPaletteOpen(true);
          break;
        case "e":
          if (isNew) return;
          e.preventDefault();
          setExportMenuOpen(true);
          break;
        case "h":
          if (isNew || status !== "issued") return;
          e.preventDefault();
          setHistoryOpen(true);
          break;
        case "d":
          if (!activeItemRef.current) return;
          e.preventDefault();
          duplicateActive();
          break;
        case "z":
          if (e.shiftKey) return;
          e.preventDefault();
          undo();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, isNew, status, duplicateActive, undo]);
  if (loading || busy) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user) return null;
  const grouped = SECTIONS.map((s) => ({ section: s, list: items.filter((i) => i.section_category === s.key) }));
  const sectionCounts = grouped.reduce((acc, g) => {
    acc[g.section.key] = g.list.length;
    return acc;
  }, {});
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-6 max-w-7xl flex gap-6 items-start", children: [
    /* @__PURE__ */ jsx(
      EditorTOC,
      {
        counts: sectionCounts,
        labControlEnabled,
        isPublic,
        hasPlan: items.length > 0
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 max-w-5xl", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin/treatment-plans", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К списку листов"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2 flex-wrap", children: [
            isNew ? "Новый лист назначений" : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Лист назначений ",
              courseNumber != null && /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
                "№ ",
                courseNumber
              ] })
            ] }),
            !isNew && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: status === "draft" ? "черновик" : status === "issued" ? "выписан" : "архив" })
          ] }),
          !isNew && patient && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mt-0.5", children: [
            "для ",
            patient.full_name,
            patientAge !== null ? `, ${patientAge} г.` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setApplyOpen(true), className: "gap-2", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
            "Загрузить из шаблона"
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setSaveAsOpen(true), className: "gap-2", disabled: items.length === 0, children: [
            /* @__PURE__ */ jsx(BookMarked, { className: "w-4 h-4" }),
            "Сохранить как шаблон"
          ] }),
          !isNew && status === "issued" && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setHistoryOpen(true), className: "gap-2", children: [
            /* @__PURE__ */ jsx(History, { className: "w-4 h-4" }),
            "История"
          ] }),
          !isNew && /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${id}/print`, target: "_blank", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
            "Печать"
          ] }) }),
          !isNew && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: exportDocx, className: "gap-2", disabled: items.length === 0, children: [
            /* @__PURE__ */ jsx(FileDown, { className: "w-4 h-4" }),
            "DOCX"
          ] }),
          !isNew && /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${id}/memo`, target: "_blank", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4" }),
            "Памятка"
          ] }) }),
          !isNew && id && patient && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setSendMemoOpen(true), className: "gap-2", children: [
            /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
            "Отправить пациенту"
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setPatternExportOpen(true), className: "gap-2", disabled: items.length === 0, children: [
            /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" }),
            "Экспорт паттерна"
          ] }),
          /* @__PURE__ */ jsx(
            WritePrescriptionsButton,
            {
              items,
              patientId: patient == null ? void 0 : patient.id,
              patientName: patient == null ? void 0 : patient.full_name
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "gap-2",
              disabled: items.filter((i) => i.catalog_id).length === 0,
              onClick: async () => {
                const catalog_ids = Array.from(new Set(items.map((i) => i.catalog_id).filter(Boolean)));
                if (!catalog_ids.length) return;
                toast({ title: "Парсинг цен запущен", description: `Обновляю ${catalog_ids.length} позиций. Это займёт 1–3 минуты.` });
                const { data, error } = await supabase.functions.invoke("parse-drug-prices", { body: { catalog_ids, async: true } });
                if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                else toast({ title: "В работе", description: `Запущено: ${(data == null ? void 0 : data.count) ?? catalog_ids.length}. Цены обновятся в каталоге автоматически.` });
              },
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                "Парсинг цен"
              ]
            }
          ),
          !isNew && id && /* @__PURE__ */ jsx(
            PublicLinkPopover,
            {
              planId: id,
              publicHash,
              isPublic,
              onChange: (v) => setIsPublic(v.is_public)
            }
          ),
          /* @__PURE__ */ jsxs(Button, { onClick: () => save(), disabled: saving, className: "gap-2", children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
            "Сохранить"
          ] }),
          !isNew && status === "draft" && /* @__PURE__ */ jsx(Button, { onClick: () => save("issued"), disabled: saving, variant: "default", children: "Выписать" }),
          !isNew && /* @__PURE__ */ jsx(Button, { onClick: remove, variant: "ghost", size: "icon", className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden gap-2 flex-wrap items-center", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: () => save(), disabled: saving, className: "gap-2 min-h-[44px]", children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
            "Сохранить"
          ] }),
          !isNew && status === "draft" && /* @__PURE__ */ jsx(Button, { onClick: () => save("issued"), disabled: saving, variant: "default", className: "min-h-[44px]", children: "Выписать" }),
          /* @__PURE__ */ jsx(
            WritePrescriptionsButton,
            {
              items,
              patientId: patient == null ? void 0 : patient.id,
              patientName: patient == null ? void 0 : patient.full_name,
              className: "min-h-[44px]"
            }
          ),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", className: "min-h-[44px] min-w-[44px] h-11 w-11", "aria-label": "Меню", children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-5 h-5" }) }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-64", children: [
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setApplyOpen(true), className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
                "Загрузить из шаблона"
              ] }),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setSaveAsOpen(true), disabled: items.length === 0, className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(BookMarked, { className: "w-4 h-4" }),
                "Сохранить как шаблон"
              ] }),
              !isNew && status === "issued" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setHistoryOpen(true), className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(History, { className: "w-4 h-4" }),
                "История версий"
              ] }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              !isNew && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => window.open(`/admin/treatment-plans/${id}/print`, "_blank"), className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
                "Печать"
              ] }),
              !isNew && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: exportDocx, disabled: items.length === 0, className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(FileDown, { className: "w-4 h-4" }),
                "DOCX"
              ] }),
              !isNew && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => window.open(`/admin/treatment-plans/${id}/memo`, "_blank"), className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4" }),
                "Памятка"
              ] }),
              !isNew && id && patient && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setSendMemoOpen(true), className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
                "Отправить пациенту"
              ] }),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setPatternExportOpen(true), disabled: items.length === 0, className: "gap-2 py-3", children: [
                /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" }),
                "Экспорт паттерна"
              ] }),
              !isNew && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
                /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: remove, className: "gap-2 py-3 text-destructive focus:text-destructive", children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                  "Удалить лист"
                ] })
              ] })
            ] })
          ] }),
          !isNew && id && /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(
            PublicLinkPopover,
            {
              planId: id,
              publicHash,
              isPublic,
              onChange: (v) => setIsPublic(v.is_public)
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "mb-4", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-3", children: [
        /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-5 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Дата выписки" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: issuedAt, onChange: (e) => setIssuedAt(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "№ курса" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: 1,
                value: courseNumber ?? "",
                placeholder: "авто",
                onChange: (e) => setCourseNumber(e.target.value === "" ? null : Number(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Длительность (дней)" }),
            /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: 180, value: durationDays, onChange: (e) => setDurationDays(Math.max(1, Math.min(180, Number(e.target.value) || 1))) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Диагноз / МКБ-10" }),
            /* @__PURE__ */ jsx(Input, { value: diagnosis, onChange: (e) => setDiagnosis(e.target.value), placeholder: "E29.1; N50.1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Режим" }),
            /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", className: "w-full justify-start gap-2", onClick: toggleMode, children: mode === "flat" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(List, { className: "w-4 h-4" }),
              "Плоский"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(CalendarDays, { className: "w-4 h-4" }),
              "По дням"
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Клиническое обоснование" }),
          /* @__PURE__ */ jsx(Textarea, { value: summary, onChange: (e) => setSummary(e.target.value), rows: 3, placeholder: "Краткое обоснование курса (печатается курсивом перед назначениями)..." })
        ] })
      ] }) }),
      mode === "scheduled" && /* @__PURE__ */ jsxs("div", { className: "mb-3 space-y-2", children: [
        /* @__PURE__ */ jsx(ScheduledSummary, { items, durationDays }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(GanttHeader, { duration: durationDays, items, onBulkUpdate: bulkUpdate }) })
      ] }),
      /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd, children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: grouped.map(({ section, list }) => {
        const Icon = section.icon;
        const empty = list.length === 0;
        return /* @__PURE__ */ jsxs(Card, { className: `scroll-mt-20 ${empty ? "opacity-70" : ""}`, "data-section-key": section.key, onClick: () => setActiveSection(section.key), children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "py-3 px-4 flex-row items-center justify-between space-y-0", children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Icon, { className: `w-4 h-4 ${empty ? "text-muted-foreground" : "text-primary"}` }),
              section.label,
              !empty && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: list.length }),
              activeSection === section.key && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] h-4 px-1", children: "активна" }),
              section.hint && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-normal", children: [
                "— ",
                section.hint
              ] })
            ] }),
            /* @__PURE__ */ jsx(CatalogPicker, { section: section.key, allowAllCategories: section.key === "peptide", onPick: (c) => addItem(section.key, c) })
          ] }),
          !empty && /* @__PURE__ */ jsx(CardContent, { className: "pt-0 pb-3 px-4 space-y-2", children: /* @__PURE__ */ jsx(SortableContext, { items: list.map((i) => i.client_id), strategy: verticalListSortingStrategy, children: list.map((it) => /* @__PURE__ */ jsx("div", { "data-item-id": it.client_id, "data-item-section": section.key, children: /* @__PURE__ */ jsx(
            PlanItemRow,
            {
              item: it,
              mode,
              courseDuration: durationDays,
              sortable: true,
              update: (p) => updateItem(it.client_id, p),
              remove: () => removeItem(it.client_id),
              duplicateInn: !!it.inn_snapshot && (innCounts.get(it.inn_snapshot) || 0) > 1
            }
          ) }, it.client_id)) }) })
        ] }, section.key);
      }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsx("div", { "data-section-key": "lab-control", className: "scroll-mt-20", children: /* @__PURE__ */ jsx(
          LabControlSection,
          {
            enabled: labControlEnabled,
            onEnabledChange: setLabControlEnabled,
            points: labPoints,
            onChange: setLabPoints
          }
        ) }),
        /* @__PURE__ */ jsx("div", { "data-section-key": "cost", className: "scroll-mt-20", children: /* @__PURE__ */ jsx(
          PlanCostBlock,
          {
            items,
            durationDays,
            mode,
            showInPrint: showCostInPrint,
            onShowInPrintChange: setShowCostInPrint,
            onTotalChange: setCurrentTotalCost
          }
        ) }),
        isPublic && id && /* @__PURE__ */ jsx("div", { "data-section-key": "public", className: "scroll-mt-20", children: /* @__PURE__ */ jsx(
          PublicLinkPopover,
          {
            planId: id,
            publicHash,
            isPublic,
            onChange: (v) => setIsPublic(v.is_public)
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx(
        PatternExportDialog,
        {
          open: patternExportOpen,
          onOpenChange: setPatternExportOpen,
          items,
          durationDays,
          totalCost: currentTotalCost,
          lab: labControlEnabled ? labPoints.map((p) => ({ control_point: p.control_point, at_day: p.at_day })) : [],
          clinicalSummary: summary,
          profile: { sex: patient == null ? void 0 : patient.sex, age: patientAge, diagnosisShort: diagnosis }
        }
      ),
      !isNew && id && /* @__PURE__ */ jsx(
        SendMemoDialog,
        {
          open: sendMemoOpen,
          onOpenChange: setSendMemoOpen,
          planId: id,
          publicHash,
          durationDays,
          patient: patient ? { full_name: patient.full_name, email: patient.email, telegram_username: patient.telegram_username } : null
        }
      ),
      /* @__PURE__ */ jsx(
        ApplyTemplateDialog,
        {
          open: applyOpen,
          onOpenChange: setApplyOpen,
          currentItemsCount: items.length,
          currentMode: mode,
          currentDuration: durationDays,
          onApply: applyTemplate
        }
      ),
      /* @__PURE__ */ jsx(
        SaveAsTemplateDialog,
        {
          open: saveAsOpen,
          onOpenChange: setSaveAsOpen,
          items,
          mode,
          durationDays,
          userId: user.id
        }
      ),
      !isNew && id && /* @__PURE__ */ jsx(
        PlanVersionHistoryDrawer,
        {
          open: historyOpen,
          onOpenChange: setHistoryOpen,
          planId: id,
          userId: user.id
        }
      ),
      /* @__PURE__ */ jsx(
        CommandPaletteDialog,
        {
          open: paletteOpen,
          onOpenChange: setPaletteOpen,
          activeSection,
          onPick: addFromPalette
        }
      ),
      /* @__PURE__ */ jsx(HotkeysHelpDialog, { open: hotkeysOpen, onOpenChange: setHotkeysOpen }),
      /* @__PURE__ */ jsxs(DropdownMenu, { open: exportMenuOpen, onOpenChange: setExportMenuOpen, children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx("button", { className: "sr-only", "aria-hidden": true, tabIndex: -1 }) }),
        /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "center", className: "w-56", children: [
          !isNew && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => window.open(`/admin/treatment-plans/${id}/print`, "_blank"), className: "gap-2", children: [
            /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
            "Печать (PDF)"
          ] }),
          /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: exportDocx, disabled: items.length === 0, className: "gap-2", children: [
            /* @__PURE__ */ jsx(FileDown, { className: "w-4 h-4" }),
            "DOCX"
          ] }),
          !isNew && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => window.open(`/admin/treatment-plans/${id}/memo`, "_blank"), className: "gap-2", children: [
            /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4" }),
            "Памятка пациенту"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 mb-2 flex items-center justify-center", children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setHotkeysOpen(true),
          className: "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
          title: "Горячие клавиши (?)",
          children: [
            /* @__PURE__ */ jsx(Keyboard, { className: "w-3.5 h-3.5" }),
            "Горячие клавиши · ",
            /* @__PURE__ */ jsx("kbd", { className: "px-1 py-0.5 rounded border bg-muted font-mono text-[10px]", children: "?" })
          ]
        }
      ) })
    ] })
  ] }) });
}
export {
  TreatmentPlanEditor as default
};
