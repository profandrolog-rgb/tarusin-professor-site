import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, B as Button, C as Card, a as CardContent, L as Label, I as Input, T as Textarea, c as CardHeader, d as CardTitle, b as Badge, t as toast } from "../main.mjs";
import { Loader2, ArrowLeft, Save, List, CalendarDays, X } from "lucide-react";
import { a as SECTIONS } from "./sections-BdvyTZRY.js";
import { G as GanttHeader, C as CatalogPicker, P as PlanItemRow } from "./PlanItemRow-DhvuHdes.js";
import { useSensors, useSensor, PointerSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
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
import "./popover-C_8nSrct.js";
import "@radix-ui/react-popover";
import "./select-BFDaalEn.js";
import "@radix-ui/react-select";
import "@dnd-kit/utilities";
const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
function fromCatalog(c, section, mode, duration) {
  const it = {
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
  if (mode === "scheduled" && duration) it.day_pattern = `1-${duration}`;
  return it;
}
function TreatmentTemplateEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState("flat");
  const [durationDays, setDurationDays] = useState(10);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [items, setItems] = useState([]);
  const [tplId, setTplId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: `/admin/treatment-templates/${id || "new"}` } });
  }, [user, isAdmin, loading, navigate, id]);
  useEffect(() => {
    (async () => {
      setBusy(true);
      if (isNew) {
        setBusy(false);
        return;
      }
      setTplId(id);
      const { data: t } = await supabase.from("protocol_templates").select("*").eq("id", id).maybeSingle();
      if (t) {
        setName(t.name);
        setDescription(t.description || "");
        setTarget(t.target_patient || "");
        setMode(t.mode || "flat");
        setDurationDays(t.duration_days || 10);
        setTags(t.tags || []);
      }
      const { data: rows } = await supabase.from("protocol_template_items").select("*").eq("template_id", id).order("section_category").order("order_index");
      const catIds = (rows || []).map((r) => r.catalog_id).filter(Boolean);
      let catMap = /* @__PURE__ */ new Map();
      if (catIds.length) {
        const { data: cat } = await supabase.from("treatment_catalog").select("*").in("id", catIds);
        catMap = new Map((cat || []).map((c) => [c.id, c]));
      }
      setItems((rows || []).map((r) => {
        const c = r.catalog_id ? catMap.get(r.catalog_id) : null;
        return {
          client_id: newId(),
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
      }));
      setBusy(false);
    })();
  }, [id, isNew]);
  const addItem = (section, c) => setItems((p) => [...p, fromCatalog(c, section, mode, durationDays)]);
  const updateItem = (cid, patch) => setItems((p) => p.map((i) => i.client_id === cid ? { ...i, ...patch } : i));
  const removeItem = (cid) => setItems((p) => p.filter((i) => i.client_id !== cid));
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const toggleMode = () => {
    if (mode === "flat") {
      setItems((prev) => prev.map((it) => ({ ...it, day_pattern: it.day_pattern || `1-${durationDays}` })));
      setMode("scheduled");
    } else setMode("flat");
  };
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const a = prev.find((i) => i.client_id === active.id);
      const b = prev.find((i) => i.client_id === over.id);
      if (!a || !b || a.section_category !== b.section_category) return prev;
      return arrayMove(prev, prev.findIndex((i) => i.client_id === active.id), prev.findIndex((i) => i.client_id === over.id));
    });
  };
  const save = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({ title: "Введите название", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let useId = tplId;
      const payload = {
        name: name.trim(),
        description: description || null,
        target_patient: target || null,
        mode,
        duration_days: durationDays,
        tags: tags.length ? tags : null
      };
      if (isNew && !useId) {
        const { data, error } = await supabase.from("protocol_templates").insert({ ...payload, created_by: user.id }).select("id").single();
        if (error || !data) throw error || new Error("insert");
        useId = data.id;
        setTplId(data.id);
      } else {
        const { error } = await supabase.from("protocol_templates").update(payload).eq("id", useId);
        if (error) throw error;
        await supabase.from("protocol_template_items").delete().eq("template_id", useId);
      }
      if (items.length) {
        const rows = items.map((it, idx) => ({
          template_id: useId,
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
        const { error } = await supabase.from("protocol_template_items").insert(rows);
        if (error) throw error;
      }
      toast({ title: "Шаблон сохранён" });
      if (isNew && useId) navigate(`/admin/treatment-templates/${useId}`, { replace: true });
    } catch (e) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  if (loading || busy) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  if (!user) return null;
  const grouped = SECTIONS.map((s) => ({ section: s, list: items.filter((i) => i.section_category === s.key) }));
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-6 max-w-5xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin/treatment-templates", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "К списку шаблонов"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: isNew ? "Новый шаблон" : "Редактирование шаблона" }),
      /* @__PURE__ */ jsxs(Button, { onClick: save, disabled: saving, className: "gap-2", children: [
        saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        "Сохранить"
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "mb-4", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Название *" }),
        /* @__PURE__ */ jsx(Input, { value: name, onChange: (e) => setName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Целевой профиль пациента" }),
        /* @__PURE__ */ jsx(Textarea, { value: target, onChange: (e) => setTarget(e.target.value), rows: 2, placeholder: "Мужчина 37–50 лет, городской житель..." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Описание" }),
        /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value), rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Режим" }),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", className: "w-full justify-start gap-2", onClick: toggleMode, children: mode === "flat" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(List, { className: "w-4 h-4" }),
            "Плоский"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CalendarDays, { className: "w-4 h-4" }),
            "По дням"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Длительность курса (дней)" }),
          /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: 180, value: durationDays, onChange: (e) => setDurationDays(Math.max(1, Math.min(180, Number(e.target.value) || 1))) })
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
                placeholder: "тег + Enter"
              }
            ),
            /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: addTag, children: "+" })
          ] }),
          tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: tags.map((t) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs", children: [
            t,
            /* @__PURE__ */ jsx(X, { className: "w-3 h-3 cursor-pointer hover:text-destructive", onClick: () => setTags(tags.filter((x) => x !== t)) })
          ] }, t)) })
        ] })
      ] })
    ] }) }),
    mode === "scheduled" && /* @__PURE__ */ jsx(Card, { className: "mb-3", children: /* @__PURE__ */ jsx(GanttHeader, { duration: durationDays }) }),
    /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd, children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: grouped.map(({ section, list }) => {
      const Icon = section.icon;
      const empty = list.length === 0;
      return /* @__PURE__ */ jsxs(Card, { className: empty ? "opacity-70" : "", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "py-3 px-4 flex-row items-center justify-between space-y-0", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Icon, { className: `w-4 h-4 ${empty ? "text-muted-foreground" : "text-primary"}` }),
            section.label,
            !empty && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: list.length })
          ] }),
          /* @__PURE__ */ jsx(CatalogPicker, { section: section.key, allowAllCategories: section.key === "peptide", onPick: (c) => addItem(section.key, c) })
        ] }),
        !empty && /* @__PURE__ */ jsx(CardContent, { className: "pt-0 pb-3 px-4 space-y-2", children: /* @__PURE__ */ jsx(SortableContext, { items: list.map((i) => i.client_id), strategy: verticalListSortingStrategy, children: list.map((it) => /* @__PURE__ */ jsx(
          PlanItemRow,
          {
            item: it,
            mode,
            courseDuration: durationDays,
            sortable: true,
            update: (p) => updateItem(it.client_id, p),
            remove: () => removeItem(it.client_id)
          },
          it.client_id
        )) }) })
      ] }, section.key);
    }) }) })
  ] }) });
}
export {
  TreatmentTemplateEditor as default
};
