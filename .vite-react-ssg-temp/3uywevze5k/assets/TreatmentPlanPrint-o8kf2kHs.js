import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { s as supabase, B as Button } from "../main.mjs";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, Printer } from "lucide-react";
import QRCode from "qrcode";
import { a as SECTIONS } from "./sections-BdvyTZRY.js";
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
import "./RxItemsPreviewDialog-DH8JlDo_.js";
import "./scroll-area-DtgkI4MV.js";
import "@radix-ui/react-scroll-area";
import "./popover-C_8nSrct.js";
import "@radix-ui/react-popover";
import "./protocolBridge-4TuhSmsW.js";
const ROUTE_LABELS = {
  iv_drip: "в/в капельно",
  iv_bolus: "в/в струйно",
  im: "в/м",
  sc: "п/к",
  oral_rx: "внутрь",
  oral_supplement: "внутрь",
  rectal: "ректально",
  topical: "накожно",
  nasal: "интраназально",
  sublingual: "под язык",
  peptide: "по схеме",
  procedure: "",
  lifestyle: "",
  homeopathy: "под язык",
  physiotherapy: "процедура"
};
function renderLine(it, courseDays) {
  const parts = [];
  let head = it.name_snapshot;
  if (it.dose != null) head += ` ${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`;
  if (it.dilution_volume && it.dilution_solvent) {
    head += ` в ${it.dilution_volume} мл ${it.dilution_solvent}`;
  } else if (it.dilution_volume) {
    head += ` в ${it.dilution_volume} мл`;
  }
  parts.push(head);
  const tail = [];
  const route = it.route_override || ROUTE_LABELS[it.section_category];
  if (route) tail.push(route);
  if (it.infusion_rate) tail.push(it.infusion_rate);
  if (it.time_of_day && it.time_of_day.length) tail.push(it.time_of_day.join("/"));
  if (it.frequency) tail.push(it.frequency);
  const days = it.duration_days ?? courseDays;
  if (days) tail.push(`дни 1–${days}`);
  if (tail.length) parts.push(tail.join(", "));
  let line = parts.join(" — ");
  if (it.notes) line += `. ${it.notes}`;
  if (!line.endsWith(".")) line += ".";
  return line;
}
function expandPattern(pattern, courseDays, itemDays) {
  const total = itemDays ?? courseDays;
  const set = /* @__PURE__ */ new Set();
  if (!pattern || pattern.trim() === "") {
    for (let i = 1; i <= total; i++) set.add(i);
    return set;
  }
  pattern.split(",").map((s) => s.trim()).filter(Boolean).forEach((part) => {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const a = +range[1], b = +range[2];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= courseDays) set.add(i);
      return;
    }
    const every = part.match(/^через\s+(\d+)$/i);
    if (every) {
      const step = +every[1] + 1;
      for (let i = 1; i <= courseDays; i += step) set.add(i);
      return;
    }
    const n = Number(part);
    if (!Number.isNaN(n) && n >= 1 && n <= courseDays) set.add(n);
  });
  return set;
}
function TreatmentPlanPrint() {
  var _a, _b, _c, _d, _e;
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [labControl, setLabControl] = useState([]);
  const [labTestsMap, setLabTestsMap] = useState(/* @__PURE__ */ new Map());
  const [catalogMap, setCatalogMap] = useState(/* @__PURE__ */ new Map());
  const [acupunctureMap, setAcupunctureMap] = useState(/* @__PURE__ */ new Map());
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("treatment_plans").select("id, issued_at, duration_days, diagnosis_short, clinical_summary, status, mode, course_number, show_cost_in_print, lab_control_enabled, is_public, public_hash, patient:patients(id, full_name, birth_date)").eq("id", id).maybeSingle();
      const { data: rows } = await supabase.from("treatment_plan_items").select("*").eq("plan_id", id).order("section_category").order("order_index");
      const { data: lc } = await supabase.from("treatment_plan_lab_control").select("*").eq("plan_id", id).order("order_index");
      const planItems = rows || [];
      const lcRows = lc || [];
      const allTestIds = /* @__PURE__ */ new Set();
      lcRows.forEach((r) => (r.test_ids || []).forEach((tid) => allTestIds.add(tid)));
      if (allTestIds.size) {
        const { data: lt } = await supabase.from("lab_tests_catalog").select("id, name, short_name").in("id", Array.from(allTestIds));
        const m = /* @__PURE__ */ new Map();
        (lt || []).forEach((t) => m.set(t.id, t));
        setLabTestsMap(m);
      }
      const catIds = Array.from(new Set(planItems.map((i) => i.catalog_id).filter(Boolean)));
      if (catIds.length) {
        const { data: cat } = await supabase.from("treatment_catalog").select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_updated_at, price_source_preference").in("id", catIds);
        const m = /* @__PURE__ */ new Map();
        (cat || []).forEach((c) => m.set(c.id, c));
        setCatalogMap(m);
        const irt = await fetchIrtForCatalogIds(catIds);
        setAcupunctureMap(irt);
      }
      setPlan(p);
      setItems(planItems);
      setLabControl(lcRows);
      setBusy(false);
      await supabase.from("treatment_plans").update({ print_count: ((p == null ? void 0 : p.print_count) ?? 0) + 1 }).eq("id", id);
      if ((p == null ? void 0 : p.is_public) && (p == null ? void 0 : p.public_hash)) {
        try {
          const url = `${window.location.origin}/p/${p.public_hash}`;
          const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1 });
          setQrDataUrl(dataUrl);
        } catch {
        }
      }
    })();
  }, [id]);
  const costBreakdown = useMemo(() => {
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
  if (busy || !plan) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  const lifestyleItems = items.filter((i) => i.section_category === "lifestyle");
  const medicalSections = SECTIONS.filter((s) => s.key !== "lifestyle");
  const date = new Date(plan.issued_at);
  const birth = ((_a = plan.patient) == null ? void 0 : _a.birth_date) ? new Date(plan.patient.birth_date) : null;
  let age = null;
  if (birth) {
    age = date.getFullYear() - birth.getFullYear();
    const m = date.getMonth() - birth.getMonth();
    if (m < 0 || m === 0 && date.getDate() < birth.getDate()) age--;
  }
  const scheduledItems = items.filter((i) => i.section_category !== "lifestyle" && i.day_pattern);
  const showCalendar = plan.mode === "scheduled" && scheduledItems.length > 0;
  const landscape = plan.duration_days > 21;
  const compact = scheduledItems.length > 30;
  const showCost = !!plan.show_cost_in_print && costBreakdown && costBreakdown.total > 0;
  const showLab = !!plan.lab_control_enabled && labControl.length > 0;
  return /* @__PURE__ */ jsxs("div", { className: "bg-muted/30 min-h-screen py-6", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; border: none !important; }
          @page { size: A4 portrait; margin: 15mm; }
          ${landscape ? `.calendar-page { page-break-before: always; }
          @page calendar { size: A4 landscape; margin: 12mm; }
          .calendar-page { page: calendar; }` : ".calendar-page { page-break-before: always; }"}
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "no-print max-w-[210mm] mx-auto mb-4 flex justify-end gap-2 px-4", children: [
      /* @__PURE__ */ jsx(
        WritePrescriptionsButton,
        {
          items,
          patientId: (_b = plan.patient) == null ? void 0 : _b.id,
          patientName: (_c = plan.patient) == null ? void 0 : _c.full_name
        }
      ),
      /* @__PURE__ */ jsxs(Button, { onClick: () => window.print(), className: "gap-2", children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
        "Печать / PDF"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "print-page bg-white text-black mx-auto shadow-lg", style: { width: "210mm", minHeight: "297mm", padding: "15mm", fontFamily: "Times New Roman, serif", fontSize: "11pt", lineHeight: 1.45 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { borderBottom: "2px solid #000", paddingBottom: "4mm", marginBottom: "5mm" }, children: [
        /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontSize: "9pt", letterSpacing: "0.5px" }, children: "Министерство здравоохранения Российской Федерации" }),
        /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontWeight: "bold", fontSize: "12pt", marginTop: "2mm" }, children: "Профессор, д.м.н. Тарусин Дмитрий Игоревич" }),
        /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontSize: "9pt", marginTop: "1mm" }, children: "Детский уролог-андролог высшей категории · Московский андрологический центр" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", fontWeight: "bold", fontSize: "15pt", letterSpacing: "2px", marginBottom: "4mm" }, children: [
        "ЛИСТ НАЗНАЧЕНИЙ",
        plan.course_number != null ? ` № ${plan.course_number}` : ""
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "3mm" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "Дата выписки: ",
          /* @__PURE__ */ jsx("b", { children: format(date, "d MMMM yyyy 'г.'", { locale: ru }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "ID: ",
          plan.id.slice(0, 8).toUpperCase()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: "10pt", marginBottom: "1mm" }, children: [
        "Ф.И.О. пациента: ",
        /* @__PURE__ */ jsx("b", { children: ((_d = plan.patient) == null ? void 0 : _d.full_name) || "—" }),
        age !== null && /* @__PURE__ */ jsxs("span", { style: { marginLeft: "5mm" }, children: [
          "Возраст: ",
          /* @__PURE__ */ jsxs("b", { children: [
            age,
            " лет"
          ] })
        ] })
      ] }),
      plan.diagnosis_short && /* @__PURE__ */ jsxs("div", { style: { fontSize: "10pt", marginBottom: "1mm" }, children: [
        "Диагноз: ",
        /* @__PURE__ */ jsx("b", { children: plan.diagnosis_short })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: "10pt", marginBottom: "3mm" }, children: [
        "Длительность курса: ",
        /* @__PURE__ */ jsxs("b", { children: [
          plan.duration_days,
          " дней"
        ] })
      ] }),
      plan.clinical_summary && /* @__PURE__ */ jsx("div", { style: { fontStyle: "italic", fontSize: "10pt", color: "#222", borderLeft: "2px solid #888", paddingLeft: "3mm", margin: "3mm 0 5mm 0" }, children: plan.clinical_summary }),
      /* @__PURE__ */ jsx("hr", { style: { border: 0, borderTop: "1px solid #000", margin: "3mm 0" } }),
      medicalSections.map((section) => {
        const list = items.filter((i) => i.section_category === section.key);
        if (!list.length) return null;
        return /* @__PURE__ */ jsxs("div", { style: { marginBottom: "4mm", pageBreakInside: "avoid" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: "bold", fontSize: "11pt", marginBottom: "1mm", textTransform: "uppercase", letterSpacing: "0.5px" }, children: section.label }),
          /* @__PURE__ */ jsx("ol", { style: { margin: 0, paddingLeft: "8mm" }, children: list.map((it) => {
            const irt = it.catalog_id ? acupunctureMap.get(it.catalog_id) : void 0;
            return /* @__PURE__ */ jsxs("li", { style: { marginBottom: "1.5mm" }, children: [
              renderLine(it, plan.duration_days),
              it.is_off_label && /* @__PURE__ */ jsx("span", { style: { fontSize: "8pt", marginLeft: "2mm" }, children: "(off-label)" }),
              irt && irt.points.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: "1mm", marginLeft: "2mm", fontSize: "9.5pt", color: "#222" }, children: [
                (() => {
                  const meta = [];
                  if (irt.session_count != null) meta.push(`${irt.session_count} сеансов`);
                  if (irt.session_duration_min != null) meta.push(`${irt.session_duration_min} мин/сеанс`);
                  if (irt.frequency) meta.push(irt.frequency);
                  return meta.length ? /* @__PURE__ */ jsxs("div", { style: { fontStyle: "italic", marginBottom: "0.5mm" }, children: [
                    "Курс: ",
                    meta.join(" · ")
                  ] }) : null;
                })(),
                /* @__PURE__ */ jsxs("div", { style: { fontWeight: "bold", marginBottom: "0.5mm" }, children: [
                  "Точки протокола (",
                  irt.points.length,
                  "):"
                ] }),
                /* @__PURE__ */ jsx("ol", { style: { margin: 0, paddingLeft: "6mm" }, children: irt.points.map((pt, idx) => /* @__PURE__ */ jsx("li", { style: { marginBottom: "0.5mm" }, children: formatIrtPointLine(pt) }, idx)) })
              ] })
            ] }, it.id);
          }) })
        ] }, section.key);
      }),
      lifestyleItems.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: "5mm", pageBreakInside: "avoid" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: "bold", fontSize: "11pt", marginBottom: "1mm", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Рекомендации образа жизни" }),
        /* @__PURE__ */ jsx("ol", { style: { margin: 0, paddingLeft: "8mm" }, children: lifestyleItems.map((it) => /* @__PURE__ */ jsxs("li", { style: { marginBottom: "1.5mm" }, children: [
          /* @__PURE__ */ jsx("b", { children: it.name_snapshot }),
          it.notes ? ` — ${it.notes}` : "",
          it.frequency ? `. ${it.frequency}` : ""
        ] }, it.id)) })
      ] }),
      showLab && /* @__PURE__ */ jsxs("div", { style: { marginTop: "5mm", pageBreakInside: "avoid" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: "bold", fontSize: "11pt", marginBottom: "1.5mm", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Контроль на фоне терапии" }),
        /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "9.5pt" }, children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { style: { border: "1px solid #000", padding: "1.2mm 2mm", background: "#f0f0f0", textAlign: "left", width: "38mm" }, children: "Точка контроля" }),
            /* @__PURE__ */ jsx("th", { style: { border: "1px solid #000", padding: "1.2mm 2mm", background: "#f0f0f0", textAlign: "left", width: "16mm" }, children: "День" }),
            /* @__PURE__ */ jsx("th", { style: { border: "1px solid #000", padding: "1.2mm 2mm", background: "#f0f0f0", textAlign: "left" }, children: "Анализы / исследования" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: labControl.map((lc) => {
            const tests = [
              ...(lc.test_ids || []).map((tid) => {
                var _a2, _b2;
                return ((_a2 = labTestsMap.get(tid)) == null ? void 0 : _a2.short_name) || ((_b2 = labTestsMap.get(tid)) == null ? void 0 : _b2.name);
              }).filter(Boolean),
              ...lc.custom_tests || []
            ];
            return /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { style: { border: "1px solid #000", padding: "1.2mm 2mm", verticalAlign: "top" }, children: lc.control_point || "—" }),
              /* @__PURE__ */ jsx("td", { style: { border: "1px solid #000", padding: "1.2mm 2mm", verticalAlign: "top" }, children: lc.at_day != null ? `${lc.at_day}` : "—" }),
              /* @__PURE__ */ jsxs("td", { style: { border: "1px solid #000", padding: "1.2mm 2mm", verticalAlign: "top" }, children: [
                tests.length ? tests.join(", ") : "—",
                lc.notes ? /* @__PURE__ */ jsx("div", { style: { fontSize: "8.5pt", color: "#444", marginTop: "0.5mm", fontStyle: "italic" }, children: lc.notes }) : null
              ] })
            ] }, lc.id);
          }) })
        ] })
      ] }),
      showCost && costBreakdown && /* @__PURE__ */ jsxs("div", { style: { marginTop: "5mm", pageBreakInside: "avoid" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: "bold", fontSize: "11pt", marginBottom: "1.5mm", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Ориентировочная стоимость курса" }),
        /* @__PURE__ */ jsx("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "10pt" }, children: /* @__PURE__ */ jsxs("tbody", { children: [
          Object.entries(costBreakdown.byGroup).map(([k, g]) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { style: { padding: "0.8mm 2mm", borderBottom: "1px dashed #999" }, children: [
              g.emoji,
              " ",
              g.label
            ] }),
            /* @__PURE__ */ jsx("td", { style: { padding: "0.8mm 2mm", borderBottom: "1px dashed #999", textAlign: "right", fontVariantNumeric: "tabular-nums" }, children: formatRub(g.sum) })
          ] }, k)),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { style: { padding: "1.2mm 2mm", borderTop: "1.5px solid #000", fontWeight: "bold" }, children: "Итого:" }),
            /* @__PURE__ */ jsx("td", { style: { padding: "1.2mm 2mm", borderTop: "1.5px solid #000", fontWeight: "bold", textAlign: "right", fontVariantNumeric: "tabular-nums" }, children: formatRub(costBreakdown.total) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: "8.5pt", color: "#444", marginTop: "1.5mm", fontStyle: "italic" }, children: [
          (() => {
            const d = latestPriceDate(catalogMap.values());
            return d ? `Цены актуальны на ${format(new Date(d), "d MMMM yyyy 'г.'", { locale: ru })}, могут отличаться ±15–20% в зависимости от аптеки. ` : "Расчёт ориентировочный, ±15–20% в зависимости от аптеки. ";
          })(),
          "Стоимость процедур, расходных материалов и услуг клиники в расчёт не включена.",
          costBreakdown.missing.length > 0 ? ` Цены не заданы для ${costBreakdown.missing.length} позиций — они не учтены.` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: "12mm", display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "10pt", gap: "8mm" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "Врач: ________________________",
          /* @__PURE__ */ jsx("div", { style: { marginTop: "1mm" }, children: "проф., д.м.н. Тарусин Д.И." }),
          /* @__PURE__ */ jsxs("div", { style: { marginTop: "1mm" }, children: [
            "М.П.   Дата: ",
            format(date, "dd.MM.yyyy")
          ] })
        ] }),
        qrDataUrl && /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ jsx("img", { src: qrDataUrl, alt: "QR-код памятки", style: { width: "25mm", height: "25mm", display: "block" } }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "8pt", marginTop: "1mm", color: "#444", maxWidth: "30mm" }, children: "Памятка пациента онлайн" })
        ] })
      ] })
    ] }),
    showCalendar && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "print-page calendar-page bg-white text-black mx-auto shadow-lg",
        style: {
          width: landscape ? "297mm" : "210mm",
          minHeight: landscape ? "210mm" : "297mm",
          padding: "12mm",
          marginTop: "8mm",
          fontFamily: "Times New Roman, serif",
          fontSize: compact ? "8pt" : "9pt",
          lineHeight: 1.2
        },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", fontWeight: "bold", fontSize: "12pt", marginBottom: "3mm", letterSpacing: "1px" }, children: [
            "КАЛЕНДАРЬ КУРСА",
            plan.course_number != null ? ` № ${plan.course_number}` : "",
            " — ",
            (_e = plan.patient) == null ? void 0 : _e.full_name
          ] }),
          /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }, children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { style: { border: "1px solid #000", padding: "1mm 2mm", textAlign: "left", width: compact ? "38mm" : "55mm", background: "#f0f0f0" }, children: "Позиция" }),
              Array.from({ length: plan.duration_days }, (_, i) => i + 1).map((d) => /* @__PURE__ */ jsx("th", { style: { border: "1px solid #000", padding: "1mm 0", textAlign: "center", background: "#f0f0f0", fontSize: compact ? "7pt" : "8pt" }, children: d }, d))
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: scheduledItems.map((it) => {
              const days = expandPattern(it.day_pattern, plan.duration_days, it.duration_days);
              return /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsxs("td", { style: { border: "1px solid #000", padding: "1mm 2mm", fontSize: compact ? "7.5pt" : "8.5pt" }, children: [
                  it.name_snapshot,
                  it.dose != null && /* @__PURE__ */ jsxs("span", { style: { color: "#555" }, children: [
                    " — ",
                    it.dose,
                    it.dose_unit ? " " + it.dose_unit : ""
                  ] })
                ] }),
                Array.from({ length: plan.duration_days }, (_, i) => i + 1).map((d) => /* @__PURE__ */ jsx(
                  "td",
                  {
                    style: {
                      border: "1px solid #ccc",
                      background: days.has(d) ? "#888" : "transparent",
                      padding: 0,
                      height: compact ? "4mm" : "5mm"
                    }
                  },
                  d
                ))
              ] }, it.id);
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { marginTop: "3mm", fontSize: "8pt", color: "#444" }, children: [
            "Серая заливка — дни приёма согласно паттерну. Всего позиций по расписанию: ",
            scheduledItems.length,
            "."
          ] })
        ]
      }
    )
  ] });
}
export {
  TreatmentPlanPrint as default
};
