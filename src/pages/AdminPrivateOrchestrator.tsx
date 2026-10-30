import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Loader2, Plus, Send, Trash2, Flame, Settings2, ShieldCheck, Users, Bot, Square } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChatMarkdown } from "@/components/cabinet/ChatMarkdown";
import { getOpenRouterModelTags } from "@/config/aiModels";
import { useOpenRouterModels } from "@/hooks/useOpenRouterModels";
import {
  PRESET_MODELS, DEFAULT_ENABLED, isValidModelId, GENERAL_SYSTEM_PROMPT, GENERAL_SUMMARIZER_PROMPT,
  CENSOR_LABELS, type CensorLevel,
} from "@/lib/privateOrchestrator/models";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const COUNCIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-council`;
const IDLE_MS = 15 * 60 * 1000;

type Conv = { id: string; title: string; mode: string; updated_at: string };
type Msg = { id?: string; role: "user" | "assistant"; content: string; meta?: any };

const rpc = (name: string, args?: Record<string, unknown>) => (supabase.rpc as any)(name, args);
const labelOf = (id: string) => PRESET_MODELS.find((m) => m.id === id)?.label ?? id;

// ───────────────────────── Шлюз (2-й уровень) ─────────────────────────
function Gate({ mode, onUnlocked }: { mode: "setup" | "locked"; onUnlocked: (models: string[]) => void }) {
  const [pin, setPin] = useState("");
  const [phrase, setPhrase] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (mode === "setup" && pin !== pin2) { setErr("PIN-коды не совпадают"); return; }
    setBusy(true);
    try {
      if (mode === "setup") {
        const { error } = await rpc("private_vault_setup", { _pin: pin, _phrase: phrase });
        if (error) throw error;
        onUnlocked(DEFAULT_ENABLED);
        await rpc("private_vault_set_models", { _models: DEFAULT_ENABLED });
        return;
      }
      const { data, error } = await rpc("private_vault_verify", { _pin: pin, _phrase: phrase });
      if (error) throw error;
      if (data?.ok) {
        const m = Array.isArray(data.models) && data.models.length ? data.models : DEFAULT_ENABLED;
        onUnlocked(m);
      } else if (data?.error === "locked") {
        setErr(`Слишком много попыток. Доступ заблокирован до ${new Date(data.locked_until).toLocaleTimeString("ru-RU")}`);
      } else if (data?.error === "wrong") {
        setErr(`Неверный PIN или фраза. Осталось попыток: ${data.left}`);
      } else setErr("Доступ запрещён");
    } catch (e: any) {
      setErr(e?.message || "Ошибка");
    } finally {
      setBusy(false);
      setPin(""); setPin2(""); setPhrase("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Личный советник</CardTitle>
          <CardDescription>
            {mode === "setup"
              ? "Первый вход: задайте PIN (4–12 цифр) и секретную фразу (от 8 символов). Восстановить их нельзя."
              : "Второй уровень защиты: введите PIN и секретную фразу. После 5 ошибок — блокировка на 15 минут."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }} autoComplete="off">
            <Input type="password" inputMode="numeric" placeholder="PIN-код" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} autoFocus />
            {mode === "setup" && (
              <Input type="password" inputMode="numeric" placeholder="Повторите PIN" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} />
            )}
            <Input type="password" placeholder="Секретная фраза" value={phrase} onChange={(e) => setPhrase(e.target.value)} />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy || pin.length < 4 || phrase.length < 8}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {mode === "setup" ? "Сохранить и войти" : "Открыть"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ───────────────────────── Выбор моделей ─────────────────────────
function ModelsDialog({ open, onOpenChange, enabled, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; enabled: string[]; onSave: (ids: string[]) => void;
}) {
  const { list, loading, error } = useOpenRouterModels();
  const [sel, setSel] = useState<string[]>(enabled);
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState("");
  useEffect(() => { if (open) setSel(enabled); }, [open, enabled]);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const liveIds = useMemo(() => new Set(list.map((m) => m.id)), [list]);
  const found = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return list.filter((m) => m.id.toLowerCase().includes(t) || (m.name || "").toLowerCase().includes(t)).slice(0, 40);
  }, [q, list]);

  const censorDot: Record<CensorLevel, string> = { none: "bg-censor-none", mid: "bg-censor-mid", full: "bg-censor-full" };
  const Row = ({ id, label, note }: { id: string; label: string; note?: string }) => {
    const p = PRESET_MODELS.find((m) => m.id === id);
    return (
      <label className="flex items-center gap-2 py-1 text-sm cursor-pointer">
        <Checkbox checked={sel.includes(id)} onCheckedChange={() => toggle(id)} />
        {p && <span className={`h-3 w-3 rounded-full shrink-0 ${censorDot[p.censor]}`} title={CENSOR_LABELS[p.censor]} />}
        <span className="flex-1">{label} <span className="text-xs text-muted-foreground">{id}</span></span>
        {p && <Badge variant="secondary" className="text-[10px] tabular-nums" title="Сила модели (10 — самая сильная)">{p.power}/10</Badge>}
        {note && <Badge variant="outline" className="text-[10px]">{note}</Badge>}
      </label>
    );
  };
  const presetNote = (id: string) => (!loading && !id.startsWith("venice/") && !liveIds.has(id) ? "нет в каталоге" : undefined);
  const uncensoredIds = PRESET_MODELS.filter((m) => m.censor === "none").map((m) => m.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Подключённые модели</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-censor-none" />без цензуры</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-censor-mid" />умеренная цензура</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-censor-full" />обычная цензура</span>
            <span>· балл — сила модели (10 — самая сильная, 1 — слабая)</span>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Флагманы</h4>
            {PRESET_MODELS.filter((m) => m.group === "flagship").map((m) => (
              <Row key={m.id} id={m.id} label={m.label} note={presetNote(m.id)} />
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm">Без цензуры / Instruct</h4>
              <Button size="sm" variant="outline" onClick={() => setSel((s) => Array.from(new Set([...s, ...uncensoredIds])))}>Отметить все без цензуры</Button>
            </div>
            {PRESET_MODELS.filter((m) => m.group === "uncensored").map((m) => (
              <Row key={m.id} id={m.id} label={m.label} note={presetNote(m.id)} />
            ))}
          </div>
          {error && <p className="text-sm text-destructive">Не удалось проверить каталог OpenRouter: {error}</p>}
          {["Instruct", "Abliterated", "Uncensored"].map((tag) => {
            const models = list.filter((m) => getOpenRouterModelTags(m).includes(tag));
            return (
              <details key={tag}>
                <summary className="cursor-pointer font-semibold text-sm">OpenRouter · {tag} ({models.length})</summary>
                {models.map((m) => <Row key={m.id} id={m.id} label={m.name || m.id} note={tag} />)}
                {!loading && !error && !models.length && <p className="text-sm text-muted-foreground">В текущем каталоге не найдены</p>}
              </details>
            );
          })}
          <div>
            <h4 className="font-semibold text-sm mb-1">Поиск по каталогу OpenRouter {loading && <Loader2 className="inline h-3 w-3 animate-spin" />}</h4>
            <Input placeholder="например: abliterated, hermes, llama, instruct…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="mt-1">{found.map((m) => <Row key={m.id} id={m.id} label={m.name || m.id} note={getOpenRouterModelTags(m).join(" · ") || undefined} />)}</div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Добавить по ID вручную</h4>
            <div className="flex gap-2">
              <Input placeholder="provider/model-name" value={custom} onChange={(e) => setCustom(e.target.value)} />
              <Button variant="outline" onClick={() => {
                const id = custom.trim();
                if (!isValidModelId(id)) { toast.error("Формат: provider/model"); return; }
                if (!sel.includes(id)) setSel((s) => [...s, id]);
                setCustom("");
              }}>Добавить</Button>
            </div>
          </div>
          {sel.filter((id) => !PRESET_MODELS.some((m) => m.id === id)).length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Добавленные вами</h4>
              {sel.filter((id) => !PRESET_MODELS.some((m) => m.id === id)).map((id) => <Row key={id} id={id} label={id} />)}
            </div>
          )}
          <Button className="w-full" disabled={!sel.length} onClick={() => onSave(sel)}>Сохранить ({sel.length})</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Рабочая область ─────────────────────────
function Workspace({ userId, models, setModels, onLock }: {
  userId: string; models: string[]; setModels: (m: string[]) => void; onLock: () => void;
}) {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"single" | "council">("single");
  const [model, setModel] = useState(models[0]);
  const [panel, setPanel] = useState<string[]>(models.slice(0, 4));
  const [summarizer, setSummarizer] = useState(models[0]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [modelsOpen, setModelsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!models.includes(model)) setModel(models[0]);
    if (!models.includes(summarizer)) setSummarizer(models[0]);
    setPanel((p) => p.filter((x) => models.includes(x)));
  }, [models]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConvs = useCallback(async () => {
    const { data } = await (supabase.from as any)("private_conversations").select("id,title,mode,updated_at").order("updated_at", { ascending: false });
    setConvs(data ?? []);
  }, []);
  useEffect(() => { loadConvs(); }, [loadConvs]);

  const openConv = async (id: string) => {
    setActiveId(id);
    const { data } = await (supabase.from as any)("private_messages").select("id,role,content,meta").eq("conversation_id", id).order("created_at");
    setMsgs(data ?? []);
  };
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const deleteConv = async (id: string) => {
    if (!confirm("Удалить беседу?")) return;
    await (supabase.from as any)("private_conversations").delete().eq("id", id);
    if (activeId === id) { setActiveId(null); setMsgs([]); }
    loadConvs();
  };

  const wipeAll = async () => {
    if (!confirm("Безвозвратно уничтожить ВСЕ беседы?")) return;
    if (!confirm("Подтвердите ещё раз: восстановить будет невозможно.")) return;
    const { data, error } = await rpc("private_vault_wipe");
    if (error) { toast.error(error.message); return; }
    toast.success(`Уничтожено бесед: ${data}`);
    setActiveId(null); setMsgs([]); setConvs([]);
  };

  const saveModels = async (ids: string[]) => {
    const { error } = await rpc("private_vault_set_models", { _models: ids });
    if (error) { toast.error(error.message); return; }
    setModels(ids); setModelsOpen(false); toast.success("Список моделей сохранён");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (mode === "council" && panel.length < 2) { toast.error("Для консилиума выберите минимум 2 модели"); return; }
    setBusy(true); setInput("");

    let convId = activeId;
    if (!convId) {
      const { data, error } = await (supabase.from as any)("private_conversations")
        .insert({ user_id: userId, title: text.slice(0, 80), mode }).select("id").single();
      if (error) { toast.error(error.message); setBusy(false); return; }
      convId = data.id; setActiveId(convId);
    }
    const history: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    await (supabase.from as any)("private_messages").insert({ conversation_id: convId, user_id: userId, role: "user", content: text });

    let answer = "";
    let councilAnswers: any[] | undefined;
    let usedModel: string | null = null;
    const meta: any = mode === "council" ? { mode, panel, summarizer } : { mode, model };
    try {
      const { data: sess } = await supabase.auth.getSession();
      const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));
      const payload = mode === "council"
        ? { messages: apiMessages, models: panel, summarizer, system: GENERAL_SYSTEM_PROMPT, system_summarizer: GENERAL_SUMMARIZER_PROMPT }
        : { model, messages: apiMessages, system: GENERAL_SYSTEM_PROMPT, reasoning_effort: "high" };
      const ac = new AbortController(); abortRef.current = ac;
      setStatus(mode === "council" ? `Опрашиваю ${panel.length} моделей…` : "Жду ответ модели…");
      const resp = await fetch(mode === "council" ? COUNCIL_URL : CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
        body: JSON.stringify(payload), signal: ac.signal,
      });
      if (!resp.ok || !resp.body) throw new Error((await resp.text().catch(() => "")) || `HTTP ${resp.status}`);
      usedModel = resp.headers.get("x-used-model");
      const reader = resp.body.getReader(); const dec = new TextDecoder();
      let buf = ""; let ev: string | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith("event: ")) { ev = line.slice(7).trim(); continue; }
          if (!line.startsWith("data: ")) { if (!line) ev = null; continue; }
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          let p: any; try { p = JSON.parse(raw); } catch { continue; }
          if (ev === "answers") { councilAnswers = p; setStatus("Синтезирую итоговый ответ…"); continue; }
          if (ev === "progress") { if (p.stage === "fanout") setStatus(`Ответили ${p.done} из ${p.total}…`); continue; }
          if (ev === "error") throw new Error(p?.error || p?.message || "Ошибка модели");
          if (ev) continue;
          const d = p?.delta ?? p?.choices?.[0]?.delta?.content;
          if (typeof d === "string" && d) {
            answer += d;
            setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: answer }; return c; });
          }
        }
      }
    } catch (e: any) {
      const msg = e?.name === "AbortError" ? "⏹ Остановлено" : `⚠️ Ошибка: ${String(e?.message || e).slice(0, 400)}`;
      answer = answer ? `${answer}\n\n${msg}` : msg;
    } finally {
      abortRef.current = null;
      if (usedModel) meta.used_model = usedModel;
      if (councilAnswers) meta.answers = councilAnswers;
      setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: answer, meta }; return c; });
      await (supabase.from as any)("private_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content: answer, meta });
      await (supabase.from as any)("private_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      setBusy(false); setStatus(""); loadConvs();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="md:w-72 border-b md:border-b-0 md:border-r border-border p-3 flex flex-col gap-2 md:h-screen md:sticky md:top-0">
        <div className="flex items-center gap-2">
          <Link to="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <span className="font-semibold flex-1">Личный советник</span>
          <Button variant="ghost" size="icon" title="Заблокировать" onClick={onLock}><Lock className="h-4 w-4" /></Button>
        </div>
        <Button onClick={() => { setActiveId(null); setMsgs([]); }}><Plus className="h-4 w-4" /> Новая беседа</Button>
        <div className="flex-1 overflow-y-auto space-y-1 max-h-60 md:max-h-none">
          {convs.map((c) => (
            <div key={c.id} className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted ${activeId === c.id ? "bg-muted" : ""}`} onClick={() => openConv(c.id)}>
              {c.mode === "council" ? <Users className="h-3.5 w-3.5 shrink-0" /> : <Bot className="h-3.5 w-3.5 shrink-0" />}
              <span className="flex-1 truncate">{c.title}</span>
              <button className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
            </div>
          ))}
          {!convs.length && <p className="text-xs text-muted-foreground px-2">Бесед пока нет</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setModelsOpen(true)}><Settings2 className="h-4 w-4" /> Модели ({models.length})</Button>
        <Button variant="destructive" size="sm" onClick={wipeAll}><Flame className="h-4 w-4" /> Уничтожить все беседы</Button>
      </aside>

      <main className="flex-1 flex flex-col min-h-[70vh] md:h-screen">
        <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Одиночный ИИ</SelectItem>
              <SelectItem value="council">Консилиум</SelectItem>
            </SelectContent>
          </Select>
          {mode === "single" ? (
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>{models.map((m) => <SelectItem key={m} value={m}>{labelOf(m)}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <>
              <div className="flex flex-wrap gap-1">
                {models.map((m) => (
                  <Badge key={m} variant={panel.includes(m) ? "default" : "outline"} className="cursor-pointer"
                    onClick={() => setPanel((p) => p.includes(m) ? p.filter((x) => x !== m) : p.length >= 6 ? p : [...p, m])}>
                    {labelOf(m)}
                  </Badge>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Синтез:</span>
              <Select value={summarizer} onValueChange={setSummarizer}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>{models.map((m) => <SelectItem key={m} value={m}>{labelOf(m)}</SelectItem>)}</SelectContent>
              </Select>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!msgs.length && <p className="text-center text-muted-foreground mt-20">Задайте вопрос на любую тему</p>}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`rounded-xl px-4 py-3 max-w-3xl ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p>
                  : m.content ? <ChatMarkdown>{m.content}</ChatMarkdown>
                  : <span className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{status}</span>}
                {m.meta && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {m.meta.mode === "council" ? `Консилиум: ${(m.meta.panel || []).map(labelOf).join(", ")}` : labelOf(m.meta.used_model || m.meta.model)}
                    {Array.isArray(m.meta.answers) && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">Исходные ответы моделей</summary>
                        {m.meta.answers.map((a: any, j: number) => (
                          <div key={j} className="mt-2 border-t border-border pt-2">
                            <b>{a.model}</b>{a.error ? <span className="text-destructive"> — ошибка: {a.error}</span> : <ChatMarkdown>{a.content}</ChatMarkdown>}
                          </div>
                        ))}
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ваш запрос… (Enter — отправить, Shift+Enter — новая строка)" rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          {busy
            ? <Button variant="outline" onClick={() => abortRef.current?.abort()}><Square className="h-4 w-4" /></Button>
            : <Button onClick={send} disabled={!input.trim()}><Send className="h-4 w-4" /></Button>}
        </div>
      </main>
      <ModelsDialog open={modelsOpen} onOpenChange={setModelsOpen} enabled={models} onSave={saveModels} />
    </div>
  );
}

// ───────────────────────── Страница ─────────────────────────
export default function AdminPrivateOrchestrator() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "denied" | "setup" | "locked" | "open">("checking");
  const [models, setModels] = useState<string[]>(DEFAULT_ENABLED);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) { navigate("/"); return; }
    rpc("private_vault_status").then(({ data, error }: any) => {
      setState(error ? "denied" : (data?.state ?? "denied"));
    });
  }, [user, isAdmin, loading, navigate]);

  const lock = useCallback(() => setState("locked"), []);

  // Автоблокировка: неактивность 15 мин или уход со вкладки
  useEffect(() => {
    if (state !== "open") return;
    let t = setTimeout(lock, IDLE_MS);
    const reset = () => { clearTimeout(t); t = setTimeout(lock, IDLE_MS); };
    const vis = () => { if (document.hidden) { clearTimeout(t); t = setTimeout(lock, 60_000); } else reset(); };
    const evs = ["mousemove", "keydown", "click", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, reset));
    document.addEventListener("visibilitychange", vis);
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, reset)); document.removeEventListener("visibilitychange", vis); };
  }, [state, lock]);

  if (loading || state === "checking") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (state === "denied") return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <div><Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p>Доступ закрыт.</p><Link to="/admin" className="text-primary underline">В админку</Link></div>
    </div>
  );
  if (state === "setup" || state === "locked") return <Gate mode={state} onUnlocked={(m) => { setModels(m); setState("open"); }} />;
  return <Workspace userId={user!.id} models={models} setModels={setModels} onLock={lock} />;
}
