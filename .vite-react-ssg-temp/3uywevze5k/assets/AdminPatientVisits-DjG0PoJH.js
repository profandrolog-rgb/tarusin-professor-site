import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { u as useAuth, B as Button, C as Card, c as CardHeader, d as CardTitle, a as CardContent, I as Input, s as supabase } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-0irROHuF.js";
import { a as PROTOCOL_TYPES, P as PROTOCOL_TYPE_MAP } from "./protocolTypes-BWCSK0Md.js";
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
function AdminPatientVisits() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isSurgeon } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateSortDir, setDateSortDir] = useState("desc");
  const [dateSearch, setDateSearch] = useState("");
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin && !isSurgeon) navigate("/");
  }, [authLoading, user, isAdmin, isSurgeon, navigate]);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase.from("patient_visits").select("id, visit_date, protocol_type, diagnosis, icd_code, patient:patients(id, full_name, history_number)").order("visit_date", { ascending: false }).limit(200);
      if (typeFilter !== "all") q = q.eq("protocol_type", typeFilter);
      const { data, error } = await q;
      if (!error) setRows(data || []);
      setLoading(false);
    };
    if (user && (isAdmin || isSurgeon)) load();
  }, [user, isAdmin, isSurgeon, typeFilter]);
  const displayRows = useMemo(() => {
    let data = rows.filter((r) => {
      var _a, _b, _c, _d, _e, _f;
      const s = search.toLowerCase();
      const matchesSearch = !search || (((_b = (_a = r.patient) == null ? void 0 : _a.full_name) == null ? void 0 : _b.toLowerCase().includes(s)) || ((_d = (_c = r.patient) == null ? void 0 : _c.history_number) == null ? void 0 : _d.toLowerCase().includes(s)) || ((_e = r.diagnosis) == null ? void 0 : _e.toLowerCase().includes(s)) || ((_f = r.icd_code) == null ? void 0 : _f.toLowerCase().includes(s)));
      const matchesDate = !dateSearch || format(new Date(r.visit_date), "yyyy-MM-dd") === dateSearch;
      return matchesSearch && matchesDate;
    });
    data.sort((a, b) => {
      const da = new Date(a.visit_date).getTime();
      const db = new Date(b.visit_date).getTime();
      return dateSortDir === "asc" ? da - db : db - da;
    });
    return data;
  }, [rows, search, dateSearch, dateSortDir]);
  if (authLoading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background p-4 md:p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
          " В админ-панель"
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: "Журнал визитов" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/visits/new", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
        " Новый протокол"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Фильтры" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-wrap gap-3 items-end", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Поиск по ФИО, ИБ, диагнозу, МКБ...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "max-w-md"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Дата визита" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "date",
              value: dateSearch,
              onChange: (e) => setDateSearch(e.target.value),
              className: "w-44"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-64", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все типы протоколов" }),
            PROTOCOL_TYPES.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.key, children: p.title }, p.key))
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: loading ? /* @__PURE__ */ jsx("div", { className: "p-12 flex justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin" }) }) : displayRows.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-muted-foreground", children: "Визитов пока нет. Создайте первый протокол." }) : /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(
          TableHead,
          {
            className: "cursor-pointer select-none",
            onClick: () => setDateSortDir((d) => d === "desc" ? "asc" : "desc"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              "Дата",
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-4 w-4 text-muted-foreground" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(TableHead, { children: "№ ИБ" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Пациент" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Тип протокола" }),
        /* @__PURE__ */ jsx(TableHead, { children: "МКБ" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Диагноз" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-24" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: displayRows.map((r) => {
        var _a, _b, _c;
        return /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono", children: format(new Date(r.visit_date), "dd.MM.yyyy") }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono", children: ((_a = r.patient) == null ? void 0 : _a.history_number) || "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: ((_b = r.patient) == null ? void 0 : _b.full_name) || "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: ((_c = PROTOCOL_TYPE_MAP[r.protocol_type]) == null ? void 0 : _c.title) || r.protocol_type }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono", children: r.icd_code || "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "max-w-md truncate", children: r.diagnosis || "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsx(Link, { to: `/admin/visits/${r.id}`, children: "Открыть" }) }) })
        ] }, r.id);
      }) })
    ] }) }) })
  ] }) });
}
export {
  AdminPatientVisits as default
};
