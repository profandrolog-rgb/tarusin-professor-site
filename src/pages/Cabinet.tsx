import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Plus, Trash2, Paperclip, X, Bot, User, Loader2, FileText, Image as ImageIcon, Zap, Brain, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const COUNCIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-council`;

type ModelOpt = { id: string; label: string; group: "fast" | "deep" };
const MODELS: ModelOpt[] = [
  // Быстрые — по умолчанию
  { id: "google/gemini-2.5-flash", label: "⚡ Gemini 2.5 Flash (быстрый)", group: "fast" },
  { id: "anthropic/claude-sonnet-4.5", label: "⚡ Claude Sonnet 4.5 (быстрый)", group: "fast" },
  { id: "openai/gpt-5-mini", label: "⚡ GPT-5 mini (быстрый)", group: "fast" },
  { id: "x-ai/grok-4.3", label: "⚡ Grok 4.3 (быстрый)", group: "fast" },
  // Глубокие
  { id: "google/gemini-2.5-pro", label: "🧠 Gemini 2.5 Pro (глубокий)", group: "deep" },
  { id: "anthropic/claude-opus-4.1", label: "🧠 Claude Opus 4.1 (глубокий)", group: "deep" },
  { id: "openai/gpt-5", label: "🧠 GPT-5 (глубокий)", group: "deep" },
];
const DEFAULT_MODEL = "google/gemini-2.5-flash";

type SpeedMode = "fast" | "deep";

type Attachment = {
  name: string;
  type: string; // mime
  dataUrl: string; // data:...;base64,...
};

type CouncilAnswer = { model: string; content: string; error: string | null };

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  model?: string;
  council?: CouncilAnswer[];
};

type Conversation = {
  id: string;
  title: string;
  model: string | null;
  updated_at: string;
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildMultimodalContent = (text: string, atts: Attachment[]) => {
  if (!atts.length) return text;
  const parts: any[] = [];
  if (text.trim()) parts.push({ type: "text", text });
  for (const a of atts) {
    if (a.type.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
    } else if (a.type === "application/pdf") {
      parts.push({ type: "file", file: { filename: a.name, file_data: a.dataUrl } });
    }
  }
  return parts;
};

export default function Cabinet() {
  const { user, loading, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [speed, setSpeed] = useState<SpeedMode>("fast");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [council, setCouncil] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id, title, model, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Не удалось загрузить историю");
      return;
    }
    setConversations(data || []);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("id, role, content, attachments, model")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("Не удалось загрузить сообщения");
        return;
      }
      setMessages(
        (data || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          attachments: m.attachments || [],
          model: m.model,
        })),
      );
      const conv = conversations.find((c) => c.id === activeId);
      if (conv?.model) setModel(conv.model);
    })();
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const newConversation = async () => {
    setActiveId(null);
    setMessages([]);
    setAttachments([]);
    setInput("");
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Удалить диалог?")) return;
    const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    if (activeId === id) setActiveId(null);
    loadConversations();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const out: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: больше 10 МБ`);
        continue;
      }
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        toast.error(`${f.name}: только PDF и изображения`);
        continue;
      }
      const dataUrl = await fileToDataUrl(f);
      out.push({ name: f.name, type: f.type, dataUrl });
    }
    setAttachments((prev) => [...prev, ...out]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!user || streaming) return;
    const text = input.trim();
    if (!text && !attachments.length) return;

    setStreaming(true);
    const userMsg: Msg = { role: "user", content: text, attachments: [...attachments] };

    // Ensure conversation
    let convId = activeId;
    if (!convId) {
      const title = text.slice(0, 60) || "Новый диалог";
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, title, model })
        .select("id, title, model, updated_at")
        .single();
      if (error || !data) {
        toast.error("Не удалось создать диалог");
        setStreaming(false);
        return;
      }
      convId = data.id;
      setActiveId(convId);
      setConversations((prev) => [data as Conversation, ...prev]);
    }

    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);

    // Persist user message
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: text,
      attachments: userMsg.attachments as any,
      model,
    });

    // Build request messages (full history)
    const historyForApi = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: buildMultimodalContent(m.content, m.attachments || []),
    }));

    let assistantSoFar = "";
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          model,
          messages: historyForApi,
          reasoning_effort: speed === "fast" ? "low" : "high",
        }),
      });

      if (!resp.ok || !resp.body) {
        const errTxt = await resp.text().catch(() => "");
        throw new Error(errTxt || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: assistantSoFar, model };
                return next;
              });
            }
          } catch { /* partial */ }
        }
      }

      // Persist assistant message
      if (assistantSoFar) {
        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: assistantSoFar,
          model,
        });
        await supabase.from("ai_conversations").update({ model, updated_at: new Date().toISOString() }).eq("id", convId);
        loadConversations();
      }
    } catch (e: any) {
      toast.error("Ошибка запроса к модели: " + (e?.message || ""));
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "⚠️ Ошибка получения ответа." };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Доступ ограничен</h1>
          <p className="text-muted-foreground text-sm">Этот раздел доступен только владельцу сайта.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="md:w-72 border-r border-border md:h-screen flex flex-col bg-muted/30">
        <div className="p-3 border-b border-border">
          <Button onClick={newConversation} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />Новый диалог
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">История пуста</p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-md px-2 py-2 cursor-pointer hover:bg-accent ${
                  activeId === c.id ? "bg-accent" : ""
                }`}
                onClick={() => setActiveId(c.id)}
              >
                <span className="flex-1 text-sm truncate">{c.title}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                  aria-label="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col md:h-screen">
        <header className="border-b border-border px-4 py-3 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold flex-1 min-w-0">Кабинет · ИИ-чат</h1>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setSpeed("fast")}
              disabled={streaming}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${
                speed === "fast" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
              }`}
              title="Минимальное обдумывание — быстрый ответ"
            >
              <Zap className="w-3.5 h-3.5" />Быстро
            </button>
            <button
              type="button"
              onClick={() => setSpeed("deep")}
              disabled={streaming}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors border-l border-border ${
                speed === "deep" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
              }`}
              title="Расширенное обдумывание — медленнее, но глубже"
            >
              <Brain className="w-3.5 h-3.5" />Вдумчиво
            </button>
          </div>
          <Select value={model} onValueChange={setModel} disabled={streaming}>
            <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm pt-16">
              Задайте вопрос. Можно прикрепить изображения или PDF.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === "user" ? "bg-accent/15" : "bg-primary/15"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {m.attachments.map((a, j) => (
                      <div key={j} className="text-xs flex items-center gap-1 bg-background/40 rounded px-2 py-1">
                        {a.type.startsWith("image/")
                          ? <img src={a.dataUrl} alt={a.name} className="w-16 h-16 object-cover rounded" />
                          : <><FileText className="w-3 h-3" />{a.name}</>}
                      </div>
                    ))}
                  </div>
                )}
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                )}
                {m.model && m.role === "assistant" && (
                  <div className="text-[10px] text-muted-foreground mt-1 opacity-60">{m.model}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3 space-y-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                  {a.type.startsWith("image/") ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  <span className="max-w-[160px] truncate">{a.name}</span>
                  <button
                    onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                    className="hover:text-destructive"
                    aria-label="Убрать"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={streaming}
              aria-label="Прикрепить файл"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Сообщение (Enter — отправить, Shift+Enter — перенос)"
              className="flex-1 min-h-[44px] max-h-40 resize-none"
              disabled={streaming}
            />
            <Button onClick={sendMessage} disabled={streaming || (!input.trim() && !attachments.length)} size="icon">
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
