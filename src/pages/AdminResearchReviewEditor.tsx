import { useEffect, useRef, useState, lazy, Suspense, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Send, ChevronDown, Loader2, Trash2, Plus, Users, Lock, Undo2, ImagePlus } from "lucide-react";
import { stripMarkers } from "@/lib/research/markers";
import type { Material } from "@/components/admin/research/MaterialsPanel";
import { makeEntry, type RefinementEntry } from "@/lib/research/refinementDiff";
import { playCompletionChime } from "@/lib/notifySound";
import OrchestratorProgress, { type OrchestratorStatus, type StepTimers } from "@/components/admin/research/OrchestratorProgress";
import OrchestratorArtifacts from "@/components/admin/research/OrchestratorArtifacts";
import FactCheckFixList from "@/components/admin/research/FactCheckFixList";
import { GALLERY_RE } from "@/lib/markdown/galleryMarkers";

const MaterialsPanel = lazy(() => import("@/components/admin/research/MaterialsPanel"));
const RefinementChat = lazy(() => import("@/components/admin/research/RefinementChat"));
const PublishBar = lazy(() => import("@/components/admin/research/PublishBar"));
const ReviewPrintView = lazy(() => import("@/components/admin/research/ReviewPrintView"));

interface Ref {
  number: number;
  authors?: string;
  title?: string;
  journal?: string;
  year?: string;
  volume_issue?: string;
  pages?: string;
  doi_or_pmid?: string;
  verified?: boolean;
}

type WorkflowState = "draft" | "writing" | "editing" | "consilium" | "published";
type VoiceMode = "impersonal" | "own_data" | "authorial";

const WORKFLOW_LABEL: Record<WorkflowState, string> = {
  draft: "Черновик",
  writing: "В написании",
  editing: "Научное редактирование",
  consilium: "На консилиуме",
  published: "Опубликован",
};

const WORKFLOW_VARIANT: Record<WorkflowState, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  writing: "secondary",
  editing: "secondary",
  consilium: "destructive",
  published: "default",
};

const VOICE_LABEL: Record<VoiceMode, string> = {
  impersonal: "Безличный (по умолчанию для обзоров)",
  own_data: "Безличный + собственные данные («мы»/«наша серия» только по материалам)",
  authorial: "Авторский (для диктовок и статей)",
};

const Fallback = <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

const AdminResearchReviewEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [contentEditor, setContentEditor] = useState<Editor | null>(null);
  const [dirty, setDirty] = useState(false);

  const [instructions, setInstructions] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [orchestrating, setOrchestrating] = useState(false);
  const orchestratingStartedAtRef = useRef<number>(0);
  const [timers, setTimers] = useState<StepTimers>({});
  const chimedRef = useRef(false);
  const prevStatusRef = useRef<OrchestratorStatus>(undefined);
  const pollingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("research_reviews" as any).select("*").eq("id", id!).single();
      if (error) toast.error(error.message);
      else setRow(data);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(`research_orchestrator:v1:${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.timers) setTimers(parsed.timers);
      }
    } catch { /* noop */ }
  }, [id]);

  const orchStateRaw: any = row?.orchestrator_state && typeof row.orchestrator_state === "object" ? row.orchestrator_state : null;
  const legacyState: any = row?.fact_check_report && typeof row.fact_check_report === "object" ? row.fact_check_report : {};
  const orchState: any = orchStateRaw && Object.keys(orchStateRaw).length > 0 ? orchStateRaw : legacyState;
  const status: OrchestratorStatus = orchState.orchestrator_status;
  const lastStep: string | undefined = orchState.last_step;
  const orchestratorError: string | undefined = orchState.error;
  const searchResult: string | undefined = orchState.search_result;
  const modelsUsed: Record<string, string> | undefined = orchState.models_used && typeof orchState.models_used === "object" ? orchState.models_used : undefined;

  const workflowState: WorkflowState = (row?.workflow_state as WorkflowState) || "draft";
  const voiceMode: VoiceMode = (row?.voice_mode as VoiceMode) || "impersonal";
  const isConsilium = workflowState === "consilium";
  const readOnly = isConsilium;

  useEffect(() => {
    if (!status) return;
    setTimers((prev) => {
      const next: StepTimers = { ...prev };
      const now = Date.now();
      const startIf = (k: keyof StepTimers) => { if (!next[k]?.startedAt) next[k] = { ...(next[k] || {}), startedAt: now }; };
      const finishIf = (k: keyof StepTimers) => { if (next[k]?.startedAt && !next[k]?.finishedAt) next[k] = { ...(next[k] || {}), finishedAt: now }; };
      if (status === "searching") startIf("searching");
      if (status === "writing") { startIf("searching"); finishIf("searching"); startIf("writing"); }
      if (status === "fact_checking") { finishIf("searching"); finishIf("writing"); startIf("writing"); startIf("fact_checking"); }
      if (status === "done") { finishIf("searching"); finishIf("writing"); finishIf("fact_checking"); }
      return next;
    });
  }, [status]);

  useEffect(() => {
    if (!id) return;
    try { localStorage.setItem(`research_orchestrator:v1:${id}`, JSON.stringify({ timers, savedAt: Date.now() })); } catch { /* noop */ }
  }, [id, timers]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const wasActive = prev === "searching" || prev === "writing" || prev === "fact_checking" || prev === "queued";
    if (wasActive && status === "done" && !chimedRef.current) {
      chimedRef.current = true;
      playCompletionChime();
      toast.success("Обзор готов. Переведён на научное редактирование.");
    }
    if (wasActive && (status === "error" || status === "interrupted")) {
      const step = lastStep || "?";
      const msg = status === "interrupted"
        ? `Оркестратор был прерван на шаге «${step}»`
        : "Оркестратор упал: " + (orchestratorError || "неизвестно");
      toast.error(msg, { action: { label: "Повторить", onClick: () => orchestrate() }, duration: 20000 });
    }
    if (status !== "done") chimedRef.current = false;
    prevStatusRef.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (!row?.id) return;
    const statusActive = status === "searching" || status === "writing" || status === "fact_checking" || status === "queued";
    const recentlyStarted = orchestrating && Date.now() - orchestratingStartedAtRef.current < 30_000;
    const active = statusActive || orchestrating;
    if (!active) { pollingRef.current = false; return; }
    if (!statusActive && !recentlyStarted) { setOrchestrating(false); pollingRef.current = false; return; }
    if (pollingRef.current) return;
    pollingRef.current = true;
    const int = setInterval(async () => {
      const { data } = await supabase.from("research_reviews" as any).select("*").eq("id", row.id).single();
      const fresh: any = data;
      if (!fresh) return;
      setRow((prev: any) => {
        const freshHasState = fresh.orchestrator_state && typeof fresh.orchestrator_state === "object" && Object.keys(fresh.orchestrator_state).length > 0;
        const freshHasLegacy = fresh.fact_check_report && typeof fresh.fact_check_report === "object" && fresh.fact_check_report.orchestrator_status;
        const withinOptimisticWindow = orchestrating && Date.now() - orchestratingStartedAtRef.current < 30_000;
        if (!freshHasState && !freshHasLegacy && withinOptimisticWindow && prev?.orchestrator_state) {
          return { ...fresh, orchestrator_state: prev.orchestrator_state };
        }
        return fresh;
      });
    }, 5000);
    return () => { clearInterval(int); pollingRef.current = false; };
  }, [row?.id, status, orchestrating]);

  useEffect(() => {
    if (!orchestrating) return;
    const t = setTimeout(() => {
      if (!status) {
        setOrchestrating(false);
        toast.error("Оркестратор не ответил, статус неизвестен", {
          action: { label: "Повторить", onClick: () => orchestrate() },
          duration: 20000,
        });
      }
    }, 30_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orchestrating, status]);

  // Блок 6: предупреждение при закрытии с несохранёнными изменениями
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function update(patch: any) {
    setRow((r: any) => ({ ...r, ...patch }));
    setDirty(true);
  }

  async function save(newStatus?: string) {
    if (!row) return;
    setSaving(true);
    const payload: any = {
      slug: row.slug,
      title: row.title,
      annotation: row.annotation,
      content: row.content,
      content_with_markers: row.content_with_markers ?? row.content,
      topic: row.topic,
      references_list: row.references_list,
      fact_check_report: row.fact_check_report,
      seo_title: row.seo_title,
      seo_meta_description: row.seo_meta_description,
      cover_image_path: row.cover_image_path,
      source_materials: row.source_materials || [],
      refinement_history: row.refinement_history || [],
      workflow_state: row.workflow_state || "draft",
      voice_mode: row.voice_mode || "impersonal",
    };
    if (newStatus) {
      payload.status = newStatus;
      if (newStatus === "published" && !row.published_at) payload.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from("research_reviews" as any).update(payload).eq("id", row.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(newStatus ? `Статус: ${newStatus}` : "Сохранено");
      setDirty(false);
      if (newStatus) setRow({ ...row, ...payload });
    }
  }

  async function saveSilently(patch: any) {
    if (!row) return;
    await supabase.from("research_reviews" as any).update(patch).eq("id", row.id);
  }

  // Функциональный апдейт одного материала + дебаунс-сейв в базу.
  // Устраняет гонку, когда асинхронное извлечение изображений завершается
  // после того, как замыкание уже сняло устаревший снимок materials.
  const materialSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateMaterial = useCallback((id: string, patch: Partial<Material>) => {
    setRow((r: any) => {
      if (!r) return r;
      const list: Material[] = Array.isArray(r.source_materials) ? r.source_materials : [];
      const next = list.map((m) => (m.id === id ? { ...m, ...patch } : m));
      if (materialSaveTimer.current) clearTimeout(materialSaveTimer.current);
      const reviewId = r.id;
      materialSaveTimer.current = setTimeout(() => {
        supabase.from("research_reviews" as any).update({ source_materials: next }).eq("id", reviewId);
      }, 1500);
      return { ...r, source_materials: next };
    });
  }, []);

  // Блок 6: автосохранение с задержкой 3с
  useEffect(() => {
    if (!dirty || !row?.id) return;
    const t = setTimeout(async () => {
      const payload: any = {
        title: row.title,
        annotation: row.annotation,
        content: row.content,
        content_with_markers: row.content_with_markers ?? row.content,
        topic: row.topic,
        references_list: row.references_list,
        seo_title: row.seo_title,
        seo_meta_description: row.seo_meta_description,
        workflow_state: row.workflow_state || "draft",
        voice_mode: row.voice_mode || "impersonal",
      };
      const { error } = await supabase.from("research_reviews" as any).update(payload).eq("id", row.id);
      if (!error) setDirty(false);
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, row?.title, row?.annotation, row?.content, row?.seo_title, row?.seo_meta_description]);

  async function setWorkflow(next: WorkflowState) {
    if (!row) return;
    const patch: any = { workflow_state: next };
    if (next === "published" && !row.published_at) {
      patch.published_at = new Date().toISOString();
      patch.status = "published";
    }
    if (next !== "published" && row.status === "published") {
      patch.status = "draft";
    }
    const { error } = await supabase.from("research_reviews" as any).update(patch).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    setRow((r: any) => ({ ...r, ...patch }));
    toast.success(`Состояние: ${WORKFLOW_LABEL[next]}`);
  }

  async function sendToConsilium() {
    if (!row) return;
    if (dirty) {
      await save();
    }
    await setWorkflow("consilium");
    navigate("/admin/orchestrator", {
      state: {
        recheck: { id: row.id, kind: "research_reviews", title: row.title },
        voiceMode: row.voice_mode || "impersonal",
      },
    });
  }

  async function analyzeMaterials() {
    if (!row) return;
    const materials: Material[] = row.source_materials || [];
    if (materials.length === 0) { toast.error("Добавьте хотя бы один материал"); return; }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("research-materials-analyze", {
        body: { materials, instructions, topic: row.topic },
      });
      if (error) throw error;
      if (!data?.analysis) throw new Error("пустой ответ");
      setAnalysis(data.analysis);
      if (Array.isArray(data.materials)) {
        update({ source_materials: data.materials });
        saveSilently({ source_materials: data.materials });
      }
      toast.success("Анализ готов");
    } catch (e: any) {
      toast.error(e?.message || "Ошибка анализа");
    } finally {
      setAnalyzing(false);
    }
  }

  async function orchestrate() {
    if (!row) return;
    if (readOnly) { toast.error("Обзор на консилиуме — недоступно"); return; }
    if (!row.topic && !analysis) { toast.error("Укажите тему обзора или запустите анализ материалов"); return; }

    let savedSnapshot = false;
    if (row.content) {
      const currentContent: string = row.content_with_markers || row.content;
      const snapshotEntry = makeEntry({
        action: "before_orchestrate",
        before: currentContent,
        after: currentContent,
        historyLength: (row.refinement_history || []).length,
        preOrchestrate: true,
      });
      const nextHistory = [...(row.refinement_history || []), snapshotEntry];
      setRow((r: any) => ({ ...r, refinement_history: nextHistory }));
      await saveSilently({ refinement_history: nextHistory });
      savedSnapshot = true;
    }

    setTimers({});
    chimedRef.current = false;
    try { localStorage.removeItem(`research_orchestrator:v1:${row.id}`); } catch { /* noop */ }

    setOrchestrating(true);
    orchestratingStartedAtRef.current = Date.now();
    setRow((r: any) => ({
      ...r,
      orchestrator_state: { orchestrator_status: "queued", last_step: "queued", updated_at: new Date().toISOString() },
      workflow_state: "writing",
    }));
    try {
      const materials: Material[] = row.source_materials || [];
      const materials_context = analysis
        ? [
            analysis.summary,
            analysis.draft_outline,
            Array.isArray(analysis.key_points) ? "Ключевые тезисы:\n- " + analysis.key_points.join("\n- ") : "",
            Array.isArray(analysis.detected_sources)
              ? "Источники:\n" + analysis.detected_sources.map((s: any) =>
                  `- ${s.marker || ""} ${[s.authors, s.title, s.journal, s.year, s.doi_or_pmid].filter(Boolean).join(". ")}`
                ).join("\n")
              : "",
          ].filter(Boolean).join("\n\n")
        : materials.map(m => `${m.marker || ""} ${m.name || m.url || m.kind}${m.text ? ": " + m.text.slice(0, 500) : ""}`).join("\n");
      const materials_list = materials.map(m => ({ marker: m.marker, name: m.name, url: m.url, kind: m.kind }));

      const { data, error } = await supabase.functions.invoke("research-review-orchestrate", {
        body: {
          topic: row.topic || row.title,
          materials_context,
          materials_list,
          review_id: row.id,
          voice_mode: row.voice_mode || "impersonal",
        },
      });
      if (error) throw error;
      if (!data?.queued && !data?.review) throw new Error("пустой ответ оркестратора");

      if (data?.review) {
        setRow(data.review);
        toast.success("Обзор готов");
        setOrchestrating(false);
        return;
      }

      toast.info("Оркестратор запущен в фоне. Прогресс — в карточке ниже.");
      if (savedSnapshot) toast.success("Предыдущая версия сохранена в истории правок");
      setTimeout(() => {
        document.getElementById("orchestrator-progress")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка оркестратора");
      setOrchestrating(false);
    }
  }

  function applyRefinement(newContent: string, entry: RefinementEntry) {
    const nextHistory = [...(row.refinement_history || []), entry];
    const patch: Record<string, unknown> = { content: newContent, refinement_history: nextHistory };
    if (!row.content_with_markers) patch.content_with_markers = newContent;
    setRow({ ...row, ...patch });
    saveSilently(patch);
  }

  function rollback(newContent: string) {
    const patch: Record<string, unknown> = { content: newContent };
    if (!row.content_with_markers) patch.content_with_markers = newContent;
    setRow({ ...row, ...patch });
    saveSilently(patch);
  }

  function stripMarkersHandler() {
    const src = row.content_with_markers || row.content || "";
    const cleaned = stripMarkers(src);
    const patch = { content: cleaned, content_with_markers: src };
    setRow({ ...row, ...patch });
    saveSilently(patch);
    toast.success("Маркеры убраны. Размеченная версия сохранена в content_with_markers.");
  }

  function printReview() {
    document.body.classList.add("printing-review");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("printing-review");
    }, 100);
  }

  // Блок 5: вставка метки галереи в позицию курсора с валидацией уникальности подписи.
  const insertGalleryMarker = useCallback(() => {
    if (readOnly) { toast.error("Обзор на консилиуме — недоступно"); return; }
    const caption = window.prompt("Подпись галереи (обязательна, должна быть уникальной):", "");
    if (!caption) return;
    const trimmed = caption.trim();
    if (!trimmed) { toast.error("Подпись не может быть пустой"); return; }
    // Проверка уникальности внутри обзора
    const src = (row?.content_with_markers || row?.content || "") as string;
    const re = new RegExp(GALLERY_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      if ((m[1] || "").trim().toLowerCase() === trimmed.toLowerCase()) {
        toast.error(`Подпись «${trimmed}» уже используется в этом обзоре`);
        return;
      }
    }
    if (contentEditor && !contentEditor.isDestroyed) {
      contentEditor.chain().focus().insertContent({
        type: "galleryPlaceholder",
        attrs: { caption: trimmed, files: "" },
      }).run();
      toast.success("Метка галереи вставлена. Загрузите изображения на публичной странице обзора.");
    }
  }, [contentEditor, readOnly, row?.content, row?.content_with_markers]);

  if (loading) return <div className="p-6"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!row) return <div className="p-6">Не найдено</div>;

  const refs: Ref[] = Array.isArray(row.references_list) ? row.references_list : [];
  const fcReport = row.fact_check_report && typeof row.fact_check_report === "object" ? row.fact_check_report : {};
  const materials: Material[] = Array.isArray(row.source_materials) ? row.source_materials : [];
  const history: RefinementEntry[] = Array.isArray(row.refinement_history) ? row.refinement_history : [];

  const materialsContextForRefine = analysis
    ? [analysis.summary, Array.isArray(analysis.key_points) ? analysis.key_points.join("\n") : ""].filter(Boolean).join("\n\n")
    : materials.map(m => `${m.marker || ""} ${m.name || m.url || m.kind}`).join("\n");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 no-print">
        <div className="flex items-center gap-3">
          <Link to="/admin/research-reviews"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Список</Button></Link>
          <Badge variant={WORKFLOW_VARIANT[workflowState]}>{WORKFLOW_LABEL[workflowState]}</Badge>
          {dirty && <span className="text-xs text-muted-foreground">есть несохранённые изменения</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => save()} disabled={saving || readOnly}>
            <Save className="w-4 h-4 mr-1" /> Сохранить
          </Button>
          {contentEditor && !readOnly && (
            <Button variant="outline" size="sm" onClick={() => contentEditor.chain().focus().undo().run()}>
              <Undo2 className="w-4 h-4 mr-1" /> Отменить
            </Button>
          )}
        </div>
      </div>

      {/* Блок 1: жизненный цикл */}
      <Card className="no-print">
        <CardHeader><CardTitle className="text-base">Состояние работы</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          {workflowState === "draft" && (
            <Button size="sm" onClick={() => setWorkflow("writing")}>В работу (написание)</Button>
          )}
          {workflowState === "writing" && (
            <>
              <Button size="sm" onClick={() => setWorkflow("editing")}>На научное редактирование</Button>
              <Button size="sm" variant="outline" onClick={() => setWorkflow("draft")}>Вернуть в черновик</Button>
            </>
          )}
          {workflowState === "editing" && (
            <>
              <Button size="sm" onClick={sendToConsilium}><Users className="w-4 h-4 mr-1" />На консилиум</Button>
              <Button size="sm" onClick={() => setWorkflow("published")}><Send className="w-4 h-4 mr-1" />Опубликовать</Button>
              <Button size="sm" variant="outline" onClick={() => setWorkflow("writing")}>Вернуть на доработку</Button>
            </>
          )}
          {workflowState === "consilium" && (
            <>
              <div className="w-full mb-2 flex items-center gap-2 rounded-md border border-amber-400/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span className="text-sm text-amber-800 dark:text-amber-300">Обзор на консилиуме — редактирование заблокировано.</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setWorkflow("editing")}>Снять с консилиума</Button>
            </>
          )}
          {workflowState === "published" && (
            <>
              <Link to={`/for-doctors/research/${row.slug}`} target="_blank">
                <Button variant="outline" size="sm">Открыть на сайте</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={() => setWorkflow("editing")}>Снять с публикации</Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Блок 2: режим голоса */}
      <Card className="no-print">
        <CardHeader><CardTitle className="text-base">Режим голоса</CardTitle></CardHeader>
        <CardContent>
          <Select
            value={voiceMode}
            onValueChange={(v) => update({ voice_mode: v as VoiceMode })}
            disabled={readOnly}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(VOICE_LABEL) as VoiceMode[]).map((k) => (
                <SelectItem key={k} value={k}>{VOICE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Режим передаётся в промпты написания, доработки и в консилиум статей.
          </p>
        </CardContent>
      </Card>

      {(() => {
        const contentStr: string = row.content_with_markers || row.content || "";
        const hasExistingContent = /\[M\d+\]/.test(contentStr);
        const showPanel = !!status || orchestrating || hasExistingContent;
        if (!showPanel) return null;
        return (
          <div id="orchestrator-progress" className="scroll-mt-4">
            <OrchestratorProgress
              status={status}
              lastStep={lastStep}
              error={orchestratorError}
              timers={timers}
              hasExistingContent={hasExistingContent}
              onRetryAll={orchestrate}
              modelsUsed={modelsUsed as any}
            />
          </div>
        );
      })()}

      <div id="materials-panel" className="scroll-mt-4">
        <Suspense fallback={Fallback}>
          <MaterialsPanel
            reviewId={row.id}
            materials={materials}
            onChange={(m) => { update({ source_materials: m }); saveSilently({ source_materials: m }); }}
            instructions={instructions}
            onInstructionsChange={setInstructions}
            onAnalyze={analyzeMaterials}
            analyzing={analyzing}
            analysis={analysis}
            onInsertTable={async (md) => {
              const { marked } = await import("marked");
              const html = await marked.parse(md, { gfm: true, breaks: false });
              contentEditor?.chain().focus().insertContent(html).run();
              toast.success("Таблица вставлена в текст обзора");
            }}
          />
        </Suspense>
      </div>

      <Suspense fallback={Fallback}>
        <RefinementChat
          reviewId={row.id}
          title={row.title || ""}
          currentContent={row.content || ""}
          materialsContext={materialsContextForRefine}
          materials={materials}
          onMaterialsChange={(m) => { update({ source_materials: m }); saveSilently({ source_materials: m }); }}
          history={history}
          onApply={applyRefinement}
          onRollback={rollback}
          onOrchestrate={orchestrate}
          orchestrating={orchestrating}
        />
      </Suspense>

      <OrchestratorArtifacts
        searchResult={searchResult}
        content={row.content_with_markers || row.content}
        factCheck={fcReport}
      />

      {status === "done" && (fcReport.not_found_in_source?.length ?? 0) > 0 && (
        <FactCheckFixList
          content={row.content_with_markers || row.content || ""}
          factCheck={fcReport}
          onApply={applyRefinement}
        />
      )}

      <Suspense fallback={Fallback}>
        <PublishBar
          title={row.title || ""}
          annotation={row.annotation}
          content={row.content || ""}
          contentWithMarkers={row.content_with_markers}
          references={refs}
          onStripMarkers={stripMarkersHandler}
          onPrint={printReview}
        />
      </Suspense>

      <Card className="no-print">
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Заголовок</Label><Input value={row.title || ""} onChange={(e) => update({ title: e.target.value })} disabled={readOnly} /></div>
          <div><Label>Slug (URL)</Label><Input value={row.slug || ""} onChange={(e) => update({ slug: e.target.value })} disabled={readOnly} /></div>
          <div><Label>Тема (фильтр)</Label><Input value={row.topic || ""} onChange={(e) => update({ topic: e.target.value })} disabled={readOnly} /></div>
          <div><Label>Аннотация</Label><Textarea value={row.annotation || ""} onChange={(e) => update({ annotation: e.target.value })} rows={4} disabled={readOnly} /></div>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Текст обзора</CardTitle>
            <Button size="sm" variant="outline" onClick={insertGalleryMarker} disabled={readOnly}>
              <ImagePlus className="w-4 h-4 mr-1" /> Место для галереи
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={row.content || ""}
            onChange={(html) => update({ content: html })}
            storageBucket="disease-media"
            storageFolder="article-images"
            ownerSlug={row.slug || "review"}
            onEditorReady={setContentEditor}
            allowGalleryUpload={false}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Маркеры источников — в формате [M1], [M2] (см. панель материалов). На публичной странице ссылки на литературу — [1], [2].
            Заливать изображения в галереи можно на публичной странице обзора — там доступен полноценный редактор.
          </p>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Список литературы ({refs.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => update({ references_list: [...refs, { number: refs.length + 1, verified: false }] })} disabled={readOnly}>
              <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {refs.map((r, i) => (
            <div key={i} className={`border rounded p-3 space-y-2 ${r.verified ? "" : "border-amber-400/60 bg-amber-50/40 dark:bg-amber-900/10"}`}>
              <div className="flex items-center gap-2">
                <Input className="w-16" type="number" value={r.number ?? i + 1} onChange={(e) => { const arr = [...refs]; arr[i] = { ...r, number: Number(e.target.value) }; update({ references_list: arr }); }} disabled={readOnly} />
                <Input placeholder="Авторы" value={r.authors || ""} onChange={(e) => { const arr = [...refs]; arr[i] = { ...r, authors: e.target.value }; update({ references_list: arr }); }} disabled={readOnly} />
                <Button variant="ghost" size="sm" onClick={() => update({ references_list: refs.filter((_, j) => j !== i) })} disabled={readOnly}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <Input placeholder="Название статьи" value={r.title || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, title: e.target.value }; update({ references_list: a }); }} disabled={readOnly} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input placeholder="Журнал" value={r.journal || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, journal: e.target.value }; update({ references_list: a }); }} disabled={readOnly} />
                <Input placeholder="Год" value={r.year || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, year: e.target.value }; update({ references_list: a }); }} disabled={readOnly} />
                <Input placeholder="Том(номер)" value={r.volume_issue || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, volume_issue: e.target.value }; update({ references_list: a }); }} disabled={readOnly} />
                <Input placeholder="Страницы" value={r.pages || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, pages: e.target.value }; update({ references_list: a }); }} disabled={readOnly} />
              </div>
              <div className="flex items-center gap-3">
                <Input placeholder="DOI / PMID" value={r.doi_or_pmid || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, doi_or_pmid: e.target.value }; update({ references_list: a }); }} disabled={readOnly} />
                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <input type="checkbox" checked={!!r.verified} onChange={(e) => { const a = [...refs]; a[i] = { ...r, verified: e.target.checked }; update({ references_list: a }); }} disabled={readOnly} />
                  проверено
                </label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Collapsible className="no-print">
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <span>Отчёт факт-чека — только для админа</span>
                <ChevronDown className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400">Подтверждено ({fcReport.verified?.length || 0})</h4>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {(fcReport.verified || []).map((v: any, i: number) => (
                    <li key={i}><span className="font-mono text-primary">{v.marker}</span> {v.claim}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-destructive">Не найдено в источнике ({fcReport.not_found_in_source?.length || 0})</h4>
                <ul className="list-disc pl-5">
                  {(fcReport.not_found_in_source || []).map((v: any, i: number) => (
                    <li key={i}><span className="font-mono">{v.marker}</span> {v.claim} — <em>{v.reason}</em></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">Утверждения без маркера ({fcReport.unmarked_claims?.length || 0})</h4>
                <ul className="list-disc pl-5">
                  {(fcReport.unmarked_claims || []).map((v: string, i: number) => <li key={i}>{v}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-muted-foreground">Материалы без ссылок в тексте ({fcReport.missing_markers?.length || 0})</h4>
                <ul className="list-disc pl-5">
                  {(fcReport.missing_markers || []).map((v: any, i: number) => (
                    <li key={i}><span className="font-mono">{v.marker}</span> — {v.name}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="no-print">
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const t = row.seo_title || "";
            const d = row.seo_meta_description || "";
            const tOver = t.length > 60;
            const dOver = d.length > 160;
            return (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>SEO title</Label>
                    <span className={`text-xs tabular-nums ${tOver ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {t.length} / 60
                    </span>
                  </div>
                  <Input value={t} onChange={(e) => update({ seo_title: e.target.value })} disabled={readOnly} />
                  <p className="text-xs text-muted-foreground">Рекомендация: до 60 символов законченной фразой.</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>Meta description</Label>
                    <span className={`text-xs tabular-nums ${dOver ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {d.length} / 160
                    </span>
                  </div>
                  <Textarea value={d} onChange={(e) => update({ seo_meta_description: e.target.value })} rows={2} disabled={readOnly} />
                  <p className="text-xs text-muted-foreground">Рекомендация: до 160 символов законченным предложением.</p>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <ReviewPrintView
          ref={printRef}
          title={row.title || ""}
          annotation={row.annotation}
          content={row.content || ""}
          references={refs}
        />
      </Suspense>
    </div>
  );
};

export default AdminResearchReviewEditor;
