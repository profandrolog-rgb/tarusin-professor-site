import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Activity,
  AlertTriangle,
  Info,
  ShieldAlert,
  Pill,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  runAggregation,
  SEVERITY_LABEL,
  type Severity,
  type PathwaySummary,
} from "@/lib/metabolic/aggregator";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchPathwayTexts, pickText, REGISTER_LABEL, fetchPathwaySeverityTexts, pickSeverityText, type PathwayText, type PathwaySeverityText, type Register } from "@/lib/metabolic/texts";
import { CODE_NODE_MAP } from "@/lib/metabolic/codeNodeMap";
import { buildCatalogIndex, resolveCode, type CatalogRow } from "@/lib/metabolic/resolveLabCodes";
import { Printer, Pencil, Beaker } from "lucide-react";
import { PathwaySceneSVG, type SceneJson } from "@/components/metabolic/PathwaySceneSVG";
import { PathwayTemplateSVG, hasPathwaySvgTemplate } from "@/components/metabolic/PathwayTemplateSVG";
import { getTemplate } from "@/lib/metabolic/pathwayTemplates";
import { templateToScene } from "@/lib/metabolic/templateToScene";
import { PathwayEditor } from "@/components/metabolic/PathwayEditor";
import { PathwayTilesGrid } from "@/components/metabolic/PathwayTilesGrid";
import { ProblemChainSVG } from "@/components/metabolic/ProblemChainSVG";
import { SeverityLegend } from "@/components/metabolic/SeverityLegend";
import { RxBlock, type RxRec } from "@/components/metabolic/RxBlock";
import { rebuildMapRecommendations } from "@/lib/metabolic/treatmentMatch";
import { buildAutoScene } from "@/lib/metabolic/autoLayout";
import { DynamicsPanel } from "@/components/metabolic/DynamicsPanel";
import { GuardianManager } from "@/components/metabolic/GuardianManager";
import { AuditPanel } from "@/components/metabolic/AuditPanel";
import { DataContextPanel } from "@/components/metabolic/DataContextPanel";
import { CompletenessInspector } from "@/components/metabolic/CompletenessInspector";

type Patient = { id: string; full_name: string; birth_date: string | null; history_number: string | null; share_simple_only?: boolean; sex?: "M" | "F" | null };
type Pathway = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  nodes: Array<{ id: string; label: string; x?: number; y?: number; kind?: string }>;
  edges: Array<{ from: string; to: string; label?: string }>;
  svg_scene: SceneJson | null;
  group?: string | null;
  group_order?: number | null;
  consequences?: Array<{ to_slug?: string; to_label?: string; weight?: number }>;
  sex?: "M" | "F" | null;
};
type Finding = {
  id: string;
  pathway_id: string | null;
  node_id: string | null;
  severity: "info" | "warn" | "critical" | string;
  label: string;
  detail: string | null;
  source_ref: any;
  created_at: string;
};
type Recommendation = RxRec & {
  catalog?: {
    name: string;
    subcategory: string | null;
    category: string | null;
    default_dose: number | null;
    dose_unit: string | null;
    default_route_label: string | null;
    default_frequency: string | null;
  } | null;
};
type VisitRow = { id: string; visit_date: string; protocol_type: string; diagnosis: string | null };

const SEVERITY_META: Record<string, { label: string; icon: any; cls: string }> = {
  critical: { label: "Критично", icon: ShieldAlert, cls: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300" },
  warn: { label: "Внимание", icon: AlertTriangle, cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300" },
  info: { label: "Инфо", icon: Info, cls: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300" },
};

const STATUS_BADGE: Record<Severity, string> = {
  no_data: "bg-muted text-muted-foreground border-border",
  norm: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300",
  mild: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300",
};

export default function AdminPatientMetabolicMap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  const [busy, setBusy] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [mapId, setMapId] = useState<string | null>(null);
  const [mapNotes, setMapNotes] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<string>("all");
  const [summary, setSummary] = useState<PathwaySummary[]>([]);
  const [lastAggregatedAt, setLastAggregatedAt] = useState<string | null>(null);
  const [texts, setTexts] = useState<PathwayText[]>([]);
  const [severityTexts, setSeverityTexts] = useState<PathwaySeverityText[]>([]);
  const [labRows, setLabRows] = useState<Array<{ id: string; test_name: string | null; test_code: string | null; value: number | null; unit: string | null }>>([]);
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);
  const [register, setRegister] = useState<Register>("simple");
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [editorPathway, setEditorPathway] = useState<Pathway | null>(null);
  const [schemas, setSchemas] = useState<Map<string, SceneJson>>(new Map());
  const [aiBusy, setAiBusy] = useState(false);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [deidentified, setDeidentified] = useState(true);
  const [ai, setAi] = useState<any | null>(null);
  const [rxBusy, setRxBusy] = useState(false);

  // Таймер прогресса ИИ-запроса
  useEffect(() => {
    if (!aiBusy) { setAiElapsed(0); return; }
    const t0 = Date.now();
    const id = setInterval(() => setAiElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [aiBusy]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => { fetchPathwayTexts().then(setTexts); }, []);
  useEffect(() => { fetchPathwaySeverityTexts().then(setSeverityTexts); }, []);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("lab_tests_catalog")
        .select("short_name, name, synonyms")
        .eq("is_active", true);
      setCatalogRows((data as CatalogRow[]) || []);
    })();
  }, []);

  useEffect(() => {
    // Auto-select affected pathways for print
    const affected = summary.filter((s) => s.status === "mild" || s.status === "moderate" || s.status === "severe").map((s) => s.slug);
    if (affected.length) setSelectedSlugs(new Set(affected));
  }, [summary]);

  const reload = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    const [{ data: p }, { data: pw }, { data: m }, { data: vs }] = await Promise.all([
      supabase.from("patients").select("id, full_name, birth_date, history_number, share_simple_only, sex").eq("id", id).maybeSingle(),
      (supabase as any).from("pathways").select("id, slug, name, description, nodes, edges, svg_scene, group, group_order, consequences, sex, rules").eq("is_active", true).order("group_order").order("name"),
      (supabase as any)
        .from("metabolic_maps")
        .select("id, notes, source_visit_id, last_aggregated_at, aggregate_summary, meta")
        .eq("patient_id", id)
        .maybeSingle(),
      supabase
        .from("patient_visits")
        .select("id, visit_date, protocol_type, diagnosis")
        .eq("patient_id", id)
        .order("visit_date", { ascending: false }),
    ]);
    setPatient(p as any);
    // Фильтр путей по полу пациента: pathways.sex = пол ИЛИ sex IS NULL.
    // Пол не указан → показываем только общие пути; половые прячем.
    const patientSex = ((p as any)?.sex === "M" || (p as any)?.sex === "F") ? (p as any).sex : null;
    const allPw = ((pw as any[]) || []) as Pathway[];
    const visiblePw = patientSex
      ? allPw.filter((x) => !x.sex || x.sex === patientSex)
      : allPw.filter((x) => !x.sex);
    setPathways(visiblePw);
    setMapId(m?.id || null);
    setMapNotes(m?.notes || null);
    setVisits((vs as any) || []);
    setSelectedVisit((m as any)?.source_visit_id || "all");
    setLastAggregatedAt((m as any)?.last_aggregated_at || null);
    const savedSummary = ((m as any)?.aggregate_summary?.pathways as PathwaySummary[]) || [];
    setSummary(savedSummary);
    setAi(((m as any)?.meta?.ai) || null);

    // Персональные рабочие копии схем этого пациента (map_schemas).
    // Шаблоны в pathway_schemas остаются нетронутыми и общими для всех.
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
    } else {
      setSchemas(new Map());
    }

    if (m?.id) {
      const [{ data: f }, { data: r }] = await Promise.all([
        (supabase as any)
          .from("map_findings")
          .select("id, pathway_id, node_id, severity, label, detail, source_ref, created_at")
          .eq("map_id", m.id)
          .order("created_at", { ascending: false }),
        (supabase as any)
          .from("map_recommendations")
          .select(
            "id, catalog_id, pathway_id, target_node_id, application_point, rationale, priority, evidence_level, age_warning, contra_warning, include_in_print, is_manual, finding_ids, catalog:treatment_catalog(name, subcategory, category, default_dose, dose_unit, default_route_label, default_frequency)",
          )
          .eq("map_id", m.id)
          .order("priority", { ascending: false })
          .order("evidence_level", { ascending: false }),
      ]);
      setFindings((f as any) || []);
      setRecs((r as any) || []);
    } else {
      setFindings([]);
      setRecs([]);
    }
    setBusy(false);
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const handleAggregate = async () => {
    if (!id) return;
    setAggregating(true);
    try {
      const result = await runAggregation({
        patientId: id,
        visitId: selectedVisit === "all" ? null : selectedVisit,
      });
      toast({
        title: "Пересчёт выполнен",
        description: `Отклонений: ${result.findings.length}. Путей проанализировано: ${result.summary.length}.`,
      });
      await reload();
    } catch (e: any) {
      toast({ title: "Ошибка агрегации", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setAggregating(false);
    }
  };

  const handleAiBuild = async () => {
    if (!id) return;
    if (!mapId) {
      toast({ title: "Сначала пересчитайте отклонения", description: "ИИ работает поверх детерминированного слоя.", variant: "destructive" });
      return;
    }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("metabolic-map-build", {
        body: {
          patient_id: id,
          visit_id: selectedVisit === "all" ? null : selectedVisit,
          deidentified,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: "ИИ-интерпретация готова",
        description: `Путей: ${(data as any)?.ai?.pathways?.length ?? 0} · подсветок: ${(data as any)?.findings_inserted ?? 0}`,
      });
      await reload();
    } catch (e: any) {
      toast({ title: "Ошибка ИИ-интерпретации", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };

  const handleRebuildRx = async () => {
    if (!id || !mapId) {
      toast({ title: "Сначала пересчитайте отклонения", description: "Точки приложения строятся поверх findings.", variant: "destructive" });
      return;
    }
    setRxBusy(true);
    try {
      const res = await rebuildMapRecommendations({ mapId, patientId: id });
      toast({
        title: "Точки приложения подобраны",
        description: `Строк из каталога: ${res.inserted}. Узлов без средства: ${res.affectedNodesWithoutMatch.length}.`,
      });
      await reload();
    } catch (e: any) {
      toast({ title: "Ошибка подбора", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setRxBusy(false);
    }
  };

  const togglePrint = async (recId: string, v: boolean) => {
    setRecs((prev) => prev.map((r) => (r.id === recId ? { ...r, include_in_print: v } : r)));
    const { error } = await (supabase as any)
      .from("map_recommendations")
      .update({ include_in_print: v })
      .eq("id", recId);
    if (error) {
      toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
      await reload();
    }
  };

  // Открытие редактора персональной схемы: гарантируем наличие metabolic_maps
  // для этого пациента, чтобы map_schemas имел куда ссылаться.
  const openEditor = async (pw: Pathway) => {
    if (!id) return;
    if (!mapId) {
      const { data, error } = await (supabase as any)
        .from("metabolic_maps")
        .insert({ patient_id: id })
        .select("id")
        .single();
      if (error) {
        toast({ title: "Не удалось создать карту", description: error.message, variant: "destructive" });
        return;
      }
      setMapId(data.id);
    }
    setEditorPathway(pw);
  };

  const recsByPathway = useMemo(() => {
    const m = new Map<string, Recommendation[]>();
    for (const r of recs) {
      const k = r.pathway_id || "_";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  }, [recs]);

  const findingsByPathway = useMemo(() => {
    const map = new Map<string, Finding[]>();
    for (const f of findings) {
      const key = f.pathway_id || "_unbound";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return map;
  }, [findings]);

  const summaryByPathway = useMemo(() => {
    const m = new Map<string, PathwaySummary>();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);

  if (loading || busy) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!patient) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Пациент не найден</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>{`Метаболическая карта — ${patient.full_name}`}</title><meta name="robots" content="noindex" /></Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
        <Link to={`/admin/patients/${patient.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />К пациенту
        </Link>

        <header className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary" />
              Метаболическая карта
            </h1>
            <p className="text-muted-foreground text-sm">
              {patient.full_name}{patient.history_number ? ` · № ИБ ${patient.history_number}` : ""}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" />Автоагрегатор</Badge>
        </header>

        <Card>
          <CardContent className="p-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Источник данных (визит)</label>
              <Select value={selectedVisit} onValueChange={setSelectedVisit}>
                <SelectTrigger><SelectValue placeholder="Все данные" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все данные пациента</SelectItem>
                  {visits.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.visit_date} · {v.protocol_type}{v.diagnosis ? ` · ${v.diagnosis}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAggregate} disabled={aggregating} className="gap-2">
              {aggregating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Пересчитать отклонения
            </Button>
            <Button onClick={handleAiBuild} disabled={aiBusy || !mapId} variant="secondary" className="gap-2">
              {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              ИИ-интерпретация{aiBusy ? ` · ${aiElapsed}с` : ""}
            </Button>
            <Button onClick={handleRebuildRx} disabled={rxBusy || !mapId} variant="secondary" className="gap-2">
              {rxBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Beaker className="w-4 h-4" />}
              Подобрать ℞ из каталога
            </Button>
            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
              <Checkbox
                checked={deidentified}
                onCheckedChange={(v) => setDeidentified(!!v)}
                aria-label="Отправлять деперсонализированно"
              />
              Отправлять деперсонализированно
            </label>
            <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
              {(["simple", "pro"] as Register[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegister(r)}
                  className={`px-3 py-1.5 transition-colors ${register === r ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                >
                  {REGISTER_LABEL[r]}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="gap-2"
              disabled={selectedSlugs.size === 0}
              onClick={() => {
                const slugs = [...selectedSlugs].join(",");
                window.open(`/admin/patients/${patient.id}/metabolic-map/print?paths=${encodeURIComponent(slugs)}&register=${register}${selectedVisit !== "all" ? `&visit=${selectedVisit}` : ""}`, "_blank");
              }}
            >
              <Printer className="w-4 h-4" />Печать выбранных ({selectedSlugs.size})
            </Button>
            {lastAggregatedAt && (
              <div className="text-xs text-muted-foreground">
                Последний пересчёт: {new Date(lastAggregatedAt).toLocaleString("ru-RU")}
              </div>
            )}
          </CardContent>
        </Card>

        <DataContextPanel patientId={patient.id} visitId={selectedVisit === "all" ? null : selectedVisit} />



        {mapNotes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Заметки</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{mapNotes}</p></CardContent>
          </Card>
        )}

        {ai && (
          <Card className="border-primary/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                ИИ-интерпретация
                {typeof ai.overall_confidence === "number" && (
                  <Badge variant="outline" className="ml-2">confidence {(ai.overall_confidence * 100).toFixed(0)}%</Badge>
                )}
                {ai.deidentified && <Badge variant="secondary">деперсонализированно</Badge>}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Модель: {ai.model} · {ai.computed_at ? new Date(ai.computed_at).toLocaleString("ru-RU") : ""}
              </p>
            </CardHeader>
            {Array.isArray(ai.cross_links) && ai.cross_links.length > 0 && (
              <CardContent className="pt-0">
                <div className="text-xs font-medium mb-1">Связи между путями:</div>
                <ul className="text-xs space-y-1">
                  {ai.cross_links.map((l: any, i: number) => (
                    <li key={i}>
                      <Badge variant="outline" className="mr-1">{l.from}</Badge>→
                      <Badge variant="outline" className="mx-1">{l.to}</Badge>
                      <span className="text-muted-foreground">{l.why}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-semibold">Обзорная карта путей</h2>
            <SeverityLegend />
          </div>
          <Card>
            <CardContent className="p-3">
              <PathwayTilesGrid
                pathways={pathways.map((pw) => {
                  const status = (summaryByPathway.get(pw.id)?.status ||
                    ((findingsByPathway.get(pw.id) || []).length ? "moderate" : "no_data")) as Severity;
                  const fList = findingsByPathway.get(pw.id) || [];
                  const evidence = fList.slice(0, 2).map((f) => f.label).join(" · ");
                  return {
                    id: pw.id,
                    slug: pw.slug,
                    name: pw.name,
                    status,
                    group: pw.group ?? null,
                    group_order: pw.group_order ?? null,
                    evidence,
                  };
                })}
                onSelect={(slug) => {
                  const el = document.getElementById(`pw-${slug}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Цепочка проблем: что тянет за собой</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ProblemChainSVG
                causes={pathways.map((pw) => ({
                  id: pw.id,
                  slug: pw.slug,
                  name: pw.name,
                  status: (summaryByPathway.get(pw.id)?.status ||
                    ((findingsByPathway.get(pw.id) || []).length ? "moderate" : "no_data")) as Severity,
                  consequences: pw.consequences || [],
                }))}
              />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Метаболические пути</h2>
          {pathways.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Справочник путей ещё пуст.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pathways.map((pw) => {
                const pwFindings = findingsByPathway.get(pw.id) || [];
                const savedSummary = summaryByPathway.get(pw.id);
                const affectedNodes = new Set<string>([
                  ...pwFindings.map((f) => f.node_id).filter(Boolean) as string[],
                  ...((savedSummary?.affected_nodes) || []),
                ]);
                const status: Severity = savedSummary?.status || (pwFindings.length ? "moderate" : "no_data");
                const text = pickText(texts, pw.id, register);
                const aiForPath = ai?.pathways?.find?.((p: any) => p.pathway_code === pw.slug) || null;
                const isSelected = selectedSlugs.has(pw.slug);
                const isAffected = status === "mild" || status === "moderate" || status === "severe";
                return (
                  <Card key={pw.id} id={`pw-${pw.slug}`} className={`overflow-hidden ${isAffected ? "border-primary/40" : ""}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(v) => {
                              setSelectedSlugs((prev) => {
                                const next = new Set(prev);
                                if (v) next.add(pw.slug); else next.delete(pw.slug);
                                return next;
                              });
                            }}
                            aria-label={`Выбрать «${pw.name}» для печати`}
                          />
                          {pw.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={STATUS_BADGE[status]}>
                            {SEVERITY_LABEL[status]}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={() => openEditor(pw)}>
                            <Pencil className="w-3.5 h-3.5" />Схема
                          </Button>
                        </div>
                      </CardTitle>
                      {pw.description && <p className="text-xs text-muted-foreground">{pw.description}</p>}
                      {savedSummary && (
                        <p className="text-[11px] text-muted-foreground">
                          Маркеров сопоставлено: {savedSummary.matched_markers}
                          {pwFindings.length > 0 && ` · отклонений: ${pwFindings.length}`}
                        </p>
                      )}
                      {savedSummary && savedSummary.needs_phase_codes && savedSummary.needs_phase_codes.length > 0 && (
                        <p className="text-[11px] text-blue-700 dark:text-blue-300">
                          🔵 Нужна фаза цикла: {savedSummary.needs_phase_codes.join(", ")} — укажите фазу в контексте визита, показатели пропущены.
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {(() => {
                        const pwRecs = recsByPathway.get(pw.id) || [];
                        const rxNodes = new Set<string>(pwRecs.map((r) => r.target_node_id || "").filter(Boolean));
                        const rxLabelByNode = new Map<string, string>();
                        for (const r of pwRecs) {
                          if (!r.target_node_id) continue;
                          const prev = rxLabelByNode.get(r.target_node_id);
                          const name = r.catalog?.name || "";
                          rxLabelByNode.set(r.target_node_id, prev ? `${prev} · ${name}` : name);
                        }
                        // Приоритет источников:
                        //  1) статичный SVG-шаблон пути (src/assets/pathways/<slug>.svg)
                        //     — с подсветкой по data-sev и overlay-слоем правок врача поверх;
                        //  2) сохранённая сцена в pathway_schemas/map_schemas;
                        //  3) шаблон templateToScene;
                        //  4) авто-раскладка nodes/edges.
                        const highlightsMap = new Map(Array.from(affectedNodes).map((n) => [n, status]));
                        if (hasPathwaySvgTemplate(pw.slug)) {
                          return (
                            <PathwayTemplateSVG
                              slug={pw.slug}
                              highlights={highlightsMap}
                              rxNodes={rxNodes}
                              rxLabelByNode={rxLabelByNode}
                              overlayScene={schemas.get(pw.slug) || null}
                              maxHeight={320}
                            />
                          );
                        }
                        const tpl = getTemplate(pw.slug);
                        const sceneToRender =
                          schemas.get(pw.slug) ||
                          (tpl ? templateToScene(tpl) : null) ||
                          (pw.svg_scene && Array.isArray(pw.svg_scene.elements) && pw.svg_scene.elements.length > 0
                            ? pw.svg_scene
                            : buildAutoScene(pw.nodes || [], pw.edges || []));
                        return (
                          <PathwaySceneSVG
                            scene={sceneToRender}
                            highlights={highlightsMap}
                            rxNodes={rxNodes}
                            rxLabelByNode={rxLabelByNode}
                            maxHeight={280}
                          />
                        );
                      })()}
                      {pwFindings.length > 0 && (
                        <ul className="space-y-1 text-xs">
                          {pwFindings.map((f) => {
                            const meta = SEVERITY_META[f.severity] || SEVERITY_META.info;
                            const Icon = meta.icon;
                            return (
                              <li key={f.id} className={`flex items-start gap-2 rounded border px-2 py-1 ${meta.cls}`}>
                                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">{f.label}</div>
                                  {f.detail && <div className="opacity-80">{f.detail}</div>}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {savedSummary && savedSummary.matched_markers === 0 && (
                        <div className="text-[11px] italic text-muted-foreground px-2 py-1">
                          Нет лабораторных данных для оценки этого пути.
                        </div>
                      )}
                      {text && (
                        <div className="text-xs space-y-1.5 pt-2 border-t">
                          {text.summary && <p><span className="font-medium">Кратко:</span> {text.summary}</p>}
                          {text.what_broken && <p><span className="font-medium">Что нарушено:</span> {text.what_broken}</p>}
                          {text.evidence && <p><span className="font-medium">По каким показателям:</span> {text.evidence}</p>}
                          {text.risks && <p><span className="font-medium">Чем грозит:</span> {text.risks}</p>}
                          {text.connections && <p><span className="font-medium">Связи:</span> {text.connections}</p>}
                          {text.actions && <p><span className="font-medium">Что делать:</span> {text.actions}</p>}
                        </div>
                      )}
                      {aiForPath && (
                        <div className="text-xs space-y-1.5 pt-2 border-t border-primary/30">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="font-medium">ИИ · {aiForPath.status}</span>
                            {typeof aiForPath.confidence === "number" && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {(aiForPath.confidence * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <p><span className="font-medium">{REGISTER_LABEL[register]}:</span>{" "}
                            {register === "simple" ? aiForPath.text_plain : aiForPath.text_pro}
                          </p>
                          {Array.isArray(aiForPath.markers) && aiForPath.markers.length > 0 && (
                            <div>
                              <div className="font-medium">Маркеры:</div>
                              <ul className="ml-3 list-disc">
                                {aiForPath.markers.slice(0, 8).map((m: any, i: number) => (
                                  <li key={i}>
                                    {m.code || m.name}: {String(m.value)}{m.unit ? ` ${m.unit}` : ""}
                                    {m.flag && m.flag !== "normal" && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">{m.flag}</Badge>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(aiForPath.recommendations) && aiForPath.recommendations.length > 0 && (
                            <div>
                              <div className="font-medium">Рекомендации ИИ:</div>
                              <ul className="ml-3 list-disc">
                                {aiForPath.recommendations.map((r: any, i: number) => (
                                  <li key={i}>
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 mr-1">{r.kind}</Badge>
                                    {r.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(aiForPath.links) && aiForPath.links.length > 0 && (
                            <div className="text-muted-foreground">
                              Связи: {aiForPath.links.join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                      <RxBlock
                        recs={recsByPathway.get(pw.id) || []}
                        affectedNodes={[...affectedNodes]}
                        onTogglePrint={togglePrint}
                        compact
                        showEmpty={isAffected}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {findingsByPathway.get("_unbound")?.length ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Отклонения вне путей</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {findingsByPathway.get("_unbound")!.map((f) => {
                  const meta = SEVERITY_META[f.severity] || SEVERITY_META.info;
                  const Icon = meta.icon;
                  return (
                    <li key={f.id} className={`flex items-start gap-2 rounded border px-2 py-1 ${meta.cls}`}>
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div><div className="font-medium">{f.label}</div>{f.detail && <div className="text-xs opacity-80">{f.detail}</div>}</div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <DynamicsPanel
            patientId={patient.id}
            currentSummary={summary.map((s) => ({ pathway_id: s.pathway_id, slug: s.slug, status: s.status }))}
            currentPathways={pathways.map((p) => ({ id: p.id, slug: p.slug, name: p.name }))}
            visitId={selectedVisit === "all" ? null : selectedVisit}
          />
          <GuardianManager
            patientId={patient.id}
            shareSimpleOnly={patient.share_simple_only ?? true}
            onShareChange={(v) => setPatient((prev) => (prev ? { ...prev, share_simple_only: v } : prev))}
          />
        </div>

        <CompletenessInspector
          patientId={patient.id}
          pathways={pathways.map((p) => ({ id: p.id, slug: p.slug, name: p.name, rules: (p as any).rules }))}
          summary={summary}
          visitDate={selectedVisit && selectedVisit !== "all" ? (visits.find((v) => v.id === selectedVisit)?.visit_date || null) : null}
        />

        <AuditPanel
          mapId={mapId}
          pathways={pathways.map((p) => ({ id: p.id, slug: p.slug, name: p.name }))}
          summary={summary}
          findings={findings as any}
          ai={ai}
        />



        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Pill className="w-5 h-5" />
              ℞ Точки приложения терапии (из каталога)
            </h2>
            <div className="text-xs text-muted-foreground">
              Отмечены на печать: {recs.filter((r) => r.include_in_print).length} из {recs.length}
            </div>
          </div>
          {recs.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">
              Нажмите «Подобрать из каталога», чтобы связать сработавшие показатели со средствами каталога лечения.
              Ничего вне каталога предложено не будет.
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <RxBlock recs={recs} onTogglePrint={togglePrint} />
              </CardContent>
            </Card>
          )}
        </section>

        <div className="pt-6 text-xs text-muted-foreground border-t">
          Автоагрегатор сравнивает измеренные значения с референсами по полу и возрасту (из lab_results)
          и детерминированно выставляет статус: норма / лёгкое / умеренное / тяжёлое. Значения не выдумываются:
          если по пути нет данных — статус «нет данных».
        </div>
      </div>

      {editorPathway && (() => {
        // Для путей со статичным SVG-шаблоном редактор открывается как ЧИСТЫЙ
        // оверлей поверх шаблона — врач добавляет свои пометки, не меняя базу.
        // Для остальных — прежнее поведение: templateScene = сцена шаблона.
        const svgTpl = hasPathwaySvgTemplate(editorPathway.slug);
        const tpl = svgTpl ? null : getTemplate(editorPathway.slug);
        const templateScene: SceneJson | null = svgTpl
          ? { elements: [], appState: { viewBackgroundColor: "transparent" }, files: {} }
          : (tpl ? templateToScene(tpl) : null) ||
            (editorPathway.svg_scene && Array.isArray(editorPathway.svg_scene.elements) && editorPathway.svg_scene.elements.length > 0
              ? editorPathway.svg_scene
              : buildAutoScene(editorPathway.nodes || [], editorPathway.edges || []));
        const patientScene = schemas.get(editorPathway.slug) || null;
        return (
          <PathwayEditor
            open={!!editorPathway}
            onOpenChange={(v) => { if (!v) setEditorPathway(null); }}
            mapId={mapId}
            pathwayCode={editorPathway.slug}
            pathwayName={editorPathway.name}
            patientScene={patientScene}
            templateScene={templateScene}
            backgroundNode={svgTpl ? (
              <PathwayTemplateSVG
                slug={editorPathway.slug}
                maxHeight={9999}
              />
            ) : undefined}
            onSaved={(scene) => {
              // Обновляем локальный кэш персональной копии пациента.
              setSchemas((prev) => {
                const next = new Map(prev);
                if (scene) next.set(editorPathway.slug, scene);
                else next.delete(editorPathway.slug);
                return next;
              });
            }}
          />
        );
      })()}
    </div>
  );
}

function PathwaySVG({ pathway, highlight, rxNodes }: { pathway: Pathway; highlight: Set<string>; rxNodes?: Set<string> }) {
  const nodes = pathway.nodes || [];
  if (nodes.length === 0) {
    return <div className="text-xs text-muted-foreground italic px-2 py-4">Схема пути пока не задана</div>;
  }
  const W = 600, H = 180, PAD = 40;
  const positioned = nodes.map((n, i) => {
    const x = typeof n.x === "number" ? n.x : PAD + ((W - PAD * 2) * i) / Math.max(1, nodes.length - 1);
    const y = typeof n.y === "number" ? n.y : H / 2;
    return { ...n, x, y };
  });
  const byId = new Map(positioned.map((n) => [n.id, n]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded bg-muted/30">
      {(pathway.edges || []).map((e, i) => {
        const a = byId.get(e.from), b = byId.get(e.to);
        if (!a || !b) return null;
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} markerEnd="url(#arrow)" />
            {e.label && (
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{e.label}</text>
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
        </marker>
      </defs>
      {positioned.map((n) => {
        const hot = highlight.has(n.id);
        const rx = rxNodes?.has(n.id);
        return (
          <g key={n.id}>
            <circle
              cx={n.x} cy={n.y} r={14}
              fill={hot ? "hsl(0 84% 60% / 0.15)" : "hsl(var(--background))"}
              stroke={hot ? "hsl(0 84% 60%)" : "hsl(var(--border))"}
              strokeWidth={hot ? 2.5 : 1.5}
            />
            <text x={n.x} y={n.y + 30} textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">{n.label}</text>
            {rx && (
              <g transform={`translate(${n.x + 12}, ${n.y - 12})`}>
                <circle r={9} fill="#10b981" stroke="#065f46" strokeWidth={1.2} />
                <text textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight={700} fill="#fff">℞</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
