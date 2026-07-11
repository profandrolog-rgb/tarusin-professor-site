import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { u as useAuth, C as Card, a as CardContent, B as Button, o as Separator, b as Badge, c as CardHeader, s as supabase } from "../main.mjs";
import { Loader2, ArrowLeft, GitCompare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { a as SECTIONS } from "./sections-BdvyTZRY.js";
import { f as fetchIrtForCatalogIds } from "./acupunctureExpand-DBa3GykD.js";
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
function itemKey(it) {
  if (it.catalog_id) return `cat:${it.catalog_id}`;
  return `name:${(it.name_snapshot || "").toLowerCase().trim()}|${(it.inn_snapshot || "").toLowerCase().trim()}`;
}
const COMPARE_FIELDS = [
  "dose",
  "dose_unit",
  "frequency",
  "duration_days",
  "day_pattern",
  "dilution_volume",
  "dilution_solvent",
  "notes"
];
function normTOD(arr) {
  return [...arr || []].sort().join(",");
}
function irtSig(s) {
  if (!s) return "";
  const head = `${s.name || ""}|${s.session_count ?? ""}|${s.session_duration_min ?? ""}|${s.frequency ?? ""}`;
  const pts = (s.points || []).slice().sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((p) => `${p.order_index}:${p.who_code}|${p.side || ""}|${p.manipulation || ""}|${p.depth_mm || ""}|${p.retention_min ?? ""}|${p.notes || ""}`).join("§");
  return `${head}::${pts}`;
}
function diffItems(a, b) {
  if (!a || !b) return [];
  const fields = [];
  for (const f of COMPARE_FIELDS) {
    const av = a[f] ?? null;
    const bv = b[f] ?? null;
    if (String(av) !== String(bv)) fields.push(f);
  }
  if (normTOD(a.time_of_day) !== normTOD(b.time_of_day)) fields.push("time_of_day");
  if (irtSig(a._irt) !== irtSig(b._irt)) fields.push("irt");
  return fields;
}
function buildDiff(aItems, bItems) {
  const aMap = /* @__PURE__ */ new Map();
  const bMap = /* @__PURE__ */ new Map();
  aItems.forEach((i) => aMap.set(itemKey(i), i));
  bItems.forEach((i) => bMap.set(itemKey(i), i));
  const keys = /* @__PURE__ */ new Set([...aMap.keys(), ...bMap.keys()]);
  const out = [];
  keys.forEach((k) => {
    const a = aMap.get(k);
    const b = bMap.get(k);
    let status = "same";
    let changedFields = [];
    if (a && !b) status = "removed";
    else if (!a && b) status = "added";
    else {
      changedFields = diffItems(a, b);
      status = changedFields.length ? "changed" : "same";
    }
    out.push({
      key: k,
      section: (a == null ? void 0 : a.section_category) || (b == null ? void 0 : b.section_category),
      a,
      b,
      status,
      changedFields
    });
  });
  return out;
}
function summarize(diff, costA, costB) {
  return {
    added: diff.filter((d) => d.status === "added").length,
    removed: diff.filter((d) => d.status === "removed").length,
    changed: diff.filter((d) => d.status === "changed").length,
    same: diff.filter((d) => d.status === "same").length,
    costDelta: (costB || 0) - (costA || 0)
  };
}
const FIELD_LABEL = {
  dose: "доза",
  dose_unit: "ед.",
  frequency: "кратность",
  duration_days: "дни",
  day_pattern: "паттерн дней",
  dilution_volume: "объём",
  dilution_solvent: "растворитель",
  notes: "примечания",
  time_of_day: "время суток",
  irt: "точки ИРТ"
};
function fmtMoney(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";
}
function fmtSigned(n) {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return `${sign}${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.abs(n))} ₽`;
}
async function loadPlan(idOrVersionRef) {
  var _a;
  if (idOrVersionRef.startsWith("version:")) {
    const versionId = idOrVersionRef.slice("version:".length);
    const { data } = await supabase.from("treatment_plan_versions").select("*").eq("id", versionId).maybeSingle();
    if (!data) return null;
    const snap = data.snapshot || {};
    const plan2 = snap.plan || {};
    let patientName = null;
    if (plan2.patient_id) {
      const { data: p } = await supabase.from("patients").select("full_name").eq("id", plan2.patient_id).maybeSingle();
      patientName = (p == null ? void 0 : p.full_name) || null;
    }
    return {
      id: idOrVersionRef,
      label: `Версия №${data.version_no} · ${format(new Date(data.created_at), "d MMM yyyy, HH:mm", { locale: ru })}`,
      patient_name: patientName,
      issued_at: plan2.issued_at || null,
      course_number: plan2.course_number ?? null,
      diagnosis_short: plan2.diagnosis_short || null,
      clinical_summary: plan2.clinical_summary || null,
      duration_days: plan2.duration_days ?? null,
      status: plan2.status || null,
      total_cost_estimate: plan2.total_cost_estimate ?? null,
      items: snap.items || [],
      lab: snap.lab || []
    };
  }
  const { data: plan } = await supabase.from("treatment_plans").select("*, patient:patients(full_name)").eq("id", idOrVersionRef).maybeSingle();
  if (!plan) return null;
  const { data: items } = await supabase.from("treatment_plan_items").select("*").eq("plan_id", idOrVersionRef).order("order_index", { ascending: true });
  const { data: lab } = await supabase.from("treatment_plan_lab_control").select("control_point, at_day").eq("plan_id", idOrVersionRef).order("at_day", { ascending: true });
  const catIds = Array.from(new Set((items || []).map((i) => i.catalog_id).filter(Boolean)));
  const irtMap = await fetchIrtForCatalogIds(catIds);
  const enriched = (items || []).map((i) => {
    const v = i.catalog_id ? irtMap.get(i.catalog_id) : null;
    if (!v) return i;
    return { ...i, _irt: {
      protocol_id: v.protocol_id,
      name: v.name,
      session_count: v.session_count,
      session_duration_min: v.session_duration_min,
      frequency: v.frequency,
      points: v.points
    } };
  });
  return {
    id: idOrVersionRef,
    label: `Лист №${plan.course_number ?? "—"} · ${plan.issued_at ? format(new Date(plan.issued_at), "d MMM yyyy", { locale: ru }) : ""}`,
    patient_name: ((_a = plan.patient) == null ? void 0 : _a.full_name) || null,
    issued_at: plan.issued_at,
    course_number: plan.course_number,
    diagnosis_short: plan.diagnosis_short,
    clinical_summary: plan.clinical_summary,
    duration_days: plan.duration_days,
    status: plan.status,
    total_cost_estimate: plan.total_cost_estimate,
    items: enriched,
    lab: lab || []
  };
}
function statusClass(s, side) {
  if (s === "added" && side === "b") return "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500";
  if (s === "added" && side === "a") return "opacity-30 border-l-4 border-transparent";
  if (s === "removed" && side === "a") return "bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500";
  if (s === "removed" && side === "b") return "opacity-30 border-l-4 border-transparent";
  if (s === "changed") return "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500";
  return "border-l-4 border-transparent";
}
function ItemCard({
  item,
  status,
  side,
  changedFields
}) {
  if (!item) {
    return /* @__PURE__ */ jsxs("div", { className: `rounded-md p-2 text-xs italic text-muted-foreground min-h-[3.5rem] ${statusClass(status, side)}`, children: [
      status === "added" && side === "a" && "— (нет в этом курсе)",
      status === "removed" && side === "b" && "— (нет в этом курсе)"
    ] });
  }
  const isChanged = (f) => changedFields.includes(f);
  const hl = (f, val) => isChanged(f) ? /* @__PURE__ */ jsx("mark", { className: "bg-amber-200 dark:bg-amber-700/60 px-0.5 rounded-sm", children: val }) : val;
  return /* @__PURE__ */ jsxs("div", { className: `rounded-md p-2 text-sm space-y-0.5 ${statusClass(status, side)}`, children: [
    /* @__PURE__ */ jsx("div", { className: "font-medium", children: item.name_snapshot }),
    (item.dose != null || item.frequency || item.duration_days != null) && /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
      item.dose != null && /* @__PURE__ */ jsx(Fragment, { children: hl("dose", `${item.dose} ${item.dose_unit ?? ""}`.trim()) }),
      item.frequency && /* @__PURE__ */ jsxs(Fragment, { children: [
        " · ",
        hl("frequency", item.frequency)
      ] }),
      item.duration_days != null && /* @__PURE__ */ jsxs(Fragment, { children: [
        " · ",
        hl("duration_days", `${item.duration_days} дн`)
      ] })
    ] }),
    item.day_pattern && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
      "дни: ",
      hl("day_pattern", item.day_pattern)
    ] }),
    item.time_of_day && item.time_of_day.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: hl("time_of_day", item.time_of_day.join(", ")) }),
    (item.dilution_volume != null || item.dilution_solvent) && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
      item.dilution_volume != null && /* @__PURE__ */ jsxs(Fragment, { children: [
        hl("dilution_volume", `${item.dilution_volume} мл`),
        " "
      ] }),
      item.dilution_solvent && /* @__PURE__ */ jsx(Fragment, { children: hl("dilution_solvent", item.dilution_solvent) })
    ] }),
    item.notes && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground italic", children: hl("notes", item.notes) }),
    item._irt && /* @__PURE__ */ jsxs("div", { className: `mt-1 rounded-sm px-1.5 py-1 text-[11px] ${isChanged("irt") ? "bg-amber-100 dark:bg-amber-800/40" : "bg-muted/50"}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "font-semibold text-muted-foreground", children: [
        "ИРТ: ",
        item._irt.name || "—",
        item._irt.session_count != null && /* @__PURE__ */ jsxs(Fragment, { children: [
          " · ",
          item._irt.session_count,
          " сеан."
        ] }),
        item._irt.session_duration_min != null && /* @__PURE__ */ jsxs(Fragment, { children: [
          " · ",
          item._irt.session_duration_min,
          " мин"
        ] }),
        item._irt.frequency && /* @__PURE__ */ jsxs(Fragment, { children: [
          " · ",
          item._irt.frequency
        ] })
      ] }),
      item._irt.points && item._irt.points.length > 0 && /* @__PURE__ */ jsx("ol", { className: "list-decimal ml-4 mt-0.5 space-y-0.5", children: item._irt.points.map((p, i) => /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono", children: p.who_code }),
        p.name_ru && /* @__PURE__ */ jsxs(Fragment, { children: [
          " ",
          p.name_ru
        ] }),
        p.side && p.side !== "bilateral" && /* @__PURE__ */ jsxs(Fragment, { children: [
          " · ",
          p.side === "left" ? "слева" : "справа"
        ] }),
        p.manipulation && /* @__PURE__ */ jsxs(Fragment, { children: [
          " · ",
          p.manipulation
        ] }),
        p.depth_mm && /* @__PURE__ */ jsxs(Fragment, { children: [
          " · ",
          p.depth_mm,
          " мм"
        ] }),
        p.retention_min != null && /* @__PURE__ */ jsxs(Fragment, { children: [
          " · ",
          p.retention_min,
          " мин"
        ] })
      ] }, i)) })
    ] })
  ] });
}
function PlanHeader({ plan }) {
  const isVersion = plan.id.startsWith("version:");
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1 border-b pb-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: plan.label }),
      plan.status && /* @__PURE__ */ jsx(Badge, { variant: plan.status === "issued" ? "default" : "secondary", children: plan.status }),
      !isVersion && /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${plan.id}`, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1", children: [
        /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
        "Открыть"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
      plan.patient_name && /* @__PURE__ */ jsxs(Fragment, { children: [
        "Пациент: ",
        /* @__PURE__ */ jsx("span", { className: "text-foreground", children: plan.patient_name }),
        " · "
      ] }),
      plan.duration_days != null && /* @__PURE__ */ jsxs(Fragment, { children: [
        "длительность: ",
        plan.duration_days,
        " дн."
      ] })
    ] }),
    plan.diagnosis_short && /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsx("b", { children: "Диагноз:" }),
      " ",
      plan.diagnosis_short
    ] }),
    plan.clinical_summary && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground line-clamp-2", children: plan.clinical_summary }),
    /* @__PURE__ */ jsxs("div", { className: "text-sm pt-1", children: [
      /* @__PURE__ */ jsx("b", { children: "Стоимость:" }),
      " ",
      fmtMoney(plan.total_cost_estimate)
    ] })
  ] });
}
function TreatmentPlanCompare() {
  const [params] = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [planA, setPlanA] = useState(null);
  const [planB, setPlanB] = useState(null);
  const [error, setError] = useState(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const syncing = useRef(false);
  useEffect(() => {
    if (!a || !b) {
      setError("Не указаны идентификаторы курсов (a, b)");
      setBusy(false);
      return;
    }
    (async () => {
      setBusy(true);
      try {
        const [pa, pb] = await Promise.all([loadPlan(a), loadPlan(b)]);
        if (!pa || !pb) {
          setError("Один из курсов не найден");
          return;
        }
        setPlanA(pa);
        setPlanB(pb);
      } catch (e) {
        setError((e == null ? void 0 : e.message) || String(e));
      } finally {
        setBusy(false);
      }
    })();
  }, [a, b]);
  useEffect(() => {
    const l = leftRef.current, r = rightRef.current;
    if (!l || !r) return;
    const onScroll = (src, dst) => () => {
      if (syncing.current) return;
      syncing.current = true;
      dst.scrollTop = src.scrollTop;
      requestAnimationFrame(() => {
        syncing.current = false;
      });
    };
    const lh = onScroll(l, r);
    const rh = onScroll(r, l);
    l.addEventListener("scroll", lh, { passive: true });
    r.addEventListener("scroll", rh, { passive: true });
    return () => {
      l.removeEventListener("scroll", lh);
      r.removeEventListener("scroll", rh);
    };
  }, [busy, planA, planB]);
  const diff = useMemo(() => {
    if (!planA || !planB) return [];
    return buildDiff(planA.items, planB.items);
  }, [planA, planB]);
  const grouped = useMemo(() => {
    return SECTIONS.map((s) => ({
      section: s,
      entries: diff.filter((d) => d.section === s.key)
    })).filter((g) => g.entries.length > 0);
  }, [diff]);
  const sum = useMemo(() => {
    if (!planA || !planB) return null;
    return summarize(diff, planA.total_cost_estimate || 0, planB.total_cost_estimate || 0);
  }, [diff, planA, planB]);
  if (authLoading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) });
  if (!user || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center p-6", children: /* @__PURE__ */ jsx(Card, { className: "max-w-md w-full", children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center", children: "Доступ запрещён" }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("div", { className: "border-b sticky top-0 z-20 bg-background/95 backdrop-blur", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-3 flex items-center gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsx(Link, { to: "/admin/treatment-plans", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К листам"
      ] }) }),
      /* @__PURE__ */ jsx(Separator, { orientation: "vertical", className: "h-6" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(GitCompare, { className: "w-5 h-5 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold", children: "Сравнение курсов" })
      ] }),
      sum && /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2 text-sm flex-wrap", children: [
        sum.added > 0 && /* @__PURE__ */ jsxs(Badge, { className: "bg-emerald-500 hover:bg-emerald-500", children: [
          "+",
          sum.added,
          " добавлено"
        ] }),
        sum.removed > 0 && /* @__PURE__ */ jsxs(Badge, { className: "bg-rose-500 hover:bg-rose-500", children: [
          "−",
          sum.removed,
          " убрано"
        ] }),
        sum.changed > 0 && /* @__PURE__ */ jsxs(Badge, { className: "bg-amber-500 hover:bg-amber-500 text-amber-950", children: [
          sum.changed,
          " изменено"
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
          "Стоимость: ",
          fmtSigned(sum.costDelta)
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4", children: [
      busy && /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }),
      error && !busy && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-center text-destructive", children: error }) }),
      !busy && !error && planA && planB && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs(Card, { className: "flex flex-col max-h-[calc(100vh-7rem)]", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2 shrink-0", children: /* @__PURE__ */ jsx(PlanHeader, { plan: planA }) }),
          /* @__PURE__ */ jsxs(CardContent, { ref: leftRef, className: "overflow-y-auto flex-1 space-y-4 pt-3", children: [
            grouped.map(({ section, entries }) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
                /* @__PURE__ */ jsx(section.icon, { className: "w-4 h-4 text-muted-foreground" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: section.label })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: entries.map((e) => /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(ItemCard, { item: e.a, status: e.status, side: "a", changedFields: e.changedFields }) }, `a-${e.key}`)) })
            ] }, `a-${section.key}`)),
            grouped.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-8", children: "Нет позиций" }),
            planA.lab.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5", children: "Лабконтроль" }),
              /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-0.5", children: planA.lab.map((l, i) => /* @__PURE__ */ jsxs("li", { className: "border rounded-md p-1.5", children: [
                l.control_point,
                " ",
                l.at_day != null && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  "· день ",
                  l.at_day
                ] })
              ] }, i)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "flex flex-col max-h-[calc(100vh-7rem)]", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2 shrink-0", children: /* @__PURE__ */ jsx(PlanHeader, { plan: planB }) }),
          /* @__PURE__ */ jsxs(CardContent, { ref: rightRef, className: "overflow-y-auto flex-1 space-y-4 pt-3", children: [
            grouped.map(({ section, entries }) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
                /* @__PURE__ */ jsx(section.icon, { className: "w-4 h-4 text-muted-foreground" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: section.label })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: entries.map((e) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(ItemCard, { item: e.b, status: e.status, side: "b", changedFields: e.changedFields }),
                e.status === "changed" && e.changedFields.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-amber-700 dark:text-amber-300 px-2 mt-0.5", children: [
                  "изменено: ",
                  e.changedFields.map((f) => FIELD_LABEL[f] || f).join(", ")
                ] })
              ] }, `b-${e.key}`)) })
            ] }, `b-${section.key}`)),
            grouped.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-8", children: "Нет позиций" }),
            planB.lab.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5", children: "Лабконтроль" }),
              /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-0.5", children: planB.lab.map((l, i) => /* @__PURE__ */ jsxs("li", { className: "border rounded-md p-1.5", children: [
                l.control_point,
                " ",
                l.at_day != null && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  "· день ",
                  l.at_day
                ] })
              ] }, i)) })
            ] })
          ] })
        ] })
      ] }),
      !busy && !error && sum && /* @__PURE__ */ jsx("div", { className: "mt-4 text-xs text-muted-foreground text-center", children: "🟢 добавлено в правом · 🔴 убрано из левого · 🟡 изменилось (доза/кратность/дни/прочее)" })
    ] })
  ] });
}
export {
  TreatmentPlanCompare as default
};
