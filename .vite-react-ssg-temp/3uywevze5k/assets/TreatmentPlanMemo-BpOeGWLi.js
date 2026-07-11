import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, r as Checkbox, B as Button, C as Card, a as CardContent, t as toast } from "../main.mjs";
import { Loader2, ArrowLeft, Printer, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { b as buildMemoGroups, m as memoReadiness, a as generateMemoDocx } from "./docxExport-CPpJ-UJC.js";
import { c as calculatePlanCost, f as formatRub, l as latestPriceDate } from "./cost-B-oW-Erb.js";
import { f as fetchIrtForCatalogIds, a as formatIrtPointLine } from "./acupunctureExpand-DBa3GykD.js";
import { W as WritePrescriptionsButton } from "./WritePrescriptionsButton-DmxG7UKp.js";
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
import "docx";
import "./FileSaver.min-DtJWvt7f.js";
import "./sections-BdvyTZRY.js";
import "./RxItemsPreviewDialog-DH8JlDo_.js";
import "./scroll-area-DtgkI4MV.js";
import "@radix-ui/react-scroll-area";
import "./popover-C_8nSrct.js";
import "@radix-ui/react-popover";
import "./protocolBridge-4TuhSmsW.js";
function TreatmentPlanMemo() {
  const { id } = useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [plan, setPlan] = useState(null);
  const [patient, setPatient] = useState(null);
  const [items, setItems] = useState([]);
  const [showCost, setShowCost] = useState(false);
  const [catalogMap, setCatalogMap] = useState(/* @__PURE__ */ new Map());
  const [catalogPatientMap, setCatalogPatientMap] = useState(/* @__PURE__ */ new Map());
  const [acuMap, setAcuMap] = useState(/* @__PURE__ */ new Map());
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: `/admin/treatment-plans/${id}/memo` } });
  }, [user, isAdmin, loading, id, navigate]);
  useEffect(() => {
    (async () => {
      setBusy(true);
      const { data: p } = await supabase.from("treatment_plans").select("*, patient:patients(*)").eq("id", id).maybeSingle();
      if (!p) {
        setBusy(false);
        return;
      }
      setPlan(p);
      setPatient(p.patient);
      setShowCost(!!p.show_cost_in_memo);
      const { data: rows } = await supabase.from("treatment_plan_items").select("*").eq("plan_id", id).order("section_category").order("order_index");
      setItems(rows || []);
      const catIds = Array.from(new Set((rows || []).map((r) => r.catalog_id).filter(Boolean)));
      if (catIds.length) {
        const { data: cat } = await supabase.from("treatment_catalog").select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_updated_at, price_source_preference").in("id", catIds);
        const m = /* @__PURE__ */ new Map();
        const mp = /* @__PURE__ */ new Map();
        (cat || []).forEach((c) => {
          m.set(c.id, c);
          if (c.patient_info && typeof c.patient_info === "object") mp.set(c.id, c.patient_info);
        });
        setCatalogMap(m);
        setCatalogPatientMap(mp);
        const acu = await fetchIrtForCatalogIds(catIds);
        setAcuMap(acu);
      }
      setBusy(false);
    })();
  }, [id]);
  const enrichedPatientMap = useMemo(() => {
    if (acuMap.size === 0) return catalogPatientMap;
    const out = new Map(catalogPatientMap);
    acuMap.forEach((proto, catId) => {
      const existing = out.get(catId) || {};
      const meta = [
        proto.session_count != null ? `${proto.session_count} сеансов` : null,
        proto.session_duration_min ? `по ${proto.session_duration_min} мин` : null,
        proto.frequency
      ].filter(Boolean).join(", ");
      const pointLines = proto.points.map((pt, i) => `${i + 1}) ${formatIrtPointLine(pt)}`).join("; ");
      const irtText = [meta && `Курс ИРТ: ${meta}.`, pointLines && `Точки: ${pointLines}.`].filter(Boolean).join(" ");
      const desc = [existing.patient_description, irtText].filter(Boolean).join(" ");
      out.set(catId, { ...existing, patient_description: desc });
    });
    return out;
  }, [catalogPatientMap, acuMap]);
  const groups = useMemo(
    () => buildMemoGroups(items, enrichedPatientMap),
    [items, enrichedPatientMap]
  );
  const breakdown = useMemo(() => {
    if (!plan) return null;
    const input = items.map((it) => ({
      catalog_id: it.catalog_id,
      section_category: it.section_category,
      frequency: it.frequency,
      day_pattern: it.day_pattern,
      duration_days: it.duration_days,
      prn_estimated_doses: it.prn_estimated_doses,
      name_snapshot: it.name_snapshot
    }));
    return calculatePlanCost(input, catalogMap, plan.duration_days, plan.mode || "flat");
  }, [items, catalogMap, plan]);
  const readiness = useMemo(() => memoReadiness(items, enrichedPatientMap), [items, enrichedPatientMap]);
  const onToggleCost = async (v) => {
    setShowCost(v);
    await supabase.from("treatment_plans").update({ show_cost_in_memo: v }).eq("id", id);
  };
  const onExportDocx = async () => {
    if (!plan) return;
    try {
      await generateMemoDocx(
        {
          plan,
          patient,
          patientAge: null,
          items,
          catalogMap,
          catalogPatientMap: enrichedPatientMap
        },
        { showCost, costBreakdownTotal: (breakdown == null ? void 0 : breakdown.total) ?? null }
      );
      toast({ title: "DOCX памятки скачан" });
    } catch (e) {
      toast({ title: "Ошибка экспорта", description: e.message, variant: "destructive" });
    }
  };
  if (busy || loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!plan) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Лист назначений не найден" });
  }
  const date = new Date(plan.issued_at);
  return /* @__PURE__ */ jsxs("div", { className: "bg-muted/30 min-h-screen py-6 print:bg-white print:py-0", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @media print {
          .no-print { display: none !important; }
          .memo-page { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 15mm !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between flex-wrap gap-2 px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: `/admin/treatment-plans/${id}`, className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К листу назначений"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Checkbox, { checked: showCost, onCheckedChange: (v) => onToggleCost(!!v) }),
          "Включить стоимость в памятку"
        ] }),
        /* @__PURE__ */ jsx(ReadinessBadge, { readiness }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => window.print(), className: "gap-2", children: [
          /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
          "Печать / PDF"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: onExportDocx, className: "gap-2", children: [
          /* @__PURE__ */ jsx(FileDown, { className: "w-4 h-4" }),
          "Скачать DOCX"
        ] }),
        /* @__PURE__ */ jsx(
          WritePrescriptionsButton,
          {
            items,
            patientId: patient == null ? void 0 : patient.id,
            patientName: patient == null ? void 0 : patient.full_name
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "memo-page bg-white text-black mx-auto shadow-lg", style: { width: "210mm", minHeight: "297mm" }, children: /* @__PURE__ */ jsxs(CardContent, { className: "p-10", style: { fontFamily: "Times New Roman, serif", fontSize: "12pt", lineHeight: 1.55 }, children: [
      /* @__PURE__ */ jsx("h1", { className: "text-center font-bold tracking-wide", style: { fontSize: "20pt", marginBottom: "4mm" }, children: "ПАМЯТКА ПАЦИЕНТУ" }),
      /* @__PURE__ */ jsxs("p", { className: "text-center italic text-muted-foreground", style: { fontSize: "11pt", color: "#555" }, children: [
        "для ",
        /* @__PURE__ */ jsx("b", { style: { color: "#000" }, children: (patient == null ? void 0 : patient.full_name) || "—" }),
        " · курс ",
        plan.duration_days,
        " дней ·",
        " ",
        format(date, "d MMMM yyyy 'г.'", { locale: ru })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-center italic", style: { color: "#555", fontSize: "10.5pt", marginTop: "2mm", marginBottom: "8mm" }, children: "Это пояснение к листу назначений простым языком. Если что-то непонятно — звоните или пишите перед началом курса." }),
      groups.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center italic", style: { color: "#888" }, children: "Памятка пуста — для всех позиций установлен признак «скрыто от памятки» или лист ещё не заполнен." }),
      groups.map((g) => /* @__PURE__ */ jsxs("section", { style: { marginBottom: "6mm", breakInside: "avoid" }, children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-bold uppercase tracking-wider", style: { fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }, children: [
          g.emoji,
          " ",
          g.label
        ] }),
        /* @__PURE__ */ jsx("ul", { style: { paddingLeft: "6mm", margin: 0 }, children: g.items.map((it, i) => /* @__PURE__ */ jsxs("li", { style: { marginBottom: "2mm" }, children: [
          /* @__PURE__ */ jsx("b", { children: it.name }),
          it.description ? /* @__PURE__ */ jsxs("span", { children: [
            " — ",
            it.description
          ] }) : null
        ] }, i)) })
      ] }, g.label)),
      showCost && breakdown && breakdown.total > 0 && /* @__PURE__ */ jsxs("section", { style: { marginTop: "6mm", breakInside: "avoid" }, children: [
        /* @__PURE__ */ jsx("h2", { className: "font-bold uppercase tracking-wider", style: { fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }, children: "💰 Ориентировочная стоимость курса" }),
        /* @__PURE__ */ jsxs("p", { style: { marginTop: "2mm" }, children: [
          formatRub(breakdown.total),
          " (±15–20%, без стоимости процедур и услуг клиники).",
          (() => {
            const d = latestPriceDate(catalogMap.values());
            return d ? ` Цены актуальны на ${format(new Date(d), "d MMMM yyyy 'г.'", { locale: ru })}.` : "";
          })()
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "italic", style: { marginTop: "10mm", color: "#444", fontSize: "10pt" }, children: "Памятка не заменяет лист назначений и консультацию врача. Все вопросы — на приёме или по телефону." })
    ] }) })
  ] });
}
function ReadinessBadge({ readiness }) {
  const cfg = readiness.state === "complete" ? { dot: "bg-emerald-500", label: "готова" } : readiness.state === "partial" ? { dot: "bg-amber-500", label: "частично" } : { dot: "bg-red-500", label: "много пропусков" };
  return /* @__PURE__ */ jsxs(
    "span",
    {
      title: `Памятка: заполнено ${readiness.filled} из ${readiness.total}`,
      className: "inline-flex items-center gap-2 text-xs text-muted-foreground",
      children: [
        /* @__PURE__ */ jsx("span", { className: `inline-block w-2.5 h-2.5 rounded-full ${cfg.dot}` }),
        "Памятка: ",
        cfg.label,
        " (",
        readiness.filled,
        "/",
        readiness.total,
        ")"
      ]
    }
  );
}
export {
  TreatmentPlanMemo as default
};
