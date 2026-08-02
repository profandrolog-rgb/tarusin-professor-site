import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Save, Sparkles, Camera, Image as ImageIcon, FileText,
  Database, Trash2, ExternalLink, UploadCloud,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFileDrop } from "@/hooks/useFileDrop";
import { captureVideoFrame, uploadPoster } from "@/lib/video/posters";
import {
  AGE_LABELS, AUDIENCE_LABELS, FORMAT_LABELS, LEVEL_LABELS,
  TRANSCRIPT_STATUS_LABELS, VIDEO_RUBRIC_FALLBACK, formatDuration, slugifyVideo,
} from "@/lib/video/constants";

interface Draft {
  slug: string;
  title: string;
  summary_short: string;
  summary_plain: string;
  seo_title: string;
  seo_description: string;
  video_url: string;
  poster_url: string;
  rubric: string;
  subrubric: string;
  audience: string[];
  age_groups: string[];
  format: string;
  level: string;
  access_level: string;
  tags: string[];
  faq_questions: string[];
  symptom_phrases: string[];
  cluster_slug: string;
  series_slug: string;
  series_order: number | null;
  is_graphic: boolean;
  is_published: boolean;
  sort_order: number | null;
  published_at: string | null;
  transcript: string;
}

const EMPTY: Draft = {
  slug: "", title: "", summary_short: "", summary_plain: "", seo_title: "", seo_description: "",
  video_url: "", poster_url: "", rubric: "", subrubric: "", audience: [], age_groups: [],
  format: "explainer", level: "patient", access_level: "public", tags: [], faq_questions: [],
  symptom_phrases: [], cluster_slug: "", series_slug: "", series_order: null,
  is_graphic: false, is_published: false, sort_order: null, published_at: null, transcript: "",
};

const listToText = (v: string[]) => (v ?? []).join("\n");
const textToList = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

const AdminVideoEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isEditor, loading: authLoading } = useAuth();
  const canEdit = isAdmin || isEditor;

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [rubrics, setRubrics] = useState<Array<{ slug: string; title: string }>>(VIDEO_RUBRIC_FALLBACK);
  const [videoId, setVideoId] = useState<string | null>(isNew ? null : (id ?? null));
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<any>(null);
  const [transcriptStatus, setTranscriptStatus] = useState<string | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!authLoading && !canEdit) navigate("/auth");
  }, [authLoading, canEdit, navigate]);

  useEffect(() => {
    supabase
      .from("video_rubrics")
      .select("slug, title")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data?.length) setRubrics(data as any[]);
      });
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("videos").select("*").eq("id", id!).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast({ title: "Видео не найдено", variant: "destructive" });
        navigate("/admin/videos");
        return;
      }
      const row = data as any;
      setDraft({
        ...EMPTY,
        ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, row[k] ?? EMPTY[k as keyof Draft]])),
      } as Draft);
      setAiDraft(row.ai_draft ?? null);
      setTranscriptStatus(row.transcript_status ?? null);
      setTranscriptError(row.transcript_error ?? null);
      setDuration(row.duration_sec ?? null);
      setVideoId(row.id);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Опрос статуса расшифровки
  useEffect(() => {
    if (transcriptStatus !== "processing" || !videoId) return;
    const timer = setInterval(async () => {
      const { data } = await supabase
        .from("videos")
        .select("transcript, transcript_status, transcript_error, duration_sec")
        .eq("id", videoId)
        .maybeSingle();
      if (!data) return;
      setTranscriptStatus(data.transcript_status ?? null);
      setTranscriptError(data.transcript_error ?? null);
      setDuration(data.duration_sec ?? null);
      if (data.transcript_status !== "processing") {
        setDraft((d) => ({ ...d, transcript: data.transcript ?? d.transcript }));
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [transcriptStatus, videoId]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const seoTitleLen = draft.seo_title.length;
  const seoDescLen = draft.seo_description.length;

  const payload = useMemo(
    () => ({
      ...draft,
      slug: draft.slug || slugifyVideo(draft.title),
      subrubric: draft.subrubric || null,
      cluster_slug: draft.cluster_slug || null,
      series_slug: draft.series_slug || null,
      summary_short: draft.summary_short || null,
      summary_plain: draft.summary_plain || null,
      seo_title: draft.seo_title || null,
      seo_description: draft.seo_description || null,
      poster_url: draft.poster_url || null,
      rubric: draft.rubric || null,
      transcript: draft.transcript || null,
      published_at: draft.published_at || null,
    }),
    [draft],
  );

  const save = async (): Promise<string | null> => {
    if (!draft.title.trim() || !draft.video_url.trim()) {
      toast({ title: "Заполните название и ссылку на видео", variant: "destructive" });
      return null;
    }
    setSaving(true);
    try {
      if (videoId) {
        const { error } = await supabase.from("videos").update(payload as any).eq("id", videoId);
        if (error) throw new Error(error.message);
        toast({ title: "Сохранено" });
        return videoId;
      }
      const { data, error } = await supabase.from("videos").insert(payload as any).select("id").single();
      if (error) throw new Error(error.message);
      setVideoId(data.id);
      toast({ title: "Видео создано" });
      navigate(`/admin/videos/${data.id}`, { replace: true });
      return data.id;
    } catch (e) {
      toast({
        title: "Не удалось сохранить",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const runFunction = async (name: string, label: string) => {
    const id = videoId ?? (await save());
    if (!id) return;
    setBusy(name);
    try {
      const { data, error } = await supabase.functions.invoke(name, { body: { video_id: id } });
      if (error) throw new Error(error.message);
      if (name === "enrich-video" && (data as any)?.ai_draft) setAiDraft((data as any).ai_draft);
      if (name === "transcribe-video") {
        const status = (data as any)?.status ?? "processing";
        setTranscriptStatus(status);
        if (status === "done") {
          const { data: fresh } = await supabase
            .from("videos")
            .select("transcript, duration_sec")
            .eq("id", id)
            .maybeSingle();
          if (fresh) {
            setDraft((d) => ({ ...d, transcript: fresh.transcript ?? "" }));
            setDuration(fresh.duration_sec ?? null);
          }
        }
      }
      toast({ title: `${label}: готово` });
    } catch (e) {
      toast({
        title: `${label}: ошибка`,
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const applyDraftField = (field: keyof Draft, value: any) => {
    if (value == null || value === "") return;
    set(field, value);
  };

  const applyAllFromAi = () => {
    if (!aiDraft) return;
    setDraft((d) => ({
      ...d,
      title: aiDraft.suggested_title || d.title,
      slug: d.slug || aiDraft.suggested_slug || slugifyVideo(aiDraft.suggested_title || d.title),
      summary_short: aiDraft.summary_short || d.summary_short,
      summary_plain: aiDraft.summary_plain || d.summary_plain,
      seo_title: aiDraft.seo_title || d.seo_title,
      seo_description: aiDraft.seo_description || d.seo_description,
      rubric: aiDraft.suggested_rubric || d.rubric,
      subrubric: aiDraft.suggested_subrubric || d.subrubric,
      audience: aiDraft.suggested_audience?.length ? aiDraft.suggested_audience : d.audience,
      age_groups: aiDraft.suggested_age_groups?.length ? aiDraft.suggested_age_groups : d.age_groups,
      tags: aiDraft.suggested_tags?.length ? aiDraft.suggested_tags : d.tags,
      faq_questions: aiDraft.faq_questions?.length ? aiDraft.faq_questions : d.faq_questions,
      symptom_phrases: aiDraft.symptom_phrases?.length ? aiDraft.symptom_phrases : d.symptom_phrases,
    }));
    toast({ title: "Черновик перенесён в поля — проверьте и сохраните" });
  };

  const grabFrame = async () => {
    const el = videoRef.current;
    if (!el) return;
    setBusy("poster");
    try {
      const file = await captureVideoFrame(el, draft.slug || slugifyVideo(draft.title) || "poster");
      const url = await uploadPoster(file, draft.slug || slugifyVideo(draft.title));
      set("poster_url", url);
      toast({ title: "Обложка захвачена и загружена" });
    } catch (e) {
      toast({
        title: "Не удалось захватить кадр",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const uploadPosterFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy("poster");
    try {
      const url = await uploadPoster(file, draft.slug || slugifyVideo(draft.title));
      set("poster_url", url);
      toast({ title: "Обложка загружена" });
    } catch (e) {
      toast({
        title: "Не удалось загрузить обложку",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const { dragOver, handlers } = useFileDrop({ onFiles: uploadPosterFiles, accept: "image/" });

  const remove = async () => {
    if (!videoId) return;
    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Видео удалено" });
    navigate("/admin/videos");
  };

  const toggleInList = (key: "audience" | "age_groups", value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((x) => x !== value) : [...d[key], value],
    }));

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Загрузка…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/admin/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> К списку видео
          </Link>
          <div className="flex flex-wrap gap-2">
            {videoId && draft.is_published && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/video/${draft.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Открыть
                </a>
              </Button>
            )}
            {videoId && (
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Удалить
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Сохранить
            </Button>
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {isNew && !videoId ? "Новое видео" : draft.title || "Видео"}
        </h1>

        <Tabs defaultValue="main" className="mt-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="main">Основное</TabsTrigger>
            <TabsTrigger value="classify">Классификация</TabsTrigger>
            <TabsTrigger value="ai">ИИ и расшифровка</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* ---------- Основное ---------- */}
          <TabsContent value="main" className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input id="title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="slug">Адрес (slug)</Label>
                <div className="flex gap-2">
                  <Input id="slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} placeholder="avtogeneratsiya" />
                  <Button type="button" variant="outline" onClick={() => set("slug", slugifyVideo(draft.title))}>
                    Из названия
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="video_url">Ссылка на видеофайл</Label>
              <Input
                id="video_url"
                value={draft.video_url}
                onChange={(e) => set("video_url", e.target.value)}
                placeholder="https://…/video.mp4"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Прямая ссылка на файл (mp4/webm). {duration ? `Длительность: ${formatDuration(duration)}.` : ""}
              </p>
            </div>

            {draft.video_url && (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  src={draft.video_url}
                  crossOrigin="anonymous"
                  controls
                  preload="metadata"
                  className="aspect-video w-full rounded-xl bg-black"
                />
                <Button type="button" variant="outline" onClick={grabFrame} disabled={busy === "poster"}>
                  {busy === "poster" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                  Взять текущий кадр как обложку
                </Button>
              </div>
            )}

            <div
              {...handlers}
              className={`rounded-xl border-2 border-dashed p-5 transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {draft.poster_url ? (
                    <img src={draft.poster_url} alt="Обложка" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <UploadCloud className="h-4 w-4" /> Обложка
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Перетащите изображение сюда или вставьте из буфера (Ctrl+V).
                  </p>
                  <Input
                    className="mt-2"
                    value={draft.poster_url}
                    onChange={(e) => set("poster_url", e.target.value)}
                    placeholder="URL обложки"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="summary_short">Краткое описание (для карточки)</Label>
              <Textarea id="summary_short" rows={2} value={draft.summary_short} onChange={(e) => set("summary_short", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="summary_plain">Описание простыми словами</Label>
              <Textarea id="summary_plain" rows={5} value={draft.summary_plain} onChange={(e) => set("summary_plain", e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="published_at">Дата публикации</Label>
                <Input
                  id="published_at"
                  type="date"
                  value={draft.published_at ?? ""}
                  onChange={(e) => set("published_at", e.target.value || null)}
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Порядок</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={draft.sort_order ?? ""}
                  onChange={(e) => set("sort_order", e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
              <div className="space-y-3 pt-6">
                <div className="flex items-center gap-3">
                  <Switch id="is_published" checked={draft.is_published} onCheckedChange={(v) => set("is_published", v)} />
                  <Label htmlFor="is_published">Опубликовано</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="is_graphic" checked={draft.is_graphic} onCheckedChange={(v) => set("is_graphic", v)} />
                  <Label htmlFor="is_graphic">Медицинские изображения</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ---------- Классификация ---------- */}
          <TabsContent value="classify" className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Раздел</Label>
                <Select value={draft.rubric || "none"} onValueChange={(v) => set("rubric", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Раздел" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без раздела</SelectItem>
                    {rubrics.map((r) => (
                      <SelectItem key={r.slug} value={r.slug}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subrubric">Подраздел</Label>
                <Input id="subrubric" value={draft.subrubric} onChange={(e) => set("subrubric", e.target.value)} />
              </div>
              <div>
                <Label>Формат</Label>
                <Select value={draft.format} onValueChange={(v) => set("format", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Уровень</Label>
                <Select value={draft.level} onValueChange={(v) => set("level", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Доступ</Label>
                <Select value={draft.access_level} onValueChange={(v) => set("access_level", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Открытый</SelectItem>
                    <SelectItem value="pro">Только для врачей (админ/редактор)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cluster_slug">Кластер (склейка дублей)</Label>
                <Input id="cluster_slug" value={draft.cluster_slug} onChange={(e) => set("cluster_slug", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="series_slug">Серия</Label>
                <Input id="series_slug" value={draft.series_slug} onChange={(e) => set("series_slug", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="series_order">Номер в серии</Label>
                <Input
                  id="series_order"
                  type="number"
                  value={draft.series_order ?? ""}
                  onChange={(e) => set("series_order", e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label>Аудитория</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleInList("audience", k)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      draft.audience.includes(k)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Возрастные группы</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(AGE_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleInList("age_groups", k)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      draft.age_groups.includes(k)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="tags">Теги (по строке)</Label>
                <Textarea id="tags" rows={5} value={listToText(draft.tags)} onChange={(e) => set("tags", textToList(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="faq">Вопросы пациента (по строке)</Label>
                <Textarea id="faq" rows={5} value={listToText(draft.faq_questions)} onChange={(e) => set("faq_questions", textToList(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="phrases">Формулировки жалоб (по строке)</Label>
                <Textarea id="phrases" rows={5} value={listToText(draft.symptom_phrases)} onChange={(e) => set("symptom_phrases", textToList(e.target.value))} />
              </div>
            </div>
          </TabsContent>

          {/* ---------- ИИ ---------- */}
          <TabsContent value="ai" className="space-y-6 pt-6">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => runFunction("transcribe-video", "Расшифровка")} disabled={busy !== null}>
                {busy === "transcribe-video" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Расшифровать
              </Button>
              <Button variant="outline" onClick={() => runFunction("enrich-video", "Черновик ИИ")} disabled={busy !== null}>
                {busy === "enrich-video" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Черновик описаний
              </Button>
              <Button variant="outline" onClick={() => runFunction("index-video", "Индексация")} disabled={busy !== null}>
                {busy === "index-video" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                Индексировать для поиска
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {TRANSCRIPT_STATUS_LABELS[transcriptStatus ?? "pending"] ?? transcriptStatus}
              </Badge>
              {transcriptStatus === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
              {transcriptError && <span className="text-destructive">{transcriptError}</span>}
            </div>

            {aiDraft && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">
                    Черновик ИИ{" "}
                    {aiDraft.confidence != null && (
                      <span className="text-sm text-muted-foreground">
                        (уверенность {Math.round(Number(aiDraft.confidence) * 100)}%)
                      </span>
                    )}
                  </p>
                  <Button size="sm" onClick={applyAllFromAi}>Перенести всё в поля</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Черновик не публикуется сам. Переносите значения и правьте вручную.
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    ["Название", "suggested_title", "title"],
                    ["Slug", "suggested_slug", "slug"],
                    ["Кратко", "summary_short", "summary_short"],
                    ["Простыми словами", "summary_plain", "summary_plain"],
                    ["SEO title", "seo_title", "seo_title"],
                    ["SEO description", "seo_description", "seo_description"],
                  ].map(([label, aiKey, field]) => (
                    aiDraft[aiKey as string] ? (
                      <div key={aiKey as string} className="flex items-start gap-3 rounded-lg bg-background p-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase text-muted-foreground">{label}</p>
                          <p className="text-foreground">{String(aiDraft[aiKey as string])}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyDraftField(field as keyof Draft, aiDraft[aiKey as string])}
                        >
                          Взять
                        </Button>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="transcript">Расшифровка (можно вставить вручную)</Label>
              <Textarea
                id="transcript"
                rows={14}
                value={draft.transcript}
                onChange={(e) => set("transcript", e.target.value)}
                placeholder="Текст расшифровки видео"
              />
            </div>
          </TabsContent>

          {/* ---------- SEO ---------- */}
          <TabsContent value="seo" className="space-y-5 pt-6">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seo_title">SEO title</Label>
                <span className={`text-xs ${seoTitleLen > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                  {seoTitleLen} / 60 (рекомендация)
                </span>
              </div>
              <Input id="seo_title" value={draft.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seo_description">SEO description</Label>
                <span className={`text-xs ${seoDescLen > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                  {seoDescLen} / 160 (рекомендация)
                </span>
              </div>
              <Textarea id="seo_description" rows={3} value={draft.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Адрес страницы: <code>/video/{draft.slug || slugifyVideo(draft.title) || "…"}</code>
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить видео?</AlertDialogTitle>
            <AlertDialogDescription>
              Запись, расшифровка и индекс поиска будут удалены. Файл видео останется в хранилище.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVideoEditor;
