import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, B as Button, C as Card, a as CardContent, L as Label, I as Input, T as Textarea, b as Badge, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { Loader2, ArrowLeft, Archive, Trash2, Save, X, Plus, Search, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
function SortablePointRow({ row, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return /* @__PURE__ */ jsx("div", { ref: setNodeRef, style, className: "border rounded-lg p-3 bg-card", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
    /* @__PURE__ */ jsx("button", { ...attributes, ...listeners, className: "text-muted-foreground hover:text-foreground cursor-grab pt-1.5", type: "button", children: /* @__PURE__ */ jsx(GripVertical, { className: "w-4 h-4" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono", children: row.who_code }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: row.point_name_ru || row.point_pinyin }),
        row.point_pinyin && row.point_name_ru && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: row.point_pinyin })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Сторона" }),
          /* @__PURE__ */ jsxs(Select, { value: row.side || "bilateral", onValueChange: (v) => onChange({ side: v }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "bilateral", children: "Билатерально" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "left", children: "Слева" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "right", children: "Справа" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Манипуляция" }),
          /* @__PURE__ */ jsx(Input, { className: "h-8", value: row.manipulation || "", onChange: (e) => onChange({ manipulation: e.target.value }), placeholder: "торм./возб./нейтр." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Глубина (мм)" }),
          /* @__PURE__ */ jsx(Input, { className: "h-8", value: row.depth_mm || "", onChange: (e) => onChange({ depth_mm: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Экспозиция (мин)" }),
          /* @__PURE__ */ jsx(Input, { className: "h-8", type: "number", value: row.retention_min ?? "", onChange: (e) => onChange({ retention_min: e.target.value ? +e.target.value : null }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Textarea, { className: "text-xs", rows: 1, value: row.notes || "", onChange: (e) => onChange({ notes: e.target.value }), placeholder: "Заметка" })
    ] }),
    /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: onRemove, className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
  ] }) });
}
function AdminAcupunctureProtocolEditor() {
  const { id } = useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [protocol, setProtocol] = useState(null);
  const [rows, setRows] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allPoints, setAllPoints] = useState([]);
  const [pickerQ, setPickerQ] = useState("");
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: `/admin/acupuncture-protocols/${id}` } });
  }, [user, isAdmin, loading, navigate, id]);
  useEffect(() => {
    (async () => {
      if (!id) return;
      setBusy(true);
      const { data: p } = await supabase.from("acupuncture_protocols").select("*").eq("id", id).maybeSingle();
      const { data: pts } = await supabase.from("acupuncture_protocol_points").select("*, acupoints(who_code, pinyin, name_ru)").eq("protocol_id", id).order("order_index");
      setProtocol(p);
      setRows((pts || []).map((r) => {
        var _a, _b, _c;
        return {
          id: r.id,
          protocol_id: r.protocol_id,
          acupoint_id: r.acupoint_id,
          order_index: r.order_index,
          manipulation: r.manipulation,
          depth_mm: r.depth_mm,
          retention_min: r.retention_min,
          side: r.side,
          notes: r.notes,
          who_code: (_a = r.acupoints) == null ? void 0 : _a.who_code,
          point_name_ru: (_b = r.acupoints) == null ? void 0 : _b.name_ru,
          point_pinyin: (_c = r.acupoints) == null ? void 0 : _c.pinyin
        };
      }));
      setBusy(false);
    })();
  }, [id]);
  useEffect(() => {
    if (!pickerOpen || allPoints.length) return;
    (async () => {
      const { data } = await supabase.from("acupoints").select("id,who_code,pinyin,name_ru,manipulation_default,depth_mm").order("who_code");
      setAllPoints(data || []);
    })();
  }, [pickerOpen, allPoints.length]);
  const filteredPicker = useMemo(() => {
    const s = pickerQ.trim().toLowerCase();
    if (!s) return allPoints;
    return allPoints.filter(
      (a) => a.who_code.toLowerCase().includes(s) || (a.pinyin || "").toLowerCase().includes(s) || (a.name_ru || "").toLowerCase().includes(s)
    );
  }, [allPoints, pickerQ]);
  const addPoint = (a) => {
    setRows((prev) => [...prev, {
      id: crypto.randomUUID(),
      acupoint_id: a.id,
      order_index: prev.length,
      manipulation: a.manipulation_default,
      depth_mm: a.depth_mm,
      retention_min: (protocol == null ? void 0 : protocol.session_duration_min) ?? 20,
      side: "bilateral",
      notes: null,
      who_code: a.who_code,
      point_name_ru: a.name_ru,
      point_pinyin: a.pinyin
    }]);
  };
  const removeRow = (rowId) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setRemovedIds((prev) => [...prev, rowId]);
  };
  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, ...patch } : r));
  };
  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows((prev) => {
      const oldIdx = prev.findIndex((r) => r.id === active.id);
      const newIdx = prev.findIndex((r) => r.id === over.id);
      return arrayMove(prev, oldIdx, newIdx).map((r, i) => ({ ...r, order_index: i }));
    });
  };
  const save = async () => {
    if (!protocol || !id) return;
    setSaving(true);
    const { error: pe } = await supabase.from("acupuncture_protocols").update({
      name: protocol.name,
      description: protocol.description,
      indications: protocol.indications,
      contraindications: protocol.contraindications,
      session_count: protocol.session_count,
      session_duration_min: protocol.session_duration_min,
      frequency: protocol.frequency,
      tags: protocol.tags,
      is_archived: protocol.is_archived
    }).eq("id", id);
    if (pe) {
      toast.error(pe.message);
      setSaving(false);
      return;
    }
    await supabase.from("acupuncture_protocol_points").delete().eq("protocol_id", id);
    if (rows.length) {
      const payload = rows.map((r, i) => ({
        protocol_id: id,
        acupoint_id: r.acupoint_id,
        order_index: i,
        manipulation: r.manipulation,
        depth_mm: r.depth_mm,
        retention_min: r.retention_min,
        side: r.side,
        notes: r.notes
      }));
      const { error: ie } = await supabase.from("acupuncture_protocol_points").insert(payload);
      if (ie) {
        toast.error(ie.message);
        setSaving(false);
        return;
      }
    }
    toast.success("Сохранено");
    setRemovedIds([]);
    setSaving(false);
  };
  const deleteProtocol = async () => {
    if (!id || !confirm("Удалить протокол целиком?")) return;
    const { error } = await supabase.from("acupuncture_protocols").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/admin/acupuncture-protocols");
  };
  const addTag = () => {
    const t = tagInput.trim();
    if (!t || !protocol) return;
    setProtocol({ ...protocol, tags: Array.from(/* @__PURE__ */ new Set([...protocol.tags || [], t])) });
    setTagInput("");
  };
  const removeTag = (t) => {
    if (!protocol) return;
    setProtocol({ ...protocol, tags: (protocol.tags || []).filter((x) => x !== t) });
  };
  if (busy || !protocol) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background p-4 md:p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/acupuncture-protocols", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
            "К списку"
          ] }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Редактирование протокола ИРТ" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setProtocol({ ...protocol, is_archived: !protocol.is_archived }), children: [
            /* @__PURE__ */ jsx(Archive, { className: "w-4 h-4 mr-2" }),
            protocol.is_archived ? "Разархивировать" : "В архив"
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "destructive", size: "sm", onClick: deleteProtocol, children: [
            /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
            "Удалить"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: save, disabled: saving, children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
            "Сохранить"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Название" }),
          /* @__PURE__ */ jsx(Input, { value: protocol.name, onChange: (e) => setProtocol({ ...protocol, name: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Сеансов" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: protocol.session_count ?? "", onChange: (e) => setProtocol({ ...protocol, session_count: e.target.value ? +e.target.value : null }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Длительность сеанса (мин)" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: protocol.session_duration_min ?? "", onChange: (e) => setProtocol({ ...protocol, session_duration_min: e.target.value ? +e.target.value : null }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Кратность" }),
            /* @__PURE__ */ jsx(Input, { value: protocol.frequency || "", onChange: (e) => setProtocol({ ...protocol, frequency: e.target.value }), placeholder: "напр., 2–3 раза в неделю" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Показания" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: protocol.indications || "", onChange: (e) => setProtocol({ ...protocol, indications: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Противопоказания" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: protocol.contraindications || "", onChange: (e) => setProtocol({ ...protocol, contraindications: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Описание / методика" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 3, value: protocol.description || "", onChange: (e) => setProtocol({ ...protocol, description: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Теги" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mb-2", children: (protocol.tags || []).map((t) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
            t,
            /* @__PURE__ */ jsx("button", { onClick: () => removeTag(t), type: "button", className: "ml-1 hover:text-destructive", children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
          ] }, t)) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Input, { value: tagInput, onChange: (e) => setTagInput(e.target.value), onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }, placeholder: "Добавить тег…" }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: addTag, children: "Добавить" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-semibold", children: [
            "Точки протокола (",
            rows.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: () => setPickerOpen(true), children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            "Добавить точку"
          ] })
        ] }),
        rows.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Нет точек. Нажмите «Добавить точку»." }) : /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd, children: /* @__PURE__ */ jsx(SortableContext, { items: rows.map((r) => r.id), strategy: verticalListSortingStrategy, children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: rows.map((r) => /* @__PURE__ */ jsx(
          SortablePointRow,
          {
            row: r,
            onChange: (p) => updateRow(r.id, p),
            onRemove: () => removeRow(r.id)
          },
          r.id
        )) }) }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: pickerOpen, onOpenChange: setPickerOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Выбрать точку" }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { value: pickerQ, onChange: (e) => setPickerQ(e.target.value), placeholder: "Поиск: WHO-код, пиньинь, название…", className: "pl-9", autoFocus: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-h-[60vh] overflow-y-auto space-y-1", children: [
        filteredPicker.map((a) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              addPoint(a);
            },
            type: "button",
            className: "w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center gap-3",
            children: [
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono shrink-0", children: a.who_code }),
              /* @__PURE__ */ jsx("span", { className: "font-medium truncate", children: a.name_ru || a.pinyin }),
              a.pinyin && a.name_ru && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground truncate", children: a.pinyin })
            ]
          },
          a.id
        )),
        filteredPicker.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: "Ничего не найдено" })
      ] })
    ] }) })
  ] });
}
export {
  AdminAcupunctureProtocolEditor as default
};
