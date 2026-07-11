import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, B as Button, C as Card, a as CardContent, I as Input } from "../main.mjs";
import { Helmet } from "react-helmet-async";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-0irROHuF.js";
import { Loader2, ArrowLeft, Plus, FileText, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
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
function AdminPatients() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      let q = supabase.from("patients").select("id, full_name, birth_date, phone, history_number").order("full_name", { ascending: true }).limit(50);
      if (debounced) {
        const esc = debounced.replace(/[%,]/g, " ");
        q = q.or(`full_name.ilike.%${esc}%,history_number.ilike.%${esc}%`);
      }
      const { data } = await q;
      if (!cancelled) {
        setRows(data || []);
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: "Пациенты" }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "В админ-панель"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "База пациентов" }),
        /* @__PURE__ */ jsx(Link, { to: "/admin/patients/new", children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          "Новый пациент"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-3", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Поиск по ФИО или № ИБ…",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: busy ? "Поиск…" : `Найдено: ${rows.length}${rows.length === 50 ? " (лимит)" : ""}` }),
        /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "ФИО" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Дата рождения" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Телефон" }),
            /* @__PURE__ */ jsx(TableHead, { children: "№ ИБ" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Действия" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: rows.length === 0 && !busy ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "text-center text-muted-foreground py-8", children: "Ничего не найдено" }) }) : rows.map((p) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: p.full_name }),
            /* @__PURE__ */ jsx(TableCell, { children: p.birth_date ? format(parseISO(p.birth_date), "d MMM yyyy", { locale: ru }) : "—" }),
            /* @__PURE__ */ jsx(TableCell, { children: p.phone || "—" }),
            /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-sm", children: p.history_number || "—" }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1 justify-end", children: [
              /* @__PURE__ */ jsx(Link, { to: `/admin/patients/${p.id}`, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", title: "Открыть", children: /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }) }) }),
              /* @__PURE__ */ jsx(Link, { to: `/admin/patients/${p.id}/edit`, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", title: "Редактировать", children: /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }) }) })
            ] }) })
          ] }, p.id)) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  AdminPatients as default
};
