// AI Article Orchestrator
// Админ-инструмент: статья → параллельное ревью N моделей → консолидация арбитром → применение правок.

import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { ArrowLeft, Loader2, Sparkles, GitMerge, FileCheck2, Copy, Send, Mic, Square, RotateCw, Plug, Wand2, Pencil } from "lucide-react";
import { toast as sonnerToast } from "sonner";


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
  ms?: number;
};

type ModelProgress = {
  status: "queued" | "running" | "done" | "error";
  startedAt?: number;
  ms?: number;
  edits?: number;
  error?: string;
};

const PANEL = [
  { id: "openai/gpt-5", label: "GPT-5", default: true },
  { id: "anthropic/claude-opus-4-8", label: "Claude Opus 4.8", default: true },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", default: true },
  { id: "z-ai/glm-5", label: "GLM-5", default: true },
  { id: "moonshotai/kimi-k2", label: "Kimi K2", default: true },
  { id: "perplexity/sonar-pro", label: "Perplexity Sonar Pro (фактчек)", default: true },
  { id: "venice/venice-uncensored-1-2", label: "Venice (без цензуры)", default: true },
  { id: "x-ai/grok-4.3", label: "Grok 4", default: true },
  { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4-Pro", default: true },
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
  const location = useLocation();
  const incoming = (location.state || {}) as { text?: string; title?: string };

  const [title, setTitle] = useState(incoming.title ?? "");
  const [text, setText] = useState(incoming.text ?? "");
  const [models, setModels] = useState<string[]>(PANEL.filter((m) => m.default).map((m) => m.id));
  const [arbiter, setArbiter] = useState(ARBITERS[0].id);
  const [rewriter, setRewriter] = useState(REWRITERS[0].id);

  // --- Диктовка ---
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startDictation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 2048) {
          toast({ title: "Запись пустая", description: "Попробуйте ещё раз", variant: "destructive" });
          return;
        }
        setTranscribing(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const fd = new FormData();
          fd.append("file", blob, `dict.${mime === "audio/webm" ? "webm" : "mp4"}`);
          const resp = await fetch(`https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/ai-transcribe`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
            body: fd,
          });
          const json = await resp.json();
          if (!resp.ok) throw new Error(json?.error || `HTTP ${resp.status}`);
          const t = String(json.text || "").trim();
          if (t) setText((prev) => (prev ? prev + (prev.endsWith("\n") ? "" : "\n") : "") + t);
        } catch (e: any) {
          toast({ title: "Ошибка диктовки", description: e.message, variant: "destructive" });
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e: any) {
      toast({ title: "Нет доступа к микрофону", description: e.message, variant: "destructive" });
    }
  };
  const stopDictation = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const [reviews, setReviews] = useState<ModelReview[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, ModelProgress>>({});
  const [tick, setTick] = useState(0);

  // живой таймер для running моделей
  useEffect(() => {
    if (!reviewing) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [reviewing]);

  const [consolidated, setConsolidated] = useState<{ summary: string; edits: EditItem[] } | null>(null);
  const [consolidating, setConsolidating] = useState(false);

  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  // Прямой приём правок из мнения каждой модели (ключ: `${model}::${index}`)
  const [directAccepted, setDirectAccepted] = useState<Map<string, EditItem>>(new Map());
  // Inline-редактирование текста правок: ключ `${model}::${index}` или `cons::${i}`
  const [editedSuggested, setEditedSuggested] = useState<Map<string, string>>(new Map());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [finalText, setFinalText] = useState("");

  const getSuggested = (key: string, fallback: string) =>
    editedSuggested.has(key) ? editedSuggested.get(key)! : fallback;

  const setSuggested = (key: string, val: string) => {
    setEditedSuggested((cur) => {
      const n = new Map(cur);
      n.set(key, val);
      return n;
    });
  };

  const toggleDirect = (model: string, i: number, edit: EditItem) => {
    const key = `${model}::${i}`;
    setDirectAccepted((cur) => {
      const n = new Map(cur);
      if (n.has(key)) {
        n.delete(key);
      } else {
        n.set(key, { ...edit, suggested: getSuggested(key, edit.suggested) });
      }
      return n;
    });
  };

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
    setProgress(Object.fromEntries(models.map((m) => [m, { status: "queued" as const }])));

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
          if (evType === "model_start") {
            try {
              const r = JSON.parse(data) as { model: string; started_at: number };
              setProgress((cur) => ({ ...cur, [r.model]: { status: "running", startedAt: r.started_at } }));
            } catch { /* ignore */ }
          } else if (evType === "model_done") {
            try {
              const r = JSON.parse(data) as ModelReview;
              setReviews((cur) => [...cur, r]);
              setPending((cur) => { const n = new Set(cur); n.delete(r.model); return n; });
              setProgress((cur) => ({
                ...cur,
                [r.model]: {
                  status: r.error ? "error" : "done",
                  startedAt: cur[r.model]?.startedAt,
                  ms: r.ms,
                  edits: r.edits?.length ?? 0,
                  error: r.error,
                },
              }));
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

  async function rewriteWithVoice(editsArg?: EditItem[]) {
    const editsAccepted = editsArg ?? (consolidated
      ? consolidated.edits
          .map((e, i) => ({ ...e, suggested: getSuggested(`cons::${i}`, e.suggested), _i: i }))
          .filter((e) => accepted.has((e as any)._i))
          .map(({ _i, ...rest }: any) => rest)
      : []);
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

  // ===== Тест связи + форматирование Claude =====
  const [testingConn, setTestingConn] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [formatProgress, setFormatProgress] = useState<{ index: number; total: number } | null>(null);

  async function testClaudeConnection() {
    setTestingConn(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/test-claude-connection`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(j?.error || `HTTP ${resp.status}`);
      sonnerToast.success("Связь с Claude в порядке", { description: j?.model || "ok" });
    } catch (e: any) {
      sonnerToast.error("Нет связи с Claude", { description: e?.message || String(e) });
    } finally {
      setTestingConn(false);
    }
  }

  async function formatFinal() {
    if (!finalText.trim()) return;
    setFormatting(true);
    setFormatProgress(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/format-disease-article`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalText }),
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${t.slice(0, 200)}`);
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "progress" && evt.stage === "chunk") {
              setFormatProgress({ index: evt.index, total: evt.total });
            } else if (evt.type === "result") {
              result = evt.formatted || "";
            } else if (evt.type === "error") {
              throw new Error(evt.error || "format error");
            }
          } catch { /* ignore */ }
        }
      }
      if (result) {
        setFinalText(result);
        sonnerToast.success("Форматирование завершено", { description: "Текст обновлён в итоговой статье" });
      } else {
        throw new Error("Пустой ответ форматера");
      }
    } catch (e: any) {
      sonnerToast.error("Ошибка форматирования", { description: e?.message || String(e) });
    } finally {
      setFormatting(false);
      setFormatProgress(null);
    }
  }

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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs text-muted-foreground">
                Символов: {text.length.toLocaleString("ru-RU")} · Слов: {text.trim() ? text.trim().split(/\s+/).length.toLocaleString("ru-RU") : 0}
              </div>
              {!recording ? (
                <Button size="sm" variant="outline" onClick={startDictation} disabled={transcribing}>
                  {transcribing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Mic className="w-4 h-4 mr-1" />}
                  {transcribing ? "Распознаю…" : "Диктовка"}
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={stopDictation}>
                  <Square className="w-4 h-4 mr-1" /> Остановить
                </Button>
              )}
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

      {/* PER-MODEL PROGRESS */}
      {Object.keys(progress).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Прогресс ревью ({Object.values(progress).filter(p => p.status === "done" || p.status === "error").length}/{Object.keys(progress).length})</span>
              {reviewing && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {Object.entries(progress).map(([modelId, p]) => {
                const label = PANEL.find((m) => m.id === modelId)?.label || modelId;
                const now = Date.now();
                const elapsedMs = p.status === "running" && p.startedAt
                  ? now - p.startedAt
                  : p.ms ?? 0;
                const secs = (elapsedMs / 1000).toFixed(1);
                const statusBadge = {
                  queued: <Badge variant="outline" className="text-muted-foreground">В очереди</Badge>,
                  running: <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin inline" />Анализирует</Badge>,
                  done: <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">Готово</Badge>,
                  error: <Badge variant="destructive">Ошибка</Badge>,
                }[p.status];
                return (
                  <div key={modelId} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-accent/30 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{label}</div>
                      {p.error && <div className="text-xs text-destructive truncate" title={p.error}>{p.error}</div>}
                    </div>
                    {(p.status === "done" || p.status === "running") && (
                      <div className="text-xs font-mono text-muted-foreground tabular-nums w-14 text-right">
                        {secs}s
                      </div>
                    )}
                    {p.status === "done" && typeof p.edits === "number" && (
                      <div className="text-xs text-muted-foreground w-20 text-right">
                        правок: <span className="font-semibold text-foreground">{p.edits}</span>
                      </div>
                    )}
                    <div className="w-32 flex justify-end">{statusBadge}</div>
                  </div>
                );
              })}
            </div>
            {reviewing && (
              <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{
                    width: `${(Object.values(progress).filter(p => p.status === "done" || p.status === "error").length / Object.keys(progress).length) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PER-MODEL REVIEWS */}
      {reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle>3. Мнения моделей ({reviews.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => {
                  const fresh = Array.from(directAccepted.entries()).map(([key, e]) => ({
                    ...e,
                    suggested: getSuggested(key, e.suggested),
                  }));
                  rewriteWithVoice(fresh);
                }}
                disabled={!directAccepted.size || rewriting}
                variant="default"
              >
                {rewriting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Переписываю…</>
                  : <><FileCheck2 className="w-4 h-4 mr-2" /> Переписать с принятыми ({directAccepted.size})</>}
              </Button>
              <Button
                onClick={runReview}
                disabled={reviewing}
                variant="outline"
                title="Запустить ревью ещё раз с теми же моделями"
              >
                {reviewing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Идёт…</>
                  : <><RotateCw className="w-4 h-4 mr-2" /> Повторное ревью</>}
              </Button>
              <Button
                onClick={runConsolidation}
                disabled={consolidating || successReviews.length < 1}
                variant="outline"
              >
                {consolidating
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Арбитр работает…</>
                  : <><GitMerge className="w-4 h-4 mr-2" /> Сформировать сводку</>}
              </Button>
            </div>
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
                          {r.edits.map((e, i) => {
                            const key = `${r.model}::${i}`;
                            const isAcc = directAccepted.has(key);
                            return (
                              <div
                                key={i}
                                className={`p-3 rounded-md border text-sm space-y-2 transition-colors ${
                                  isAcc ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline">{e.category}</Badge>
                                  {e.severity && <Badge className={SEVERITY_COLOR[e.severity] || ""} variant="outline">{e.severity}</Badge>}
                                  <div className="ml-auto flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingKey(editingKey === key ? null : key)}
                                      title="Править текст правки вручную"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={isAcc ? "default" : "outline"}
                                      onClick={() => toggleDirect(r.model, i, e)}
                                      className={isAcc ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                                    >
                                      {isAcc ? "✓ Принято" : "Принять"}
                                    </Button>
                                  </div>
                                </div>
                                {e.original && <div className="text-xs italic text-muted-foreground">«{e.original}»</div>}
                                {editingKey === key ? (
                                  <Textarea
                                    value={getSuggested(key, e.suggested)}
                                    onChange={(ev) => setSuggested(key, ev.target.value)}
                                    onBlur={() => setEditingKey(null)}
                                    autoFocus
                                    className="min-h-[80px] text-sm font-serif leading-relaxed border-amber-500/50 focus-visible:ring-amber-500/40"
                                  />
                                ) : (
                                  <div
                                    className="cursor-text rounded px-1 -mx-1 hover:bg-amber-500/10"
                                    onClick={() => setEditingKey(key)}
                                    title="Нажмите, чтобы править"
                                  >
                                    <span className="text-xs font-semibold">→ </span>
                                    {getSuggested(key, e.suggested)}
                                    {editedSuggested.has(key) && (
                                      <Badge variant="outline" className="ml-2 text-[10px] bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400">
                                        отредактировано
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {e.rationale && <div className="text-xs text-muted-foreground">{e.rationale}</div>}
                              </div>
                            );
                          })}
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
              {consolidated.edits.map((e, i) => {
                const isAccepted = accepted.has(i);
                // ищем контекст (абзац) вокруг original в исходном тексте
                let context: { before: string; after: string } | null = null;
                if (e.original && text.includes(e.original)) {
                  const idx = text.indexOf(e.original);
                  const before = text.slice(Math.max(0, idx - 120), idx);
                  const after = text.slice(idx + e.original.length, idx + e.original.length + 120);
                  context = { before, after };
                }
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-md border transition-colors ${isAccepted ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`}
                  >
                    <label className="flex gap-3 cursor-pointer">
                      <Checkbox
                        checked={isAccepted}
                        onCheckedChange={() => {
                          setAccepted((cur) => {
                            const n = new Set(cur);
                            n.has(i) ? n.delete(i) : n.add(i);
                            return n;
                          });
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
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

                        {/* DIFF: до / после */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2 text-xs">
                            <div className="font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                              − До
                            </div>
                            {e.original ? (
                              <div className="font-serif leading-relaxed">
                                {context && (
                                  <span className="text-muted-foreground">…{context.before}</span>
                                )}
                                <span className="bg-red-500/20 line-through decoration-red-500/60 px-0.5 rounded">
                                  {e.original}
                                </span>
                                {context && (
                                  <span className="text-muted-foreground">{context.after}…</span>
                                )}
                              </div>
                            ) : (
                              <div className="italic text-muted-foreground">
                                (глобальная правка — фрагмент в тексте не указан)
                              </div>
                            )}
                          </div>
                          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-xs">
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between gap-1">
                              <span>+ После</span>
                              <button
                                type="button"
                                onClick={(ev) => { ev.preventDefault(); setEditingKey(editingKey === `cons::${i}` ? null : `cons::${i}`); }}
                                className="text-[10px] opacity-70 hover:opacity-100 inline-flex items-center gap-1"
                                title="Править вручную"
                              >
                                <Pencil className="w-3 h-3" /> править
                              </button>
                            </div>
                            {editingKey === `cons::${i}` ? (
                              <Textarea
                                value={getSuggested(`cons::${i}`, e.suggested)}
                                onChange={(ev) => setSuggested(`cons::${i}`, ev.target.value)}
                                onBlur={() => setEditingKey(null)}
                                onClick={(ev) => ev.preventDefault()}
                                autoFocus
                                className="min-h-[90px] text-xs font-serif leading-relaxed bg-background"
                              />
                            ) : (
                              <div
                                className="font-serif leading-relaxed cursor-text"
                                onClick={(ev) => { ev.preventDefault(); setEditingKey(`cons::${i}`); }}
                              >
                                {context && e.original && (
                                  <span className="text-muted-foreground">…{context.before}</span>
                                )}
                                <span className="bg-emerald-500/20 px-0.5 rounded">
                                  {getSuggested(`cons::${i}`, e.suggested)}
                                </span>
                                {context && e.original && (
                                  <span className="text-muted-foreground">{context.after}…</span>
                                )}
                                {editedSuggested.has(`cons::${i}`) && (
                                  <Badge variant="outline" className="ml-2 text-[10px] bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400">
                                    отредактировано
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {e.rationale && (
                          <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                            {e.rationale}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            <Button onClick={() => rewriteWithVoice()} disabled={!acceptedCount || rewriting} className="w-full" size="lg">
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
            <div className="flex gap-2 flex-wrap">
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
                variant="outline"
                onClick={testClaudeConnection}
                disabled={testingConn}
                title="Проверить связь с Claude (формат-функция)"
              >
                {testingConn
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Тест…</>
                  : <><Plug className="w-4 h-4 mr-2" /> Тест связи</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={formatFinal}
                disabled={formatting || !finalText}
                title="Форматирование через Claude (постранично, под сайт)"
              >
                {formatting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Форматирую {formatProgress ? `${formatProgress.index}/${formatProgress.total}` : "…"}</>
                  : <><Wand2 className="w-4 h-4 mr-2" /> Форматировать</>}
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
