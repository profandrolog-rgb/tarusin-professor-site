// AI Article Orchestrator
// Админ-инструмент: статья → параллельное ревью N моделей → консолидация арбитром → применение правок.

import { useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ArticleDiffEditor from "@/components/admin/ArticleDiffEditor";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Sparkles, GitMerge, FileCheck2, Copy, Send, Mic, Square } from "lucide-react";


type EditItem = {
  id?: string;
  category: string;
  original: string;
  suggested: string;
  rationale: string;
  severity?: "low" | "medium" | "high";
  supporting_models?: string[];
  status?: "consensus" | "majority" | "single" | "disputed";
};

type ModelReview = {
  model: string;
  free_review: string;
  edits: EditItem[];
  error?: string;
  parse_error?: boolean;
};

const PANEL = [
  { id: "openai/gpt-5", label: "GPT-5", default: true },
  { id: "anthropic/claude-opus-4-8", label: "Claude Opus 4.8", default: true },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", default: true },
  { id: "z-ai/glm-5", label: "GLM-5", default: true },
  { id: "moonshotai/kimi-k2", label: "Kimi K2", default: true },
  { id: "perplexity/sonar-pro", label: "Perplexity Sonar Pro (фактчек)", default: true },
  { id: "venice/venice-uncensored-1-2", label: "Venice (без цензуры)", default: false },
  { id: "x-ai/grok-4.3", label: "Grok 4", default: false },
  { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4-Pro", default: false },
];

const ARBITERS = [
  { id: "anthropic/claude-opus-4-8", label: "Claude Opus 4.8" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

const REWRITERS = [
  { id: "anthropic/claude-opus-4-8", label: "Claude Opus 4.8 (рекомендуется — лучше держит авторский стиль)" },
  { id: "anthropic/claude-sonnet-4-8", label: "Claude Sonnet 4.8 (быстрее)" },
  { id: "openai/gpt-5.5", label: "GPT-5.5" },
  { id: "openai/gpt-5.4-pro", label: "GPT-5.4 Pro" },
  { id: "x-ai/grok-4.3", label: "Grok 4" },
];

const SEVERITY_COLOR: Record<string, string> = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};
const STATUS_LABEL: Record<string, string> = {
  consensus: "Консенсус",
  majority: "Большинство",
  single: "Одна модель",
  disputed: "Спорно",
};

export default function AdminArticleOrchestrator() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [models, setModels] = useState<string[]>(PANEL.filter((m) => m.default).map((m) => m.id));
  const [arbiter, setArbiter] = useState(ARBITERS[0].id);
  const [rewriter, setRewriter] = useState(REWRITERS[0].id);

  const [reviews, setReviews] = useState<ModelReview[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const [consolidated, setConsolidated] = useState<{ summary: string; edits: EditItem[] } | null>(null);
  const [consolidating, setConsolidating] = useState(false);

  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [finalText, setFinalText] = useState("");

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!user || !isAdmin) { navigate("/auth"); return null; }

  const toggleModel = (id: string) => {
    setModels((cur) => cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]);
  };

  async function runReview() {
    if (text.trim().length < 100) {
      toast({ title: "Статья слишком короткая", description: "Минимум 100 символов.", variant: "destructive" });
      return;
    }
    if (!models.length) {
      toast({ title: "Выберите хотя бы одну модель", variant: "destructive" });
      return;
    }
    setReviews([]);
    setConsolidated(null);
    setAccepted(new Set());
    setFinalText("");
    setReviewing(true);
    setPending(new Set(models));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "review", title, text, models }),
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${t.slice(0, 200)}`);
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const lines = ev.split("\n");
          let evType = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) evType = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          if (evType === "model_done") {
            try {
              const r = JSON.parse(data) as ModelReview;
              setReviews((cur) => [...cur, r]);
              setPending((cur) => { const n = new Set(cur); n.delete(r.model); return n; });
            } catch { /* ignore */ }
          } else if (evType === "done") {
            // finished
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Ошибка ревью", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setReviewing(false);
      setPending(new Set());
    }
  }

  async function runConsolidation() {
    const valid = reviews.filter((r) => !r.error && (r.edits.length || r.free_review));
    if (!valid.length) {
      toast({ title: "Нет валидных рецензий", variant: "destructive" });
      return;
    }
    setConsolidating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "consolidate",
          text,
          reviews: valid.map(({ model, free_review, edits }) => ({ model, free_review, edits })),
          arbiter,
        }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || `HTTP ${resp.status}`);
      const cons = j.consolidated as { summary: string; edits: EditItem[] };
      setConsolidated(cons);
      // По умолчанию принимаем consensus и majority high/medium
      const auto = new Set<number>();
      cons.edits.forEach((e, i) => {
        if ((e.status === "consensus" || e.status === "majority") && e.severity !== "low") auto.add(i);
      });
      setAccepted(auto);
    } catch (e: any) {
      toast({ title: "Ошибка консолидации", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setConsolidating(false);
    }
  }

  const [rewriting, setRewriting] = useState(false);

  async function rewriteWithVoice() {
    if (!consolidated) return;
    const editsAccepted = consolidated.edits.filter((_, i) => accepted.has(i));
    if (!editsAccepted.length) {
      toast({ title: "Не выбраны правки", variant: "destructive" });
      return;
    }
    setRewriting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "rewrite", text, edits: editsAccepted, rewriter }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || `HTTP ${resp.status}`);
      setFinalText(String(j.rewritten || ""));
      toast({ title: "Статья переписана", description: `Применено правок: ${j.applied}. Голос автора сохранён.` });
    } catch (e: any) {
      toast({ title: "Ошибка переписывания", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setRewriting(false);
    }
  }

  const acceptedCount = accepted.size;

  const successReviews = useMemo(() => reviews.filter((r) => !r.error), [reviews]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Назад в админку
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-500" /> Оркестратор статей
        </h1>
        <p className="text-muted-foreground mt-1">
          Параллельное ревью статьи несколькими ИИ-моделями, голосование и арбитраж, применение правок.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUT */}
        <Card>
          <CardHeader>
            <CardTitle>1. Статья</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Заголовок (опционально)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Вставьте или надиктуйте текст статьи…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[360px] font-serif text-[15px] leading-relaxed"
            />
            <div className="text-xs text-muted-foreground">
              Символов: {text.length.toLocaleString("ru-RU")} · Слов: {text.trim() ? text.trim().split(/\s+/).length.toLocaleString("ru-RU") : 0}
            </div>
          </CardContent>
        </Card>

        {/* PANEL */}
        <Card>
          <CardHeader>
            <CardTitle>2. Панель моделей</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PANEL.map((m) => (
                <label key={m.id} className="flex items-start gap-2 p-2 rounded-md border border-border hover:bg-accent/40 cursor-pointer">
                  <Checkbox checked={models.includes(m.id)} onCheckedChange={() => toggleModel(m.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.label}</div>
                    <div className="text-[11px] font-mono text-muted-foreground truncate">{m.id}</div>
                  </div>
                  {pending.has(m.id) && <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />}
                </label>
              ))}
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Арбитр (для консолидации мнений)</div>
              <select
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={arbiter}
                onChange={(e) => setArbiter(e.target.value)}
              >
                {ARBITERS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Переписчик (создаёт финальную статью с вашим голосом)</div>
              <select
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={rewriter}
                onChange={(e) => setRewriter(e.target.value)}
              >
                {REWRITERS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <Button
              onClick={runReview}
              disabled={reviewing || !text.trim() || !models.length}
              className="w-full"
              size="lg"
            >
              {reviewing
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Идёт ревью ({models.length - pending.size}/{models.length})…</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Запустить ревью</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PER-MODEL REVIEWS */}
      {reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>3. Мнения моделей ({reviews.length})</CardTitle>
            <Button
              onClick={runConsolidation}
              disabled={consolidating || successReviews.length < 1}
              variant="default"
            >
              {consolidating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Арбитр работает…</>
                : <><GitMerge className="w-4 h-4 mr-2" /> Сформировать сводку</>}
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={reviews[0]?.model}>
              <TabsList className="flex flex-wrap h-auto">
                {reviews.map((r) => (
                  <TabsTrigger key={r.model} value={r.model} className="text-xs">
                    {r.model.split("/")[1] || r.model}
                    {r.error
                      ? <Badge variant="destructive" className="ml-1 text-[10px]">ошибка</Badge>
                      : <Badge variant="secondary" className="ml-1 text-[10px]">{r.edits.length}</Badge>}
                  </TabsTrigger>
                ))}
              </TabsList>
              {reviews.map((r) => (
                <TabsContent key={r.model} value={r.model} className="space-y-3 mt-4">
                  {r.error ? (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                      {r.error}
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-md bg-muted/50 border border-border text-sm whitespace-pre-wrap">
                        {r.free_review || <span className="text-muted-foreground">(нет общего ревью)</span>}
                      </div>
                      {r.edits.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Правок не предложено.</div>
                      ) : (
                        <div className="space-y-2">
                          {r.edits.map((e, i) => (
                            <div key={i} className="p-3 rounded-md border border-border text-sm space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">{e.category}</Badge>
                                {e.severity && <Badge className={SEVERITY_COLOR[e.severity] || ""} variant="outline">{e.severity}</Badge>}
                              </div>
                              {e.original && <div className="text-xs italic text-muted-foreground">«{e.original}»</div>}
                              <div><span className="text-xs font-semibold">→ </span>{e.suggested}</div>
                              <div className="text-xs text-muted-foreground">{e.rationale}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* CONSOLIDATED */}
      {consolidated && (
        <Card className="mt-6 border-amber-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-amber-500" /> 4. Консолидированное мнение арбитра
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/30 text-sm whitespace-pre-wrap">
              {consolidated.summary}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Правки ({consolidated.edits.length}). Принято: {acceptedCount}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAccepted(new Set(consolidated.edits.map((_, i) => i)))}>
                    Все
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAccepted(new Set())}>
                    Снять все
                  </Button>
                </div>
              </div>
              {consolidated.edits.map((e, i) => (
                <label key={i} className="flex gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-accent/40">
                  <Checkbox
                    checked={accepted.has(i)}
                    onCheckedChange={() => {
                      setAccepted((cur) => {
                        const n = new Set(cur);
                        n.has(i) ? n.delete(i) : n.add(i);
                        return n;
                      });
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">{e.category}</Badge>
                      {e.severity && <Badge variant="outline" className={SEVERITY_COLOR[e.severity] || ""}>{e.severity}</Badge>}
                      {e.status && <Badge variant="secondary">{STATUS_LABEL[e.status] || e.status}</Badge>}
                      {e.supporting_models?.length ? (
                        <span className="text-[10px] text-muted-foreground">
                          {e.supporting_models.map((m) => m.split("/")[1] || m).join(", ")}
                        </span>
                      ) : null}
                    </div>
                    {e.original && <div className="text-xs italic text-muted-foreground">«{e.original}»</div>}
                    <div className="text-sm"><span className="font-semibold">→ </span>{e.suggested}</div>
                    <div className="text-xs text-muted-foreground">{e.rationale}</div>
                  </div>
                </label>
              ))}
            </div>

            <Button onClick={rewriteWithVoice} disabled={!acceptedCount || rewriting} className="w-full" size="lg">
              {rewriting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Переписываю с сохранением вашего голоса…</>
                : <><FileCheck2 className="w-4 h-4 mr-2" /> Переписать статью с моим голосом ({acceptedCount} правок)</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* FINAL */}
      {finalText && (
        <Card className="mt-6 border-emerald-500/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-500" /> 5. Итоговая статья
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(finalText);
                  toast({ title: "Скопировано в буфер" });
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Копировать
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigate("/admin/article-import", {
                    state: { title, text: finalText, source: "orchestrator" },
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" /> Разместить
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ArticleDiffEditor original={text} value={finalText} onChange={setFinalText} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
