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
import DictationStudio from "@/components/admin/DictationStudio";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Sparkles, GitMerge, FileCheck2, Copy, Send, Mic, Square, RotateCw, Plug, Wand2, Pencil, Languages, RefreshCw, FileSearch, ImagePlus, Eye, Volume2, VolumeX, Users, Shield } from "lucide-react";

import { playCompletionChime, isSoundEnabled, setSoundEnabled } from "@/lib/notifySound";
import { toast as sonnerToast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdown/galleryMarkers";
import {
  markerDiff,
  listMarkers,
  countMarkers,
  restoreLostMarkersInSuggestion,
  restoreLostGalleryMarkers,
  MARKER_RE,
} from "@/lib/research/markerProtection";
import MarkdownArticle from "@/components/parents/MarkdownArticle";
import { CURATED_MODELS, resolveCuratedModel } from "@/config/aiModels";
import { useOpenRouterModels } from "@/hooks/useOpenRouterModels";
import { useVeniceModels } from "@/hooks/useVeniceModels";



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

const PANEL_KEYS: { key: string; default: boolean }[] = [
  { key: "gpt5", default: true },
  { key: "gpt56-terra-pro", default: true },
  { key: "claude-opus", default: true },
  { key: "gemini-pro", default: true },
  { key: "glm-5", default: true },
  { key: "kimi-k2", default: true },
  { key: "tencent-hy3", default: true },
  { key: "nemotron-3-ultra", default: true },
  { key: "qwen-max", default: false }, // временно off: Alibaba upstream часто отдаёт 429 в общем пуле OpenRouter
  { key: "pplx-sonar-pro", default: true },
  { key: "venice-uncensored", default: true },
  { key: "grok-fast", default: true },
  { key: "deepseek-v4-pro", default: true },
  { key: "mimo-v25-pro", default: true },
  { key: "mistral-large", default: false },
];
const ARBITER_KEYS = ["claude-opus", "gpt5", "gpt56-terra-pro", "gemini-pro", "nemotron-3-ultra"];
const REWRITER_KEYS = ["claude-opus", "claude-sonnet", "gpt5", "gpt56-terra-pro", "grok-fast"];



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
  const { user, isAdmin, isEditor, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const incoming = (location.state || {}) as {
    text?: string;
    title?: string;
    recheck?: { id: string; kind: "disease_articles" | "blog_posts" | "research_articles" | "research_reviews"; title?: string };
    voiceMode?: "impersonal" | "own_data" | "authorial";
  };
  const [researchVoiceMode, setResearchVoiceMode] = useState<"impersonal" | "own_data" | "authorial" | null>(null);

  const { byId: liveModelsById } = useOpenRouterModels();
  const { byId: veniceModelsById } = useVeniceModels();
  const resolvedModels = useMemo(
    () => CURATED_MODELS.map((c) => resolveCuratedModel(c, liveModelsById, veniceModelsById)),
    [liveModelsById, veniceModelsById],
  );
  const PANEL = useMemo(
    () =>
      PANEL_KEYS.map(({ key, default: def }) => {
        const r = resolvedModels.find((m) => m.key === key);
        return { id: r?.id ?? key, label: r?.label ?? key, default: def };
      }),
    [resolvedModels],
  );
  const ARBITERS = useMemo(
    () =>
      ARBITER_KEYS.map((key) => {
        const r = resolvedModels.find((m) => m.key === key);
        return { id: r?.id ?? key, label: r?.label ?? key };
      }),
    [resolvedModels],
  );
  const REWRITERS = useMemo(
    () =>
      REWRITER_KEYS.map((key) => {
        const r = resolvedModels.find((m) => m.key === key);
        return { id: r?.id ?? key, label: r?.label ?? key };
      }),
    [resolvedModels],
  );

  const [title, setTitle] = useState(incoming.title ?? "");
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [text, setText] = useState(incoming.text ?? "");
  const [models, setModels] = useState<string[]>(() => PANEL.filter((m) => m.default).map((m) => m.id));
  const [arbiter, setArbiter] = useState(() => ARBITERS[0]?.id ?? "");
  const [rewriter, setRewriter] = useState(() => REWRITERS[0]?.id ?? "");

  // Синхронизируем выбранные модели с реальными id, когда каталог OpenRouter/Venice подгрузится.
  // Иначе в state остаются короткие ключи ("claude-opus"), которые backend резолвит в другой id
  // ("anthropic/claude-opus-4-8"), из-за чего в прогрессе появляется фантомная "В очереди" карточка.
  useEffect(() => {
    if (reviewing) return;
    const allKeys = Array.from(new Set([...PANEL_KEYS.map(p => p.key), ...ARBITER_KEYS, ...REWRITER_KEYS]));
    const keyToId = new Map(allKeys.map((key) => {
      const r = resolvedModels.find((m) => m.key === key);
      return [key, r?.id ?? key] as const;
    }));
    setModels((cur) => {
      const next = cur.map((m) => keyToId.get(m) ?? m);
      return next.some((v, i) => v !== cur[i]) ? next : cur;
    });
    setArbiter((cur) => keyToId.get(cur) ?? cur);
    setRewriter((cur) => keyToId.get(cur) ?? cur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedModels]);
  const [previewOpen, setPreviewOpen] = useState(false);


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
          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-transcribe`, {
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
  const reviewsRef = useRef<ModelReview[]>([]);
  useEffect(() => { reviewsRef.current = reviews; }, [reviews]);
  const abortReviewRef = useRef<AbortController | null>(null);
  const autoArbiterRef = useRef(true);
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
  // Накопленные применённые правки между раундами (чтобы исключать из повторного ревью)
  const [appliedEdits, setAppliedEdits] = useState<EditItem[]>([]);
  const [reviewRound, setReviewRound] = useState(1);
  const [rewriting, setRewriting] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [formatProgress, setFormatProgress] = useState<{ index: number; total: number } | null>(null);
  const [translating, setTranslating] = useState(false);
  // Блок 4: сет ключей правок, для которых пользователь явно согласился принять «без маркера».
  const [acceptWithoutMarker, setAcceptWithoutMarker] = useState<Set<string>>(new Set());
  // Блок 4: модалка финальной сверки перед применением.
  const [pendingApply, setPendingApply] = useState<{ edits: EditItem[]; lost: string[] } | null>(null);
  const [translation, setTranslation] = useState<null | {
    title: string;
    slug: string;
    description: string;
    card_annotation: string;
    content: string;
    keywords: string[];
    seo_title: string;
    seo_description: string;
  }>(null);

  // --- SEO-мета для передачи в публикатор ---
  type SeoMeta = {
    title: string;
    slug: string;
    excerpt: string;
    keywords: string[];
    category: string;
    age_group: "children" | "adults";
  };
  const [seoMeta, setSeoMeta] = useState<SeoMeta | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const seoCategoryLabels: Record<string, string> = {
    general: "Общее", urology: "Урология", andrology: "Андрология", surgery: "Хирургия",
    endocrinology: "Эндокринология", psychology: "Психология", sexology: "Сексология", genetics: "Генетика",
  };
  async function optimizeSeo() {
    if (!finalText.trim()) return;
    setSeoLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-article-meta", {
        body: { text: finalText, filename: title || "article" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSeoMeta({
        title: String(data.title || title || ""),
        slug: String(data.slug || ""),
        excerpt: String(data.excerpt || ""),
        keywords: Array.isArray(data.keywords) ? data.keywords.map((k: any) => String(k)) : [],
        category: seoCategoryLabels[data.category] ? String(data.category) : "general",
        age_group: data.age_group === "adults" ? "adults" : "children",
      });
      sonnerToast.success("SEO готов — проверьте и правьте перед публикацией");
    } catch (e: any) {
      sonnerToast.error("SEO не получен", { description: e?.message || String(e) });
    } finally {
      setSeoLoading(false);
    }
  }


  // --- Перепроверка опубликованного ---
  type PubItem = { id: string; kind: "disease_articles" | "blog_posts" | "research_articles" | "research_reviews"; title: string; updated_at: string };
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerItems, setPickerItems] = useState<PubItem[]>([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const [existingRef, setExistingRef] = useState<{ id: string; kind: PubItem["kind"] } | null>(null);

  async function openRecheckPicker() {
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const [d, b, r] = await Promise.all([
        supabase.from("disease_articles").select("id,title,updated_at,is_published").eq("is_published", true).order("updated_at", { ascending: false }).limit(200),
        supabase.from("blog_posts").select("id,title,updated_at,is_published").eq("is_published", true).order("updated_at", { ascending: false }).limit(200),
        supabase.from("research_articles").select("id,title,updated_at,is_published").eq("is_published", true).order("updated_at", { ascending: false }).limit(200),
      ]);
      const items: PubItem[] = [
        ...((d.data ?? []) as any[]).map((x) => ({ id: x.id, kind: "disease_articles" as const, title: x.title, updated_at: x.updated_at })),
        ...((b.data ?? []) as any[]).map((x) => ({ id: x.id, kind: "blog_posts" as const, title: x.title, updated_at: x.updated_at })),
        ...((r.data ?? []) as any[]).map((x) => ({ id: x.id, kind: "research_articles" as const, title: x.title, updated_at: x.updated_at })),
      ];
      setPickerItems(items);
    } catch (e: any) {
      sonnerToast.error("Не удалось загрузить список", { description: e?.message || String(e) });
    } finally {
      setPickerLoading(false);
    }
  }

  async function loadForRecheck(item: PubItem) {
    try {
      if (item.kind === "research_reviews") {
        // Научный обзор: контент хранится в поле content (HTML). Конвертируем в markdown.
        const { data, error } = await supabase
          .from("research_reviews" as any)
          .select("title, content, voice_mode")
          .eq("id", item.id)
          .maybeSingle();
        if (error) throw error;
        const html = (data as any)?.content || "";
        const md = /<[a-z][\s\S]*>/i.test(html) ? htmlToMarkdown(html) : html;
        setTitle((data as any)?.title || item.title);
        setText(md);
        setExistingRef({ id: item.id, kind: item.kind });
        const vm = (data as any)?.voice_mode as "impersonal" | "own_data" | "authorial" | undefined;
        if (vm) setResearchVoiceMode(vm);
        setPickerOpen(false);
        setReviews([]); setConsolidated(null); setAccepted(new Set()); setDirectAccepted(new Map());
        setEditedSuggested(new Map()); setFinalText(""); setAppliedEdits([]); setReviewRound(1);
        sonnerToast.success("Обзор загружен на консилиум", { description: "Режим голоса: " + (vm || "impersonal") });
        return;
      }
      const field = item.kind === "disease_articles" ? "article_content" : "content";
      const { data, error } = await supabase.from(item.kind).select(`title, ${field}`).eq("id", item.id).maybeSingle();
      if (error) throw error;
      const html = (data as any)?.[field] || "";
      const md = /<[a-z][\s\S]*>/i.test(html) ? htmlToMarkdown(html) : html;
      setTitle((data as any)?.title || item.title);
      setText(md);
      setExistingRef({ id: item.id, kind: item.kind });
      setResearchVoiceMode(null);
      setPickerOpen(false);
      setReviews([]); setConsolidated(null); setAccepted(new Set()); setDirectAccepted(new Map());
      setEditedSuggested(new Map()); setFinalText(""); setAppliedEdits([]); setReviewRound(1);
      sonnerToast.success("Статья загружена", { description: "Можно запускать ревью" });
    } catch (e: any) {
      sonnerToast.error("Ошибка загрузки", { description: e?.message || String(e) });
    }
  }

  // Авто-загрузка опубликованной статьи, если пришли по кнопке «В оркестратор»
  useEffect(() => {
    if (!incoming.recheck) return;
    loadForRecheck({
      id: incoming.recheck.id,
      kind: incoming.recheck.kind,
      title: incoming.recheck.title || "",
      updated_at: "",
    });
    if (incoming.voiceMode) setResearchVoiceMode(incoming.voiceMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Кнопка «Принять и вернуть в научный редактор» (Блок 4).
  async function acceptAndReturnToReview() {
    if (!existingRef || existingRef.kind !== "research_reviews") return;
    try {
      // Защита маркеров: сверяем оригинал (то, что пришло на консилиум = text)
      // с итогом (finalText) и, если arbiter/rewriter потерял [M#] или [[GALLERY]],
      // предупреждаем и восстанавливаем блочные метки автоматически.
      // Функции защиты маркеров уже импортированы наверху.
      const originalMd = text;
      let finalMd = finalText || text;
      const restored = restoreLostGalleryMarkers(originalMd, finalMd);
      finalMd = restored.fixed;
      const diff = markerDiff(originalMd, finalMd);
      if (diff.lost.length) {
        sonnerToast.warning(
          `После консилиума пропали маркеры источников: ${diff.lost.join(", ")}. Проверьте текст перед публикацией.`,
        );
      }
      if (restored.restored.length) {
        sonnerToast.info(`Восстановил метки галерей: ${restored.restored.join(", ")}`);
      }
      const html = markdownToHtml(finalMd);
      const { error } = await supabase
        .from("research_reviews" as any)
        .update({ content: html, content_with_markers: html, workflow_state: "editing" })
        .eq("id", existingRef.id);
      if (error) throw error;
      sonnerToast.success("Правки применены, обзор возвращён в редактор");
      navigate(`/admin/research-reviews/${existingRef.id}`);
    } catch (e: any) {
      sonnerToast.error("Не удалось вернуть обзор", { description: e?.message || String(e) });
    }
  }

  // --- Персистентность прогона в localStorage (переживает F5, hot-reload, случайные уходы) ---
  const DRAFT_KEY = "orchestrator:draft:v1";
  const draftLoadedRef = useRef(false);
  const draftHydratingRef = useRef(true);

  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    // Не восстанавливаем, если пришли с явным новым текстом или на перепроверку
    if (incoming.text || incoming.recheck) {
      draftHydratingRef.current = false;
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) { draftHydratingRef.current = false; return; }
      const d = JSON.parse(raw);
      // TTL 7 дней
      if (!d?.savedAt || Date.now() - d.savedAt > 7 * 24 * 3600 * 1000) {
        draftHydratingRef.current = false;
        return;
      }
      if (typeof d.title === "string") setTitle(d.title);
      if (typeof d.text === "string") setText(d.text);
      if (Array.isArray(d.models)) setModels(d.models);
      if (typeof d.arbiter === "string" && d.arbiter) setArbiter(d.arbiter);
      if (typeof d.rewriter === "string" && d.rewriter) setRewriter(d.rewriter);
      if (Array.isArray(d.reviews)) setReviews(d.reviews);
      if (d.progress && typeof d.progress === "object") setProgress(d.progress);
      if (d.consolidated) setConsolidated(d.consolidated);
      if (Array.isArray(d.accepted)) setAccepted(new Set(d.accepted));
      if (Array.isArray(d.directAccepted)) setDirectAccepted(new Map(d.directAccepted));
      if (Array.isArray(d.editedSuggested)) setEditedSuggested(new Map(d.editedSuggested));
      if (typeof d.finalText === "string") setFinalText(d.finalText);
      if (Array.isArray(d.appliedEdits)) setAppliedEdits(d.appliedEdits);
      if (typeof d.reviewRound === "number") setReviewRound(d.reviewRound);
      if (d.translation) setTranslation(d.translation);
      if (d.seoMeta) setSeoMeta(d.seoMeta);
      const when = new Date(d.savedAt);
      sonnerToast.success("Черновик восстановлен", {
        description: `Автосохранение от ${when.toLocaleString("ru-RU")}. Кнопка «Сбросить черновик» в шапке.`,
      });
    } catch (e) {
      console.warn("[orchestrator] draft restore failed", e);
    } finally {
      // Дадим React отрендерить восстановленное состояние до включения автосохранения
      setTimeout(() => { draftHydratingRef.current = false; }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced автосейв
  useEffect(() => {
    if (draftHydratingRef.current) return;
    const timer = setTimeout(() => {
      try {
        const bundle = {
          savedAt: Date.now(),
          title, text, models, arbiter, rewriter,
          reviews, progress,
          consolidated,
          accepted: Array.from(accepted),
          directAccepted: Array.from(directAccepted.entries()),
          editedSuggested: Array.from(editedSuggested.entries()),
          finalText, appliedEdits, reviewRound,
          translation, seoMeta,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(bundle));
      } catch (e) {
        // квота или приватный режим — просто игнорируем
        console.warn("[orchestrator] draft save failed", e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [title, text, models, arbiter, rewriter, reviews, progress, consolidated, accepted, directAccepted, editedSuggested, finalText, appliedEdits, reviewRound, translation, seoMeta]);

  function resetDraft() {
    if (!confirm("Сбросить локальный черновик оркестратора? Текущее состояние формы очистится.")) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setTitle(""); setText(""); setReviews([]); setProgress({}); setConsolidated(null);
    setAccepted(new Set()); setDirectAccepted(new Map()); setEditedSuggested(new Map());
    setFinalText(""); setAppliedEdits([]); setReviewRound(1); setTranslation(null); setSeoMeta(null);
    sonnerToast.success("Черновик сброшен");
  }


  function insertGalleryMarker(target: "text" | "final") {
    const caption = window.prompt("Подпись к галерее (можно пустую):", "");
    if (caption === null) return;
    const marker = `\n\n[[GALLERY: caption="${(caption || "").replace(/"/g, "'")}"]]\n\n`;
    if (target === "final") {
      setFinalText((cur) => (cur || "") + marker);
    } else {
      setText((cur) => (cur || "") + marker);
    }
    sonnerToast.success("Блок галереи вставлен", {
      description: "Файлы можно прикрепить на странице «Разместить»",
    });
  }




  async function translateFinal() {
    if (!finalText.trim()) return;
    setTranslating(true);
    setTranslation(null);
    try {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { text: finalText, title, description: "" },
      });
      if (error) throw error;
      if (!data?.translation) throw new Error("Empty response");
      setTranslation(data.translation);
      sonnerToast.success("Перевод готов — проверьте и скопируйте поля");
    } catch (e: any) {
      sonnerToast.error("Перевод не удался", { description: e?.message || String(e) });
    } finally {
      setTranslating(false);
    }
  }

  const successReviews = useMemo(() => reviews.filter((r) => !r.error), [reviews]);

  const getSuggested = (key: string, fallback: string) =>
    editedSuggested.has(key) ? editedSuggested.get(key)! : fallback;

  const copyToClipboard = async (value: string, successMessage: string) => {
    if (!value) {
      sonnerToast.error("Нечего копировать");
      return;
    }
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch { /* fallthrough to legacy */ }
    if (!ok) {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "0";
      area.style.opacity = "0";
      area.setAttribute("readonly", "");
      document.body.appendChild(area);
      const prevSelection = document.getSelection()?.rangeCount ? document.getSelection()!.getRangeAt(0) : null;
      area.focus();
      area.select();
      area.setSelectionRange(0, value.length);
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(area);
      if (prevSelection) {
        const sel = document.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(prevSelection);
      }
    }
    if (ok) sonnerToast.success(`${successMessage} (${value.length.toLocaleString("ru-RU")} симв.)`);
    else sonnerToast.error("Браузер заблокировал копирование — выделите текст вручную и Ctrl+C");
  };

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
  if (!user || (!isAdmin && !isEditor)) { navigate("/auth"); return null; }

  const toggleModel = (id: string) => {
    setModels((cur) => cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]);
  };

  const markUnfinishedModelsAsError = (message: string, onlyModel?: string) => {
    setProgress((cur) => Object.fromEntries(
      Object.entries(cur).map(([modelId, p]) => {
        if (onlyModel && modelId !== onlyModel) return [modelId, p];
        if (p.status === "done" || p.status === "error") return [modelId, p];
        return [modelId, { ...p, status: "error" as const, ms: p.startedAt ? Date.now() - p.startedAt : p.ms, error: message }];
      }),
    ));
  };

  // Досрочная остановка ожидания моделей и передача арбитру.
  // Не отменяет фоновый стрим — просто фиксирует состояние UI и сразу запускает консолидацию.
  function forceFinishAndConsolidate() {
    markUnfinishedModelsAsError("Пропущено — отправлено арбитру досрочно");
    try { abortReviewRef.current?.abort(); } catch { /* noop */ }
    setReviewing(false);
    setPending(new Set());
    // даём React обновить successReviews, затем зовём арбитра
    setTimeout(() => { void runConsolidation(); }, 50);
  }

  // Многократный сигнал (n колокольчиков) — короткие последовательные chime.
  function playChimes(n: number) {
    // Интервал > длительности звука (0.8с), иначе сигналы сливаются в один тон.
    for (let i = 0; i < n; i++) setTimeout(() => playCompletionChime(), i * 900);
  }

  async function runReview(opts?: { reReview?: boolean }) {
    const reReview = !!opts?.reReview;
    // База для повторного ревью — переписанная статья (если есть) или текущий text.
    const baseText = reReview ? (finalText.trim() || text) : text;
    if (baseText.trim().length < 100) {
      toast({ title: "Статья слишком короткая", description: "Минимум 100 символов.", variant: "destructive" });
      return;
    }
    if (!models.length) {
      toast({ title: "Выберите хотя бы одну модель", variant: "destructive" });
      return;
    }
    // При повторном ревью обновляем основной текст, чтобы и UI, и последующие правки шли уже от него.
    if (reReview && finalText.trim() && baseText !== text) {
      setText(baseText);
    }
    setReviews([]);
    setConsolidated(null);
    setAccepted(new Set());
    setDirectAccepted(new Map());
    setEditedSuggested(new Map());
    if (!reReview) {
      setAppliedEdits([]);
      setReviewRound(1);
      setFinalText("");
    } else {
      setReviewRound((r) => r + 1);
    }
    setReviewing(true);
    setPending(new Set(models));
    setProgress(Object.fromEntries(models.map((m) => [m, { status: "queued" as const }])));

    try {
      let streamDone = false;
      const ctrl = new AbortController();
      abortReviewRef.current = ctrl;
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "review",
          title,
          text: baseText,
          models,
          applied_edits: reReview ? appliedEdits : [],
          kind: existingRef?.kind,
          voice_mode: existingRef?.kind === "research_reviews" ? researchVoiceMode : undefined,
        }),
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
            streamDone = true;
            playChimes(1); // один колокольчик — первичный анализ завершён
          }
        }
      }
      if (!streamDone) throw new Error("Поток оркестратора закрылся до завершения. Незавершённые модели помечены ошибкой.");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // Тихо — пользователь сам оборвал ожидание кнопкой «Досрочно к арбитру».
      } else {
        const message = e?.message || String(e);
        markUnfinishedModelsAsError(message);
        toast({ title: "Ошибка ревью", description: message, variant: "destructive" });
      }
    } finally {
      setReviewing(false);
      setPending(new Set());
      abortReviewRef.current = null;
      // Автоматически передаём арбитру, если есть хоть одна успешная модель.
      if (autoArbiterRef.current) {
        setTimeout(() => { void runConsolidation({ silentIfEmpty: true }); }, 120);
      }
    }
  }

  async function runReviewOne(model: string) {
    const baseText = (finalText.trim() || text).trim();
    if (baseText.length < 100) {
      toast({ title: "Статья слишком короткая", description: "Минимум 100 символов.", variant: "destructive" });
      return;
    }
    // Убираем прошлый результат этой модели, чтобы стрим заменил её карточку.
    setReviews((cur) => cur.filter((r) => r.model !== model));
    // Сбрасываем связанные с этой моделью локальные принятия правок.
    setDirectAccepted((cur) => {
      const n = new Map(cur);
      for (const k of Array.from(n.keys())) if (k.startsWith(`${model}::`)) n.delete(k);
      return n;
    });
    setEditedSuggested((cur) => {
      const n = new Map(cur);
      for (const k of Array.from(n.keys())) if (k.startsWith(`${model}::`)) n.delete(k);
      return n;
    });
    setPending((cur) => { const n = new Set(cur); n.add(model); return n; });
    setProgress((cur) => ({ ...cur, [model]: { status: "queued" } }));
    setReviewing(true);

    try {
      let streamDone = false;
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "review",
          title,
          text: baseText,
          models: [model],
          applied_edits: reviewRound > 1 ? appliedEdits : [],
          kind: existingRef?.kind,
          voice_mode: existingRef?.kind === "research_reviews" ? researchVoiceMode : undefined,
        }),
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
              setReviews((cur) => [...cur.filter((x) => x.model !== r.model), r]);
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
            streamDone = true;
            playCompletionChime();
          }
        }
      }
      if (!streamDone) throw new Error("Поток оркестратора закрылся до завершения. Модель помечена ошибкой.");
    } catch (e: any) {
      const message = e?.message || String(e);
      toast({ title: `Ошибка ревью (${model})`, description: message, variant: "destructive" });
      setProgress((cur) => ({ ...cur, [model]: { ...cur[model], status: "error", error: message } }));
    } finally {
      setPending((cur) => { const n = new Set(cur); n.delete(model); return n; });
      // Если больше нет активных моделей — снимаем общий флаг reviewing.
      setPending((cur) => {
        if (cur.size === 0) setReviewing(false);
        return cur;
      });
    }
  }

  async function runConsolidation(opts?: { silentIfEmpty?: boolean }) {
    const src = reviewsRef.current.length ? reviewsRef.current : reviews;
    const valid = src.filter((r) => !r.error && (r.edits.length || r.free_review));
    if (!valid.length) {
      if (!opts?.silentIfEmpty) toast({ title: "Нет валидных рецензий", variant: "destructive" });
      return;
    }
    setConsolidating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-article`;
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
          kind: existingRef?.kind,
          voice_mode: existingRef?.kind === "research_reviews" ? researchVoiceMode : undefined,
        }),
      });
      const j = await resp.json();
      if (!resp.ok || j?.error) throw new Error(j?.error || `HTTP ${resp.status}`);
      const cons = j.consolidated as { summary: string; edits: EditItem[] };
      setConsolidated(cons);
      // По умолчанию принимаем consensus и majority high/medium
      const auto = new Set<number>();
      cons.edits.forEach((e, i) => {
        if ((e.status === "consensus" || e.status === "majority") && e.severity !== "low") auto.add(i);
      });
      setAccepted(auto);
      playChimes(3); // три колокольчика — арбитр закончил работу
    } catch (e: any) {
      toast({ title: "Ошибка консолидации", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setConsolidating(false);
    }
  }


  async function rewriteWithVoice(editsArg?: EditItem[], skipMarkerConfirm = false) {
    const rawAccepted = editsArg ?? (consolidated
      ? consolidated.edits
          .map((e, i) => ({ ...e, suggested: getSuggested(`cons::${i}`, e.suggested), _i: i }))
          .filter((e) => accepted.has((e as any)._i))
          .map(({ _i, ...rest }: any) => rest)
      : []);
    if (!rawAccepted.length) {
      toast({ title: "Не выбраны правки", variant: "destructive" });
      return;
    }
    // Блок 4: авто-восстановление маркеров источников в каждой правке,
    // если модель не пометила себя как «без маркера».
    const editsAccepted: EditItem[] = rawAccepted.map((e: EditItem, idx: number) => {
      const key = `cons::${idx}`;
      if (acceptWithoutMarker.has(key)) return e;
      if (!e.suggested?.trim()) return e; // пустая правка (удаление) — не восстанавливаем
      const { fixed } = restoreLostMarkersInSuggestion(e.original || "", e.suggested);
      return { ...e, suggested: fixed };
    });

    // Блок 4: финальная сверка. Считаем маркеры в исходнике vs в симуляции применения.
    if (!skipMarkerConfirm) {
      let simulated = text;
      for (const e of editsAccepted) {
        if (e.original && simulated.includes(e.original)) {
          simulated = simulated.replace(e.original, e.suggested || "");
        }
      }
      const diff = markerDiff(text, simulated);
      // Убираем из списка потерь те, что пользователь явно принял без маркера.
      const stillLost = diff.lost.filter((mk) => {
        return !editsAccepted.some((e, i) =>
          acceptWithoutMarker.has(`cons::${i}`) && (e.original || "").includes(mk),
        );
      });
      if (stillLost.length) {
        setPendingApply({ edits: editsAccepted, lost: stillLost });
        return;
      }
    }

    setRewriting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "rewrite",
          text,
          edits: editsAccepted,
          rewriter,
          kind: existingRef?.kind,
          voice_mode: existingRef?.kind === "research_reviews" ? researchVoiceMode : undefined,
        }),
      });
      const j = await resp.json();
      if (!resp.ok || j?.error) throw new Error(j?.error || `HTTP ${resp.status}`);
      setFinalText(String(j.rewritten || ""));
      // Запоминаем применённые правки — чтобы исключить их при повторном ревью
      setAppliedEdits((cur) => [...cur, ...editsAccepted]);
      toast({ title: "Статья переписана", description: `Применено правок: ${j.applied}. Голос автора сохранён. Можно запустить повторное ревью.` });
      playCompletionChime();
    } catch (e: any) {
      toast({ title: "Ошибка переписывания", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setRewriting(false);
    }
  }

  const acceptedCount = accepted.size;

  // ===== Тест связи + форматирование Claude =====

  async function testClaudeConnection() {
    setTestingConn(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-claude-connection`, {
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
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/format-disease-article`, {
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


  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Назад в админку
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" /> Оркестратор статей
          </h1>
          <p className="text-muted-foreground mt-1">
            Параллельное ревью статьи несколькими ИИ-моделями, голосование и арбитраж, применение правок.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); }}
          title="Звук по завершении этапов"
          className="shrink-0"
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={resetDraft}
          title="Очистить сохранённый локальный черновик оркестратора"
          className="shrink-0"
        >
          Сбросить черновик
        </Button>
        <Button asChild size="sm" variant="ghost" className="shrink-0">
          <a href="/admin/orchestrator-metrics" target="_blank" rel="noreferrer">Метрики</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>1. Статья</CardTitle>
            <Button size="sm" variant="outline" onClick={openRecheckPicker} className="gap-1">
              <FileSearch className="w-4 h-4" /> Перепроверить опубликованное
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {existingRef && existingRef.kind === "research_reviews" && (
              <div className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300">
                <Users className="w-3 h-3" />
                Научный обзор на консилиуме: «{title}»{researchVoiceMode ? ` · режим голоса: ${researchVoiceMode}` : ""} — после ревью нажмите «Принять и вернуть в научный редактор»
                <button className="ml-auto underline" onClick={() => { setExistingRef(null); setResearchVoiceMode(null); }}>отменить</button>
              </div>
            )}
            {existingRef && existingRef.kind !== "research_reviews" && (
              <div className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                <RefreshCw className="w-3 h-3" />
                Режим перепроверки опубликованной статьи · при «Разместить» обновится существующая запись
                <button className="ml-auto underline" onClick={() => setExistingRef(null)}>отменить</button>
              </div>
            )}
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
            <DictationStudio
              initialTitle={title}
              onAssembled={(cleaned) => { setText(cleaned); }}
            />
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
              onClick={() => runReview()}
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
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span>Прогресс ревью ({Object.values(progress).filter(p => p.status === "done" || p.status === "error").length}/{Object.keys(progress).length})</span>
              <div className="flex items-center gap-2">
                {reviewing && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                {(reviewing || pending.size > 0) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={forceFinishAndConsolidate}
                    title="Не ждать зависшие модели — передать арбитру уже полученные мнения"
                  >
                    <GitMerge className="w-3.5 h-3.5 mr-1.5" /> Досрочно к арбитру
                  </Button>
                )}
              </div>
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
                const isPending = pending.has(modelId) || p.status === "running";
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      disabled={isPending}
                      onClick={() => runReviewOne(modelId)}
                      title="Повторить только эту модель"
                    >
                      {isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <RotateCw className="w-3.5 h-3.5" />}
                    </Button>
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
                onClick={() => runReview({ reReview: true })}
                disabled={reviewing || (!finalText.trim() && !appliedEdits.length && !directAccepted.size && !accepted.size)}
                variant="outline"
                title="Передать моделям уже переписанную статью и исключить принятые правки"
              >
                {reviewing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Идёт…</>
                  : <><RotateCw className="w-4 h-4 mr-2" /> Повторное ревью {reviewRound > 1 ? `(раунд ${reviewRound + 1})` : "(с правками)"}</>}
              </Button>
              {(reviewing || pending.size > 0) && (
                <Button
                  onClick={forceFinishAndConsolidate}
                  variant="secondary"
                  title="Не ждать зависшие модели — передать арбитру уже полученные мнения"
                >
                  <GitMerge className="w-4 h-4 mr-2" /> Досрочно к арбитру ({successReviews.length})
                </Button>
              )}
              <Button
                onClick={() => runConsolidation()}
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground truncate">
                      {r.model}{typeof r.ms === "number" && !r.error ? ` · ${(r.ms / 1000).toFixed(1)}s` : ""}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending.has(r.model)}
                      onClick={() => runReviewOne(r.model)}
                      title="Перезапустить ревью только этой модели"
                    >
                      {pending.has(r.model)
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Идёт…</>
                        : <><RotateCw className="w-3.5 h-3.5 mr-1.5" /> Повторить</>}
                    </Button>
                  </div>
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
                                    onClick={(ev) => ev.stopPropagation()}
                                    onMouseDown={(ev) => ev.stopPropagation()}
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
                const key = `cons::${i}`;
                // Блок 4: анализ маркеров источника этой правки.
                const currentSuggested = getSuggested(key, e.suggested);
                const restore = restoreLostMarkersInSuggestion(e.original || "", currentSuggested);
                const hasLostMarkers = restore.restored.length > 0;
                const isDeletion = !currentSuggested.trim();
                const unrestorable = hasLostMarkers && isDeletion;
                const acceptedWithoutMk = acceptWithoutMarker.has(key);
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
                    className={`p-3 rounded-md border transition-colors ${
                      unrestorable && !acceptedWithoutMk
                        ? "border-red-500 bg-red-500/10 ring-2 ring-red-500/30"
                        : isAccepted
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-border"
                    }`}
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
                                onClick={(ev) => ev.stopPropagation()}
                                onMouseDown={(ev) => ev.stopPropagation()}
                                onKeyDown={(ev) => ev.stopPropagation()}
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

                        {/* Блок 4: восстановление [M#] маркеров */}
                        {hasLostMarkers && !unrestorable && !acceptedWithoutMk && (
                          <div className="text-[11px] px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-300">
                            Маркер {restore.restored.join(", ")} восстановлен автоматически — будет дописан к концу правки.
                          </div>
                        )}
                        {unrestorable && !acceptedWithoutMk && (
                          <div className="space-y-2">
                            <div className="text-[11px] px-2 py-1 rounded bg-red-500/15 border border-red-500/40 text-red-800 dark:text-red-300 font-medium">
                              Правка удаляет предложение с маркером {restore.restored.join(", ")}. Выберите действие.
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  const anchor = window.prompt(
                                    `К какому предложению отнести маркер ${restore.restored.join(" ")}? Введите текст правки:`,
                                    "",
                                  );
                                  if (!anchor?.trim()) return;
                                  const tail = restore.restored.join(" ");
                                  setSuggested(key, `${anchor.trim()} ${tail}`);
                                }}
                              >
                                Вернуть маркер
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  setAcceptWithoutMarker((cur) => new Set(cur).add(key));
                                  setAccepted((cur) => new Set(cur).add(i));
                                }}
                              >
                                Принять без маркера
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  setAccepted((cur) => {
                                    const n = new Set(cur);
                                    n.delete(i);
                                    return n;
                                  });
                                }}
                              >
                                Отклонить правку
                              </Button>
                            </div>
                          </div>
                        )}
                        {acceptedWithoutMk && (
                          <div className="text-[11px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                            <span>Принято без маркера {restore.restored.join(", ")} — метка будет утрачена в тексте.</span>
                            <button
                              type="button"
                              className="underline"
                              onClick={(ev) => {
                                ev.preventDefault();
                                setAcceptWithoutMarker((cur) => {
                                  const n = new Set(cur);
                                  n.delete(key);
                                  return n;
                                });
                              }}
                            >
                              отменить
                            </button>
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
                onClick={() => copyToClipboard(finalText, "Скопировано в буфер")}
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
                variant="outline"
                onClick={translateFinal}
                disabled={translating || !finalText}
                title="Перевести итоговую статью на английский (Gemini)"
              >
                {translating
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Перевод…</>
                  : <><Languages className="w-4 h-4 mr-2" /> Перевести EN</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertGalleryMarker("final")}
                disabled={!finalText}
                title="Вставить блок галереи в конец итогового текста"
              >
                <ImagePlus className="w-4 h-4 mr-2" /> + Галерея
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                disabled={!finalText}
                title="Просмотреть как у пациентов — с форматированием и галереями"
              >
                <Eye className="w-4 h-4 mr-2" /> Превью
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={optimizeSeo}
                disabled={seoLoading || !finalText}
                title="Подобрать заголовок, slug, ключевые слова и категорию до отправки в публикатор"
              >
                {seoLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> SEO…</>
                  : <><Sparkles className="w-4 h-4 mr-2" /> Оптимизировать SEO</>}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (existingRef?.kind === "research_reviews") {
                    void acceptAndReturnToReview();
                    return;
                  }
                  navigate("/admin/article-import", {
                    state: { title, text: finalText, source: "orchestrator", existingRef, seoMeta: seoMeta ?? undefined },
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" /> {existingRef?.kind === "research_reviews" ? "Принять и вернуть в научный редактор" : existingRef ? "Переопубликовать" : "Разместить"}
              </Button>


            </div>
          </CardHeader>
          <CardContent>
            <ArticleDiffEditor original={text} value={finalText} onChange={setFinalText} />

            {seoMeta && (
              <div className="mt-6 border-t pt-6 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> SEO-мета для публикатора
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => setSeoMeta(null)}>
                    Очистить
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Заголовок</label>
                    <Input value={seoMeta.title} onChange={(e) => setSeoMeta({ ...seoMeta, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Slug</label>
                    <Input value={seoMeta.slug} onChange={(e) => setSeoMeta({ ...seoMeta, slug: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Категория / Возраст</label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 h-9 rounded-md border bg-background px-2 text-sm"
                        value={seoMeta.category}
                        onChange={(e) => setSeoMeta({ ...seoMeta, category: e.target.value })}
                      >
                        {Object.entries(seoCategoryLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        value={seoMeta.age_group}
                        onChange={(e) => setSeoMeta({ ...seoMeta, age_group: e.target.value as "children" | "adults" })}
                      >
                        <option value="children">Дети</option>
                        <option value="adults">Взрослые</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Аннотация</label>
                    <Textarea rows={2} value={seoMeta.excerpt} onChange={(e) => setSeoMeta({ ...seoMeta, excerpt: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Ключевые слова (через запятую)</label>
                    <Input
                      value={seoMeta.keywords.join(", ")}
                      onChange={(e) =>
                        setSeoMeta({
                          ...seoMeta,
                          keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                        })
                      }
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {seoMeta.keywords.map((k) => (
                        <Badge key={k} variant="secondary">{k}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Эти поля будут переданы в публикатор — там их можно ещё раз править перед сохранением.
                </p>
              </div>
            )}


            {translation && (
              <div className="mt-6 border-t pt-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Languages className="w-5 h-5 text-emerald-600" /> English version
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const blob = [
                        `# ${translation.title}`,
                        `slug: ${translation.slug}`,
                        `description: ${translation.description}`,
                        `card_annotation: ${translation.card_annotation}`,
                        `seo_title: ${translation.seo_title}`,
                        `seo_description: ${translation.seo_description}`,
                        `keywords: ${translation.keywords.join(", ")}`,
                        ``,
                        translation.content,
                      ].join("\n");
                      copyToClipboard(blob, "Английская версия скопирована целиком");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Копировать всё
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">EN title</label>
                    <Input value={translation.title} onChange={(e) => setTranslation({ ...translation, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">EN slug</label>
                    <Input value={translation.slug} onChange={(e) => setTranslation({ ...translation, slug: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">SEO title (&lt;60)</label>
                    <Input value={translation.seo_title} onChange={(e) => setTranslation({ ...translation, seo_title: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">SEO description (&lt;155)</label>
                    <Textarea rows={2} value={translation.seo_description} onChange={(e) => setTranslation({ ...translation, seo_description: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Keywords (comma-separated)</label>
                    <Input
                      value={translation.keywords.join(", ")}
                      onChange={(e) =>
                        setTranslation({
                          ...translation,
                          keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Card annotation</label>
                    <Textarea rows={2} value={translation.card_annotation} onChange={(e) => setTranslation({ ...translation, card_annotation: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">EN content (markdown)</label>
                    <Textarea
                      rows={14}
                      className="font-mono text-sm"
                      value={translation.content}
                      onChange={(e) => setTranslation({ ...translation, content: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Перевод не сохранён в БД автоматически — скопируйте поля во вкладку «EN» в редакторе
                  статьи, либо разместите русскую версию и нажмите «Перевести» там, чтобы записать в
                  таблицу <code>content_translations</code>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" /> Превью — как увидит пациент
            </DialogTitle>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none">
            {title && <h1>{title}</h1>}
            <MarkdownArticle
              content={finalText}
              articleId={existingRef?.id || "preview"}
              articleSlug="preview"
              isAdmin={false}
              title={title}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Перепроверить опубликованную статью</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Поиск по заголовку…"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
          />
          <div className="max-h-[60vh] overflow-y-auto space-y-1 mt-2">
            {pickerLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : pickerItems.filter((i) => i.title.toLowerCase().includes(pickerQuery.toLowerCase())).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Ничего не найдено</p>
            ) : (
              pickerItems
                .filter((i) => i.title.toLowerCase().includes(pickerQuery.toLowerCase()))
                .map((i) => (
                  <button
                    key={`${i.kind}:${i.id}`}
                    onClick={() => loadForRecheck(i)}
                    className="w-full text-left p-2 rounded hover:bg-accent border border-transparent hover:border-border transition-colors"
                  >
                    <div className="text-sm font-medium truncate">{i.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {i.kind === "disease_articles" ? "Заболевания" : i.kind === "blog_posts" ? "Блог" : "Исследования"}
                      </Badge>
                      <span>Обновлено: {new Date(i.updated_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </button>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Блок 4: финальная сверка маркеров перед применением */}
      <Dialog open={!!pendingApply} onOpenChange={(o) => { if (!o) setPendingApply(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" /> Пропадут маркеры источников
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              Если применить выбранные правки, в тексте пропадут следующие маркеры цитирования:
            </p>
            <div className="p-2 rounded bg-red-500/10 border border-red-500/40 font-mono text-red-700 dark:text-red-300">
              {pendingApply?.lost.join(", ")}
            </div>
            <p className="text-muted-foreground text-xs">
              Вернитесь к правкам, чтобы явно вернуть маркер к нужному предложению
              или принять правку «без маркера».
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingApply(null)}>
              Вернуться к правкам
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const edits = pendingApply?.edits ?? [];
                setPendingApply(null);
                rewriteWithVoice(edits, true);
              }}
            >
              Всё равно применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
