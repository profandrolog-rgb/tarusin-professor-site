import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, B as Button, C as Card, a as CardContent, I as Input, b as Badge, s as supabase } from "../main.mjs";
import { Loader2, ArrowLeft, MapPin, Plus, Search, Archive } from "lucide-react";
import { toast } from "sonner";
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
function AdminAcupunctureProtocols() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/acupuncture-protocols" } });
    }
  }, [user, isAdmin, loading, navigate]);
  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("acupuncture_protocols").select("id,name,description,indications,session_count,session_duration_min,frequency,tags,is_archived,updated_at").order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setList(data || []);
    setBusy(false);
  };
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);
  const createNew = async () => {
    const { data, error } = await supabase.from("acupuncture_protocols").insert({ name: "Новый протокол ИРТ", session_count: 10, session_duration_min: 30 }).select("id").maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) navigate(`/admin/acupuncture-protocols/${data.id}`);
  };
  const filtered = list.filter((p) => {
    if (!showArchived && p.is_archived) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p.indications || "").toLowerCase().includes(s) || (p.tags || []).some((t) => t.toLowerCase().includes(s));
  });
  if (loading || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background p-4 md:p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/treatment-plans", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
          "Назад"
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Протоколы ИРТ" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/acupoints", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 mr-2" }),
          "Точки ИРТ"
        ] }) }),
        /* @__PURE__ */ jsxs(Button, { onClick: createNew, children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
          "Новый протокол"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6 space-y-3", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск по названию, показаниям, тегам…", className: "pl-9" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: showArchived ? "default" : "outline", size: "sm", onClick: () => setShowArchived(!showArchived), children: [
        /* @__PURE__ */ jsx(Archive, { className: "w-4 h-4 mr-2" }),
        "Архив"
      ] })
    ] }) }) }),
    busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12 text-center text-muted-foreground", children: "Протоколов пока нет. Нажмите «Новый протокол»." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: filtered.map((p) => /* @__PURE__ */ jsx(Card, { className: "hover:border-primary/40 transition-colors", children: /* @__PURE__ */ jsx(Link, { to: `/admin/acupuncture-protocols/${p.id}`, className: "block", children: /* @__PURE__ */ jsx(CardContent, { className: "pt-5 pb-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base truncate", children: p.name }),
          p.is_archived && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: "Архив" })
        ] }),
        p.indications && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mb-2", children: p.indications }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 text-xs", children: (p.tags || []).map((t) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "font-normal", children: t }, t)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right text-xs text-muted-foreground shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          p.session_count ?? "—",
          " сеансов"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          p.session_duration_min ?? "—",
          " мин"
        ] }),
        p.frequency && /* @__PURE__ */ jsx("div", { className: "mt-1", children: p.frequency })
      ] })
    ] }) }) }) }, p.id)) })
  ] }) });
}
export {
  AdminAcupunctureProtocols as default
};
