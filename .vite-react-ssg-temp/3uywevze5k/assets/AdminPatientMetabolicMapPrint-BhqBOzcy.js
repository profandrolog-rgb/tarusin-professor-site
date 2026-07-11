import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { s as supabase, B as Button } from "../main.mjs";
import { Loader2, FileDown, Printer } from "lucide-react";
import { S as SEVERITY_LABEL } from "./aggregator-U0tC1iI4.js";
import { f as fetchPathwayTexts, R as REGISTER_LABEL, b as pickText } from "./texts-CVx3FMtc.js";
import { e as exportNodeToPdf } from "./exportPdf-BAJanap8.js";
import { g as getTemplate, t as templateToScene, b as buildAutoScene, P as PathwaySceneSVG, R as RxBlock } from "./autoLayout-ewZEOAZ4.js";
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
import "jspdf";
import "html2canvas";
const STATUS_CLS = {
  no_data: "bg-gray-100 text-gray-700 border-gray-300",
  norm: "bg-emerald-50 text-emerald-800 border-emerald-300",
  mild: "bg-blue-50 text-blue-800 border-blue-300",
  moderate: "bg-amber-50 text-amber-800 border-amber-300",
  severe: "bg-red-50 text-red-800 border-red-300"
};
function AdminPatientMetabolicMapPrint() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const paths = (sp.get("paths") || "").split(",").filter(Boolean);
  const register = sp.get("register") || "simple";
  const [patient, setPatient] = useState(null);
  const [pathways, setPathways] = useState([]);
  const [summary, setSummary] = useState([]);
  const [findings, setFindings] = useState([]);
  const [texts, setTexts] = useState([]);
  const [recs, setRecs] = useState([]);
  const [schemas, setSchemas] = useState(/* @__PURE__ */ new Map());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    (async () => {
      var _a;
      if (!id) return;
      const [{ data: p }, { data: pw }, { data: m }, txs] = await Promise.all([
        supabase.from("patients").select("id, full_name, birth_date, history_number").eq("id", id).maybeSingle(),
        supabase.from("pathways").select("id, slug, name, description, nodes, edges, svg_scene").eq("is_active", true),
        supabase.from("metabolic_maps").select("id, aggregate_summary").eq("patient_id", id).maybeSingle(),
        fetchPathwayTexts()
      ]);
      setPatient(p);
      setPathways(pw || []);
      setSummary(((_a = m == null ? void 0 : m.aggregate_summary) == null ? void 0 : _a.pathways) || []);
      setTexts(txs);
      if (m == null ? void 0 : m.id) {
        const { data: sch } = await supabase.from("map_schemas").select("pathway_code, scene").eq("map_id", m.id);
        const map = /* @__PURE__ */ new Map();
        for (const row of sch || []) {
          if ((row == null ? void 0 : row.pathway_code) && (row == null ? void 0 : row.scene)) map.set(row.pathway_code, row.scene);
        }
        setSchemas(map);
      }
      if (m == null ? void 0 : m.id) {
        const [{ data: f }, { data: r }] = await Promise.all([
          supabase.from("map_findings").select("id, pathway_id, node_id, severity, label, detail, source_ref").eq("map_id", m.id),
          supabase.from("map_recommendations").select(
            "id, catalog_id, pathway_id, target_node_id, application_point, rationale, priority, evidence_level, age_warning, contra_warning, include_in_print, is_manual, catalog:treatment_catalog(name, subcategory, category, default_dose, dose_unit, default_route_label, default_frequency)"
          ).eq("map_id", m.id).eq("include_in_print", true).order("priority", { ascending: false }).order("evidence_level", { ascending: false })
        ]);
        setFindings(f || []);
        setRecs(r || []);
      }
      setLoading(false);
    })();
  }, [id]);
  const selected = useMemo(() => {
    const bySlug = new Map(pathways.map((p) => [p.slug, p]));
    return paths.map((s) => bySlug.get(s)).filter(Boolean);
  }, [pathways, paths]);
  const summaryByPathway = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);
  const findingsByPathway = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const f of findings) {
      const k = f.pathway_id || "_";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(f);
    }
    return m;
  }, [findings]);
  const doPdf = async () => {
    const node = document.getElementById("print-root");
    if (!node) return;
    setExporting(true);
    try {
      await exportNodeToPdf(node, `metabolic-map-${(patient == null ? void 0 : patient.full_name) || id}.pdf`);
    } finally {
      setExporting(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin" }) });
  return /* @__PURE__ */ jsxs("div", { className: "bg-neutral-100 min-h-screen", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: "Метаболическая карта — печать" }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .a4-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          .a4-page:last-child { page-break-after: auto; }
        }
        .a4-page { width: 210mm; min-height: 297mm; padding: 14mm 12mm; background: #fff; margin: 8mm auto; box-shadow: 0 1px 8px rgba(0,0,0,0.08); box-sizing: border-box; }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "no-print sticky top-0 z-10 bg-background border-b py-3 px-4 flex items-center gap-2 justify-end", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground mr-auto", children: [
        "Режим: ",
        REGISTER_LABEL[register],
        " · листов: ",
        selected.length + 1
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: doPdf, disabled: exporting, children: [
        exporting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(FileDown, { className: "w-4 h-4 mr-2" }),
        "Скачать PDF"
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => window.print(), children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4 mr-2" }),
        "Печать"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { id: "print-root", children: [
      /* @__PURE__ */ jsxs("section", { className: "a4-page", children: [
        /* @__PURE__ */ jsxs("header", { className: "mb-4 pb-3 border-b", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Метаболическая карта" }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-neutral-700 mt-1", children: [
            patient == null ? void 0 : patient.full_name,
            (patient == null ? void 0 : patient.history_number) ? ` · № ИБ ${patient.history_number}` : "",
            (patient == null ? void 0 : patient.birth_date) ? ` · д.р. ${patient.birth_date}` : ""
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-neutral-500 mt-1", children: [
            "Регистр: ",
            REGISTER_LABEL[register],
            " · сформировано ",
            (/* @__PURE__ */ new Date()).toLocaleString("ru-RU")
          ] })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-2", children: "Сводка по путям" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-100 text-left", children: [
            /* @__PURE__ */ jsx("th", { className: "border px-2 py-1", children: "Путь" }),
            /* @__PURE__ */ jsx("th", { className: "border px-2 py-1 w-32", children: "Статус" }),
            /* @__PURE__ */ jsx("th", { className: "border px-2 py-1 w-24", children: "Маркеров" }),
            /* @__PURE__ */ jsx("th", { className: "border px-2 py-1", children: "Кратко" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: selected.map((pw) => {
            const s = summaryByPathway.get(pw.id);
            const st = (s == null ? void 0 : s.status) || "no_data";
            const t = pickText(texts, pw.id, register);
            return /* @__PURE__ */ jsxs("tr", { className: "align-top", children: [
              /* @__PURE__ */ jsx("td", { className: "border px-2 py-1 font-medium", children: pw.name }),
              /* @__PURE__ */ jsx("td", { className: `border px-2 py-1 ${STATUS_CLS[st]}`, children: SEVERITY_LABEL[st] }),
              /* @__PURE__ */ jsx("td", { className: "border px-2 py-1 text-center", children: (s == null ? void 0 : s.matched_markers) ?? 0 }),
              /* @__PURE__ */ jsx("td", { className: "border px-2 py-1 text-xs", children: (t == null ? void 0 : t.summary) || "—" })
            ] }, pw.id);
          }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-neutral-500 mt-6 pt-3 border-t", children: "Статусы получены детерминированно из лабораторных данных (сравнение с референсными границами по правилам пути). Если данных нет — статус «нет данных». Документ не заменяет консультацию врача." })
      ] }),
      selected.map((pw) => {
        const s = summaryByPathway.get(pw.id);
        const st = (s == null ? void 0 : s.status) || "no_data";
        const t = pickText(texts, pw.id, register);
        const pwFindings = findingsByPathway.get(pw.id) || [];
        const affectedNodes = /* @__PURE__ */ new Set([
          ...pwFindings.map((f) => f.node_id).filter(Boolean),
          ...(s == null ? void 0 : s.affected_nodes) || []
        ]);
        return /* @__PURE__ */ jsxs("section", { className: "a4-page", children: [
          /* @__PURE__ */ jsxs("header", { className: "mb-3 pb-2 border-b flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: pw.name }),
              pw.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 mt-0.5", children: pw.description })
            ] }),
            /* @__PURE__ */ jsx("div", { className: `text-sm px-2 py-1 rounded border ${STATUS_CLS[st]}`, children: SEVERITY_LABEL[st] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mb-4", children: (() => {
            const tpl = getTemplate(pw.slug);
            const anyPw = pw;
            const scene = schemas.get(pw.slug) || (tpl ? templateToScene(tpl) : null) || (anyPw.svg_scene && Array.isArray(anyPw.svg_scene.elements) && anyPw.svg_scene.elements.length > 0 ? anyPw.svg_scene : buildAutoScene(pw.nodes || [], pw.edges || []));
            const rxSet = new Set(
              recs.filter((r) => r.pathway_id === pw.id).map((r) => r.target_node_id).filter(Boolean)
            );
            return /* @__PURE__ */ jsx(
              PathwaySceneSVG,
              {
                scene,
                highlights: new Map(Array.from(affectedNodes).map((n) => [n, st])),
                rxNodes: rxSet,
                maxHeight: 320
              }
            );
          })() }),
          t && /* @__PURE__ */ jsxs("div", { className: "text-[13px] space-y-2 leading-snug", children: [
            t.what_broken && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Что нарушено. " }),
              t.what_broken
            ] }),
            t.evidence && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "По каким показателям это видно. " }),
              t.evidence
            ] }),
            t.risks && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Чем грозит. " }),
              t.risks
            ] }),
            t.connections && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Связи с другими системами. " }),
              t.connections
            ] }),
            t.actions && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Что делать. " }),
              t.actions
            ] })
          ] }),
          (() => {
            const pwRecs = recs.filter((r) => r.pathway_id === pw.id);
            if (pwRecs.length === 0 && affectedNodes.size === 0) return null;
            return /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(RxBlock, { recs: pwRecs, affectedNodes: [...affectedNodes] }) });
          })(),
          pwFindings.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold mb-1", children: "Показатели пациента" }),
            /* @__PURE__ */ jsxs("table", { className: "w-full text-xs border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-100 text-left", children: [
                /* @__PURE__ */ jsx("th", { className: "border px-2 py-1", children: "Маркер / значение" }),
                /* @__PURE__ */ jsx("th", { className: "border px-2 py-1 w-56", children: "Референс / забор" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: pwFindings.map((f) => /* @__PURE__ */ jsxs("tr", { className: "align-top", children: [
                /* @__PURE__ */ jsx("td", { className: "border px-2 py-1", children: f.label }),
                /* @__PURE__ */ jsx("td", { className: "border px-2 py-1 text-neutral-700", children: f.detail || "—" })
              ] }, f.id)) })
            ] })
          ] }),
          (s == null ? void 0 : s.matched_markers) === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs italic text-neutral-500 mt-3", children: "По этому пути данных для оценки нет — статус «нет данных». Значения не выдумываются." })
        ] }, pw.id);
      })
    ] })
  ] });
}
export {
  AdminPatientMetabolicMapPrint as default
};
