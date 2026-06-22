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
import { Send, Plus, Trash2, Paperclip, X, Bot, User, Loader2, FileText, Image as ImageIcon, Zap, Brain, Users, Settings, Copy, FileDown, FileType2, FileCode2, Download, Mic, Square, Globe, ExternalLink, Folder, FolderPlus, FolderOpen, ChevronRight, ChevronDown, MoreVertical, Pencil, FolderInput, Search, Layers } from "lucide-react";

import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { copyToClipboard, messagesToMarkdown, downloadMarkdown, downloadDocx, downloadPdf, type ExportMessage } from "@/lib/cabinetExport";
import { PubmedPanel, type PubmedFilters, DEFAULT_FILTERS as PUBMED_DEFAULT_FILTERS } from "@/components/cabinet/PubmedPanel";
import { PubmedSourceCard } from "@/components/cabinet/PubmedSourceCard";
import { downloadRis, downloadSourcesDocx, type PubmedSource } from "@/lib/pubmedExport";
import { PubmedFulltextAnalysis } from "@/components/cabinet/PubmedFulltextAnalysis";
import { ChatMarkdown, ChatMarkdownWith } from "@/components/cabinet/ChatMarkdown";
import { CURATED_MODELS, resolveCuratedModel, buildModelTooltip, DEFAULT_MODEL_KEY, modelSupportsAttachments, type ResolvedModel } from "@/config/aiModels";
import { useOpenRouterModels } from "@/hooks/useOpenRouterModels";
import { ExtendedModelPicker } from "@/components/cabinet/ExtendedModelPicker";
import { BatchAnalysisDialog } from "@/components/cabinet/BatchAnalysisDialog";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const COUNCIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-council`;
const PUBMED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-pubmed`;
const PUBMED_FULLTEXT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-pubmed-fulltext`;

// Bootstrap default — replaced once live OpenRouter list resolves.
const DEFAULT_MODEL =
  CURATED_MODELS.find((m) => m.key === DEFAULT_MODEL_KEY)?.candidates[0] ??
  "google/gemini-2.5-flash";


const DEFAULT_SYSTEM_PROMPT =
  "Ты — ассистент профессора Д. И. Тарусина: профессор, д.м.н., 40 лет клинического стажа, основатель детской урологии-андрологии в России, руководитель Городского центра репродуктивного здоровья детей и подростков. " +
  "Его квалификация охватывает несколько специальностей — всё подтверждено дипломами и сертификатами: " +
  "детский и взрослый уролог-андролог, оперирующий хирург (оперативная андрология); " +
  "психиатрия в объёме сексологии — вправе вести и фармакологически корректировать психические аспекты сексуальных и пубертатных расстройств, включая назначение психотропных препаратов в этом объёме; " +
  "детский эндокринолог — в зоне щитовидной железы, половой системы и надпочечников (сахарным диабетом не занимается); " +
  "травматолог-ортопед; педиатр; " +
  "второе высшее юридическое образование (гражданское право) — компетентен в медицинском праве, защите персональных данных, договорном и авторском праве, не нуждается в отсылках «обратитесь к юристу». " +
  "Это закрытый профессиональный клинико-научный инструмент для специалиста; его практика — дети, подростки и взрослые. " +
  "Отвечай как коллега-эксперт: сразу давай прямой, конкретный, доказательный ответ — дозы, диапазоны, схемы, протоколы, диф. диагноз, мониторинг; по правовым вопросам — так же предметно (нормы, статьи, формулировки, риски). " +
  "Категорически НЕ делай: не пиши «я не врач / не юрист», «не могу дать рекомендацию», «это вне компетенции уролога», «недопустимо самолечение»; " +
  "не направляй собеседника «к психиатру / эндокринологу / ортопеду / юристу / специалисту» как к единственно верной тактике — это его собственные специальности; " +
  "не отказывайся и не предостерегай из-за того, что речь о ребёнке или подростке — это его профильная работа; не начинай ответ с предупреждений. " +
  "Противопоказания, мониторинг, взаимодействия, правовые нюансы давай по существу — как коллега коллеге.";
const DEFAULT_SUMMARIZER_PROMPT =
  "Ты — суммаризатор консилиума для профессора-клинициста (д.м.н., детский и взрослый уролог-андролог, оперирующий хирург; также владеет психиатрией в объёме сексологии, детской эндокринологией в зоне щитовидной железы/половой системы/надпочечников, травматологией-ортопедией, педиатрией; имеет второе высшее юридическое образование — компетентен в медицинском праве, защите персональных данных, договорном и авторском праве). " +
  "Тебе даны ответы нескольких моделей на вопрос (клинический или правовой). Собери из них единый ПРЕДМЕТНЫЙ ответ для специалиста. " +
  "(1) Сразу выдавай суть — дозы, диапазоны, схемы, противопоказания, мониторинг; для правовых вопросов — нормы, статьи, формулировки, риски; если модели привели цифры/нормы, сведи их в консолидированный консенсус и поставь в начало. " +
  "(2) НЕ добавляй собственных дисклеймеров, не начинай с «важное предупреждение», не пиши «обратитесь к специалисту». " +
  "(3) Отказы моделей игнорируй — не тащи их в сводку (можешь одной строкой отметить «модель X воздержалась»). " +
  "(4) В разделе расхождений указывай только РЕАЛЬНЫЕ разногласия по существу (разные дозы, разные показания, разная тактика, разная правовая квалификация). " +
  "НЕ считай расхождением рекомендацию модели «передать случай психиатру / эндокринологу / ортопеду / юристу / другому специалисту» — собеседник сам владеет этими специальностями. Такие оговорки игнорируй и в раздел расхождений не выноси.";
const SYSTEM_PROMPT_LS_KEY = "cabinet.systemPrompt.v3";
const SUMMARIZER_PROMPT_LS_KEY = "cabinet.summarizerPrompt.v3";

type SpeedMode = "fast" | "deep";

type Attachment = {
  name: string;
  type: string; // mime
  path?: string;   // storage path in chat-attachments (new scheme)
  dataUrl?: string; // signed URL (new) OR legacy data:...;base64,... (old messages)
};

type CouncilAnswer = { model: string; content: string; error: string | null };

type SourceCitation = { url: string; title?: string; content?: string };

type PubmedPayload = {
  used_query: string;
  english_query: string;
  total_count: number;
  retstart: number;
  sources: PubmedSource[];
};

type FulltextMeta = {
  pmid: string;
  pmcid?: string;
  title?: string;
  doi?: string;
  pmc_url?: string;
};

type BatchPartial = { subbatch_index: number; files: string[]; content?: string; error?: string; per_file_errors?: { file: string; error: string }[] };

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  model?: string;
  council?: CouncilAnswer[];
  sources?: SourceCitation[];
  pubmed?: PubmedPayload;
  fulltext?: FulltextMeta;
  batch?: { task: string; partial: BatchPartial[] };
};


type Conversation = {
  id: string;
  title: string;
  model: string | null;
  updated_at: string;
  folder_id: string | null;
};

type ChatFolder = {
  id: string;
  name: string;
};

const FOLDERS_OPEN_LS_KEY = "cabinet.foldersOpen.v1";

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
    const url = a.dataUrl; // signed URL for new, base64 data URL for legacy
    if (!url) continue;
    if (a.type.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url } });
    } else if (a.type === "application/pdf") {
      parts.push({ type: "file", file: { filename: a.name, file_data: url } });
    }
  }
  return parts;
};

/** Convert provider error text into a short Russian explanation. */
const friendlyChatError = (raw: string): string => {
  const s = (raw || "").toLowerCase();
  if (/context[_ ]?length|maximum context|token.*exceed/i.test(s))
    return "Контекст модели переполнен — удалите часть истории/вложений или выберите модель с большим контекстом.";
  if (/\b429\b|rate ?limit|too many requests/i.test(s))
    return "Превышен лимит запросов к модели (429). Подождите несколько секунд и повторите.";
  if (/\b402\b|insufficient.*credit|payment required|out of credit/i.test(s))
    return "Закончились кредиты у провайдера модели (402). Попробуйте другую модель или пополните баланс.";
  if (/\b401\b|invalid api key|unauthorized/i.test(s))
    return "Провайдер отклонил ключ (401). Сообщите администратору.";
  if (/\b404\b|model.*not.*found|no endpoints? found/i.test(s))
    return "Эта модель сейчас недоступна у провайдера (404). Выберите другую из списка.";
  if (/unsupported.*(image|file|modality|pdf)|does not support (images?|files?|pdf|vision)/i.test(s))
    return "Выбранная модель не поддерживает вложения (картинки/PDF). Снимите файл или выберите модель с поддержкой vision/PDF.";
  if (/\b5\d\d\b|internal server|bad gateway|service unavailable|timeout|timed out/i.test(s))
    return "Провайдер модели временно недоступен. Попробуйте ещё раз или выберите другую модель.";
  // Try to extract a short message from OpenRouter JSON
  try {
    const j = JSON.parse(raw);
    const m = j?.error?.message || j?.details || j?.message;
    if (typeof m === "string" && m.length < 300) return m;
  } catch { /* not json */ }
  return raw && raw.length < 240 ? raw : "Не удалось получить ответ от модели.";
};

function linkifyPubmedCitations(content: string, sources: PubmedSource[], msgIndex: number): string {
  if (!sources?.length) return content;
  // Strip legacy/hallucinated [PMID:xxxx] markers — we cite by index only.
  let text = content.replace(/\[PMID[:\s]*\d+\]/gi, "").replace(/\s{2,}/g, " ");
  // Replace [n], [n, m, k], [n,m][k] etc. with markdown links per index.
  text = text.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_m, group: string) => {
    const nums = group.split(",").map((s) => s.trim()).filter(Boolean);
    return nums
      .map((n) => {
        const idx = Number(n);
        const src = sources[idx - 1];
        if (!src) return `[${n}]`;
        return `[\\[${n}\\]](#pubmed-src-${msgIndex}-${src.pmid})`;
      })
      .join(" ");
  });
  return text;
}



function ConvRow({
  conv, active, folders, onOpen, onDelete, onMove, onRename,
}: {
  conv: Conversation;
  active: boolean;
  folders: ChatFolder[];
  onOpen: () => void;
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
  onRename: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-conv-id", conv.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group flex items-start gap-1 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent ${active ? "bg-accent" : ""}`}
      onClick={onOpen}
      onDoubleClick={(e) => { e.stopPropagation(); onRename(); }}
      title={conv.title}
    >
      <button
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary opacity-100 hover:bg-primary/20 hover:text-primary"
        onClick={(e) => { e.stopPropagation(); onRename(); }}
        aria-label="Переименовать"
        title="Переименовать (фамилия пациента, пометка)"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <span className="min-w-0 flex-1 text-sm break-words whitespace-normal leading-snug">{conv.title}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground opacity-70 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            aria-label="В папку"
            title="В папку"
          >
            <FolderInput className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {folders.length === 0 && (
            <DropdownMenuItem disabled>Нет папок</DropdownMenuItem>
          )}
          {folders.map((f) => (
            <DropdownMenuItem
              key={f.id}
              disabled={conv.folder_id === f.id}
              onClick={(e) => { e.stopPropagation(); onMove(f.id); }}
            >
              <Folder className="w-3.5 h-3.5 mr-2" />{f.name}
            </DropdownMenuItem>
          ))}
          {conv.folder_id && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(null); }}>
              <X className="w-3.5 h-3.5 mr-2" />Убрать из папки
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label="Удалить"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}


export default function Cabinet() {
  const { user, loading, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(window.localStorage.getItem(FOLDERS_OPEN_LS_KEY) || "{}"); } catch { return {}; }
  });
  const [unfiledOpen, setUnfiledOpen] = useState(true);
  const [pendingFolderId, setPendingFolderId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | "unfiled" | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [extendedPickerOpen, setExtendedPickerOpen] = useState(false);
  const { byId: liveModelsById, loading: liveModelsLoading } = useOpenRouterModels();
  const resolvedModels: ResolvedModel[] = CURATED_MODELS.map((c) => resolveCuratedModel(c, liveModelsById));
  const fastModels = resolvedModels.filter((m) => m.tier === "fast");
  const deepModels = resolvedModels.filter((m) => m.tier === "deep");
  const councilPanel = deepModels.filter((m) => m.available).map((m) => m.id);
  // Once live list is in, upgrade the bootstrap default to the resolved slug.
  useEffect(() => {
    if (liveModelsLoading || !resolvedModels.length) return;
    const isCurated = resolvedModels.some((r) => r.id === model);
    const isLive = liveModelsById.has(model);
    if (!isCurated && !isLive) {
      const fallback = resolvedModels.find((r) => r.key === DEFAULT_MODEL_KEY && r.available)
        ?? resolvedModels.find((r) => r.available);
      if (fallback) setModel(fallback.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveModelsLoading]);
  const currentResolved = resolvedModels.find((r) => r.id === model);
  const currentLive = liveModelsById.get(model);
  const modelKnown = !!currentLive || !!currentResolved?.available;

  const [speed, setSpeed] = useState<SpeedMode>("fast");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [council, setCouncil] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [searchSource, setSearchSource] = useState<"web" | "pubmed">("pubmed");
  const [pubmedFilters, setPubmedFilters] = useState<PubmedFilters>(PUBMED_DEFAULT_FILTERS);

  const attachmentsSupported = council ? true : modelSupportsAttachments(currentLive);
  const visionCapableLabels = resolvedModels
    .filter((r) => r.available && modelSupportsAttachments(r.liveInfo))
    .map((r) => r.label);
  const [pubmedLoadingMore, setPubmedLoadingMore] = useState<number | null>(null);
  const [pubmedAnalyzing, setPubmedAnalyzing] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamStartedAt, setStreamStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!streaming || !streamStartedAt) { setElapsedSec(0); return; }
    setElapsedSec(Math.floor((Date.now() - streamStartedAt) / 1000));
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - streamStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [streaming, streamStartedAt]);
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_SYSTEM_PROMPT;
    return window.localStorage.getItem(SYSTEM_PROMPT_LS_KEY) || DEFAULT_SYSTEM_PROMPT;
  });
  const [summarizerPrompt, setSummarizerPrompt] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_SUMMARIZER_PROMPT;
    return window.localStorage.getItem(SUMMARIZER_PROMPT_LS_KEY) || DEFAULT_SUMMARIZER_PROMPT;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemDraft, setSystemDraft] = useState(systemPrompt);
  const [summarizerDraft, setSummarizerDraft] = useState(summarizerPrompt);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (recording || transcribing) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Нет доступа к микрофону");
      return;
    }
    const mimeType = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    if (!mimeType) {
      stream.getTracks().forEach((t) => t.stop());
      toast.error("Браузер не поддерживает запись");
      return;
    }
    const rec = new MediaRecorder(stream, { mimeType });
    recordedChunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(recordedChunksRef.current, { type: rec.mimeType });
      recordedChunksRef.current = [];
      if (blob.size < 1024) { toast.error("Слишком короткая запись"); return; }
      setTranscribing(true);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const fd = new FormData();
        const ext = rec.mimeType.includes("mp4") ? "mp4" : "webm";
        fd.append("file", blob, `recording.${ext}`);
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-transcribe`;
        const r = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` },
          body: fd,
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j?.error || `HTTP ${r.status}`);
        }
        const { text } = await r.json();
        if (text) {
          setInput((prev) => prev ? `${prev} ${text}`.trim() : text);
        } else {
          toast.error("Ничего не распознано");
        }
      } catch (e: any) {
        toast.error(e?.message || "Ошибка распознавания");
      } finally {
        setTranscribing(false);
      }
    };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  }, [recording, transcribing]);

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id, title, model, updated_at, folder_id")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Не удалось загрузить историю");
      return;
    }
    setConversations(data || []);
  }, [user]);

  const loadFolders = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ai_conversation_folders")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) return;
    setFolders(data || []);
  }, [user]);

  useEffect(() => {
    loadConversations();
    loadFolders();
  }, [loadConversations, loadFolders]);

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { window.localStorage.setItem(FOLDERS_OPEN_LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const createFolder = async () => {
    if (!user) return;
    const name = window.prompt("Название папки (пациент или тема):")?.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from("ai_conversation_folders")
      .insert({ user_id: user.id, name })
      .select("id, name")
      .single();
    if (error || !data) { toast.error("Не удалось создать папку"); return; }
    setFolders((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "ru")));
    setOpenFolders((prev) => ({ ...prev, [data.id]: true }));
  };

  const renameFolder = async (f: ChatFolder) => {
    const name = window.prompt("Новое название:", f.name)?.trim();
    if (!name || name === f.name) return;
    const { error } = await supabase.from("ai_conversation_folders").update({ name }).eq("id", f.id);
    if (error) { toast.error("Не удалось переименовать"); return; }
    setFolders((prev) => prev.map((x) => x.id === f.id ? { ...x, name } : x).sort((a, b) => a.name.localeCompare(b.name, "ru")));
  };

  const deleteFolder = async (f: ChatFolder) => {
    if (!confirm(`Удалить папку «${f.name}»? Диалоги внутри сохранятся (вне папок).`)) return;
    const { error } = await supabase.from("ai_conversation_folders").delete().eq("id", f.id);
    if (error) { toast.error("Не удалось удалить папку"); return; }
    setFolders((prev) => prev.filter((x) => x.id !== f.id));
    setConversations((prev) => prev.map((c) => c.folder_id === f.id ? { ...c, folder_id: null } : c));
  };

  const moveConversation = async (convId: string, folderId: string | null) => {
    const { error } = await supabase.from("ai_conversations").update({ folder_id: folderId }).eq("id", convId);
    if (error) { toast.error("Не удалось переместить"); return; }
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, folder_id: folderId } : c));
    toast.success(folderId ? "Перемещено в папку" : "Убрано из папки");
  };


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
      const loadedMessages: Msg[] = (data || []).map((m: any) => {
          const atts: Attachment[] = Array.isArray(m.attachments) ? m.attachments : [];
          const councilAtt = atts.find((a) => a?.name === "__council__");
          const sourcesAtt = atts.find((a) => a?.name === "__sources__");
          const pubmedAtt = atts.find((a) => a?.name === "__pubmed__");
          const fulltextAtt = atts.find((a) => a?.name === "__fulltext__");
          const batchAtt = atts.find((a) => a?.name === "__batch__");
          let councilAnswers: CouncilAnswer[] | undefined;
          if (councilAtt?.dataUrl) {
            try {
              const b64 = councilAtt.dataUrl.split(",")[1] || "";
              councilAnswers = JSON.parse(decodeURIComponent(escape(atob(b64))));
            } catch { /* ignore */ }
          }
          let sources: SourceCitation[] | undefined;
          if (sourcesAtt?.dataUrl) {
            try {
              const b64 = sourcesAtt.dataUrl.split(",")[1] || "";
              sources = JSON.parse(decodeURIComponent(escape(atob(b64))));
            } catch { /* ignore */ }
          }
          let pubmed: PubmedPayload | undefined;
          if (pubmedAtt?.dataUrl) {
            try {
              const b64 = pubmedAtt.dataUrl.split(",")[1] || "";
              pubmed = JSON.parse(decodeURIComponent(escape(atob(b64))));
            } catch { /* ignore */ }
          }
          let fulltext: FulltextMeta | undefined;
          if (fulltextAtt?.dataUrl) {
            try {
              const b64 = fulltextAtt.dataUrl.split(",")[1] || "";
              fulltext = JSON.parse(decodeURIComponent(escape(atob(b64))));
            } catch { /* ignore */ }
          }
          let batch: Msg["batch"];
          if (batchAtt?.dataUrl) {
            try {
              const b64 = batchAtt.dataUrl.split(",")[1] || "";
              batch = JSON.parse(decodeURIComponent(escape(atob(b64))));
            } catch { /* ignore */ }
          }
          return {
            id: m.id,
            role: m.role,
            content: m.content,
            attachments: atts.filter((a) => !["__council__", "__sources__", "__pubmed__", "__fulltext__", "__batch__"].includes(a?.name)),
            model: m.model,
            council: councilAnswers,
            sources,
            pubmed,
            fulltext,
            batch,
          };
        });

      // Re-sign storage-backed attachments in batch (1h TTL)
      const pathsToSign = Array.from(new Set(
        loadedMessages.flatMap((m) => (m.attachments || []).filter((a) => a.path && !a.dataUrl).map((a) => a.path as string))
      ));
      if (pathsToSign.length) {
        const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrls(pathsToSign, 60 * 60);
        const map = new Map<string, string>();
        (signed || []).forEach((s: any, i: number) => { if (s?.signedUrl) map.set(pathsToSign[i], s.signedUrl); });
        for (const m of loadedMessages) {
          if (!m.attachments) continue;
          m.attachments = m.attachments.map((a) => a.path && map.has(a.path) ? { ...a, dataUrl: map.get(a.path) } : a);
        }
      }
      setMessages(loadedMessages);

      const conv = conversations.find((c) => c.id === activeId);
      if (conv?.model === "council") {
        setCouncil(true);
      } else if (conv?.model) {
        setCouncil(false);
        setModel(conv.model);
      }
    })();
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const newConversation = async (folderId: string | null = null) => {
    setActiveId(null);
    setMessages([]);
    setAttachments([]);
    setInput("");
    setPendingFolderId(folderId);
    if (folderId) setOpenFolders((prev) => ({ ...prev, [folderId]: true }));
  };

  const renameConversation = async (conv: Conversation) => {
    const name = window.prompt("Название диалога (фамилия пациента, пометка):", conv.title)?.trim();
    if (!name || name === conv.title) return;
    const trimmed = name.slice(0, 120);
    const { error } = await supabase.from("ai_conversations").update({ title: trimmed }).eq("id", conv.id);
    if (error) { toast.error("Не удалось переименовать"); return; }
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, title: trimmed } : c));
    toast.success("Переименовано");
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
    if (!files || !user) return;
    if (!attachmentsSupported) {
      toast.error("Выбранная модель не принимает вложения. Выберите модель с поддержкой картинок/PDF (например, Claude Sonnet, Gemini, GPT-5).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const MAX_FILES = 2;
    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB per file (Storage upload, not request body)
    const list = Array.from(files);
    const out: Attachment[] = [];
    for (const f of list) {
      if (attachments.length + out.length >= MAX_FILES) {
        toast.error(`В обычный чат можно прикрепить максимум ${MAX_FILES} файла. Для больших объёмов используйте «Пакетный анализ».`);
        break;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: больше 25 МБ`);
        continue;
      }
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        toast.error(`${f.name}: только PDF и изображения`);
        continue;
      }
      const safeName = f.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/chat/${crypto.randomUUID()}/${safeName}`;
      const up = await supabase.storage.from("chat-attachments").upload(path, f, {
        contentType: f.type, upsert: false,
      });
      if (up.error) {
        toast.error(`${f.name}: не удалось загрузить (${up.error.message})`);
        continue;
      }
      const signed = await supabase.storage.from("chat-attachments").createSignedUrl(path, 60 * 60);
      if (signed.error || !signed.data?.signedUrl) {
        toast.error(`${f.name}: не удалось получить ссылку`);
        continue;
      }
      out.push({ name: f.name, type: f.type, path, dataUrl: signed.data.signedUrl });
    }
    setAttachments((prev) => [...prev, ...out]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pubmedMode = webSearch && searchSource === "pubmed" && !council;

  const ensureConversation = async (titleSeed: string, modelTag: string): Promise<string | null> => {
    if (!user) return null;
    if (activeId) return activeId;
    const title = titleSeed.slice(0, 60) || "Новый диалог";
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title, model: modelTag, folder_id: pendingFolderId })
      .select("id, title, model, updated_at, folder_id")
      .single();
    if (error || !data) { toast.error("Не удалось создать диалог"); return null; }
    setActiveId(data.id);
    setConversations((prev) => [data as Conversation, ...prev]);
    setPendingFolderId(null);
    return data.id;
  };

  const handleBatchResult = useCallback(async ({ final, partial, task }: { final: string; partial: BatchPartial[]; task: string }) => {
    if (!user) return;
    const convId = await ensureConversation(`📚 ${task.slice(0, 50)}`, "anthropic/claude-sonnet-4.6");
    if (!convId) return;
    const userContent = `📚 Пакетный анализ документов: ${task}`;
    await supabase.from("ai_messages").insert({
      conversation_id: convId, user_id: user.id, role: "user", content: userContent, model: "batch-input",
    });
    const batchJson = JSON.stringify({ task, partial });
    const b64 = btoa(unescape(encodeURIComponent(batchJson)));
    await supabase.from("ai_messages").insert({
      conversation_id: convId, user_id: user.id, role: "assistant",
      content: final, model: "anthropic/claude-sonnet-4.6 (batch)",
      attachments: [{ name: "__batch__", type: "application/json", dataUrl: `data:application/json;base64,${b64}` }] as any,
    });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    // Append to local view
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userContent },
      { role: "assistant", content: final, model: "anthropic/claude-sonnet-4.6 (batch)", batch: { task, partial } },
    ]);
    loadConversations();
    toast.success("Анализ готов");
  }, [user, activeId, pendingFolderId]);

  const persistPubmedAssistant = async (
    convId: string, content: string, payload: PubmedPayload,
  ) => {
    if (!user) return;
    const pubmedB64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "assistant",
      content,
      model: `pubmed:${model}`,
      attachments: [{ name: "__pubmed__", type: "application/json", dataUrl: `data:application/json;base64,${pubmedB64}` }] as any,
    });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    loadConversations();
  };

  const sendPubmedMessage = async () => {
    if (!user || streaming) return;
    const text = input.trim();
    if (!text) { toast.error("Введите клинический вопрос"); return; }
    setStreaming(true);
    setStreamStartedAt(Date.now());

    const userMsg: Msg = { role: "user", content: text };
    const convId = await ensureConversation(text, `pubmed:${model}`);
    if (!convId) { setStreaming(false); return; }
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    await supabase.from("ai_messages").insert({
      conversation_id: convId, user_id: user.id, role: "user", content: text, model,
    });

    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(PUBMED_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
        body: JSON.stringify({ question: text, filters: pubmedFilters, model, system: systemPrompt }),
      });
      if (!resp.ok) {
        const err = await resp.text().catch(() => "");
        throw new Error(err || `HTTP ${resp.status}`);
      }
      const json = await resp.json();
      const payload: PubmedPayload = {
        used_query: json.used_query || "",
        english_query: json.english_query || "",
        total_count: Number(json.total_count) || 0,
        retstart: Number(json.retstart) || 0,
        sources: (json.sources || []) as PubmedSource[],
      };
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: json.answer || "", model: `pubmed:${model}`, pubmed: payload };
        return next;
      });
      await persistPubmedAssistant(convId, json.answer || "", payload);
    } catch (e: any) {
      toast.error("PubMed-поиск не удался: " + (e?.message || ""));
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "⚠️ Ошибка PubMed-поиска." };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  const loadMorePubmed = async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg?.pubmed || pubmedLoadingMore !== null) return;
    setPubmedLoadingMore(msgIndex);
    try {
      const nextStart = msg.pubmed.retstart + msg.pubmed.sources.length;
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(PUBMED_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
        body: JSON.stringify({
          question: msg.pubmed.english_query,
          english_query: msg.pubmed.english_query,
          filters: pubmedFilters,
          model,
          retstart: nextStart,
          skip_answer: true,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const json = await resp.json();
      const newSources: PubmedSource[] = json.sources || [];
      const merged: PubmedSource[] = [...msg.pubmed.sources];
      for (const s of newSources) {
        if (!merged.some((x) => x.pmid === s.pmid)) merged.push(s);
      }
      const updated: PubmedPayload = { ...msg.pubmed, sources: merged, total_count: Number(json.total_count) || msg.pubmed.total_count };
      setMessages((prev) => prev.map((m, i) => i === msgIndex ? { ...m, pubmed: updated } : m));
      if (msg.id) {
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(updated))));
        await supabase.from("ai_messages").update({
          attachments: [{ name: "__pubmed__", type: "application/json", dataUrl: `data:application/json;base64,${b64}` }] as any,
        }).eq("id", msg.id);
      }
    } catch (e: any) {
      toast.error("Не удалось дозагрузить: " + (e?.message || ""));
    } finally {
      setPubmedLoadingMore(null);
    }
  };

  const callFulltext = async (args: { pmid: string; pmcid?: string; title?: string; question: string }) => {
    const { data: sess } = await supabase.auth.getSession();
    const resp = await fetch(PUBMED_FULLTEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
      body: JSON.stringify({
        pmid: args.pmid,
        pmcid: args.pmcid,
        question: args.question,
        model,
        system: systemPrompt,
      }),
    });
    const json = await resp.json();
    return { ok: resp.ok, json } as const;
  };

  const persistFulltextMessage = async (content: string, meta: FulltextMeta) => {
    const convId = activeId;
    if (!convId || !user) return;
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(meta))));
    const att = { name: "__fulltext__", type: "application/json", dataUrl: `data:application/json;base64,${b64}` };
    await supabase.from("ai_messages").insert({
      conversation_id: convId, user_id: user.id, role: "assistant", content,
      model: `pubmed-fulltext:${model}`, attachments: [att] as any,
    });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    loadConversations();
  };

  const analyzePubmedArticle = async (source: PubmedSource, originalQuestion: string) => {
    if (!user || pubmedAnalyzing) return;
    setPubmedAnalyzing(source.pmid);
    try {
      const { ok, json } = await callFulltext({
        pmid: source.pmid, pmcid: source.pmcid, title: source.title, question: originalQuestion,
      });
      if (!ok) {
        toast.error(json?.error || "Не удалось получить полный текст");
        return;
      }
      const meta: FulltextMeta = {
        pmid: source.pmid,
        pmcid: json.pmcid || source.pmcid,
        title: source.title,
        pmc_url: json.pmc_url,
      };
      const content = json.analysis || "";
      const assistantMsg: Msg = { role: "assistant", content, model: `pubmed-fulltext:${model}`, fulltext: meta };
      setMessages((prev) => [...prev, assistantMsg]);
      await persistFulltextMessage(content, meta);
    } catch (e: any) {
      toast.error("Ошибка разбора: " + (e?.message || ""));
    } finally {
      setPubmedAnalyzing(null);
    }
  };

  const [fulltextFollowupLoading, setFulltextFollowupLoading] = useState<string | null>(null);
  const askFulltextFollowup = async (meta: FulltextMeta, userQuestion: string) => {
    if (!user || fulltextFollowupLoading) return;
    setFulltextFollowupLoading(meta.pmid);
    // Show the user's question in the thread for transparency
    const userMsg: Msg = { role: "user", content: userQuestion };
    setMessages((prev) => [...prev, userMsg]);
    if (activeId) {
      await supabase.from("ai_messages").insert({
        conversation_id: activeId, user_id: user.id, role: "user", content: userQuestion, model,
      });
    }
    try {
      const { ok, json } = await callFulltext({
        pmid: meta.pmid, pmcid: meta.pmcid, title: meta.title, question: userQuestion,
      });
      if (!ok) {
        toast.error(json?.error || "Не удалось получить ответ");
        return;
      }
      const assistantMsg: Msg = {
        role: "assistant",
        content: json.analysis || "",
        model: `pubmed-fulltext:${model}`,
        fulltext: meta,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await persistFulltextMessage(assistantMsg.content, meta);
    } catch (e: any) {
      toast.error("Ошибка: " + (e?.message || ""));
    } finally {
      setFulltextFollowupLoading(null);
    }
  };



  const sendMessage = async () => {
    if (pubmedMode) return sendPubmedMessage();
    if (!user || streaming) return;
    const text = input.trim();
    if (!text && !attachments.length) return;

    setStreaming(true);
    setStreamStartedAt(Date.now());
    const userMsg: Msg = { role: "user", content: text, attachments: [...attachments] };

    // Ensure conversation
    let convId = activeId;
    if (!convId) {
      const title = text.slice(0, 60) || "Новый диалог";
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, title, model, folder_id: pendingFolderId })
        .select("id, title, model, updated_at, folder_id")
        .single();
      if (error || !data) {
        toast.error("Не удалось создать диалог");
        setStreaming(false);
        return;
      }
      convId = data.id;
      setActiveId(convId);
      setConversations((prev) => [data as Conversation, ...prev]);
      setPendingFolderId(null);
    }

    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);

    // Persist user message — strip transient signed URLs for path-based attachments
    const persistedAtts = (userMsg.attachments || []).map((a) =>
      a.path ? { name: a.name, type: a.type, path: a.path } : a,
    );
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: text,
      attachments: persistedAtts as any,
      model,
    });

    // Build request messages (full history)
    const historyForApi = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: buildMultimodalContent(m.content, m.attachments || []),
    }));

    let assistantSoFar = "";
    let councilAnswers: CouncilAnswer[] | undefined;
    let collectedSources: SourceCitation[] = [];
    const usedWebSearch = webSearch && !council;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const url = council ? COUNCIL_URL : CHAT_URL;
      const payload = council
        ? { messages: historyForApi, system: systemPrompt, system_summarizer: summarizerPrompt, models: councilPanel }
        : { model, messages: historyForApi, reasoning_effort: speed === "fast" ? "low" : "high", system: systemPrompt, web_search: usedWebSearch, search_source: searchSource };

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok || !resp.body) {
        const errTxt = await resp.text().catch(() => "");
        throw new Error(errTxt || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let pendingEvent: string | null = null;
      const mergeAnnotations = (anns: any) => {
        if (!Array.isArray(anns)) return;
        for (const a of anns) {
          const cit = a?.url_citation || (a?.type === "url_citation" ? a : null);
          const url = cit?.url || a?.url;
          if (!url) continue;
          if (collectedSources.some((s) => s.url === url)) continue;
          collectedSources.push({ url, title: cit?.title || a?.title, content: cit?.content || a?.content });
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith("event: ")) { pendingEvent = line.slice(7).trim(); continue; }
          if (!line.startsWith("data: ")) { if (line === "") pendingEvent = null; continue; }
          const json = line.slice(6).trim();
          if (json === "[DONE]") { pendingEvent = null; continue; }
          try {
            const parsed = JSON.parse(json);
            if (council) {
              if (pendingEvent === "answers") {
                councilAnswers = parsed as CouncilAnswer[];
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar, model: "council", council: councilAnswers };
                  return next;
                });
              } else if (typeof parsed.delta === "string") {
                assistantSoFar += parsed.delta;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar, model: "council", council: councilAnswers };
                  return next;
                });
              }
            } else {
              const choice = parsed.choices?.[0];
              const delta = choice?.delta?.content;
              mergeAnnotations(choice?.delta?.annotations);
              mergeAnnotations(choice?.message?.annotations);
              if (delta) {
                assistantSoFar += delta;
              }
              if (delta || collectedSources.length) {
                const sourcesSnapshot = collectedSources.slice();
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar, model, sources: sourcesSnapshot.length ? sourcesSnapshot : undefined };
                  return next;
                });
              }
            }
          } catch { /* partial */ }
          pendingEvent = null;
        }
      }


      // Persist assistant message
      if (assistantSoFar) {
        const persistModel = council ? "council" : model;
        const persistAtts: any[] = [];
        if (councilAnswers) {
          persistAtts.push({ name: "__council__", type: "application/json", dataUrl: `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(councilAnswers))))}` });
        }
        if (collectedSources.length) {
          persistAtts.push({ name: "__sources__", type: "application/json", dataUrl: `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(collectedSources))))}` });
        }
        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: assistantSoFar,
          model: persistModel,
          attachments: persistAtts as any,
        });
        await supabase.from("ai_conversations").update({ model: persistModel, updated_at: new Date().toISOString() }).eq("id", convId);
        loadConversations();
      }
    } catch (e: any) {
      toast.error(friendlyChatError(e?.message || ""));
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
        <div className="p-3 border-b border-border space-y-2">
          <Button onClick={() => newConversation(null)} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />Новый диалог
          </Button>
          <Button onClick={createFolder} className="w-full" size="sm" variant="outline">
            <FolderPlus className="w-4 h-4 mr-2" />Новая папка
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 && folders.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">История пуста</p>
            )}

            {/* Folders */}
            {folders.map((f) => {
              const items = conversations.filter((c) => c.folder_id === f.id);
              const isOpen = openFolders[f.id] ?? true;
              return (
                <div
                  key={f.id}
                  className={`space-y-0.5 rounded-md ${dragOverFolder === f.id ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes("application/x-conv-id")) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverFolder(f.id);
                    }
                  }}
                  onDragLeave={() => setDragOverFolder((cur) => (cur === f.id ? null : cur))}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("application/x-conv-id");
                    setDragOverFolder(null);
                    if (id) moveConversation(id, f.id);
                  }}
                >
                  <div className="group flex items-center gap-1 rounded-md px-1 py-1.5 hover:bg-accent">
                    <button
                      type="button"
                      onClick={() => toggleFolder(f.id)}
                      className="flex items-center gap-1 flex-1 min-w-0 text-left"
                    >
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                      {isOpen ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-primary" /> : <Folder className="w-3.5 h-3.5 shrink-0 text-primary" />}
                      <span className="text-sm font-medium truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{items.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); newConversation(f.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary"
                      aria-label="Новый чат в папке"
                      title="Новый чат в папке"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-1" aria-label="Действия">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => renameFolder(f)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" />Переименовать
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteFolder(f)} className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" />Удалить папку
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {isOpen && (
                    <div className="pl-5 space-y-0.5">
                      {items.length === 0 && (
                        <p className="text-xs text-muted-foreground px-2 py-1">Пусто</p>
                      )}
                      {items.map((c) => (
                        <ConvRow
                          key={c.id}
                          conv={c}
                          active={activeId === c.id}
                          folders={folders}
                          onOpen={() => setActiveId(c.id)}
                          onDelete={() => deleteConversation(c.id)}
                          onMove={(fid) => moveConversation(c.id, fid)}
                          onRename={() => renameConversation(c)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unfiled */}
            {(() => {
              const unfiled = conversations.filter((c) => !c.folder_id);
              if (!folders.length) {
                return unfiled.map((c) => (
                  <ConvRow
                    key={c.id}
                    conv={c}
                    active={activeId === c.id}
                    folders={folders}
                    onOpen={() => setActiveId(c.id)}
                    onDelete={() => deleteConversation(c.id)}
                    onMove={(fid) => moveConversation(c.id, fid)}
                          onRename={() => renameConversation(c)}
                  />
                ));
              }
              return (
                <div
                  className={`space-y-0.5 pt-1 rounded-md ${dragOverFolder === "unfiled" ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes("application/x-conv-id")) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverFolder("unfiled");
                    }
                  }}
                  onDragLeave={() => setDragOverFolder((cur) => (cur === "unfiled" ? null : cur))}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("application/x-conv-id");
                    setDragOverFolder(null);
                    if (id) moveConversation(id, null);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setUnfiledOpen((v) => !v)}
                    className="flex items-center gap-1 w-full text-left rounded-md px-1 py-1.5 hover:bg-accent"
                  >
                    {unfiledOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Без папки</span>
                    <span className="text-xs text-muted-foreground">{unfiled.length}</span>
                  </button>
                  {unfiledOpen && (
                    <div className="pl-5 space-y-0.5">
                      {unfiled.map((c) => (
                        <ConvRow
                          key={c.id}
                          conv={c}
                          active={activeId === c.id}
                          folders={folders}
                          onOpen={() => setActiveId(c.id)}
                          onDelete={() => deleteConversation(c.id)}
                          onMove={(fid) => moveConversation(c.id, fid)}
                          onRename={() => renameConversation(c)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col md:h-screen">
        <header className="border-b border-border px-4 py-3 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold flex-1 min-w-0">Мультимодальный ассистент профессора</h1>
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
          <button
            type="button"
            onClick={() => setCouncil((v) => !v)}
            disabled={streaming}
            className={`px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 transition-colors ${
              council ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-border"
            }`}
            title="Параллельный опрос Claude, GPT, Gemini, Grok + сводный ответ"
          >
            <Users className="w-3.5 h-3.5" />Консилиум
          </button>
          <Select value={model} onValueChange={setModel} disabled={streaming || council}>
            <SelectTrigger className="w-[300px]">
              <SelectValue>
                {(() => {
                  const r = currentResolved;
                  if (r) return `${r.emoji} ${r.label}${!r.available ? " · недоступно" : ""}`;
                  if (currentLive) return `🧪 ${currentLive.name || currentLive.id}`;
                  return `⚠ ${model}`;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Быстрые</div>
              {fastModels.map((m) => (
                <SelectItem key={m.key} value={m.id} disabled={!m.available} title={buildModelTooltip(m)}>
                  <span className="flex items-center gap-1">
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                    {!m.available && <span className="text-[10px] text-destructive ml-1">недоступно</span>}
                  </span>
                </SelectItem>
              ))}
              <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Глубокие</div>
              {deepModels.map((m) => (
                <SelectItem key={m.key} value={m.id} disabled={!m.available} title={buildModelTooltip(m)}>
                  <span className="flex items-center gap-1">
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                    {!m.available && <span className="text-[10px] text-destructive ml-1">недоступно</span>}
                  </span>
                </SelectItem>
              ))}
              {currentResolved == null && currentLive && (
                <>
                  <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Расширенный выбор</div>
                  <SelectItem value={model}>🧪 {currentLive.name || currentLive.id}</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setExtendedPickerOpen(true)}
            disabled={streaming || council}
            className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-accent flex items-center gap-1 disabled:opacity-40"
            title={modelKnown
              ? `Выбрать любую модель из живого списка OpenRouter\n\nТекущая: ${buildModelTooltip(currentResolved ?? { key: "live", label: currentLive?.name || model, tier: "fast", emoji: "🧪", id: model, available: true, liveInfo: currentLive })}`
              : `⚠ Слаг ${model} не найден в OpenRouter — может вернуть 404`}
          >
            <Search className="w-3.5 h-3.5" />Ещё
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={messages.length === 0}
                className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-accent flex items-center gap-1 disabled:opacity-40"
                title="Экспорт всего диалога"
              >
                <Download className="w-3.5 h-3.5" />Экспорт
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  const ok = await copyToClipboard(messagesToMarkdown(messages as ExportMessage[]));
                  ok ? toast.success("Скопировано") : toast.error("Не удалось скопировать");
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-2" /> Копировать (Markdown)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadMarkdown(messagesToMarkdown(messages as ExportMessage[]))}>
                <FileCode2 className="w-3.5 h-3.5 mr-2" /> Скачать .md
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { await downloadDocx(messages as ExportMessage[]); toast.success("DOCX сохранён"); }}>
                <FileType2 className="w-3.5 h-3.5 mr-2" /> Скачать .docx
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { const ok = downloadPdf(messages as ExportMessage[]); if (!ok) toast.error("Браузер заблокировал окно печати"); }}>
                <FileDown className="w-3.5 h-3.5 mr-2" /> Скачать .pdf (через печать)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => {
              setSystemDraft(systemPrompt);
              setSummarizerDraft(summarizerPrompt);
              setSettingsOpen(true);
            }}
            className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-accent flex items-center gap-1"
            title="Системные промпты"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </header>

        <ExtendedModelPicker
          open={extendedPickerOpen}
          onOpenChange={setExtendedPickerOpen}
          onPick={(id) => setModel(id)}
          currentId={model}
        />

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Системные промпты</DialogTitle>
              <DialogDescription>
                Сохраняются локально в этом браузере.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Основной промпт (обычный чат и модели-участники консилиума)
              </div>
              <Textarea
                value={systemDraft}
                onChange={(e) => setSystemDraft(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => setSystemDraft(DEFAULT_SYSTEM_PROMPT)}>
                  Вернуть по умолчанию
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Промпт суммаризатора консилиума
              </div>
              <Textarea
                value={summarizerDraft}
                onChange={(e) => setSummarizerDraft(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => setSummarizerDraft(DEFAULT_SUMMARIZER_PROMPT)}>
                  Вернуть по умолчанию
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Отмена</Button>
              <Button
                onClick={() => {
                  const sys = systemDraft.trim() || DEFAULT_SYSTEM_PROMPT;
                  const sum = summarizerDraft.trim() || DEFAULT_SUMMARIZER_PROMPT;
                  setSystemPrompt(sys);
                  setSummarizerPrompt(sum);
                  try {
                    window.localStorage.setItem(SYSTEM_PROMPT_LS_KEY, sys);
                    window.localStorage.setItem(SUMMARIZER_PROMPT_LS_KEY, sum);
                  } catch { /* ignore */ }
                  setSettingsOpen(false);
                  toast.success("Промпты сохранены");
                }}
              >
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



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
                  m.content || m.council ? (
                    <>
                      {m.council && m.council.length > 0 && (
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Сводный ответ консилиума
                        </div>
                      )}
                      {m.content && m.fulltext ? (
                        <PubmedFulltextAnalysis
                          raw={m.content}
                          meta={m.fulltext}
                          onFollowup={(q) => askFulltextFollowup(m.fulltext!, q)}
                          followupLoading={fulltextFollowupLoading === m.fulltext.pmid}
                        />
                      ) : m.content ? (

                        <ChatMarkdownWith
                          extraComponents={m.pubmed ? {
                            a: ({ href, children, ...props }: any) => {
                              if (typeof href === "string" && href.startsWith("#pubmed-src-")) {
                                return (
                                  <a
                                    href={href}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const el = document.getElementById(href.slice(1));
                                      if (el) {
                                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                                        el.classList.add("ring-2", "ring-primary");
                                        setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1400);
                                      }
                                    }}
                                    className="inline-flex items-center px-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20 font-medium text-[0.85em] mx-0.5"
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                );
                              }
                              return <a href={href} {...props}>{children}</a>;
                            },
                          } : undefined}
                        >
                          {m.pubmed ? linkifyPubmedCitations(m.content, m.pubmed.sources, i) : m.content}
                        </ChatMarkdownWith>

                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Сводим ответы…
                        </div>
                      )}
                      {m.council && m.council.length > 0 && (
                        <Accordion type="single" collapsible className="mt-3 border-t border-border/50 pt-2">
                          <AccordionItem value="answers" className="border-0">
                            <AccordionTrigger className="text-xs py-1 hover:no-underline">
                              Ответы моделей по отдельности ({m.council.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                {m.council.map((a, k) => (
                                  <div key={k} className="rounded-md bg-background/60 p-2">
                                    <div className="text-[11px] font-mono text-muted-foreground mb-1">{a.model}</div>
                                    {a.error ? (
                                      <div className="text-xs text-destructive">⚠️ {a.error}</div>
                                    ) : (
                                      <ChatMarkdown className="prose prose-xs dark:prose-invert max-w-none text-xs">{a.content}</ChatMarkdown>

                                    )}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                      {m.batch && m.batch.partial.length > 0 && (
                        <Accordion type="single" collapsible className="mt-3 border-t border-border/50 pt-2">
                          <AccordionItem value="batch" className="border-0">
                            <AccordionTrigger className="text-xs py-1 hover:no-underline">
                              <span className="inline-flex items-center gap-1"><Layers className="w-3 h-3" /> Разбор по подпакетам ({m.batch.partial.length})</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                {m.batch.partial.map((p, k) => (
                                  <div key={k} className="rounded-md bg-background/60 p-2">
                                    <div className="text-[11px] font-mono text-muted-foreground mb-1">
                                      Подпакет {p.subbatch_index + 1} · {p.files.length} файлов: {p.files.join(", ")}
                                    </div>
                                    {p.error ? (
                                      <div className="text-xs text-destructive">⚠️ {p.error}</div>
                                    ) : (
                                      <ChatMarkdown className="prose prose-xs dark:prose-invert max-w-none text-xs">{p.content || ""}</ChatMarkdown>
                                    )}
                                    {p.per_file_errors && p.per_file_errors.length > 0 && (
                                      <div className="mt-1 text-[11px] text-amber-600">
                                        Не прочитано: {p.per_file_errors.map(f => f.file).join(", ")}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 border-t border-border/50 pt-2">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Источники ({m.sources.length})
                          </div>
                          <ol className="space-y-1 text-xs list-decimal pl-4">
                            {m.sources.map((s, k) => (
                              <li key={k} className="leading-snug">
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-start gap-1 break-all"
                                  title={s.url}
                                >
                                  <span>{s.title || s.url}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                </a>
                                {s.title && (
                                  <div className="text-[10px] text-muted-foreground break-all">{s.url}</div>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {m.pubmed && (
                        <div className="mt-3 border-t border-border/50 pt-2 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="uppercase tracking-wide font-semibold">PubMed</span>
                            <span>· Найдено: {m.pubmed.total_count}</span>
                            <span>· Показано: {m.pubmed.sources.length}</span>
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(m.pubmed.used_query)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
                            >
                              <ExternalLink className="w-3 h-3" /> Открыть в PubMed
                            </a>
                          </div>
                          {m.pubmed.used_query && (
                            <details className="text-[11px] text-muted-foreground">
                              <summary className="cursor-pointer">Использованный запрос</summary>
                              <code className="block mt-1 p-2 bg-background/50 rounded text-[10px] whitespace-pre-wrap break-all">{m.pubmed.used_query}</code>
                            </details>
                          )}
                          <div className="space-y-2">
                            {m.pubmed.sources.map((s, k) => (
                              <div
                                key={s.pmid}
                                id={`pubmed-src-${i}-${s.pmid}`}
                                className="rounded-md transition-shadow scroll-mt-24"
                              >
                                <PubmedSourceCard
                                  index={k + 1}
                                  source={s}
                                  onAnalyze={(src) => {
                                    const userQ = (() => {
                                      for (let x = i - 1; x >= 0; x--) {
                                        if (messages[x]?.role === "user") return messages[x].content;
                                      }
                                      return "";
                                    })();
                                    analyzePubmedArticle(src, userQ);
                                  }}
                                  analyzing={pubmedAnalyzing === s.pmid}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {m.pubmed.sources.length < m.pubmed.total_count && (
                              <Button
                                type="button" size="sm" variant="outline"
                                onClick={() => loadMorePubmed(i)}
                                disabled={pubmedLoadingMore !== null}
                              >
                                {pubmedLoadingMore === i ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                                Показать ещё
                              </Button>
                            )}
                            <Button
                              type="button" size="sm" variant="ghost"
                              onClick={() => downloadSourcesDocx(m.pubmed!.sources)}
                            >
                              <FileType2 className="w-3 h-3 mr-1" />Экспорт .docx
                            </Button>
                            <Button
                              type="button" size="sm" variant="ghost"
                              onClick={() => downloadRis(m.pubmed!.sources)}
                            >
                              <FileDown className="w-3 h-3 mr-1" />Экспорт .ris
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span className="tabular-nums">
                        Думаю… {elapsedSec}s
                        {elapsedSec >= 60 && elapsedSec < 240 && (
                          <span className="text-xs opacity-70"> · модель размышляет, ответ скоро пойдёт</span>
                        )}
                        {elapsedSec >= 240 && (
                          <span className="text-xs text-amber-600 dark:text-amber-400"> · долго, риск обрыва — можно отменить и сменить модель</span>
                        )}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                )}
                {m.role === "assistant" && m.content && !streaming && (
                  <div className="flex items-center gap-1 mt-2 -mb-1 opacity-70 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyToClipboard(m.content);
                        ok ? toast.success("Скопировано") : toast.error("Ошибка");
                      }}
                      className="p-1 rounded hover:bg-background/60"
                      title="Копировать"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadMarkdown(m.content, `answer-${i + 1}.md`)}
                      className="p-1 rounded hover:bg-background/60"
                      title="Скачать .md"
                    >
                      <FileCode2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await downloadDocx([{ role: "assistant", content: m.content, model: m.model }], `answer-${i + 1}.docx`, "Ответ");
                        toast.success("DOCX сохранён");
                      }}
                      className="p-1 rounded hover:bg-background/60"
                      title="Скачать .docx"
                    >
                      <FileType2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { const ok = downloadPdf([{ role: "assistant", content: m.content, model: m.model }], "Ответ"); if (!ok) toast.error("Браузер заблокировал окно печати"); }}
                      className="p-1 rounded hover:bg-background/60"
                      title="Скачать .pdf"
                    >
                      <FileDown className="w-3 h-3" />
                    </button>
                    {m.model && <span className="text-[10px] text-muted-foreground ml-auto">{m.model}</span>}
                  </div>
                )}
                {m.model && m.role === "assistant" && (!m.content || streaming) && (
                  <div className="text-[10px] text-muted-foreground mt-1 opacity-60">{m.model}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3 space-y-2">
          {pubmedMode && user && (
            <PubmedPanel
              userId={user.id}
              filters={pubmedFilters}
              onFiltersChange={setPubmedFilters}
              disabled={streaming}
            />
          )}
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
              disabled={streaming || !attachmentsSupported}
              aria-label="Прикрепить файл"
              title={
                attachmentsSupported
                  ? "Прикрепить PDF/изображение (до 2 файлов, 25 МБ)"
                  : `Модель «${currentLive?.name || model}» не принимает картинки/PDF.\nПодходят: ${visionCapableLabels.length ? visionCapableLabels.join(", ") : "Claude Sonnet, Gemini, GPT-5"}.`
              }
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setBatchDialogOpen(true)}
              disabled={streaming || !user}
              aria-label="Пакетный анализ документов"
              title="Пакетный анализ документов (много PDF/изображений сразу, через Claude)"
            >
              <Layers className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant={recording ? "destructive" : "outline"}
              size="icon"
              onClick={recording ? stopRecording : startRecording}
              disabled={streaming || transcribing}
              aria-label={recording ? "Остановить запись" : "Голосовой ввод"}
              title={recording ? "Остановить запись" : "Голосовой ввод (микрофон)"}
              className={recording ? "animate-pulse" : ""}
            >
              {transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              type="button"
              variant={webSearch ? "default" : "outline"}
              size="icon"
              onClick={() => setWebSearch((v) => !v)}
              disabled={streaming || council}
              aria-label="Поиск источников"
              title={
                council
                  ? "Поиск недоступен в режиме Консилиум"
                  : webSearch
                    ? `Поиск включён (${searchSource === "pubmed" ? "PubMed" : "Веб"}) — модель опирается на источники`
                    : "Включить поиск источников для этого сообщения"
              }
            >
              <Globe className="w-4 h-4" />
            </Button>
            {webSearch && !council && (
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setSearchSource("web")}
                  disabled={streaming}
                  className={`px-2 py-1 ${searchSource === "web" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  title="Поиск в открытом вебе"
                >
                  Веб
                </button>
                <button
                  type="button"
                  onClick={() => setSearchSource("pubmed")}
                  disabled={streaming}
                  className={`px-2 py-1 border-l ${searchSource === "pubmed" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  title="Поиск в PubMed (англоязычная медицинская литература)"
                >
                  PubMed
                </button>
              </div>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={pubmedMode ? "Клинический вопрос для поиска в PubMed (Enter — искать)" : "Сообщение (Enter — отправить, Shift+Enter — перенос)"}
              className="flex-1 min-h-[44px] max-h-40 resize-none"
              disabled={streaming}
            />
            <Button onClick={sendMessage} disabled={streaming || (!input.trim() && !attachments.length)} size="icon">
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </main>
      {user && (
        <BatchAnalysisDialog
          open={batchDialogOpen}
          onOpenChange={setBatchDialogOpen}
          userId={user.id}
          conversationId={activeId}
          onResult={handleBatchResult}
        />
      )}
    </div>
  );
}
