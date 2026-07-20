import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Send, ChevronDown, Loader2, Trash2, Plus } from "lucide-react";
import { stripMarkers } from "@/lib/research/markers";
import type { Material } from "@/components/admin/research/MaterialsPanel";
import type { RefinementEntry } from "@/lib/research/refinementDiff";

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

const Fallback = <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

const AdminResearchReviewEditor = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [instructions, setInstructions] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [orchestrating, setOrchestrating] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("research_reviews" as any).select("*").eq("id", id!).single();
      if (error) toast.error(error.message);
      else setRow(data);
      setLoading(false);
    })();
  }, [id]);

  function update(patch: any) { setRow((r: any) => ({ ...r, ...patch })); }

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
      if (newStatus) setRow({ ...row, ...payload });
    }
  }

  async function saveSilently(patch: any) {
    if (!row) return;
    await supabase.from("research_reviews" as any).update(patch).eq("id", row.id);
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
    if (!row.topic && !analysis) { toast.error("Укажите тему обзора или запустите анализ материалов"); return; }
    if (row.content && !confirm("Текущий текст обзора будет перезаписан. Продолжить?")) return;
    setOrchestrating(true);
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
        body: { topic: row.topic || row.title, materials_context, materials_list, review_id: row.id },
      });
      if (error) throw error;
      if (!data?.queued && !data?.review) throw new Error("пустой ответ оркестратора");

      // Если функция вернула готовый результат (старое поведение) — применим сразу
      if (data?.review) {
        setRow(data.review);
        toast.success("Обзор готов");
        setOrchestrating(false);
        return;
      }

      toast.info("Оркестратор запущен в фоне. Ожидаю результат…");
      // Опрос статуса раз в 5 сек, максимум 10 минут
      const deadline = Date.now() + 10 * 60 * 1000;
      const poll = async () => {
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 5000));
          const { data: fresh } = await supabase.from("research_reviews" as any).select("*").eq("id", row.id).single();
          if (!fresh) continue;
          const status = (fresh as any).fact_check_report?.orchestrator_status;
          if (status === "done" || !status) {
            setRow(fresh);
            toast.success("Обзор готов");
            return;
          }
          if (status === "error") {
            toast.error("Оркестратор упал: " + ((fresh as any).fact_check_report?.error || "неизвестно"));
            setRow(fresh);
            return;
          }
        }
        toast.error("Оркестратор не ответил за 10 минут. Проверьте логи функции.");
      };
      poll().finally(() => setOrchestrating(false));
      return;
    } catch (e: any) {
      toast.error(e?.message || "Ошибка оркестратора");
      setOrchestrating(false);
    }
  }

  function applyRefinement(newContent: string, entry: RefinementEntry) {
    const nextHistory = [...(row.refinement_history || []), entry];
    const patch = { content: newContent, content_with_markers: newContent, refinement_history: nextHistory };
    setRow({ ...row, ...patch });
    saveSilently(patch);
  }

  function rollback(newContent: string) {
    const patch = { content: newContent, content_with_markers: newContent };
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
          <Badge variant={row.status === "published" ? "default" : row.status === "in_review" ? "secondary" : "outline"}>
            {row.status === "published" ? "Опубликован" : row.status === "in_review" ? "На проверке" : "Черновик"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => save()} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Сохранить
          </Button>
          {row.status === "draft" && (
            <Button variant="secondary" size="sm" onClick={() => save("in_review")} disabled={saving}>
              <Eye className="w-4 h-4 mr-1" /> На проверку
            </Button>
          )}
          {row.status === "in_review" && (
            <>
              <Button variant="outline" size="sm" onClick={() => save("draft")}>Вернуть в draft</Button>
              <Button size="sm" onClick={() => save("published")}>
                <Send className="w-4 h-4 mr-1" /> Опубликовать
              </Button>
            </>
          )}
          {row.status === "published" && (
            <>
              <Link to={`/for-doctors/research/${row.slug}`} target="_blank">
                <Button variant="outline" size="sm">Открыть на сайте</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => save("draft")}>Снять с публикации</Button>
            </>
          )}
        </div>
      </div>

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
        />
      </Suspense>

      <Suspense fallback={Fallback}>
        <RefinementChat
          reviewId={row.id}
          title={row.title || ""}
          currentContent={row.content || ""}
          materialsContext={materialsContextForRefine}
          history={history}
          onApply={applyRefinement}
          onRollback={rollback}
          onOrchestrate={orchestrate}
          orchestrating={orchestrating}
        />
      </Suspense>

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
          <div><Label>Заголовок</Label><Input value={row.title || ""} onChange={(e) => update({ title: e.target.value })} /></div>
          <div><Label>Slug (URL)</Label><Input value={row.slug || ""} onChange={(e) => update({ slug: e.target.value })} /></div>
          <div><Label>Тема (фильтр)</Label><Input value={row.topic || ""} onChange={(e) => update({ topic: e.target.value })} /></div>
          <div><Label>Аннотация</Label><Textarea value={row.annotation || ""} onChange={(e) => update({ annotation: e.target.value })} rows={4} /></div>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader><CardTitle>Текст обзора</CardTitle></CardHeader>
        <CardContent>
          <RichTextEditor content={row.content || ""} onChange={(html) => update({ content: html })} storageBucket="disease-media" storageFolder="research-images" />
          <p className="text-xs text-muted-foreground mt-2">
            Маркеры источников — в формате [M1], [M2] (см. панель материалов). На публичной странице ссылки на литературу — [1], [2].
          </p>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Список литературы ({refs.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => update({ references_list: [...refs, { number: refs.length + 1, verified: false }] })}>
              <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {refs.map((r, i) => (
            <div key={i} className="border rounded p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input className="w-16" type="number" value={r.number ?? i + 1} onChange={(e) => {
                  const arr = [...refs]; arr[i] = { ...r, number: Number(e.target.value) }; update({ references_list: arr });
                }} />
                <Input placeholder="Авторы" value={r.authors || ""} onChange={(e) => {
                  const arr = [...refs]; arr[i] = { ...r, authors: e.target.value }; update({ references_list: arr });
                }} />
                <Button variant="ghost" size="sm" onClick={() => update({ references_list: refs.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <Input placeholder="Название статьи" value={r.title || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, title: e.target.value }; update({ references_list: a }); }} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input placeholder="Журнал" value={r.journal || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, journal: e.target.value }; update({ references_list: a }); }} />
                <Input placeholder="Год" value={r.year || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, year: e.target.value }; update({ references_list: a }); }} />
                <Input placeholder="Том(номер)" value={r.volume_issue || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, volume_issue: e.target.value }; update({ references_list: a }); }} />
                <Input placeholder="Страницы" value={r.pages || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, pages: e.target.value }; update({ references_list: a }); }} />
              </div>
              <div className="flex items-center gap-3">
                <Input placeholder="DOI / PMID" value={r.doi_or_pmid || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, doi_or_pmid: e.target.value }; update({ references_list: a }); }} />
                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <input type="checkbox" checked={!!r.verified} onChange={(e) => { const a = [...refs]; a[i] = { ...r, verified: e.target.checked }; update({ references_list: a }); }} />
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
        <CardContent className="space-y-3">
          <div><Label>SEO title (≤60 симв.)</Label><Input value={row.seo_title || ""} onChange={(e) => update({ seo_title: e.target.value })} maxLength={70} /></div>
          <div><Label>Meta description (≤160 симв.)</Label><Textarea value={row.seo_meta_description || ""} onChange={(e) => update({ seo_meta_description: e.target.value })} rows={2} maxLength={200} /></div>
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
