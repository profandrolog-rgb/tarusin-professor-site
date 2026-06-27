import { useState, useRef, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, Search, BookOpen, FlaskConical, Pill, User, FileText, AlertTriangle, CheckCircle2, XCircle, Sparkles, ArrowLeft, History } from "lucide-react";
import { toast } from "sonner";
import { ChatMarkdown } from "@/components/cabinet/ChatMarkdown";

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

type Step =
  | { type: "step"; n: number; status: string }
  | { type: "tool_call"; id: string; name: string; args: any; step?: number }
  | { type: "tool_result"; id: string; name: string; result: any }
  | { type: "awaiting_approval"; tool_call_id: string; name: string; args: any }
  | { type: "final"; content: string }
  | { type: "error"; message: string };

const TOOL_ICONS: Record<string, any> = {
  perplexity_search: Search,
  pubmed_search: FlaskConical,
  repertory_lookup: BookOpen,
  materia_medica: BookOpen,
  treatment_catalog_search: Pill,
  patient_lookup: User,
  patient_protocols: FileText,
  draft_assignment: AlertTriangle,
  draft_prescription: AlertTriangle,
};

const TOOL_LABELS: Record<string, string> = {
  perplexity_search: "Поиск в интернете",
  pubmed_search: "PubMed",
  repertory_lookup: "Реперториум Кента",
  materia_medica: "Materia Medica",
  treatment_catalog_search: "Каталог препаратов",
  patient_lookup: "Поиск пациента",
  patient_protocols: "Протоколы пациента",
  draft_assignment: "Черновик назначения",
  draft_prescription: "Черновик рецепта",
};

export default function CabinetAgent() {
  const { user, isAdmin, loading } = useAuth();
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<Step[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{ tool_call_id: string; name: string; args: any } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("agent_runs").select("id, task, status, created_at, final_answer")
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setHistory(data ?? []));
  }, [user, running]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div>;
  if (!user || !isAdmin) return <Navigate to="/auth" replace />;

  const startRun = async (resumeRunId?: string, approval?: { approved: boolean; reason?: string }) => {
    if (!resumeRunId && !task.trim()) return;
    setRunning(true);
    if (!resumeRunId) { setEvents([]); setRunId(null); }
    setPendingApproval(null);

    const { data: { session } } = await supabase.auth.getSession();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const resp = await fetch(AGENT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resumeRunId ? { runId: resumeRunId, approval } : { task }),
        signal: ac.signal,
      });

      if (!resp.body) throw new Error("Нет потока");
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          const ev = lines.find(l => l.startsWith("event: "))?.slice(7);
          const dt = lines.find(l => l.startsWith("data: "))?.slice(6);
          if (!ev || !dt) continue;
          const data = JSON.parse(dt);
          if (ev === "run_started") setRunId(data.runId);
          else if (ev === "awaiting_approval") setPendingApproval({ tool_call_id: data.tool_call_id, name: data.name, args: data.args });
          else setEvents(prev => [...prev, { type: ev as any, ...data }]);
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!pendingApproval || !runId) return;
    setEvents(prev => [...prev, { type: "tool_result" as any, id: pendingApproval.tool_call_id, name: pendingApproval.name, result: { status: approved ? "approved" : "rejected" } }]);
    setPendingApproval(null);
    await startRun(runId, { approved });
  };

  const stop = () => { abortRef.current?.abort(); setRunning(false); };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/cabinet"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Кабинет</Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Агентный режим
            <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />GPT-5.4</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Автономный ИИ — сам ищет, читает, считает, готовит назначения. Подтверждение врача обязательно перед записью в карту.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          {/* Composer */}
          <Card className="p-4">
            <Textarea
              placeholder="Опишите задачу. Пример: «Разбери случай пациента Иванов И.И.: ХП + ДГПЖ 42 мл, ПСА 6.1. Найди исследования по фитотерапии 2024-2025, подбери средства из каталога, подготовь назначения и рецепты.»"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={running}
              rows={4}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={() => startRun()} disabled={running || !task.trim()} className="flex-1">
                {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Агент работает…</> : <><Send className="w-4 h-4 mr-2" />Запустить агента</>}
              </Button>
              {running && <Button variant="outline" onClick={stop}>Остановить</Button>}
            </div>
          </Card>

          {/* Steps */}
          {events.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Bot className="w-4 h-4" />Ход рассуждений</h2>
              <ScrollArea className="max-h-[500px]" ref={scrollRef as any}>
                <div className="space-y-2">
                  {events.map((ev, i) => <EventCard key={i} ev={ev} />)}
                  {running && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> думаю…
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Approval dialog */}
          {pendingApproval && (
            <Card className="p-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-1 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Требуется ваше подтверждение</h3>
                  <p className="text-sm mb-2">Агент хочет выполнить: <strong>{TOOL_LABELS[pendingApproval.name]}</strong></p>
                  <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-60">{JSON.stringify(pendingApproval.args, null, 2)}</pre>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => handleApproval(true)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="w-4 h-4 mr-1" />Подтвердить
                    </Button>
                    <Button variant="outline" onClick={() => handleApproval(false)}>
                      <XCircle className="w-4 h-4 mr-1" />Отклонить
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* History */}
        <Card className="p-3 h-fit">
          <h3 className="font-semibold mb-2 flex items-center gap-1 text-sm"><History className="w-4 h-4" />История</h3>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-1">
              {history.map((h) => (
                <button
                  key={h.id}
                  className="w-full text-left p-2 rounded hover:bg-muted text-xs"
                  onClick={() => { setTask(h.task); toast.info("Задача загружена — нажмите «Запустить»"); }}
                >
                  <div className="line-clamp-2">{h.task}</div>
                  <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Badge variant={h.status === "completed" ? "default" : h.status === "awaiting_approval" ? "secondary" : "outline"} className="text-[10px] py-0">{h.status}</Badge>
                    {new Date(h.created_at).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </button>
              ))}
              {!history.length && <p className="text-xs text-muted-foreground p-2">Пока пусто</p>}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

function EventCard({ ev }: { ev: Step }) {
  if (ev.type === "step") return null;
  if (ev.type === "final") {
    return (
      <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 p-3 rounded">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />Итоговый ответ
        </div>
        <ChatMarkdown content={ev.content} />
      </div>
    );
  }
  if (ev.type === "error") {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded text-sm text-red-700">
        <XCircle className="w-4 h-4 inline mr-1" />{ev.message}
      </div>
    );
  }
  if (ev.type === "tool_call") {
    const Icon = TOOL_ICONS[ev.name] ?? Search;
    return (
      <Accordion type="single" collapsible>
        <AccordionItem value="x" className="border rounded">
          <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
            <span className="flex items-center gap-2"><Icon className="w-4 h-4" /><span className="font-medium">{TOOL_LABELS[ev.name] ?? ev.name}</span></span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2">
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(ev.args, null, 2)}</pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
  if (ev.type === "tool_result") {
    return (
      <Accordion type="single" collapsible>
        <AccordionItem value="x" className="border rounded border-blue-200">
          <AccordionTrigger className="px-3 py-2 text-xs text-muted-foreground hover:no-underline">
            ✓ Результат: {TOOL_LABELS[ev.name] ?? ev.name}
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2">
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-80">{JSON.stringify(ev.result, null, 2)}</pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
  return null;
}
