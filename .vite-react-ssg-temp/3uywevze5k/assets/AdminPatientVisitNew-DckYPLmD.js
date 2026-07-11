import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, ClipboardList } from "lucide-react";
import { u as useAuth, s as supabase, B as Button, C as Card, c as CardHeader, d as CardTitle, a as CardContent, v as CardDescription, t as toast } from "../main.mjs";
import { P as PatientSelect } from "./PatientSelect-GQWx7tp3.js";
import { a as PROTOCOL_TYPES } from "./protocolTypes-BWCSK0Md.js";
import { D as DEFAULT_PROTOCOL_DATA } from "./protocolSchemas-DhWMMgbX.js";
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
import "date-fns";
import "./templates-B4T4fWBm.js";
import "./select-BFDaalEn.js";
import "@radix-ui/react-select";
function AdminPatientVisitNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading, isAdmin, isSurgeon } = useAuth();
  const [patient, setPatient] = useState(null);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin && !isSurgeon) navigate("/");
  }, [authLoading, user, isAdmin, isSurgeon, navigate]);
  useEffect(() => {
    const pid = params.get("patient_id");
    if (pid && !patient) {
      supabase.from("patients").select("id, full_name, birth_date").eq("id", pid).maybeSingle().then(({ data }) => {
        if (data) setPatient(data);
      });
    }
  }, [params, patient]);
  const handleCreate = async (type) => {
    if (!patient) {
      toast({ title: "Выберите пациента", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.from("patient_visits").insert({
      patient_id: patient.id,
      protocol_type: type,
      protocol_data: DEFAULT_PROTOCOL_DATA[type] || {},
      created_by: user == null ? void 0 : user.id
    }).select().single();
    setCreating(false);
    if (error) {
      toast({ title: "Не удалось создать протокол", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Протокол создан" });
    navigate(`/admin/visits/${data.id}`);
  };
  if (authLoading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background p-4 md:p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/visits", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
        " К журналу визитов"
      ] }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: "Новый протокол" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "1. Выберите пациента" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "2. Выберите тип протокола" }),
        /* @__PURE__ */ jsx(CardDescription, { children: patient ? `Будет создан протокол для пациента: ${patient.full_name}` : "Сначала выберите пациента выше (или заполните форму нового пациента и нажмите «Создать»)" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: PROTOCOL_TYPES.map((p) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          disabled: !patient || creating,
          onClick: () => handleCreate(p.key),
          className: "text-left p-4 rounded-lg border bg-card hover:border-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all",
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "rounded-md bg-primary/10 p-2 text-primary", children: /* @__PURE__ */ jsx(ClipboardList, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx("div", { className: "font-medium leading-tight", children: p.title }) })
          ] })
        },
        p.key
      )) }) })
    ] })
  ] }) });
}
export {
  AdminPatientVisitNew as default
};
