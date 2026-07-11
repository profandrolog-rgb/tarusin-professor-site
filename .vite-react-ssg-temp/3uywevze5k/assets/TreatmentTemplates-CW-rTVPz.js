import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, B as Button, I as Input, b as Badge, C as Card, a as CardContent, s as supabase, t as toast } from "../main.mjs";
import { Loader2, ArrowLeft, BookMarked, Plus, X, FilePlus, Pencil, Copy, Archive, Trash2 } from "lucide-react";
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
function TreatmentTemplates() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/treatment-templates" } });
  }, [user, isAdmin, loading, navigate]);
  const load = async () => {
    setBusy(true);
    const { data } = await supabase.from("protocol_templates").select("*, items:protocol_template_items(count)").order("created_at", { ascending: false });
    setRows((data || []).map((r) => {
      var _a, _b;
      return { ...r, items_count: ((_b = (_a = r.items) == null ? void 0 : _a[0]) == null ? void 0 : _b.count) ?? 0 };
    }));
    setBusy(false);
  };
  useEffect(() => {
    load();
  }, []);
  const create = () => navigate("/admin/treatment-templates/new");
  const duplicate = async (r) => {
    if (!user) return;
    const { data: tpl, error } = await supabase.from("protocol_templates").insert({
      name: r.name + " (копия)",
      description: r.description,
      target_patient: r.target_patient,
      mode: r.mode,
      duration_days: r.duration_days,
      tags: r.tags,
      created_by: user.id
    }).select("id").single();
    if (error || !tpl) {
      toast({ title: "Ошибка", description: error == null ? void 0 : error.message, variant: "destructive" });
      return;
    }
    const { data: src } = await supabase.from("protocol_template_items").select("*").eq("template_id", r.id);
    if (src && src.length) {
      const rows2 = src.map((s) => {
        const { id, created_at, ...rest } = s;
        return { ...rest, template_id: tpl.id };
      });
      await supabase.from("protocol_template_items").insert(rows2);
    }
    toast({ title: "Шаблон скопирован" });
    load();
  };
  const toggleArchive = async (r) => {
    const { error } = await supabase.from("protocol_templates").update({ is_archived: !r.is_archived }).eq("id", r.id);
    if (!error) load();
  };
  const remove = async (r) => {
    if (!confirm(`Удалить шаблон «${r.name}»?`)) return;
    const { error } = await supabase.from("protocol_templates").delete().eq("id", r.id);
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else load();
  };
  const allTags = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    rows.forEach((r) => (r.tags || []).forEach((t) => t && set.add(t)));
    return Array.from(set).sort();
  }, [rows]);
  const toggleTag = (t) => setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  const filtered = rows.filter((r) => {
    if (!showArchived && r.is_archived) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase()) && !(r.target_patient || "").toLowerCase().includes(q.toLowerCase())) return false;
    if (activeTags.length && !activeTags.every((t) => (r.tags || []).includes(t))) return false;
    return true;
  });
  if (loading || !user) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin/treatment-plans", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "К листам назначений"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-1 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BookMarked, { className: "w-7 h-7 text-primary" }),
          "Шаблоны протоколов"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Готовые наборы назначений для типовых случаев" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: create, className: "gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        "Новый шаблон"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-3 flex-wrap items-center", children: [
      /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск...", className: "max-w-md" }),
      /* @__PURE__ */ jsxs("label", { className: "text-sm flex items-center gap-2 cursor-pointer", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: showArchived, onChange: (e) => setShowArchived(e.target.checked) }),
        "показать архив"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground ml-auto", children: [
        filtered.length,
        " из ",
        rows.length
      ] })
    ] }),
    allTags.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5 mb-4 flex-wrap items-center", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mr-1", children: "Теги:" }),
      allTags.map((t) => /* @__PURE__ */ jsx(
        Badge,
        {
          variant: activeTags.includes(t) ? "default" : "outline",
          className: "cursor-pointer hover:bg-primary/10",
          onClick: () => toggleTag(t),
          children: t
        },
        t
      )),
      activeTags.length > 0 && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setActiveTags([]), className: "h-6 gap-1 text-xs", children: [
        /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
        "сбросить"
      ] })
    ] }),
    busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-10 text-center text-muted-foreground", children: [
      /* @__PURE__ */ jsx(BookMarked, { className: "w-10 h-10 mx-auto mb-3 opacity-50" }),
      "Шаблонов пока нет. Создайте первый или сохраните существующий лист как шаблон."
    ] }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: filtered.map((r) => /* @__PURE__ */ jsx(Card, { className: `hover:shadow-md transition-shadow ${r.is_archived ? "opacity-60" : ""}`, children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-templates/${r.id}`, className: "font-medium hover:text-primary", children: r.name }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", children: r.mode === "flat" ? "плоский" : "по дням" }),
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
            r.items_count,
            " позиций"
          ] }),
          r.duration_days && /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
            r.duration_days,
            " дн."
          ] }),
          r.is_archived && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "архив" })
        ] }),
        (r.tags || []).length > 0 && /* @__PURE__ */ jsx("div", { className: "flex gap-1 flex-wrap mt-1.5", children: (r.tags || []).map((t) => /* @__PURE__ */ jsx(
          Badge,
          {
            variant: activeTags.includes(t) ? "default" : "secondary",
            className: "text-[10px] cursor-pointer",
            onClick: (e) => {
              e.preventDefault();
              toggleTag(t);
            },
            children: t
          },
          t
        )) }),
        r.target_patient && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mt-1", children: r.target_patient }),
        r.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-0.5 line-clamp-2", children: r.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-1 flex-wrap", children: [
        /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/new?templateId=${r.id}`, children: /* @__PURE__ */ jsxs(Button, { size: "sm", className: "gap-1", children: [
          /* @__PURE__ */ jsx(FilePlus, { className: "w-3.5 h-3.5" }),
          "Применить к новому листу"
        ] }) }),
        /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-templates/${r.id}`, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "gap-1", children: [
          /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }),
          "Открыть"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", onClick: () => duplicate(r), title: "Дублировать", children: /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", onClick: () => toggleArchive(r), title: "В архив / из архива", children: /* @__PURE__ */ jsx(Archive, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", onClick: () => remove(r), className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
      ] })
    ] }) }, r.id)) })
  ] }) });
}
export {
  TreatmentTemplates as default
};
