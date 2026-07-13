import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, FileDown } from "lucide-react";
import {
  SEVERITY_LABEL,
  type PathwaySummary,
  type Severity,
} from "@/lib/metabolic/aggregator";
import { fetchPathwayTexts, pickText, REGISTER_LABEL, type PathwayText, type Register } from "@/lib/metabolic/texts";
import { exportNodeToPdf } from "@/lib/exportPdf";
import { RxBlock, type RxRec } from "@/components/metabolic/RxBlock";
import { PathwaySceneSVG, type SceneJson } from "@/components/metabolic/PathwaySceneSVG";
import { PathwayTemplateSVG, hasPathwaySvgTemplate } from "@/components/metabolic/PathwayTemplateSVG";
import { SteroidHubSVG } from "@/components/metabolic/schemes/SteroidHubSVG";
import { VitDSchemeSVG } from "@/components/metabolic/schemes/VitDSchemeSVG";
import { EndoDisruptorsSchemeSVG } from "@/components/metabolic/schemes/EndoDisruptorsSchemeSVG";
import { getTemplate } from "@/lib/metabolic/pathwayTemplates";
import { templateToScene } from "@/lib/metabolic/templateToScene";
import { buildAutoScene } from "@/lib/metabolic/autoLayout";

// Единый набор кастомных схем — идентично AdminPatientMetabolicMap.tsx,
// чтобы печатный PDF выглядел ровно как на экране.
const CUSTOM_SCHEMES: Record<string, (props: { values?: Record<string, { value: number | string; status: "norm" | "mild" | "moderate" | "severe" | "nodata" }> }) => JSX.Element> = {
  steroidogenesis: SteroidHubSVG,
  vit_d_bone: VitDSchemeSVG,
  endocrine_disruptors: EndoDisruptorsSchemeSVG,
};


type Patient = { id: string; full_name: string; birth_date: string | null; history_number: string | null };
type Pathway = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  nodes: Array<{ id: string; label: string; x?: number; y?: number }>;
  edges: Array<{ from: string; to: string; label?: string }>;
};
type Finding = {
  id: string;
  pathway_id: string | null;
  node_id: string | null;
  severity: string;
  label: string;
  detail: string | null;
  source_ref: any;
};

const STATUS_CLS: Record<Severity, string> = {
  no_data: "bg-gray-100 text-gray-700 border-gray-300",
  norm: "bg-emerald-50 text-emerald-800 border-emerald-300",
  mild: "bg-blue-50 text-blue-800 border-blue-300",
  moderate: "bg-amber-50 text-amber-800 border-amber-300",
  severe: "bg-red-50 text-red-800 border-red-300",
};

export default function AdminPatientMetabolicMapPrint() {
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();
  const paths = (sp.get("paths") || "").split(",").filter(Boolean);
  const register = (sp.get("register") || "simple") as Register;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [summary, setSummary] = useState<PathwaySummary[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [texts, setTexts] = useState<PathwayText[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [schemas, setSchemas] = useState<Map<string, SceneJson>>(new Map());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: p }, { data: pw }, { data: m }, txs] = await Promise.all([
        supabase.from("patients").select("id, full_name, birth_date, history_number").eq("id", id).maybeSingle(),
        (supabase as any).from("pathways").select("id, slug, name, description, nodes, edges, svg_scene").eq("is_active", true),
        (supabase as any).from("metabolic_maps").select("id, aggregate_summary").eq("patient_id", id).maybeSingle(),
        fetchPathwayTexts(),
      ]);
      setPatient(p as any);
      setPathways(((pw as any) || []) as Pathway[]);
      setSummary((m?.aggregate_summary?.pathways as PathwaySummary[]) || []);
      setTexts(txs);

      // Персональные рабочие копии схем этого пациента из map_schemas.
      if (m?.id) {
        const { data: sch } = await (supabase as any)
          .from("map_schemas")
          .select("pathway_code, scene")
          .eq("map_id", m.id);
        const map = new Map<string, SceneJson>();
        for (const row of (sch || []) as Array<{ pathway_code: string; scene: SceneJson }>) {
          if (row?.pathway_code && row?.scene) map.set(row.pathway_code, row.scene);
        }
        setSchemas(map);
      }

      if (m?.id) {
        const [{ data: f }, { data: r }] = await Promise.all([
          (supabase as any)
            .from("map_findings")
            .select("id, pathway_id, node_id, severity, label, detail, source_ref")
            .eq("map_id", m.id),
          (supabase as any)
            .from("map_recommendations")
            .select(
              "id, catalog_id, pathway_id, target_node_id, application_point, rationale, priority, evidence_level, age_warning, contra_warning, include_in_print, is_manual, catalog:treatment_catalog(name, subcategory, category, default_dose, dose_unit, default_route_label, default_frequency)",
            )
            .eq("map_id", m.id)
            .eq("include_in_print", true)
            .order("priority", { ascending: false })
            .order("evidence_level", { ascending: false }),
        ]);
        setFindings((f as Finding[]) || []);
        setRecs((r as any[]) || []);
      }
      setLoading(false);
    })();
  }, [id]);

  const selected = useMemo(() => {
    const bySlug = new Map(pathways.map((p) => [p.slug, p]));
    return paths.map((s) => bySlug.get(s)).filter(Boolean) as Pathway[];
  }, [pathways, paths]);

  const summaryByPathway = useMemo(() => {
    const m = new Map<string, PathwaySummary>();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);

  const findingsByPathway = useMemo(() => {
    const m = new Map<string, Finding[]>();
    for (const f of findings) {
      const k = f.pathway_id || "_";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(f);
    }
    return m;
  }, [findings]);

  const doPdf = async () => {
    const node = document.getElementById("print-root");
    if (!node) return;
    setExporting(true);
    try {
      await exportNodeToPdf(node, `metabolic-map-${patient?.full_name || id}.pdf`);
    } finally { setExporting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="bg-neutral-100 min-h-screen">
      <Helmet><title>Метаболическая карта — печать</title><meta name="robots" content="noindex" /></Helmet>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .a4-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          .a4-page:last-child { page-break-after: auto; }
        }
        .a4-page { width: 210mm; min-height: 297mm; padding: 14mm 12mm; background: #fff; margin: 8mm auto; box-shadow: 0 1px 8px rgba(0,0,0,0.08); box-sizing: border-box; }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-background border-b py-3 px-4 flex items-center gap-2 justify-end">
        <span className="text-sm text-muted-foreground mr-auto">Режим: {REGISTER_LABEL[register]} · листов: {selected.length + 1}</span>
        <Button variant="outline" onClick={doPdf} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
          Скачать PDF
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />Печать
        </Button>
      </div>

      <div id="print-root">
        {/* Сводка */}
        <section className="a4-page">
          <header className="mb-4 pb-3 border-b">
            <h1 className="text-2xl font-bold">Метаболическая карта</h1>
            <div className="text-sm text-neutral-700 mt-1">
              {patient?.full_name}
              {patient?.history_number ? ` · № ИБ ${patient.history_number}` : ""}
              {patient?.birth_date ? ` · д.р. ${patient.birth_date}` : ""}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Регистр: {REGISTER_LABEL[register]} · сформировано {new Date().toLocaleString("ru-RU")}</div>
          </header>

          <h2 className="text-lg font-semibold mb-2">Сводка по путям</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100 text-left">
                <th className="border px-2 py-1">Путь</th>
                <th className="border px-2 py-1 w-32">Статус</th>
                <th className="border px-2 py-1 w-24">Маркеров</th>
                <th className="border px-2 py-1">Кратко</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((pw) => {
                const s = summaryByPathway.get(pw.id);
                const st: Severity = s?.status || "no_data";
                const t = pickText(texts, pw.id, register);
                return (
                  <tr key={pw.id} className="align-top">
                    <td className="border px-2 py-1 font-medium">{pw.name}</td>
                    <td className={`border px-2 py-1 ${STATUS_CLS[st]}`}>{SEVERITY_LABEL[st]}</td>
                    <td className="border px-2 py-1 text-center">{s?.matched_markers ?? 0}</td>
                    <td className="border px-2 py-1 text-xs">{t?.summary || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="text-[11px] text-neutral-500 mt-6 pt-3 border-t">
            Статусы получены детерминированно из лабораторных данных (сравнение с референсными границами по правилам пути).
            Если данных нет — статус «нет данных». Документ не заменяет консультацию врача.
          </p>
        </section>

        {/* По одной странице на путь */}
        {selected.map((pw) => {
          const s = summaryByPathway.get(pw.id);
          const st: Severity = s?.status || "no_data";
          const t = pickText(texts, pw.id, register);
          const pwFindings = findingsByPathway.get(pw.id) || [];
          const affectedNodes = new Set<string>([
            ...pwFindings.map((f) => f.node_id).filter(Boolean) as string[],
            ...((s?.affected_nodes) || []),
          ]);
          return (
            <section key={pw.id} className="a4-page">
              <header className="mb-3 pb-2 border-b flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{pw.name}</h2>
                  {pw.description && <p className="text-xs text-neutral-600 mt-0.5">{pw.description}</p>}
                </div>
                <div className={`text-sm px-2 py-1 rounded border ${STATUS_CLS[st]}`}>{SEVERITY_LABEL[st]}</div>
              </header>

              {/* Схема сверху — тот же рендер, что и в карточке (единая подсветка) */}
              <div className="mb-4">
                {(() => {
                  const tpl = getTemplate(pw.slug);
                  const anyPw = pw as any;
                  const scene: SceneJson =
                    schemas.get(pw.slug) ||
                    (tpl ? templateToScene(tpl) : null) ||
                    (anyPw.svg_scene && Array.isArray(anyPw.svg_scene.elements) && anyPw.svg_scene.elements.length > 0
                      ? anyPw.svg_scene
                      : buildAutoScene(pw.nodes || [], pw.edges || []));
                  const rxSet = new Set<string>(
                    recs.filter((r) => r.pathway_id === pw.id)
                      .map((r) => r.target_node_id)
                      .filter(Boolean) as string[],
                  );
                  return (
                    <PathwaySceneSVG
                      scene={scene}
                      highlights={new Map(Array.from(affectedNodes).map((n) => [n, st]))}
                      rxNodes={rxSet}
                      maxHeight={320}
                    />
                  );
                })()}
              </div>


              {/* Объяснение */}
              {t && (
                <div className="text-[13px] space-y-2 leading-snug">
                  {t.what_broken && <p><strong>Что нарушено. </strong>{t.what_broken}</p>}
                  {t.evidence && <p><strong>По каким показателям это видно. </strong>{t.evidence}</p>}
                  {t.risks && <p><strong>Чем грозит. </strong>{t.risks}</p>}
                  {t.connections && <p><strong>Связи с другими системами. </strong>{t.connections}</p>}
                  {t.actions && <p><strong>Что делать. </strong>{t.actions}</p>}
                </div>
              )}

              {/* ℞ Точки приложения терапии (только с галочкой «Включить в печать») */}
              {(() => {
                const pwRecs = recs.filter((r) => r.pathway_id === pw.id) as RxRec[];
                if (pwRecs.length === 0 && affectedNodes.size === 0) return null;
                return (
                  <div className="mt-4">
                    <RxBlock recs={pwRecs} affectedNodes={[...affectedNodes]} />
                  </div>
                );
              })()}

              {/* Таблица показателей */}
              {pwFindings.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-1">Показатели пациента</h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-left">
                        <th className="border px-2 py-1">Маркер / значение</th>
                        <th className="border px-2 py-1 w-56">Референс / забор</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pwFindings.map((f) => (
                        <tr key={f.id} className="align-top">
                          <td className="border px-2 py-1">{f.label}</td>
                          <td className="border px-2 py-1 text-neutral-700">{f.detail || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {s?.matched_markers === 0 && (
                <p className="text-xs italic text-neutral-500 mt-3">
                  По этому пути данных для оценки нет — статус «нет данных». Значения не выдумываются.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Устаревший PrintPathwaySVG удалён — печать использует общий PathwaySceneSVG,
// чтобы подсветка была одинаковой в карточке и в PDF.

