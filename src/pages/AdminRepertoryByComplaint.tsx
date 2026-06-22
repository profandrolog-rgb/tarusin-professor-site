import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Loader2, Search, Sparkles, Calculator, X, Info, CheckCircle2, Circle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Candidate {
  rubric_id: string;
  name: string;
  name_ru: string | null;
  chapter_id: string | null;
  similarity: number;
  matched_statements: string[];
  reason?: string;
  selected: boolean;
}
interface Remedy { id: string; name_latin: string; name_ru: string | null; abbrev: string | null }
interface Link { rubric_id: string; remedy_id: string; grade: number }

export default function AdminRepertoryByComplaint() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState("");
  const [statements, setStatements] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [computed, setComputed] = useState(false);
  const [computing, setComputing] = useState(false);
  const [mmSections, setMmSections] = useState<Record<string, { heading: string; body: string; source_url: string | null }[]>>({});

  // Auto-pipeline progress: extract → select → compute
  type Stage = "idle" | "extract" | "select" | "compute" | "done" | "error";
  const [stage, setStage] = useState<Stage>("idle");
  const [stageMessage, setStageMessage] = useState<string>("");
  const stageProgress: Record<Stage, number> = {
    idle: 0, extract: 25, select: 60, compute: 90, done: 100, error: 0,
  };
  const pipelineRunning = stage === "extract" || stage === "select" || stage === "compute";


  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/repertory/by-complaint" } });
  }, [user, isAdmin, loading, navigate]);

  const remedyById = useMemo(() => {
    const m = new Map<string, Remedy>();
    remedies.forEach((r) => m.set(r.id, r));
    return m;
  }, [remedies]);

  const selectedIds = useMemo(() => new Set(candidates.filter((c) => c.selected).map((c) => c.rubric_id)), [candidates]);

  const ranking = useMemo(() => {
    if (!computed || selectedIds.size === 0) return [];
    const stats = new Map<string, { sum: number; count: number; perRubric: Map<string, number> }>();
    links.forEach((l) => {
      if (!selectedIds.has(l.rubric_id)) return;
      const s = stats.get(l.remedy_id) || { sum: 0, count: 0, perRubric: new Map() };
      s.sum += l.grade;
      s.count += 1;
      s.perRubric.set(l.rubric_id, l.grade);
      stats.set(l.remedy_id, s);
    });
    return Array.from(stats.entries())
      .map(([rid, s]) => ({ remedy: remedyById.get(rid)!, ...s }))
      .filter((x) => x.remedy)
      .sort((a, b) => b.count - a.count || b.sum - a.sum)
      .slice(0, 10);
  }, [computed, selectedIds, links, remedyById]);

  async function runExtract(): Promise<{ stmts: string[]; cands: Omit<Candidate, "selected">[] } | null> {
    if (!complaint.trim()) return null;
    setExtracting(true);
    setComputed(false);
    setStatements([]);
    setCandidates([]);
    try {
      const { data, error } = await supabase.functions.invoke("repertorize-from-complaint", {
        body: { mode: "extract", complaint },
      });
      if (error) throw error;
      const stmts: string[] = data.statements || [];
      const cands: Omit<Candidate, "selected">[] = data.candidates || [];
      setStatements(stmts);
      setCandidates(cands.map((c) => ({ ...c, selected: true })));
      return { stmts, cands };
    } catch (e: any) {
      toast({ title: "Ошибка извлечения", description: e?.message || String(e), variant: "destructive" });
      return null;
    } finally {
      setExtracting(false);
    }
  }

  async function runAiSelect(initialCandidates?: Omit<Candidate, "selected">[]): Promise<string[] | null> {
    const source = initialCandidates ?? candidates;
    if (source.length === 0) return null;
    setSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("repertorize-from-complaint", {
        body: {
          mode: "select",
          complaint,
          candidates: source.map((c) => ({ rubric_id: c.rubric_id, name: c.name, name_ru: c.name_ru })),
        },
      });
      if (error) throw error;
      const picks: { rubric_id: string; reason: string }[] = data.selected || [];
      const picked = new Map(picks.map((p) => [p.rubric_id, p.reason]));
      setCandidates((prev) =>
        prev.map((c) => ({ ...c, selected: picked.has(c.rubric_id), reason: picked.get(c.rubric_id) || c.reason })),
      );
      return picks.map((p) => p.rubric_id);
    } catch (e: any) {
      toast({ title: "Ошибка выбора", description: e?.message || String(e), variant: "destructive" });
      return null;
    } finally {
      setSelecting(false);
    }
  }

  async function runCompute(ids?: string[]): Promise<boolean> {
    const useIds = ids && ids.length > 0 ? ids : Array.from(selectedIds);
    if (useIds.length === 0) return false;
    setComputing(true);
    try {
      const [linksRes, remediesRes] = await Promise.all([
        supabase.from("repertory_rubric_remedies").select("rubric_id,remedy_id,grade").in("rubric_id", useIds),
        supabase.from("repertory_remedies").select("id,name_latin,name_ru,abbrev"),
      ]);
      if (linksRes.error) throw linksRes.error;
      if (remediesRes.error) throw remediesRes.error;
      setLinks((linksRes.data as any) || []);
      setRemedies((remediesRes.data as any) || []);
      setComputed(true);
      return true;
    } catch (e: any) {
      toast({ title: "Ошибка подсчёта", description: e?.message || String(e), variant: "destructive" });
      return false;
    } finally {
      setComputing(false);
    }
  }

  // Single-click full pipeline: extract → AI select → compute ranking
  async function runFullPipeline() {
    if (!complaint.trim()) return;
    setStage("extract");
    setStageMessage("Разбираем жалобы и ищем рубрики по смыслу…");
    const ex = await runExtract();
    if (!ex) { setStage("error"); setStageMessage("Не удалось извлечь утверждения"); return; }
    if (ex.cands.length === 0) {
      setStage("error");
      setStageMessage("Поиск рубрик не дал результатов. Проверьте, что эмбеддинги рубрик загружены.");
      return;
    }
    setStage("select");
    setStageMessage(`Найдено ${ex.cands.length} кандидатов из ${ex.stmts.length} утверждений. ИИ выбирает клинически уместные…`);
    const picked = await runAiSelect(ex.cands);
    if (!picked || picked.length === 0) {
      setStage("error");
      setStageMessage("ИИ не выбрал ни одной рубрики");
      return;
    }
    setStage("compute");
    setStageMessage(`ИИ выбрал ${picked.length} рубрик. Считаем ранжирование средств…`);
    const ok = await runCompute(picked);
    if (!ok) { setStage("error"); setStageMessage("Ошибка подсчёта ранжирования"); return; }
    setStage("done");
    setStageMessage(`Готово: ${picked.length} рубрик, ${ex.stmts.length} утверждений`);
    toast({ title: "Подбор завершён", description: `${picked.length} рубрик · ${ex.stmts.length} утверждений` });
  }

  // Load Materia Medica Relationship sections for top-5 remedies
  useEffect(() => {
    if (!computed) { setMmSections({}); return; }
    const top5 = ranking.slice(0, 5).map((r) => r.remedy.id);
    if (top5.length === 0) { setMmSections({}); return; }
    (async () => {
      const { data, error } = await supabase
        .from("materia_medica_sections")
        .select("remedy_id, heading, body, source_url")
        .in("remedy_id", top5)
        .eq("source", "boericke");
      if (error) return;
      const grouped: Record<string, { heading: string; body: string; source_url: string | null }[]> = {};
      (data || []).forEach((row: any) => {
        (grouped[row.remedy_id] ||= []).push({ heading: row.heading, body: row.body, source_url: row.source_url });
      });
      setMmSections(grouped);
    })();
  }, [computed, ranking]);


  function removeStatement(s: string) {
    setStatements((prev) => prev.filter((x) => x !== s));
    setCandidates((prev) => prev.map((c) => ({ ...c, matched_statements: c.matched_statements.filter((x) => x !== s) })));
  }
  function toggleCandidate(id: string) {
    setCandidates((prev) => prev.map((c) => (c.rubric_id === id ? { ...c, selected: !c.selected } : c)));
    setComputed(false);
  }
  function removeCandidate(id: string) {
    setCandidates((prev) => prev.filter((c) => c.rubric_id !== id));
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-[1400px]">
          <Link to="/admin/repertory" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />Назад к реперторию
          </Link>

          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" /> Поиск по жалобам
          </h1>
          <p className="text-muted-foreground mb-6">
            Свободный текст → разбор на симптомы → семантический поиск рубрик → AI-выбор клинически уместных → ранжирование средств.
          </p>

          <Card className="mb-4">
            <CardHeader className="pb-3"><CardTitle className="text-base">1. Жалобы пациента</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Опишите жалобы пациента свободным текстом — локализация, характер, модальности (что улучшает/ухудшает), время суток, психические особенности…"
                rows={6}
                maxLength={8000}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={runFullPipeline} disabled={pipelineRunning || !complaint.trim()} className="gap-2">
                  {pipelineRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Подобрать препараты
                </Button>
                <Button variant="outline" onClick={() => runExtract()} disabled={extracting || !complaint.trim()} className="gap-2">
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Только найти кандидатов
                </Button>
                <span className="text-xs text-muted-foreground">{complaint.length} / 8000</span>
              </div>

              {stage !== "idle" && (
                <div className="space-y-2 pt-2">
                  <Progress value={stageProgress[stage]} className={stage === "error" ? "[&>div]:bg-destructive" : ""} />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { key: "extract", label: "Поиск рубрик" },
                      { key: "select", label: "ИИ-отбор" },
                      { key: "compute", label: "Ранжирование" },
                    ].map((s) => {
                      const order = ["extract", "select", "compute", "done"];
                      const idx = order.indexOf(s.key);
                      const curIdx = order.indexOf(stage);
                      const isDone = stage === "done" || curIdx > idx;
                      const isCurrent = stage === s.key;
                      return (
                        <div key={s.key} className="flex items-center gap-1.5">
                          {isCurrent ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className={isCurrent ? "font-medium" : isDone ? "" : "text-muted-foreground"}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {stageMessage && (
                    <p className={`text-xs ${stage === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                      {stageMessage}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {statements.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Извлечённые утверждения ({statements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {statements.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeStatement(s)}>
                      {s}<X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {candidates.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                  <span>3. Рубрики-кандидаты ({candidates.length}, отмечено {selectedIds.size})</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => runAiSelect()} disabled={selecting} className="gap-2">
                      {selecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      ИИ-подсказка выбора
                    </Button>
                    <Button size="sm" onClick={() => runCompute()} disabled={computing || selectedIds.size === 0} className="gap-2">
                      {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                      Посчитать ранжирование
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[480px] pr-3">
                  <div className="space-y-1">
                    {candidates.map((c) => (
                      <div key={c.rubric_id} className="flex items-start gap-2 px-2 py-2 rounded hover:bg-muted/50 group">
                        <Checkbox checked={c.selected} onCheckedChange={() => toggleCandidate(c.rubric_id)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{c.name_ru || c.name}</div>
                          {c.reason && <div className="text-xs text-muted-foreground mt-0.5 italic">↳ {c.reason}</div>}
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] font-mono">sim {(c.similarity * 100).toFixed(0)}%</Badge>
                            {c.matched_statements.slice(0, 3).map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] font-normal">{s}</Badge>
                            ))}
                            {c.matched_statements.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">+{c.matched_statements.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeCandidate(c.rubric_id)} className="opacity-0 group-hover:opacity-100">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {computed && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">4. Топ-10 средств</CardTitle>
                <p className="text-xs text-muted-foreground">Сортировка: совпадения рубрик ↓, затем сумма грейдов ↓</p>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">Для выбранных рубрик нет связанных средств в реперторие.</div>
                ) : (
                  <div className="space-y-1">
                    {ranking.map((row, i) => (
                      <div key={row.remedy.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50">
                        <div className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{row.remedy.name_latin}</div>
                          {row.remedy.name_ru && <div className="text-xs text-muted-foreground truncate">{row.remedy.name_ru}</div>}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <Badge variant="secondary" className="font-mono text-xs">{row.count}/{selectedIds.size}</Badge>
                              <Badge className="font-mono text-xs">Σ {row.sum}</Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <div className="space-y-1">
                              {Array.from(row.perRubric.entries()).map(([rid, g]) => {
                                const c = candidates.find((x) => x.rubric_id === rid);
                                return (
                                  <div key={rid} className="flex items-center justify-between gap-3 text-xs">
                                    <span className="truncate">{c?.name_ru || c?.name || "—"}</span>
                                    <span className="font-mono font-semibold">grade {g}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium mb-3">
                    <Info className="w-4 h-4 text-muted-foreground" />Сочетания и сравнения (Materia Medica Бёрике) — топ-5
                  </div>
                  {(() => {
                    const top5 = ranking.slice(0, 5);
                    const anyData = top5.some((r) => (mmSections[r.remedy.id] || []).length > 0);
                    if (!anyData) {
                      return (
                        <div className="text-xs text-muted-foreground bg-muted/40 rounded p-3">
                          Для топ-5 средств не найдено разделов Materia Medica. Запустите импорт Бёрике на странице{" "}
                          <Link to="/admin/repertory" className="underline">репертория</Link>.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        {top5.map((row) => {
                          const sections = mmSections[row.remedy.id] || [];
                          if (sections.length === 0) return null;
                          return (
                            <div key={row.remedy.id} className="rounded-md border bg-muted/30 p-3">
                              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                                <div className="font-medium text-sm">
                                  {row.remedy.name_latin}
                                  {row.remedy.name_ru && <span className="text-muted-foreground font-normal"> · {row.remedy.name_ru}</span>}
                                </div>
                                {sections[0]?.source_url && (
                                  <a href={sections[0].source_url} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground underline">
                                    источник
                                  </a>
                                )}
                              </div>
                              {sections.map((s, i) => (
                                <div key={i} className="text-xs leading-relaxed">
                                  <span className="font-semibold text-foreground/80">{s.heading}. </span>
                                  <span className="text-muted-foreground whitespace-pre-wrap">{s.body}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
