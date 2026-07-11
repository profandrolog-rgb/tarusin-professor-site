import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, e as useToast, B as Button, I as Input, C as Card, a as CardContent, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, T as Textarea, s as supabase } from "../main.mjs";
import { Loader2, ArrowLeft, Plus, Search, Pencil, Trash2, X, Save } from "lucide-react";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-0irROHuF.js";
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
const emptyForm = {
  operation_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
  patient_name: "",
  patient_birth_date: "",
  diagnosis: "",
  operation_name: "",
  protocol_notes: "",
  surgeon_name: "Профессор, д.м.н. Тарусин Дмитрий Игоревич",
  assistant_name: "",
  postop_course: "",
  complications: "",
  child_notes: "",
  parent_notes: "",
  communication_notes: ""
};
const AdminOperationsJournal = () => {
  const { user, isAdmin, isSurgeon, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const hasAccess = isAdmin || isSurgeon;
  useEffect(() => {
    if (!authLoading && (!user || !hasAccess)) {
      navigate("/auth", { state: { from: "/admin/operations-journal" } });
    }
  }, [user, hasAccess, authLoading, navigate]);
  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("operations_journal").select("*").order("operation_date", { ascending: false });
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (user && hasAccess) fetchEntries();
  }, [user, hasAccess]);
  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      operation_date: entry.operation_date,
      patient_name: entry.patient_name,
      patient_birth_date: entry.patient_birth_date,
      diagnosis: entry.diagnosis,
      operation_name: entry.operation_name,
      protocol_notes: entry.protocol_notes || "",
      surgeon_name: entry.surgeon_name,
      assistant_name: entry.assistant_name || "",
      postop_course: entry.postop_course || "",
      complications: entry.complications || "",
      child_notes: entry.child_notes || "",
      parent_notes: entry.parent_notes || "",
      communication_notes: entry.communication_notes || ""
    });
    setDialogOpen(true);
  };
  const handleSave = async () => {
    if (!form.patient_name || !form.diagnosis || !form.operation_name) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      operation_date: form.operation_date,
      patient_name: form.patient_name.trim(),
      patient_birth_date: form.patient_birth_date,
      diagnosis: form.diagnosis.trim(),
      operation_name: form.operation_name.trim(),
      protocol_notes: form.protocol_notes.trim() || null,
      surgeon_name: form.surgeon_name.trim(),
      assistant_name: form.assistant_name.trim() || null,
      postop_course: form.postop_course.trim() || null,
      complications: form.complications.trim() || null,
      child_notes: form.child_notes.trim() || null,
      parent_notes: form.parent_notes.trim() || null,
      communication_notes: form.communication_notes.trim() || null
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("operations_journal").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("operations_journal").insert(payload));
    }
    if (error) {
      toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Запись обновлена" : "Запись добавлена" });
      setDialogOpen(false);
      fetchEntries();
    }
    setSaving(false);
  };
  const handleDelete = async (id) => {
    if (!confirm("Удалить запись из журнала?")) return;
    const { error } = await supabase.from("operations_journal").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Запись удалена" });
      fetchEntries();
    }
  };
  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU");
  };
  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.patient_name.toLowerCase().includes(q) || e.diagnosis.toLowerCase().includes(q) || e.operation_name.toLowerCase().includes(q) || e.surgeon_name.toLowerCase().includes(q);
  });
  if (authLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user || !hasAccess) return null;
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/admin",
        className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          "Панель администратора"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Операционный журнал" }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-sm", children: [
          "Всего записей: ",
          entries.length
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: openNew, className: "gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " Новая запись"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mb-4 max-w-md", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Поиск по пациенту, диагнозу, операции...",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: "pl-9"
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12 text-center text-muted-foreground", children: search ? "Ничего не найдено" : "Журнал пуст. Добавьте первую запись." }) }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "w-[100px]", children: "Дата" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Пациент" }),
        /* @__PURE__ */ jsx(TableHead, { className: "hidden md:table-cell", children: "Д.р." }),
        /* @__PURE__ */ jsx(TableHead, { children: "Диагноз" }),
        /* @__PURE__ */ jsx(TableHead, { className: "hidden lg:table-cell", children: "Операция" }),
        /* @__PURE__ */ jsx(TableHead, { className: "hidden xl:table-cell", children: "Оператор" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-[90px]" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: filtered.map((entry) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: formatDate(entry.operation_date) }),
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: entry.patient_name }),
        /* @__PURE__ */ jsx(TableCell, { className: "hidden md:table-cell text-xs text-muted-foreground", children: formatDate(entry.patient_birth_date) }),
        /* @__PURE__ */ jsx(TableCell, { className: "max-w-[200px] truncate", children: entry.diagnosis }),
        /* @__PURE__ */ jsx(TableCell, { className: "hidden lg:table-cell max-w-[200px] truncate", children: entry.operation_name }),
        /* @__PURE__ */ jsx(TableCell, { className: "hidden xl:table-cell text-sm text-muted-foreground truncate max-w-[180px]", children: entry.surgeon_name }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => openEdit(entry),
              children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => handleDelete(entry.id),
              children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 text-destructive" })
            }
          )
        ] }) })
      ] }, entry.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingId ? "Редактировать запись" : "Новая запись в журнале" }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Дата операции *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: form.operation_date,
                onChange: (e) => setForm({ ...form, operation_date: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Дата рождения *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: form.patient_birth_date,
                onChange: (e) => setForm({ ...form, patient_birth_date: e.target.value })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "ФИО пациента *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.patient_name,
              onChange: (e) => setForm({ ...form, patient_name: e.target.value }),
              placeholder: "Иванов Иван Иванович"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Диагноз *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.diagnosis,
              onChange: (e) => setForm({ ...form, diagnosis: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Название операции *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.operation_name,
              onChange: (e) => setForm({ ...form, operation_name: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Особенности протокола" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.protocol_notes,
              onChange: (e) => setForm({ ...form, protocol_notes: e.target.value }),
              rows: 4,
              placeholder: "Особенности хода операции..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Оператор *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: form.surgeon_name,
                onChange: (e) => setForm({ ...form, surgeon_name: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Ассистент" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: form.assistant_name,
                onChange: (e) => setForm({ ...form, assistant_name: e.target.value })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Послеоперационное течение" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.postop_course,
              onChange: (e) => setForm({ ...form, postop_course: e.target.value }),
              rows: 2,
              placeholder: "Особенности послеоперационного течения..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Осложнения" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.complications,
              onChange: (e) => setForm({ ...form, complications: e.target.value }),
              rows: 2,
              placeholder: "Осложнения..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Особенности ребёнка" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.child_notes,
              onChange: (e) => setForm({ ...form, child_notes: e.target.value }),
              rows: 2,
              placeholder: "Особенности ребёнка..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Особенности родителей" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.parent_notes,
              onChange: (e) => setForm({ ...form, parent_notes: e.target.value }),
              rows: 2,
              placeholder: "Особенности родителей..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Особенности коммуникации" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.communication_notes,
              onChange: (e) => setForm({ ...form, communication_notes: e.target.value }),
              rows: 2,
              placeholder: "Особенности коммуникации..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setDialogOpen(false), disabled: saving, children: [
            /* @__PURE__ */ jsx(X, { className: "w-4 h-4 mr-1" }),
            " Отмена"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving, children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-1" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-1" }),
            "Сохранить"
          ] })
        ] })
      ] })
    ] }) })
  ] }) });
};
export {
  AdminOperationsJournal as default
};
