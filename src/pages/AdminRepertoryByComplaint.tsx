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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Loader2, Search, Sparkles, Calculator, X, Info } from "lucide-react";
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

  async function runExtract() {
    if (!complaint.trim()) return;
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
      toast({ title: `Найдено ${cands.length} рубрик`, description: `Утверждений: ${stmts.length}` });
    } catch (e: any) {
      toast({ title: "Ошибка извлечения", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  }

  async function runAiSelect() {
    if (candidates.length === 0) return;
    setSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("repertorize-from-complaint", {
        body: {
          mode: "select",
          complaint,
          candidates: candidates.map((c) => ({ rubric_id: c.rubric_id, name: c.name, name_ru: c.name_ru })),
        },
      });
      if (error) throw error;
      const picks: { rubric_id: string; reason: string }[] = data.selected || [];
      const picked = new Map(picks.map((p) => [p.rubric_id, p.reason]));
      setCandidates((prev) =>
        prev.map((c) => ({ ...c, selected: picked.has(c.rubric_id), reason: picked.get(c.rubric_id) || c.reason })),
      );
      toast({ title: `ИИ выбрал ${picks.length} рубрик` });
    } catch (e: any) {
      toast({ title: "Ошибка выбора", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSelecting(false);
    }
  }

  async function runCompute() {
    if (selectedIds.size === 0) return;
    setComputing(true);
    try {
      const ids = Array.from(selectedIds);
      const [linksRes, remediesRes] = await Promise.all([
        supabase.from("repertory_rubric_remedies").select("rubric_id,remedy_id,grade").in("rubric_id", ids),
        supabase.from("repertory_remedies").select("id,name_latin,name_ru,abbrev"),
      ]);
      if (linksRes.error) throw linksRes.error;
      if (remediesRes.error) throw remediesRes.error;
      setLinks((linksRes.data as any) || []);
      setRemedies((remediesRes.data as any) || []);
      setComputed(true);
    } catch (e: any) {
      toast({ title: "Ошибка подсчёта", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setComputing(false);
    }
  }

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
              <div className="flex items-center gap-2">
                <Button onClick={runExtract} disabled={extracting || !complaint.trim()} className="gap-2">
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Найти кандидатов
                </Button>
                <span className="text-xs text-muted-foreground">{complaint.length} / 8000</span>
              </div>
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
                    <Button size="sm" variant="outline" onClick={runAiSelect} disabled={selecting} className="gap-2">
                      {selecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      ИИ-подсказка выбора
                    </Button>
                    <Button size="sm" onClick={runCompute} disabled={computing || selectedIds.size === 0} className="gap-2">
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
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Info className="w-4 h-4 text-muted-foreground" />Сочетания и сравнения (Materia Medica Бёрике)
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/40 rounded p-3">
                    Materia Medica Бёрике ещё не импортирована в базу. После импорта таблицы <code className="text-[11px]">materia_medica_sections</code> здесь
                    появятся разделы Compare / Complementary / Antidote для топ-5 средств.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
