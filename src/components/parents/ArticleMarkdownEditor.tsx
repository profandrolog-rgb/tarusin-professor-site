import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from "react";
import mammoth from "mammoth";
import TurndownService from "turndown";
// @ts-ignore - turndown-plugin-gfm has no types but exports `tables`/`gfm`
import { gfm as turndownGfm } from "turndown-plugin-gfm";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Sparkles,
  ImagePlus,
  Loader2,
  Eye,
  Pencil,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Plug,
  Save,
} from "lucide-react";

import MarkdownArticle from "./MarkdownArticle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GalleryPlaceholder } from "./tiptap/GalleryPlaceholderNode";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown/galleryMarkers";

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Optional: when set, shows a "Save as-is" button that triggers parent save without formatting. */
  onSaveAsIs?: () => void;
  saving?: boolean;
  /** Stable key for the persistent draft row (e.g. article id, or "new" for fresh articles). */
  draftKey?: string;
  /** Article metadata mirrored into the draft so a tab close never loses it. */
  draftMeta?: { title?: string; slug?: string; description?: string; tags?: string; articleId?: string | null };
}

export interface ArticleMarkdownEditorHandle {
  getMarkdown: () => string;
}

const CHUNK_TARGET = 6000;

function splitIntoChunks(text: string, target = CHUNK_TARGET): string[] {
  if (text.length <= target) return [text];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let cur = "";
  const flush = () => { if (cur) { chunks.push(cur); cur = ""; } };
  for (const p of paragraphs) {
    if (!cur) cur = p;
    else if (cur.length + p.length + 2 <= target) cur += "\n\n" + p;
    else { flush(); cur = p; }
    // Never split inside a markdown table — keep the whole block together
    // even if it exceeds 1.5×target.
    const looksLikeTable = /(^|\n)\s*\|.*\|/.test(cur);
    while (!looksLikeTable && cur.length > target * 1.5) {
      const cut = cur.lastIndexOf("\n", target);
      const at = cut > target / 2 ? cut : target;
      chunks.push(cur.slice(0, at));
      cur = cur.slice(at);
    }
  }
  flush();
  return chunks;
}

const ArticleMarkdownEditor = forwardRef<ArticleMarkdownEditorHandle, Props>(({ value, onChange, onSaveAsIs, saving, draftKey, draftMeta }, ref) => {

  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewCtx, setPreviewCtx] = useState<"parents" | "doctors">("parents");
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<{ ok: boolean; text: string } | null>(null);

  // Persistent-draft state (Pkt 1, 2, 5, 6 — save-first, resumable, realtime progress)
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftRow, setDraftRow] = useState<{
    format_status: string;
    format_progress: string | null;
    last_chunk_done: number;
    total_chunks: number;
    error_message: string | null;
    formatted_content: string;
  } | null>(null);
  const effectiveDraftKey = draftKey || draftMeta?.articleId || "new";

  useEffect(() => {
    setDraftId(null);
    setDraftRow(null);
    setConnStatus(null);
    setFormatting(false);
  }, [effectiveDraftKey]);


  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke("test-claude-connection", { body: {} });
      if (error) {
        setConnStatus({ ok: false, text: `❌ Нет связи: ${error.message || "unknown"}` });
      } else if (data?.ok) {
        setConnStatus({ ok: true, text: `✅ Связь с Claude API подтверждена (${data.latencyMs} мс)` });
      } else {
        setConnStatus({ ok: false, text: `❌ Нет связи: ${data?.error || "unknown"}` });
      }
    } catch (e: any) {
      setConnStatus({ ok: false, text: `❌ Нет связи: ${e?.message || "unknown"}` });
    } finally {
      setTestingConn(false);
    }
  };

  // Track last markdown we emitted/received so we don't reset the editor on our own updates.
  const lastSyncedMd = useRef<string>(value);
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      GalleryPlaceholder,
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[420px] px-4 py-3 overflow-visible [&_ul]:list-disc [&_ul]:pl-7 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-7 [&_ol]:my-2 [&_li]:list-item [&_li]:pl-1 [&_li]:my-1 [&_li]:marker:text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      const md = htmlToMarkdown(editor.getHTML());
      lastSyncedMd.current = md;
      isInternalUpdate.current = true;
      onChange(md);
    },
  });

  useImperativeHandle(ref, () => ({
    getMarkdown: () => (editor ? htmlToMarkdown(editor.getHTML()) : value),
  }), [editor, value]);

  // External value changes (e.g., format, .docx import, initial load) → reload editor content.
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (value === lastSyncedMd.current) return;
    lastSyncedMd.current = value;
    const html = markdownToHtml(value);
    editor.commands.setContent(html, { emitUpdate: false });
  }, [value, editor]);

  const handleDocx = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      // Convert to HTML first so tables/lists/bold are preserved, then to GFM markdown.
      const html = await mammoth.convertToHtml({ arrayBuffer: buf });
      const htmlStr = (html.value || "").trim();
      let text = "";
      if (htmlStr) {
        const td = new TurndownService({
          headingStyle: "atx",
          bulletListMarker: "-",
          codeBlockStyle: "fenced",
          emDelimiter: "_",
        });
        td.use(turndownGfm);
        text = td.turndown(htmlStr).trim();
      }
      if (!text) {
        // Fallback to raw text if HTML conversion produced nothing
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        text = (result.value || "").trim();
      }
      if (!text) {
        toast.error("Не удалось извлечь текст из документа");
        return;
      }
      onChange(text);
      toast.success("Текст загружен, проверьте содержимое");
    } catch (e: any) {
      toast.error("Ошибка чтения .docx: " + (e?.message || e));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ---------- Persistent draft (save-first architecture) ----------
  // We mirror the form into Supabase BEFORE any formatting starts. From then on
  // the source of truth is the draft row — closing the tab, refreshing, or any
  // edge timeout cannot lose data.

  // Load existing draft for this key on mount / key change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("disease_article_drafts")
        .select("id, format_status, format_progress, last_chunk_done, total_chunks, error_message, formatted_content")
        .eq("user_id", uid)
        .eq("draft_key", effectiveDraftKey)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setDraftId(data.id);
        setDraftRow({
          format_status: data.format_status,
          format_progress: data.format_progress,
          last_chunk_done: data.last_chunk_done,
          total_chunks: data.total_chunks,
          error_message: data.error_message,
          formatted_content: data.formatted_content || "",
        });
      } else {
        setDraftId(null);
        setDraftRow(null);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveDraftKey]);

  // Realtime subscription on the draft row → live progress / error / resume hint.
  useEffect(() => {
    if (!draftId) return;
    const ch = supabase
      .channel(`disease_article_drafts:${draftId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "disease_article_drafts", filter: `id=eq.${draftId}` },
        (payload) => {
          const r: any = payload.new;
          setDraftRow({
            format_status: r.format_status,
            format_progress: r.format_progress,
            last_chunk_done: r.last_chunk_done,
            total_chunks: r.total_chunks,
            error_message: r.error_message,
            formatted_content: r.formatted_content || "",
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [draftId]);

  // Debounced auto-save of content/tags/description into the draft.
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) return;
        const upsertPayload: any = {
          user_id: uid,
          draft_key: effectiveDraftKey,
          content: value || "",
          title: draftMeta?.title ?? null,
          slug: draftMeta?.slug ?? null,
          description: draftMeta?.description ?? null,
          tags: draftMeta?.tags ?? null,
          article_id: draftMeta?.articleId ?? null,
        };
        const { data, error } = await supabase
          .from("disease_article_drafts")
          .upsert(upsertPayload, { onConflict: "user_id,draft_key" })
          .select("id")
          .maybeSingle();
        if (!error && data?.id && !draftId) setDraftId(data.id);
      } catch (e) {
        console.warn("draft auto-save failed", e);
      }
    }, 800);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, draftMeta?.title, draftMeta?.slug, draftMeta?.description, draftMeta?.tags, draftMeta?.articleId, effectiveDraftKey]);

  /** Ensure a draft row exists right now, return its id (synchronous wait). */
  const ensureDraft = async (chunks: string[]): Promise<string> => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) throw new Error("Требуется авторизация");
    const payload: any = {
      user_id: uid,
      draft_key: effectiveDraftKey,
      content: value || "",
      chunks,
      formatted_content: "",
      format_status: "processing",
      format_progress: `0/${chunks.length}`,
      last_chunk_done: 0,
      total_chunks: chunks.length,
      error_message: null,
      title: draftMeta?.title ?? null,
      slug: draftMeta?.slug ?? null,
      description: draftMeta?.description ?? null,
      tags: draftMeta?.tags ?? null,
      article_id: draftMeta?.articleId ?? null,
    };
    const { data, error } = await supabase
      .from("disease_article_drafts")
      .upsert(payload, { onConflict: "user_id,draft_key" })
      .select("id")
      .maybeSingle();
    if (error || !data) throw new Error("Не удалось создать черновик: " + (error?.message || "unknown"));
    setDraftId(data.id);
    return data.id;
  };

  /** Call the single-chunk edge function with up to (1 + autoRetries) tries. */
  const processChunk = async (dId: string, index: number, total: number, autoRetries = 2): Promise<boolean> => {
    let lastErr = "";
    for (let attempt = 0; attempt <= autoRetries; attempt++) {
      const label = attempt === 0
        ? `Часть ${index + 1}/${total}...`
        : `Часть ${index + 1}/${total} — попытка ${attempt + 1}...`;
      toast.message(label, { id: `fmt-progress-${index}` });
      try {
        const { data, error } = await supabase.functions.invoke("format-disease-article-chunk", {
          body: { draft_id: dId, chunk_index: index },
        });
        if (error) throw new Error(error.message || "network error");
        if (data?.ok) {
          toast.dismiss(`fmt-progress-${index}`);
          return true;
        }
        lastErr = data?.error || "неизвестная ошибка";
      } catch (e: any) {
        lastErr = e?.message || "сетевая ошибка";
      }
      console.warn(`chunk ${index + 1} attempt ${attempt + 1} failed:`, lastErr);
      if (attempt < autoRetries) await new Promise((r) => setTimeout(r, 2500));
    }
    toast.dismiss(`fmt-progress-${index}`);
    toast.error(`Часть ${index + 1} не удалась: ${lastErr}`, {
      id: `fmt-retry-${index}`,
      duration: Infinity,
      action: {
        label: "Повторить",
        onClick: () => { void retrySingleChunk(dId, index, total); },
      },
    });
    return false;
  };

  const retrySingleChunk = async (dId: string, index: number, total: number) => {
    toast.dismiss(`fmt-retry-${index}`);
    setFormatting(true);
    try {
      const ok = await processChunk(dId, index, total);
      if (ok) {
        // continue from this chunk to the end
        for (let i = index + 1; i < total; i++) {
          const okNext = await processChunk(dId, i, total);
          if (!okNext) return;
        }
        await commitFromDraft(dId);
      }
    } finally {
      setFormatting(false);
    }
  };

  const commitFromDraft = async (dId: string) => {
    const { data } = await supabase
      .from("disease_article_drafts")
      .select("formatted_content, total_chunks, last_chunk_done, format_status")
      .eq("id", dId)
      .maybeSingle();
    if (!data) return;
    if (data.format_status === "done" && data.formatted_content) {
      onChange(data.formatted_content.trim());
      toast.success("Текст отформатирован");
    }
  };

  const handleFormat = async () => {
    if (!value.trim()) {
      toast.error("Сначала добавьте текст");
      return;
    }
    setFormatting(true);
    try {
      const chunks = splitIntoChunks(value);
      const dId = await ensureDraft(chunks);
      if (chunks.length > 1) toast.message(`Начато форматирование (${chunks.length} частей)`);
      for (let i = 0; i < chunks.length; i++) {
        const ok = await processChunk(dId, i, chunks.length);
        if (!ok) return; // draft preserves state for resume; form unchanged
      }
      await commitFromDraft(dId);
    } catch (e: any) {
      console.error(e);
      toast.error("Ошибка форматирования: " + (e?.message || "неизвестно"));
    } finally {
      setFormatting(false);
    }
  };

  /** Resume an interrupted job from last_chunk_done + 1. */
  const handleResume = async () => {
    if (!draftId || !draftRow) return;
    setFormatting(true);
    try {
      const start = draftRow.last_chunk_done;
      const total = draftRow.total_chunks;
      if (start >= total) {
        await commitFromDraft(draftId);
        return;
      }
      toast.message(`Возобновление с части ${start + 1}/${total}`);
      for (let i = start; i < total; i++) {
        const ok = await processChunk(draftId, i, total);
        if (!ok) return;
      }
      await commitFromDraft(draftId);
    } finally {
      setFormatting(false);
    }
  };





  const insertGallery = () => {
    if (!galleryCaption.trim()) {
      toast.error("Введите подпись");
      return;
    }
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertGalleryPlaceholder(galleryCaption.trim().replace(/"/g, "'"))
      .run();
    setGalleryCaption("");
    setGalleryOpen(false);
    toast.success("Блок галереи вставлен");
  };

  const promptLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL ссылки", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-30 bg-background border rounded-md shadow-sm">
        <div className="flex flex-wrap gap-2 items-center p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="gap-1.5"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Загрузить .docx
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => handleDocx(e.target.files?.[0] || null)}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConn}
            className="gap-1.5"
            title="Проверить связь с Claude API"
          >
            {testingConn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plug className="w-3.5 h-3.5" />
            )}
            🔌 Тест связи
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => { setConnStatus(null); handleFormat(); }}
            disabled={formatting || !value.trim()}
            className="gap-1.5"
          >
            {formatting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {formatting ? "Форматирую..." : "Форматировать"}
          </Button>

          {/* Resume button — visible when an interrupted job exists */}
          {draftRow &&
            draftRow.total_chunks > 0 &&
            draftRow.last_chunk_done < draftRow.total_chunks &&
            (draftRow.format_status === "error" || draftRow.format_status === "processing") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={formatting}
                className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300"
                title="Продолжить форматирование с прерванной части"
              >
                {formatting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                ▶️ Продолжить ({draftRow.last_chunk_done}/{draftRow.total_chunks})
              </Button>
            )}

          {/* Live progress indicator from realtime draft row */}
          {draftRow && (draftRow.format_status === "processing" || formatting) && draftRow.format_progress && (
            <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900">
              Обработка: {draftRow.format_progress}
            </span>
          )}
          {draftRow?.format_status === "error" && draftRow.error_message && (
            <span className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900" title={draftRow.error_message}>
              ⚠️ {draftRow.error_message.length > 60 ? draftRow.error_message.slice(0, 60) + "…" : draftRow.error_message}
            </span>
          )}

          {onSaveAsIs && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSaveAsIs}
              disabled={saving || !value.trim()}
              className="gap-1.5"
              title="Сохранить текст как есть, без AI-форматирования (для уже готового markdown)"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Сохранить без форматирования
            </Button>
          )}


          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setConnStatus(null); setGalleryOpen(true); }}
            className="gap-1.5"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Галерея
          </Button>

          {connStatus && (
            <span
              className={`text-xs px-2 py-1 rounded-md ${
                connStatus.ok
                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900"
              }`}
            >
              {connStatus.text}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{value.length} симв.</span>
            <div className="flex rounded-md border overflow-hidden">
              <Button
                type="button"
                variant={mode === "edit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("edit")}
                className="gap-1 rounded-none h-8"
              >
                <Pencil className="w-3.5 h-3.5" />
                Редактор
              </Button>
              <Button
                type="button"
                variant={mode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("preview")}
                className="gap-1 rounded-none h-8"
              >
                <Eye className="w-3.5 h-3.5" />
                Предпросмотр
              </Button>
            </div>
          </div>
        </div>
        {mode === "edit" && (
          <div className="border-t">
            <FormattingToolbar editor={editor} onLink={promptLink} />
          </div>
        )}
      </div>

      {mode === "edit" ? (
        <div className="border rounded-md bg-background">
          <EditorContent editor={editor} />
        </div>

      ) : (
        <div className="border rounded-md bg-muted/30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
            <span className="text-xs text-muted-foreground">Контекст:</span>
            <div className="flex rounded-md border overflow-hidden">
              <Button
                type="button"
                variant={previewCtx === "parents" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewCtx("parents")}
                className="rounded-none h-7 text-xs"
              >
                /for-parents/
              </Button>
              <Button
                type="button"
                variant={previewCtx === "doctors" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewCtx("doctors")}
                className="rounded-none h-7 text-xs"
              >
                /for-doctors/
              </Button>
            </div>
          </div>

          {!value.trim() ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Нет содержимого для предпросмотра
            </p>
          ) : previewCtx === "parents" ? (
            <div className="bg-background">
              <div className="bg-primary text-primary-foreground py-6 px-6">
                <div className="text-xs text-primary-foreground/70 mb-2">
                  Главная › Для родителей › Статья
                </div>
                <div className="text-2xl font-bold">Заголовок статьи</div>
              </div>
              <div className="max-w-4xl mx-auto px-6 py-8">
                <MarkdownArticle
                  content={value}
                  articleId="preview"
                  articleSlug="preview"
                  isAdmin={false}
                />
              </div>
            </div>
          ) : (
            <div className="bg-background">
              <div className="bg-slate-800 text-white py-5 px-6 border-b">
                <div className="text-xs text-slate-300 mb-1.5">
                  Главная › Для врачей › Материал
                </div>
                <div className="text-xl font-semibold">Заголовок материала</div>
              </div>
              <div className="max-w-3xl mx-auto px-6 py-8 text-[0.95rem]">
                <MarkdownArticle
                  content={value}
                  articleId="preview"
                  articleSlug="preview"
                  isAdmin={false}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить блок галереи</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Подпись к галерее</Label>
            <Input
              value={galleryCaption}
              onChange={(e) => setGalleryCaption(e.target.value)}
              placeholder="Например: Анатомия: схема строения органа"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertGallery();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Блок вставится в позицию курсора. Фото можно добавить позже прямо на странице статьи.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGalleryOpen(false)}>
              Отмена
            </Button>
            <Button onClick={insertGallery}>Вставить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ArticleMarkdownEditor.displayName = "ArticleMarkdownEditor";

interface ToolbarProps {
  editor: Editor | null;
  onLink: () => void;
}

const TBtn = ({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <Button
    type="button"
    variant={active ? "default" : "ghost"}
    size="sm"
    className="h-8 w-8 p-0"
    onClick={onClick}
    title={title}
    disabled={disabled}
  >
    {children}
  </Button>
);

const FormattingToolbar = ({ editor, onLink }: ToolbarProps) => {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-0.5 items-center px-2 py-1.5 bg-muted/40">
      <TBtn
        title="H1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="H3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="w-4 h-4" />
      </TBtn>
      <div className="w-px h-5 bg-border mx-1" />
      <TBtn
        title="Жирный"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Курсив"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </TBtn>
      <div className="w-px h-5 bg-border mx-1" />
      <TBtn
        title="Маркированный список"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Нумерованный список"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Цитата"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-4 h-4" />
      </TBtn>
      <TBtn title="Ссылка" active={editor.isActive("link")} onClick={onLink}>
        <LinkIcon className="w-4 h-4" />
      </TBtn>
      <div className="w-px h-5 bg-border mx-1" />
      <TBtn
        title="Отменить"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Повторить"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </TBtn>
    </div>
  );
};

export default ArticleMarkdownEditor;
