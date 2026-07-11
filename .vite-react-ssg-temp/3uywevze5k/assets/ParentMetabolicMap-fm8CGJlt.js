import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { u as useAuth, s as supabase, C as Card, a as CardContent, B as Button, c as CardHeader, d as CardTitle, b as Badge } from "../main.mjs";
import { Loader2, ArrowLeft, Info, Printer } from "lucide-react";
import { f as fetchPathwayTexts, b as pickText } from "./texts-CVx3FMtc.js";
import { S as SEVERITY_LABEL } from "./aggregator-U0tC1iI4.js";
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
const STATUS_BADGE = {
  no_data: "bg-muted text-muted-foreground",
  norm: "bg-emerald-100 text-emerald-800",
  mild: "bg-blue-100 text-blue-800",
  moderate: "bg-amber-100 text-amber-800",
  severe: "bg-red-100 text-red-800"
};
function ParentMetabolicMap() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [patient, setPatient] = useState(null);
  const [pathways, setPathways] = useState([]);
  const [summary, setSummary] = useState([]);
  const [texts, setTexts] = useState([]);
  const [recs, setRecs] = useState([]);
  useEffect(() => {
    if (!id) return;
    (async () => {
      var _a;
      setBusy(true);
      const [{ data: p }, { data: pw }, { data: m }, ts] = await Promise.all([
        supabase.from("patients").select("id, full_name, share_simple_only, sex").eq("id", id).maybeSingle(),
        supabase.from("pathways").select("id, slug, name, description, sex").eq("is_active", true).order("name"),
        supabase.from("metabolic_maps").select("id, aggregate_summary").eq("patient_id", id).maybeSingle(),
        fetchPathwayTexts()
      ]);
      setPatient(p);
      const patientSex = (p == null ? void 0 : p.sex) === "M" || (p == null ? void 0 : p.sex) === "F" ? p.sex : null;
      const allPw = pw || [];
      const visiblePw = patientSex ? allPw.filter((x) => !x.sex || x.sex === patientSex) : allPw.filter((x) => !x.sex);
      setPathways(visiblePw);
      setSummary(((_a = m == null ? void 0 : m.aggregate_summary) == null ? void 0 : _a.pathways) || []);
      setTexts(ts);
      if (m == null ? void 0 : m.id) {
        const { data: r } = await supabase.from("map_recommendations").select("id, pathway_id, application_point, catalog:treatment_catalog(name, subcategory, default_dose, dose_unit, default_frequency)").eq("map_id", m.id).eq("include_in_print", true);
        setRecs(r || []);
      }
      setBusy(false);
    })();
  }, [id]);
  const summaryByPathway = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);
  const recsByPathway = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const r of recs) {
      const k = r.pathway_id || "_";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return m;
  }, [recs]);
  if (loading || busy) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Требуется вход." });
  }
  if (!patient) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Карта недоступна." });
  }
  const affected = pathways.map((pw) => ({ pw, sum: summaryByPathway.get(pw.id) })).filter(({ sum }) => sum && (sum.status === "mild" || sum.status === "moderate" || sum.status === "severe"));
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: `Метаболическая карта — ${patient.full_name}` }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 space-y-5 max-w-3xl", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/cabinet", className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "В кабинет"
      ] }),
      /* @__PURE__ */ jsxs("header", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Метаболическая карта" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: patient.full_name })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "bg-primary/5 border-primary/30", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-sm flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-primary mt-0.5" }),
        /* @__PURE__ */ jsx("div", { children: "Это упрощённая карта для родителя. Она объясняет простыми словами, какие системы обмена веществ у ребёнка сейчас требуют внимания. За подробностями и назначениями обращайтесь к лечащему врачу." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => window.print(), children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
        "Распечатать"
      ] }) }),
      (() => {
        const needsPhaseAll = Array.from(
          new Set(summary.flatMap((s) => s.needs_phase_codes || []))
        );
        if (!needsPhaseAll.length) return null;
        return /* @__PURE__ */ jsx(Card, { className: "border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-sm flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-blue-600 mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { children: [
            "Для некоторых показателей (",
            needsPhaseAll.join(", "),
            ") нужна фаза менструального цикла — без неё врач не сможет их правильно оценить. Уточните дату последних mens на приёме."
          ] })
        ] }) });
      })(),
      affected.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-sm text-muted-foreground italic", children: "По имеющимся данным путей, требующих внимания, не выявлено." }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: affected.map(({ pw, sum }) => {
        const text = pickText(texts, pw.id, "simple");
        const pwRecs = recsByPathway.get(pw.id) || [];
        return /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: pw.name }),
            /* @__PURE__ */ jsx(Badge, { className: STATUS_BADGE[sum.status], children: SEVERITY_LABEL[sum.status] })
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
            (text == null ? void 0 : text.summary) && /* @__PURE__ */ jsx("p", { children: text.summary }),
            (text == null ? void 0 : text.what_broken) && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("b", { children: "Что нарушено:" }),
              " ",
              text.what_broken
            ] }),
            (text == null ? void 0 : text.risks) && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("b", { children: "Почему это важно:" }),
              " ",
              text.risks
            ] }),
            (text == null ? void 0 : text.actions) && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("b", { children: "Что делать:" }),
              " ",
              text.actions
            ] }),
            !patient.share_simple_only && (text == null ? void 0 : text.evidence) && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx("b", { children: "Показатели:" }),
              " ",
              text.evidence
            ] }),
            pwRecs.length > 0 && /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium mb-1", children: "Что назначил врач:" }),
              /* @__PURE__ */ jsx("ul", { className: "text-xs space-y-0.5", children: pwRecs.map((r) => {
                var _a, _b, _c;
                return /* @__PURE__ */ jsxs("li", { children: [
                  "• ",
                  ((_a = r.catalog) == null ? void 0 : _a.name) || r.application_point,
                  ((_b = r.catalog) == null ? void 0 : _b.default_dose) ? ` — ${r.catalog.default_dose}${r.catalog.dose_unit || ""}` : "",
                  ((_c = r.catalog) == null ? void 0 : _c.default_frequency) ? `, ${r.catalog.default_frequency}` : ""
                ] }, r.id);
              }) })
            ] })
          ] })
        ] }, pw.id);
      }) }),
      /* @__PURE__ */ jsx("div", { className: "pt-6 text-xs text-muted-foreground border-t", children: "Карта сформирована по данным обследований, введённых лечащим врачом. Она не является медицинским заключением сама по себе — только материалом для обсуждения с врачом." })
    ] })
  ] });
}
export {
  ParentMetabolicMap as default
};
