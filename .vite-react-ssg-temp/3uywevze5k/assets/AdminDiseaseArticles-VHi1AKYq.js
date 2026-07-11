import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, forwardRef, useRef, useEffect, useImperativeHandle, useCallback } from "react";
import { useNavigate, Link as Link$2 } from "react-router-dom";
import { B as Button, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, I as Input, l as DialogFooter, s as supabase, b as Badge, T as Textarea, n as cn, t as toast$1, u as useAuth, C as Card, a as CardContent } from "../main.mjs";
import { Image, Pencil, Loader2, Upload, Plug, Sparkles, Save, ImagePlus, Eye, Heading1, Heading2, Heading3, Bold, Italic, List, ListOrdered, Quote, Link as Link$1, Undo, Redo, Languages, EyeOff, Trash2, ArrowLeft, LayoutGrid, Plus, Video, Headphones, FileText, X } from "lucide-react";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-B9yOFgqE.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import mammoth from "mammoth";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { ReactNodeViewRenderer, NodeViewWrapper, useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { M as MarkdownArticle } from "./MarkdownArticle-VHzx3tCj.js";
import { toast } from "sonner";
import { Node, mergeAttributes } from "@tiptap/core";
import { m as markdownToHtml, h as htmlToMarkdown, a as mergePersistedGalleryFiles } from "./galleryMarkers-BtRCpzSB.js";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { B as BentoImageCell, D as DiseaseBentoCard } from "./DiseaseBentoCard-Di1W66C4.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "react-i18next";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-select";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-tabs";
import "react-markdown";
import "remark-gfm";
import "rehype-raw";
import "@dnd-kit/core";
import "@dnd-kit/sortable";
import "@dnd-kit/utilities";
import "react-image-crop";
import "marked";
const GalleryView = ({ node, updateAttributes, editor }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(node.attrs.caption || "");
  const editable = editor.isEditable;
  const caption = node.attrs.caption || "Без подписи";
  return /* @__PURE__ */ jsxs(
    NodeViewWrapper,
    {
      as: "div",
      contentEditable: false,
      className: "my-4 flex items-center gap-3 px-4 bg-slate-50 select-none",
      style: {
        height: 80,
        border: "2px dashed #E2EBF5",
        borderRadius: 8
      },
      "data-gallery-placeholder": "",
      "data-caption": node.attrs.caption || "",
      "data-files": node.attrs.files || "",
      children: [
        /* @__PURE__ */ jsx(Image, { className: "w-6 h-6 shrink-0 text-slate-500" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wider text-slate-500", children: "Галерея" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-slate-800 truncate", children: caption })
        ] }),
        editable && /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            className: "gap-1.5 shrink-0 bg-white",
            onClick: () => {
              setDraft(node.attrs.caption || "");
              setOpen(true);
            },
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }),
              "Изменить подпись"
            ]
          }
        ),
        /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Подпись к галерее" }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Подпись" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: draft,
                onChange: (e) => setDraft(e.target.value),
                autoFocus: true,
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateAttributes({ caption: draft.trim() });
                    setOpen(false);
                  }
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Отмена" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => {
                  updateAttributes({ caption: draft.trim() });
                  setOpen(false);
                },
                children: "Сохранить"
              }
            )
          ] })
        ] }) })
      ]
    }
  );
};
const GalleryPlaceholder = Node.create({
  name: "galleryPlaceholder",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      caption: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-caption") || "",
        renderHTML: (attrs) => ({ "data-caption": attrs.caption || "" })
      },
      files: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-files") || "",
        // ВАЖНО: всегда отдаём data-files, даже пустой — иначе TipTap может выкинуть
        // атрибут при сериализации и список файлов потеряется.
        renderHTML: (attrs) => ({ "data-files": attrs.files ?? "" })
      }
    };
  },
  parseHTML() {
    return [
      { tag: "div[data-gallery-placeholder]" },
      { tag: 'div[data-type="galleryPlaceholder"]' }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-gallery-placeholder": "",
        "data-type": "galleryPlaceholder"
      })
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(GalleryView);
  },
  addCommands() {
    return {
      insertGalleryPlaceholder: (caption) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: { caption }
      })
    };
  }
});
const CHUNK_TARGET = 6e3;
function splitIntoChunks(text, target = CHUNK_TARGET) {
  if (text.length <= target) return [text];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let cur = "";
  const flush = () => {
    if (cur) {
      chunks.push(cur);
      cur = "";
    }
  };
  for (const p of paragraphs) {
    if (!cur) cur = p;
    else if (cur.length + p.length + 2 <= target) cur += "\n\n" + p;
    else {
      flush();
      cur = p;
    }
    const looksLikeTable = /(^|\n)\s*\|.*\|/.test(cur);
    const hasOpenGallery = /\[\[GALLERY:[^\]]*$/.test(cur);
    while (!looksLikeTable && !hasOpenGallery && cur.length > target * 1.5) {
      const cut = cur.lastIndexOf("\n", target);
      const at = cut > target / 2 ? cut : target;
      chunks.push(cur.slice(0, at));
      cur = cur.slice(at);
    }
  }
  flush();
  return chunks;
}
const ArticleMarkdownEditor = forwardRef(({ value, onChange, onSaveAsIs, saving, draftKey, draftMeta }, ref) => {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [mode, setMode] = useState("edit");
  const [previewCtx, setPreviewCtx] = useState("parents");
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [draftRow, setDraftRow] = useState(null);
  const effectiveDraftKey = draftKey || (draftMeta == null ? void 0 : draftMeta.articleId) || "new";
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
      } else if (data == null ? void 0 : data.ok) {
        setConnStatus({ ok: true, text: `✅ Связь с Claude API подтверждена (${data.latencyMs} мс)` });
      } else {
        setConnStatus({ ok: false, text: `❌ Нет связи: ${(data == null ? void 0 : data.error) || "unknown"}` });
      }
    } catch (e) {
      setConnStatus({ ok: false, text: `❌ Нет связи: ${(e == null ? void 0 : e.message) || "unknown"}` });
    } finally {
      setTestingConn(false);
    }
  };
  const lastSyncedMd = useRef(value);
  const isInternalUpdate = useRef(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false, HTMLAttributes: { class: "tiptap-table" } }),
      TableRow,
      TableHeader,
      TableCell,
      GalleryPlaceholder
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[560px] px-4 py-3 overflow-visible [&_ul]:list-disc [&_ul]:pl-7 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-7 [&_ol]:my-2 [&_li]:list-item [&_li]:pl-1 [&_li]:my-1 [&_li]:marker:text-foreground"
      }
    },
    onUpdate: ({ editor: editor2 }) => {
      const md = htmlToMarkdown(editor2.getHTML());
      lastSyncedMd.current = md;
      isInternalUpdate.current = true;
      onChange(md);
    }
  });
  useImperativeHandle(ref, () => ({
    getMarkdown: () => editor ? htmlToMarkdown(editor.getHTML()) : value
  }), [editor, value]);
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
  const handleDocx = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const html = await mammoth.convertToHtml({ arrayBuffer: buf });
      const htmlStr = (html.value || "").trim();
      let text = "";
      if (htmlStr) {
        const td = new TurndownService({
          headingStyle: "atx",
          bulletListMarker: "-",
          codeBlockStyle: "fenced",
          emDelimiter: "_"
        });
        td.use(gfm);
        text = td.turndown(htmlStr).trim();
      }
      if (!text) {
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        text = (result.value || "").trim();
      }
      if (!text) {
        toast.error("Не удалось извлечь текст из документа");
        return;
      }
      onChange(text);
      toast.success("Текст загружен, проверьте содержимое");
    } catch (e) {
      toast.error("Ошибка чтения .docx: " + ((e == null ? void 0 : e.message) || e));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      var _a, _b;
      const { data: sess } = await supabase.auth.getSession();
      const uid = (_b = (_a = sess.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id;
      if (!uid) return;
      const { data } = await supabase.from("disease_article_drafts").select("id, format_status, format_progress, last_chunk_done, total_chunks, error_message, formatted_content").eq("user_id", uid).eq("draft_key", effectiveDraftKey).maybeSingle();
      if (cancelled) return;
      if (data) {
        setDraftId(data.id);
        setDraftRow({
          format_status: data.format_status,
          format_progress: data.format_progress,
          last_chunk_done: data.last_chunk_done,
          total_chunks: data.total_chunks,
          error_message: data.error_message,
          formatted_content: data.formatted_content || ""
        });
      } else {
        setDraftId(null);
        setDraftRow(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveDraftKey]);
  useEffect(() => {
    if (!draftId) return;
    const ch = supabase.channel(`disease_article_drafts:${draftId}`).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "disease_article_drafts", filter: `id=eq.${draftId}` },
      (payload) => {
        const r = payload.new;
        setDraftRow({
          format_status: r.format_status,
          format_progress: r.format_progress,
          last_chunk_done: r.last_chunk_done,
          total_chunks: r.total_chunks,
          error_message: r.error_message,
          formatted_content: r.formatted_content || ""
        });
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [draftId]);
  const saveTimer = useRef(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      var _a, _b;
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = (_b = (_a = sess.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id;
        if (!uid) return;
        const upsertPayload = {
          user_id: uid,
          draft_key: effectiveDraftKey,
          content: value || "",
          title: (draftMeta == null ? void 0 : draftMeta.title) ?? null,
          slug: (draftMeta == null ? void 0 : draftMeta.slug) ?? null,
          description: (draftMeta == null ? void 0 : draftMeta.description) ?? null,
          tags: (draftMeta == null ? void 0 : draftMeta.tags) ?? null,
          article_id: (draftMeta == null ? void 0 : draftMeta.articleId) ?? null
        };
        const { data, error } = await supabase.from("disease_article_drafts").upsert(upsertPayload, { onConflict: "user_id,draft_key" }).select("id").maybeSingle();
        if (!error && (data == null ? void 0 : data.id) && !draftId) setDraftId(data.id);
      } catch (e) {
        console.warn("draft auto-save failed", e);
      }
    }, 800);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [value, draftMeta == null ? void 0 : draftMeta.title, draftMeta == null ? void 0 : draftMeta.slug, draftMeta == null ? void 0 : draftMeta.description, draftMeta == null ? void 0 : draftMeta.tags, draftMeta == null ? void 0 : draftMeta.articleId, effectiveDraftKey]);
  const ensureDraft = async (chunks) => {
    var _a, _b;
    const { data: sess } = await supabase.auth.getSession();
    const uid = (_b = (_a = sess.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id;
    if (!uid) throw new Error("Требуется авторизация");
    const payload = {
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
      title: (draftMeta == null ? void 0 : draftMeta.title) ?? null,
      slug: (draftMeta == null ? void 0 : draftMeta.slug) ?? null,
      description: (draftMeta == null ? void 0 : draftMeta.description) ?? null,
      tags: (draftMeta == null ? void 0 : draftMeta.tags) ?? null,
      article_id: (draftMeta == null ? void 0 : draftMeta.articleId) ?? null
    };
    const { data, error } = await supabase.from("disease_article_drafts").upsert(payload, { onConflict: "user_id,draft_key" }).select("id").maybeSingle();
    if (error || !data) throw new Error("Не удалось создать черновик: " + ((error == null ? void 0 : error.message) || "unknown"));
    setDraftId(data.id);
    return data.id;
  };
  const processChunk = async (dId, index, total, autoRetries = 2) => {
    let lastErr = "";
    for (let attempt = 0; attempt <= autoRetries; attempt++) {
      const label = attempt === 0 ? `Часть ${index + 1}/${total}...` : `Часть ${index + 1}/${total} — попытка ${attempt + 1}...`;
      toast.message(label, { id: `fmt-progress-${index}` });
      try {
        const { data, error } = await supabase.functions.invoke("format-disease-article-chunk", {
          body: { draft_id: dId, chunk_index: index }
        });
        if (error) throw new Error(error.message || "network error");
        if (data == null ? void 0 : data.ok) {
          toast.dismiss(`fmt-progress-${index}`);
          return true;
        }
        lastErr = (data == null ? void 0 : data.error) || "неизвестная ошибка";
      } catch (e) {
        lastErr = (e == null ? void 0 : e.message) || "сетевая ошибка";
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
        onClick: () => {
          void retrySingleChunk(dId, index, total);
        }
      }
    });
    return false;
  };
  const retrySingleChunk = async (dId, index, total) => {
    toast.dismiss(`fmt-retry-${index}`);
    setFormatting(true);
    try {
      const ok = await processChunk(dId, index, total);
      if (ok) {
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
  const commitFromDraft = async (dId) => {
    const { data } = await supabase.from("disease_article_drafts").select("formatted_content, total_chunks, last_chunk_done, format_status").eq("id", dId).maybeSingle();
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
        if (!ok) return;
      }
      await commitFromDraft(dId);
    } catch (e) {
      console.error(e);
      toast.error("Ошибка форматирования: " + ((e == null ? void 0 : e.message) || "неизвестно"));
    } finally {
      setFormatting(false);
    }
  };
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
    editor.chain().focus().insertGalleryPlaceholder(galleryCaption.trim().replace(/"/g, "'")).run();
    setGalleryCaption("");
    setGalleryOpen(false);
    toast.success("Блок галереи вставлен");
  };
  const promptLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL ссылки", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-30 bg-background border rounded-md shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 items-center p-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: () => {
              var _a;
              return (_a = fileRef.current) == null ? void 0 : _a.click();
            },
            disabled: importing,
            className: "gap-1.5",
            children: [
              importing ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5" }),
              "Загрузить .docx"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: fileRef,
            type: "file",
            accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            className: "hidden",
            onChange: (e) => {
              var _a;
              return handleDocx(((_a = e.target.files) == null ? void 0 : _a[0]) || null);
            }
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: handleTestConnection,
            disabled: testingConn,
            className: "gap-1.5",
            title: "Проверить связь с Claude API",
            children: [
              testingConn ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Plug, { className: "w-3.5 h-3.5" }),
              "🔌 Тест связи"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "default",
            size: "sm",
            onClick: () => {
              setConnStatus(null);
              handleFormat();
            },
            disabled: formatting || !value.trim(),
            className: "gap-1.5",
            children: [
              formatting ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
              formatting ? "Форматирую..." : "Форматировать"
            ]
          }
        ),
        draftRow && draftRow.total_chunks > 0 && draftRow.last_chunk_done < draftRow.total_chunks && (draftRow.format_status === "error" || draftRow.format_status === "processing") && /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: handleResume,
            disabled: formatting,
            className: "gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300",
            title: "Продолжить форматирование с прерванной части",
            children: [
              formatting ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
              "▶️ Продолжить (",
              draftRow.last_chunk_done,
              "/",
              draftRow.total_chunks,
              ")"
            ]
          }
        ),
        draftRow && (draftRow.format_status === "processing" || formatting) && draftRow.format_progress && /* @__PURE__ */ jsxs("span", { className: "text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900", children: [
          "Обработка: ",
          draftRow.format_progress
        ] }),
        (draftRow == null ? void 0 : draftRow.format_status) === "error" && draftRow.error_message && /* @__PURE__ */ jsxs("span", { className: "text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900", title: draftRow.error_message, children: [
          "⚠️ ",
          draftRow.error_message.length > 60 ? draftRow.error_message.slice(0, 60) + "…" : draftRow.error_message
        ] }),
        onSaveAsIs && /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "secondary",
            size: "sm",
            onClick: onSaveAsIs,
            disabled: saving || !value.trim(),
            className: "gap-1.5",
            title: "Сохранить текст как есть, без AI-форматирования (для уже готового markdown)",
            children: [
              saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-3.5 h-3.5" }),
              "Сохранить без форматирования"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: () => {
              setConnStatus(null);
              setGalleryOpen(true);
            },
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsx(ImagePlus, { className: "w-3.5 h-3.5" }),
              "Галерея"
            ]
          }
        ),
        connStatus && /* @__PURE__ */ jsx(
          "span",
          {
            className: `text-xs px-2 py-1 rounded-md ${connStatus.ok ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900" : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900"}`,
            children: connStatus.text
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            value.length,
            " симв."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex rounded-md border overflow-hidden", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: mode === "edit" ? "default" : "ghost",
                size: "sm",
                onClick: () => setMode("edit"),
                className: "gap-1 rounded-none h-8",
                children: [
                  /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }),
                  "Редактор"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: mode === "preview" ? "default" : "ghost",
                size: "sm",
                onClick: () => setMode("preview"),
                className: "gap-1 rounded-none h-8",
                children: [
                  /* @__PURE__ */ jsx(Eye, { className: "w-3.5 h-3.5" }),
                  "Предпросмотр"
                ]
              }
            )
          ] })
        ] })
      ] }),
      mode === "edit" && /* @__PURE__ */ jsx("div", { className: "border-t", children: /* @__PURE__ */ jsx(FormattingToolbar, { editor, onLink: promptLink }) })
    ] }),
    mode === "edit" ? /* @__PURE__ */ jsx("div", { className: "border rounded-md bg-background", children: /* @__PURE__ */ jsx(EditorContent, { editor }) }) : /* @__PURE__ */ jsxs("div", { className: "border rounded-md bg-muted/30 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-b bg-background", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Контекст:" }),
        /* @__PURE__ */ jsxs("div", { className: "flex rounded-md border overflow-hidden", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: previewCtx === "parents" ? "default" : "ghost",
              size: "sm",
              onClick: () => setPreviewCtx("parents"),
              className: "rounded-none h-7 text-xs",
              children: "/for-parents/"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: previewCtx === "doctors" ? "default" : "ghost",
              size: "sm",
              onClick: () => setPreviewCtx("doctors"),
              className: "rounded-none h-7 text-xs",
              children: "/for-doctors/"
            }
          )
        ] })
      ] }),
      !value.trim() ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-12", children: "Нет содержимого для предпросмотра" }) : previewCtx === "parents" ? /* @__PURE__ */ jsxs("div", { className: "bg-background", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-primary text-primary-foreground py-6 px-6", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-primary-foreground/70 mb-2", children: "Главная › Для родителей › Статья" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: "Заголовок статьи" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto px-6 py-8", children: /* @__PURE__ */ jsx(
          MarkdownArticle,
          {
            content: value,
            articleId: "preview",
            articleSlug: "preview",
            isAdmin: false
          }
        ) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-background", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-800 text-white py-5 px-6 border-b", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-300 mb-1.5", children: "Главная › Для врачей › Материал" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-semibold", children: "Заголовок материала" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto px-6 py-8 text-[0.95rem]", children: /* @__PURE__ */ jsx(
          MarkdownArticle,
          {
            content: value,
            articleId: "preview",
            articleSlug: "preview",
            isAdmin: false
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: galleryOpen, onOpenChange: setGalleryOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Вставить блок галереи" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Подпись к галерее" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: galleryCaption,
            onChange: (e) => setGalleryCaption(e.target.value),
            placeholder: "Например: Анатомия: схема строения органа",
            autoFocus: true,
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertGallery();
              }
            }
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Блок вставится в позицию курсора. Фото можно добавить позже прямо на странице статьи." })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setGalleryOpen(false), children: "Отмена" }),
        /* @__PURE__ */ jsx(Button, { onClick: insertGallery, children: "Вставить" })
      ] })
    ] }) })
  ] });
});
ArticleMarkdownEditor.displayName = "ArticleMarkdownEditor";
const TBtn = ({
  active,
  onClick,
  title,
  children,
  disabled
}) => /* @__PURE__ */ jsx(
  Button,
  {
    type: "button",
    variant: active ? "default" : "ghost",
    size: "sm",
    className: "h-8 w-8 p-0",
    onClick,
    title,
    disabled,
    children
  }
);
const FormattingToolbar = ({ editor, onLink }) => {
  if (!editor) return null;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-0.5 items-center px-2 py-1.5 bg-muted/40", children: [
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "H1",
        active: editor.isActive("heading", { level: 1 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        children: /* @__PURE__ */ jsx(Heading1, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "H2",
        active: editor.isActive("heading", { level: 2 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        children: /* @__PURE__ */ jsx(Heading2, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "H3",
        active: editor.isActive("heading", { level: 3 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        children: /* @__PURE__ */ jsx(Heading3, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "w-px h-5 bg-border mx-1" }),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "Жирный",
        active: editor.isActive("bold"),
        onClick: () => editor.chain().focus().toggleBold().run(),
        children: /* @__PURE__ */ jsx(Bold, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "Курсив",
        active: editor.isActive("italic"),
        onClick: () => editor.chain().focus().toggleItalic().run(),
        children: /* @__PURE__ */ jsx(Italic, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "w-px h-5 bg-border mx-1" }),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "Маркированный список",
        active: editor.isActive("bulletList"),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "Нумерованный список",
        active: editor.isActive("orderedList"),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        children: /* @__PURE__ */ jsx(ListOrdered, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "Цитата",
        active: editor.isActive("blockquote"),
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        children: /* @__PURE__ */ jsx(Quote, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(TBtn, { title: "Ссылка", active: editor.isActive("link"), onClick: onLink, children: /* @__PURE__ */ jsx(Link$1, { className: "w-4 h-4" }) }),
    /* @__PURE__ */ jsx("div", { className: "w-px h-5 bg-border mx-1" }),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "Отменить",
        onClick: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
        children: /* @__PURE__ */ jsx(Undo, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      TBtn,
      {
        title: "Повторить",
        onClick: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
        children: /* @__PURE__ */ jsx(Redo, { className: "w-4 h-4" })
      }
    )
  ] });
};
const empty = {
  title: "",
  slug: "",
  description: "",
  card_annotation: "",
  content: "",
  keywords: [],
  seo_title: "",
  seo_description: "",
  status: "draft"
};
function EnTranslationPanel({ entity_type, entity_id }) {
  const [row, setRow] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  useEffect(() => {
    if (!entity_id) {
      setRow(empty);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("content_translations").select("*").eq("entity_type", entity_type).eq("entity_id", entity_id).eq("locale", "en").maybeSingle();
      if (cancelled) return;
      if (data) {
        setRow({
          id: data.id,
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          card_annotation: data.card_annotation || "",
          content: data.content || "",
          keywords: data.keywords || [],
          seo_title: data.seo_title || "",
          seo_description: data.seo_description || "",
          status: data.status || "draft"
        });
      } else {
        setRow(empty);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entity_type, entity_id]);
  async function autoTranslate() {
    if (!entity_id) {
      toast.error("Сначала сохраните русскую версию статьи");
      return;
    }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { entity_type, entity_id, publish: row.status === "published" }
      });
      if (error) throw error;
      const t = data == null ? void 0 : data.translation;
      if (!t) throw new Error("Empty response");
      setRow({
        id: t.id,
        title: t.title || "",
        slug: t.slug || "",
        description: t.description || "",
        card_annotation: t.card_annotation || "",
        content: t.content || "",
        keywords: t.keywords || [],
        seo_title: t.seo_title || "",
        seo_description: t.seo_description || "",
        status: t.status || "draft"
      });
      toast.success("Перевод готов и сохранён как черновик");
    } catch (e) {
      toast.error("Не удалось перевести", { description: (e == null ? void 0 : e.message) || String(e) });
    } finally {
      setTranslating(false);
    }
  }
  async function save(nextStatus) {
    if (!entity_id) {
      toast.error("Сначала сохраните русскую версию статьи");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        entity_type,
        entity_id,
        locale: "en",
        title: row.title || null,
        slug: row.slug || null,
        description: row.description || null,
        card_annotation: row.card_annotation || null,
        content: row.content || null,
        keywords: row.keywords,
        seo_title: row.seo_title || null,
        seo_description: row.seo_description || null,
        status: nextStatus || row.status,
        auto_generated: false
      };
      const { data, error } = await supabase.from("content_translations").upsert(payload, { onConflict: "entity_type,entity_id,locale" }).select().single();
      if (error) throw error;
      setRow((cur) => ({ ...cur, id: data.id, status: data.status }));
      toast.success(
        nextStatus === "published" ? "Английская версия опубликована" : nextStatus === "draft" ? "Снято с публикации" : "Сохранено"
      );
    } catch (e) {
      toast.error("Не удалось сохранить", { description: (e == null ? void 0 : e.message) || String(e) });
    } finally {
      setSaving(false);
    }
  }
  if (!entity_id) {
    return /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground p-4 border border-dashed rounded-lg", children: "Сохраните русскую версию, чтобы добавить английский перевод." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Languages, { className: "w-4 h-4 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "English version" }),
        /* @__PURE__ */ jsx(Badge, { variant: row.status === "published" ? "default" : "outline", children: row.status === "published" ? "Published" : "Draft" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: autoTranslate, disabled: translating || loading, children: [
          translating ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Languages, { className: "w-4 h-4 mr-2" }),
          "Auto-translate"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => save(), disabled: saving, children: [
          saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : null,
          "Save draft"
        ] }),
        row.status === "published" ? /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => save("draft"), disabled: saving, children: [
          /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4 mr-2" }),
          " Unpublish"
        ] }) : /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => save("published"), disabled: saving, children: [
          /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
          " Publish EN"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "EN title" }),
        /* @__PURE__ */ jsx(Input, { value: row.title, onChange: (e) => setRow({ ...row, title: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "EN slug" }),
        /* @__PURE__ */ jsx(Input, { value: row.slug, onChange: (e) => setRow({ ...row, slug: e.target.value }), placeholder: "varicocele-in-adolescents" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "SEO title (<60 chars)" }),
        /* @__PURE__ */ jsx(Input, { value: row.seo_title, onChange: (e) => setRow({ ...row, seo_title: e.target.value }), maxLength: 70 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "SEO description (<155 chars)" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            value: row.seo_description,
            onChange: (e) => setRow({ ...row, seo_description: e.target.value }),
            maxLength: 200
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: 'Keywords (comma-separated — for <meta name="keywords">)' }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: row.keywords.join(", "),
            onChange: (e) => setRow({
              ...row,
              keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
            }),
            placeholder: "pediatric urology, varicocele, adolescent fertility"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Short description" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: row.description, onChange: (e) => setRow({ ...row, description: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Card annotation (shown under the card title)" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            maxLength: 200,
            value: row.card_annotation,
            onChange: (e) => setRow({ ...row, card_annotation: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "EN content (markdown / HTML — same formatting as RU)" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 16,
            className: "font-mono text-sm",
            value: row.content,
            onChange: (e) => setRow({ ...row, content: e.target.value })
          }
        )
      ] })
    ] }),
    loading && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
      " Загружаем перевод…"
    ] })
  ] });
}
const Slider = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(
  SliderPrimitive.Root,
  {
    ref,
    className: cn("relative flex w-full touch-none select-none items-center", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx(SliderPrimitive.Track, { className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsx(SliderPrimitive.Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" })
    ]
  }
));
Slider.displayName = SliderPrimitive.Root.displayName;
const BentoImageEditor = ({ value, onChange, label }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const frameRef = useRef(null);
  const dragging = useRef(false);
  const handleFile = async (file) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `bento/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("disease-media").upload(path, file);
      if (error) throw error;
      onChange({ path, x: 50, y: 50, zoom: 100 });
    } catch (e) {
      toast$1({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  const updatePos = (clientX, clientY) => {
    if (!frameRef.current || !value) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100));
    const y = Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100));
    onChange({ ...value, x, y });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", children: label }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "outline",
            className: "h-7 px-2 text-xs",
            onClick: () => {
              var _a;
              return (_a = inputRef.current) == null ? void 0 : _a.click();
            },
            disabled: uploading,
            children: uploading ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "w-3 h-3" })
          }
        ),
        (value == null ? void 0 : value.path) && /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "ghost",
            className: "h-7 px-2 text-xs text-destructive",
            onClick: () => onChange(null),
            children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept: "image/*",
        className: "hidden",
        onChange: (e) => {
          var _a;
          const f = (_a = e.target.files) == null ? void 0 : _a[0];
          if (f) handleFile(f);
          e.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: frameRef,
        className: "relative aspect-square rounded-lg overflow-hidden ring-2 ring-primary/40 shadow-sm cursor-crosshair select-none touch-none",
        onPointerDown: (e) => {
          var _a, _b;
          if (!(value == null ? void 0 : value.path)) return;
          dragging.current = true;
          (_b = (_a = e.target).setPointerCapture) == null ? void 0 : _b.call(_a, e.pointerId);
          updatePos(e.clientX, e.clientY);
        },
        onPointerMove: (e) => {
          if (dragging.current) updatePos(e.clientX, e.clientY);
        },
        onPointerUp: () => {
          dragging.current = false;
        },
        onPointerCancel: () => {
          dragging.current = false;
        },
        children: [
          /* @__PURE__ */ jsx(BentoImageCell, { image: value, rounded: "", className: "absolute inset-0" }),
          (value == null ? void 0 : value.path) && /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-primary bg-primary/60 pointer-events-none",
              style: { left: `${value.x ?? 50}%`, top: `${value.y ?? 50}%` }
            }
          )
        ]
      }
    ),
    (value == null ? void 0 : value.path) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground w-10", children: "Zoom" }),
      /* @__PURE__ */ jsx(
        Slider,
        {
          min: 100,
          max: 250,
          step: 5,
          value: [value.zoom ?? 100],
          onValueChange: (v) => onChange({ ...value, zoom: v[0] }),
          className: "flex-1"
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground w-8 text-right", children: [
        value.zoom ?? 100,
        "%"
      ] })
    ] })
  ] });
};
const categoryLabels = {
  general: "Общее",
  urology: "Урология",
  andrology: "Андрология",
  surgery: "Хирургия",
  endocrinology: "Эндокринология",
  psychology: "Психология",
  sexology: "Сексология",
  genetics: "Генетика"
};
const emptyForm = {
  title: "",
  slug: "",
  age_group: "children",
  category: "general",
  keywords: "",
  description: "",
  article_content: "",
  is_published: false,
  card_annotation: "",
  card_background_path: null,
  bento_image_1: null,
  bento_image_2: null,
  bento_image_3: null
};
const AdminDiseaseArticles = () => {
  var _a, _b, _c;
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [cardBgFile, setCardBgFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem("disease-articles-view-mode") || "list";
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("disease-articles-view-mode", viewMode);
  }, [viewMode]);
  const articleEditorRef = useRef(null);
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/disease-articles" } });
    }
  }, [user, isAdmin, authLoading, navigate]);
  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabase.from("disease_articles").select("*").order("sort_order", { ascending: true });
    setArticles(data || []);
    setLoading(false);
  };
  useEffect(() => {
    if (user && isAdmin) fetchArticles();
  }, [user, isAdmin]);
  const generateSlug = (title) => title.toLowerCase().replace(/[а-яё]/g, (c) => {
    const map = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
    return map[c] || c;
  }).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setVideoFile(null);
    setAudioFile(null);
    setCardBgFile(null);
    setDialogOpen(true);
  };
  const openEdit = (article) => {
    setEditing(article);
    setForm({
      title: article.title,
      slug: article.slug,
      age_group: article.age_group,
      category: article.category,
      keywords: (article.keywords || []).join(", "),
      description: article.description || "",
      article_content: article.article_content || "",
      is_published: article.is_published,
      card_annotation: article.card_annotation || "",
      card_background_path: article.card_background_path || null,
      bento_image_1: article.bento_image_1 || null,
      bento_image_2: article.bento_image_2 || null,
      bento_image_3: article.bento_image_3 || null
    });
    setVideoFile(null);
    setAudioFile(null);
    setCardBgFile(null);
    setDialogOpen(true);
  };
  const uploadFile = async (file, folder) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("disease-media").upload(path, file);
    if (error) throw error;
    return path;
  };
  const getMediaUrl = (path) => {
    if (!path) return null;
    return supabase.storage.from("disease-media").getPublicUrl(path).data.publicUrl;
  };
  const handleSave = async () => {
    var _a2, _b2;
    if (!form.title.trim()) {
      toast$1({ title: "Введите название", variant: "destructive" });
      return;
    }
    setSaving(true);
    setUploading(true);
    try {
      let video_path = (editing == null ? void 0 : editing.video_path) || null;
      let audio_path = (editing == null ? void 0 : editing.audio_path) || null;
      if (videoFile) {
        video_path = await uploadFile(videoFile, "videos");
      }
      if (audioFile) {
        audio_path = await uploadFile(audioFile, "audio");
      }
      let card_background_path = form.card_background_path;
      if (cardBgFile) {
        card_background_path = await uploadFile(cardBgFile, "card-bg");
      }
      const slug = form.slug.trim() || generateSlug(form.title);
      const keywords = form.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      let syncedArticleContent = ((_a2 = articleEditorRef.current) == null ? void 0 : _a2.getMarkdown()) ?? form.article_content;
      if (editing == null ? void 0 : editing.id) {
        const { data: freshArticle, error: freshError } = await supabase.from("disease_articles").select("article_content").eq("id", editing.id).maybeSingle();
        if (freshError) throw freshError;
        syncedArticleContent = mergePersistedGalleryFiles(
          syncedArticleContent,
          (freshArticle == null ? void 0 : freshArticle.article_content) || ""
        );
      }
      const payload = {
        title: form.title,
        slug,
        age_group: form.age_group,
        category: form.category,
        keywords,
        description: form.description || null,
        article_content: syncedArticleContent || null,
        video_path,
        audio_path,
        is_published: form.is_published,
        card_annotation: ((_b2 = form.card_annotation) == null ? void 0 : _b2.trim()) || null,
        card_background_path,
        bento_image_1: form.bento_image_1,
        bento_image_2: form.bento_image_2,
        bento_image_3: form.bento_image_3
      };
      if (editing) {
        const { error } = await supabase.from("disease_articles").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast$1({ title: "Статья обновлена" });
      } else {
        const { error } = await supabase.from("disease_articles").insert(payload);
        if (error) throw error;
        toast$1({ title: "Статья создана" });
      }
      setDialogOpen(false);
      fetchArticles();
    } catch (err) {
      toast$1({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };
  const handleDelete = async (id) => {
    const { error } = await supabase.from("disease_articles").delete().eq("id", id);
    if (error) {
      toast$1({ title: "Ошибка удаления", variant: "destructive" });
    } else {
      toast$1({ title: "Статья удалена" });
      fetchArticles();
    }
  };
  const togglePublish = async (article) => {
    const { error } = await supabase.from("disease_articles").update({ is_published: !article.is_published }).eq("id", article.id);
    if (!error) fetchArticles();
  };
  if (authLoading || !user || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  const filtered = filterAgeGroup === "all" ? articles : articles.filter((a) => a.age_group === filterAgeGroup);
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(Link$2, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Панель управления"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Материалы о заболеваниях" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Управление контентом для раздела «Для родителей и пациентов»" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-md border border-border overflow-hidden", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: viewMode === "list" ? "default" : "ghost",
              size: "sm",
              className: "rounded-none",
              onClick: () => setViewMode("list"),
              title: "Списком",
              children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: viewMode === "cards" ? "default" : "ghost",
              size: "sm",
              className: "rounded-none",
              onClick: () => setViewMode("cards"),
              title: "Карточками",
              children: /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: openCreate, className: "gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          "Добавить материал"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-6", children: [
      /* @__PURE__ */ jsx(Badge, { variant: filterAgeGroup === "all" ? "default" : "outline", className: "cursor-pointer", onClick: () => setFilterAgeGroup("all"), children: "Все" }),
      /* @__PURE__ */ jsx(Badge, { variant: filterAgeGroup === "children" ? "default" : "outline", className: "cursor-pointer", onClick: () => setFilterAgeGroup("children"), children: "Детские" }),
      /* @__PURE__ */ jsx(Badge, { variant: filterAgeGroup === "adults" ? "default" : "outline", className: "cursor-pointer", onClick: () => setFilterAgeGroup("adults"), children: "Взрослые" })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "text-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin mx-auto text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Нет материалов. Нажмите «Добавить материал»." }) : viewMode === "cards" ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: filtered.map((article) => {
      const bg = getMediaUrl(article.card_background_path);
      return /* @__PURE__ */ jsxs(
        Card,
        {
          className: "relative overflow-hidden h-56 flex flex-col justify-end border border-border hover:shadow-lg transition-shadow cursor-pointer group",
          onClick: () => openEdit(article),
          children: [
            bg && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("img", { src: bg, alt: "", className: "absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [
                article.video_path && /* @__PURE__ */ jsx(Video, { className: "w-3.5 h-3.5 text-blue-500" }),
                article.audio_path && /* @__PURE__ */ jsx(Headphones, { className: "w-3.5 h-3.5 text-purple-500" }),
                article.article_content && /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5 text-green-500" }),
                !article.is_published && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] text-orange-500 border-orange-300 ml-auto", children: "Черновик" })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-foreground line-clamp-2 mb-1", children: article.title }),
              (article.card_annotation || article.description) && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 italic", children: article.card_annotation || article.description }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1 mt-2", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: article.age_group === "children" ? "Детские" : "Взрослые" }),
                /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: categoryLabels[article.category] || article.category })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "secondary",
                  size: "icon",
                  className: "h-7 w-7",
                  title: "Отправить в Оркестратор для повторного ревью",
                  onClick: (e) => {
                    e.stopPropagation();
                    navigate("/admin/article-orchestrator", {
                      state: { recheck: { id: article.id, kind: "disease_articles", title: article.title } }
                    });
                  },
                  children: /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 text-amber-500" })
                }
              ),
              /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "icon", className: "h-7 w-7", onClick: (e) => {
                e.stopPropagation();
                togglePublish(article);
              }, children: article.is_published ? /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(EyeOff, { className: "w-3 h-3" }) })
            ] })
          ]
        },
        article.id
      );
    }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 min-w-0", children: filtered.map((article) => /* @__PURE__ */ jsx(Card, { className: "min-w-0 overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between min-w-0 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
          article.video_path && /* @__PURE__ */ jsx(Video, { className: "w-4 h-4 text-blue-500" }),
          article.audio_path && /* @__PURE__ */ jsx(Headphones, { className: "w-4 h-4 text-purple-500" }),
          article.article_content && /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-green-500" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground truncate", children: article.title }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs flex-shrink-0", children: article.age_group === "children" ? "Детские" : "Взрослые" }),
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs flex-shrink-0", children: categoryLabels[article.category] || article.category }),
            !article.is_published && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs text-orange-500 border-orange-300 flex-shrink-0", children: "Черновик" })
          ] }),
          article.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground truncate mt-0.5", children: article.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ml-4 flex-shrink-0", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            title: "В Оркестратор (полный цикл ИИ-ревью и переопубликация)",
            onClick: () => navigate("/admin/article-orchestrator", {
              state: { recheck: { id: article.id, kind: "disease_articles", title: article.title } }
            }),
            children: /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-amber-500" })
          }
        ),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => togglePublish(article), title: article.is_published ? "Снять с публикации" : "Опубликовать", children: article.is_published ? /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => openEdit(article), children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "text-destructive hover:text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }) }),
          /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxs(AlertDialogTitle, { children: [
                "Удалить «",
                article.title,
                "»?"
              ] }),
              /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие нельзя отменить. Все связанные файлы также будут удалены." })
            ] }),
            /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
              /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => handleDelete(article.id), className: "bg-destructive text-destructive-foreground", children: "Удалить" })
            ] })
          ] })
        ] })
      ] })
    ] }) }, article.id)) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "px-6 pt-6 pb-4 border-b shrink-0 flex flex-row items-center justify-between gap-4 space-y-0", children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "flex-1", children: editing ? "Редактирование материала" : "Новый материал о заболевании" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 shrink-0", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setDialogOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: handleSave, disabled: saving, children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : null,
            uploading && saving ? "Загрузка..." : editing ? "Сохранить" : "Создать"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 overflow-y-auto px-6 py-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Название заболевания *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: form.title,
                onChange: (e) => {
                  setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) });
                },
                placeholder: "Например: Варикоцеле"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "URL-адрес (slug) *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: form.slug,
                onChange: (e) => setForm({ ...form, slug: e.target.value }),
                placeholder: "varikotsele"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              "Адрес страницы: /for-parents/",
              /* @__PURE__ */ jsx("span", { className: "font-mono", children: form.slug || "..." }),
              ". Автогенерируется из названия, можно отредактировать."
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "sm",
                className: "mt-1 h-7 px-2 text-xs",
                onClick: () => setForm({ ...form, slug: generateSlug(form.title) }),
                children: "Сгенерировать заново из названия"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { children: "Возрастная группа" }),
              /* @__PURE__ */ jsxs(Select, { value: form.age_group, onValueChange: (v) => setForm({ ...form, age_group: v }), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "children", children: "О детских болезнях" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "adults", children: "О взрослых болезнях" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { children: "Категория" }),
              /* @__PURE__ */ jsxs(Select, { value: form.category, onValueChange: (v) => setForm({ ...form, category: v }), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(categoryLabels).map(([key, label]) => /* @__PURE__ */ jsx(SelectItem, { value: key, children: label }, key)) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Краткое описание" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                value: form.description,
                onChange: (e) => setForm({ ...form, description: e.target.value }),
                placeholder: "Краткое описание для карточки",
                rows: 2
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Ключевые слова (через запятую)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: form.keywords,
                onChange: (e) => setForm({ ...form, keywords: e.target.value }),
                placeholder: "варикоцеле, яичко, боль, подросток"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg p-3 space-y-3 bg-muted/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [
              /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" }),
              " Настройки карточки (вид «карточками»)"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Короткая аннотация под карточкой" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: form.card_annotation,
                  onChange: (e) => setForm({ ...form, card_annotation: e.target.value }),
                  placeholder: "1–2 предложения, видны под названием на карточке",
                  maxLength: 180
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              (cardBgFile || form.card_background_path) && /* @__PURE__ */ jsx("div", { className: "relative w-20 h-14 rounded overflow-hidden border border-border flex-shrink-0", children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: cardBgFile ? URL.createObjectURL(cardBgFile) : getMediaUrl(form.card_background_path),
                  alt: "",
                  className: "w-full h-full object-cover"
                }
              ) }),
              /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground", children: [
                /* @__PURE__ */ jsx(Image, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: cardBgFile || form.card_background_path ? "Заменить фон карточки" : "Загрузить фон карточки" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*",
                    className: "hidden",
                    onChange: (e) => {
                      var _a2;
                      const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
                      if (f) setCardBgFile(f);
                    }
                  }
                )
              ] }),
              (cardBgFile || form.card_background_path) && /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => {
                    setCardBgFile(null);
                    setForm({ ...form, card_background_path: null });
                  },
                  children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Изображение отображается полупрозрачным фоном карточки, текст — поверх." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg p-3 space-y-3 bg-muted/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [
              /* @__PURE__ */ jsx(Image, { className: "w-4 h-4" }),
              " Три изображения для бенто-карточки"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground -mt-1", children: "Показываются только на большой (featured) карточке в режиме «Плитка» и тонкой полосой под текстом в режиме «Список». Перетащите точку внутри рамки — центр кадра, ползунком отрегулируйте масштаб." }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
              /* @__PURE__ */ jsx(
                BentoImageEditor,
                {
                  label: "Изображение 1",
                  value: form.bento_image_1,
                  onChange: (v) => setForm({ ...form, bento_image_1: v })
                }
              ),
              /* @__PURE__ */ jsx(
                BentoImageEditor,
                {
                  label: "Изображение 2",
                  value: form.bento_image_2,
                  onChange: (v) => setForm({ ...form, bento_image_2: v })
                }
              ),
              /* @__PURE__ */ jsx(
                BentoImageEditor,
                {
                  label: "Изображение 3",
                  value: form.bento_image_3,
                  onChange: (v) => setForm({ ...form, bento_image_3: v })
                }
              )
            ] }),
            (form.title || ((_a = form.bento_image_1) == null ? void 0 : _a.path) || ((_b = form.bento_image_2) == null ? void 0 : _b.path) || ((_c = form.bento_image_3) == null ? void 0 : _c.path)) && /* @__PURE__ */ jsxs("div", { className: "pt-3 border-t border-border/60", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Предпросмотр большой карточки" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", style: { gridAutoRows: "minmax(140px, auto)" }, children: /* @__PURE__ */ jsx(
                DiseaseBentoCard,
                {
                  featured: true,
                  categoryLabel: categoryLabels[form.category] || form.category,
                  article: {
                    id: (editing == null ? void 0 : editing.id) || "preview",
                    slug: form.slug || "preview",
                    title: form.title || "Название заболевания",
                    description: form.description || null,
                    thumbnail_path: form.card_background_path,
                    category: form.category,
                    bento_image_1: form.bento_image_1,
                    bento_image_2: form.bento_image_2,
                    bento_image_3: form.bento_image_3
                  }
                }
              ) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Tabs, { defaultValue: "video", children: [
          /* @__PURE__ */ jsxs(TabsList, { className: "w-full grid grid-cols-4", children: [
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "video", className: "gap-1.5", children: [
              /* @__PURE__ */ jsx(Video, { className: "w-3.5 h-3.5" }),
              " Видео"
            ] }),
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "audio", className: "gap-1.5", children: [
              /* @__PURE__ */ jsx(Headphones, { className: "w-3.5 h-3.5" }),
              " Подкаст"
            ] }),
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "text", className: "gap-1.5", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }),
              " Статья"
            ] }),
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "en", className: "gap-1.5", children: [
              /* @__PURE__ */ jsx(Languages, { className: "w-3.5 h-3.5" }),
              " EN"
            ] })
          ] }),
          /* @__PURE__ */ jsx(TabsContent, { value: "video", className: "space-y-3 mt-4", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Видеоролик о заболевании" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "file",
                accept: "video/*",
                onChange: (e) => {
                  var _a2;
                  return setVideoFile(((_a2 = e.target.files) == null ? void 0 : _a2[0]) || null);
                },
                className: "mt-1"
              }
            ),
            (editing == null ? void 0 : editing.video_path) && !videoFile && /* @__PURE__ */ jsxs("p", { className: "text-xs text-green-600 mt-1", children: [
              "✓ Видео загружено: ",
              editing.video_path.split("/").pop()
            ] }),
            videoFile && /* @__PURE__ */ jsxs("p", { className: "text-xs text-blue-600 mt-1", children: [
              "Выбрано: ",
              videoFile.name,
              " (",
              (videoFile.size / 1024 / 1024).toFixed(1),
              " МБ)"
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TabsContent, { value: "audio", className: "space-y-3 mt-4", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Аудиоподкаст (MP3)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "file",
                accept: "audio/*",
                onChange: (e) => {
                  var _a2;
                  return setAudioFile(((_a2 = e.target.files) == null ? void 0 : _a2[0]) || null);
                },
                className: "mt-1"
              }
            ),
            (editing == null ? void 0 : editing.audio_path) && !audioFile && /* @__PURE__ */ jsxs("p", { className: "text-xs text-green-600 mt-1", children: [
              "✓ Аудио загружено: ",
              editing.audio_path.split("/").pop()
            ] }),
            audioFile && /* @__PURE__ */ jsxs("p", { className: "text-xs text-blue-600 mt-1", children: [
              "Выбрано: ",
              audioFile.name,
              " (",
              (audioFile.size / 1024 / 1024).toFixed(1),
              " МБ)"
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TabsContent, { value: "text", className: "space-y-3 mt-4", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Текст статьи (markdown)" }),
            /* @__PURE__ */ jsx(
              ArticleMarkdownEditor,
              {
                ref: articleEditorRef,
                value: form.article_content,
                onChange: (v) => setForm((prev) => ({ ...prev, article_content: v })),
                onSaveAsIs: handleSave,
                saving,
                draftKey: (editing == null ? void 0 : editing.id) || "new",
                draftMeta: {
                  title: form.title,
                  slug: form.slug,
                  description: form.description,
                  tags: form.keywords,
                  articleId: (editing == null ? void 0 : editing.id) ?? null
                }
              },
              `editor-${(editing == null ? void 0 : editing.id) || "new"}-${dialogOpen ? "open" : "closed"}`
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Загрузите .docx, отформатируйте AI, добавьте маркеры галерей. Фото можно вставить позже на странице статьи." })
          ] }) }),
          /* @__PURE__ */ jsx(TabsContent, { value: "en", className: "space-y-3 mt-4", children: /* @__PURE__ */ jsx(EnTranslationPanel, { entity_type: "disease_article", entity_id: (editing == null ? void 0 : editing.id) ?? null }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t pt-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Статус:" }),
            /* @__PURE__ */ jsx(
              Badge,
              {
                variant: form.is_published ? "default" : "outline",
                className: "cursor-pointer",
                onClick: () => setForm({ ...form, is_published: !form.is_published }),
                children: form.is_published ? "Опубликовано" : "Черновик"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDialogOpen(false), children: "Отмена" }),
            /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving, children: [
              saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : null,
              uploading && saving ? "Загрузка файлов..." : editing ? "Сохранить" : "Создать"
            ] })
          ] })
        ] })
      ] })
    ] }) })
  ] }) });
};
export {
  AdminDiseaseArticles as default
};
