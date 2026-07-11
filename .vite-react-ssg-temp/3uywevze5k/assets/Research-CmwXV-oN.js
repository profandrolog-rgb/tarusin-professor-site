import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect, useCallback } from "react";
import { A as AlertDialog, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-B9yOFgqE.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { u as useAuth, e as useToast, n as cn, s as supabase, B as Button, T as Textarea, P as PageMeta, p as SocialBar, b as Badge, D as Dialog, f as DialogTrigger, h as DialogContent, L as Label, I as Input, H as Header, F as Footer, q as StickyBottomPanel } from "../main.mjs";
import { MessageCircle, Trash2, ArrowLeft, Download, FileText, FileSpreadsheet, Film, Upload, X, Loader2, Save, Pencil, GripVertical, Grid3X3, List, Check, ArrowUpDown, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import DOMPurify from "dompurify";
import { u as useAutoSave } from "./useAutoSave-DcIiKxWj.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { R as RichTextEditor } from "./RichTextEditor-Dy3yot2p.js";
import { toast } from "sonner";
import { useSortable, sortableKeyboardCoordinates, arrayMove, SortableContext, rectSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { u as useHashOpen } from "./useHashOpen-DHCIwQ6Z.js";
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import "@radix-ui/react-alert-dialog";
import "vite-react-ssg";
import "react-router-dom";
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
import "@radix-ui/react-switch";
import "@tiptap/react";
import "@tiptap/starter-kit";
import "@tiptap/extension-underline";
import "@tiptap/extension-image";
const RESEARCH_CATEGORIES = [
  { value: "general", label: "Общее" },
  { value: "urology", label: "Урология" },
  { value: "andrology", label: "Андрология" },
  { value: "surgery", label: "Хирургия" },
  { value: "endocrinology", label: "Эндокринология" },
  { value: "reproductology", label: "Репродуктология" },
  { value: "sexology", label: "Сексология" },
  { value: "pediatrics", label: "Педиатрия" },
  { value: "diagnostics", label: "Диагностика" },
  { value: "rehabilitation", label: "Реабилитация" }
];
function getCategoryLabel(value) {
  const cat = RESEARCH_CATEGORIES.find((c) => c.value === value);
  return (cat == null ? void 0 : cat.label) ?? value;
}
const AGE_GROUPS = [
  { value: "all", label: "Все возрасты", emoji: "👥" },
  { value: "children", label: "Дети", emoji: "👶" },
  { value: "adults", label: "Взрослые", emoji: "🧑" }
];
const REACTIONS = [
  { type: "like", emoji: "👍", label: "Нравится" },
  { type: "heart", emoji: "❤️", label: "Люблю" },
  { type: "fire", emoji: "🔥", label: "Огонь" },
  { type: "clap", emoji: "👏", label: "Браво" },
  { type: "think", emoji: "🤔", label: "Интересно" },
  { type: "wow", emoji: "😮", label: "Ого" }
];
const ResearchReactions = ({ articleId, reactions, onReactionChange }) => {
  const { user } = useAuth();
  const { toast: toast2 } = useToast();
  const [loading, setLoading] = useState(false);
  const userReaction = reactions.find((r) => r.user_id === (user == null ? void 0 : user.id));
  const reactionCounts = REACTIONS.map((r) => ({
    ...r,
    count: reactions.filter((rx) => rx.reaction_type === r.type).length,
    isActive: (userReaction == null ? void 0 : userReaction.reaction_type) === r.type
  }));
  const handleReaction = async (type) => {
    if (!user) {
      toast2({ title: "Войдите, чтобы оставить реакцию", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if ((userReaction == null ? void 0 : userReaction.reaction_type) === type) {
        await supabase.from("research_article_reactions").delete().eq("article_id", articleId).eq("user_id", user.id);
      } else if (userReaction) {
        await supabase.from("research_article_reactions").update({ reaction_type: type }).eq("article_id", articleId).eq("user_id", user.id);
      } else {
        await supabase.from("research_article_reactions").insert({ article_id: articleId, user_id: user.id, reaction_type: type });
      }
      onReactionChange();
    } catch {
      toast2({ title: "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: reactionCounts.map((r) => /* @__PURE__ */ jsxs(
    "button",
    {
      disabled: loading,
      onClick: () => handleReaction(r.type),
      className: cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all border",
        r.isActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground"
      ),
      title: r.label,
      children: [
        /* @__PURE__ */ jsx("span", { children: r.emoji }),
        r.count > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: r.count })
      ]
    },
    r.type
  )) });
};
const ResearchComments = ({ articleId, comments, onCommentChange }) => {
  const { user, isAdmin } = useAuth();
  const { toast: toast2 } = useToast();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const visibleComments = comments.filter(
    (c) => c.is_approved || isAdmin || c.user_id === (user == null ? void 0 : user.id)
  );
  const handleSubmit = async () => {
    var _a;
    if (!user || !text.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("research_article_comments").insert({
        article_id: articleId,
        user_id: user.id,
        author_name: ((_a = user.email) == null ? void 0 : _a.split("@")[0]) || "Пользователь",
        author_email: user.email || "",
        content: text.trim()
      });
      if (error) throw error;
      setText("");
      toast2({ title: "Комментарий отправлен на модерацию" });
      onCommentChange();
    } catch {
      toast2({ title: "Ошибка отправки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  const handleApprove = async (id) => {
    await supabase.from("research_article_comments").update({ is_approved: true }).eq("id", id);
    onCommentChange();
  };
  const handleDelete = async (id) => {
    await supabase.from("research_article_comments").delete().eq("id", id);
    onCommentChange();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold text-foreground flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(MessageCircle, { className: "w-4 h-4" }),
      "Комментарии (",
      visibleComments.filter((c) => c.is_approved).length,
      ")"
    ] }),
    visibleComments.map((c) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: `p-3 rounded-lg border ${!c.is_approved ? "border-amber-300 bg-amber-50/50" : "border-border bg-muted/30"}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: c.author_name }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              !c.is_approved && /* @__PURE__ */ jsx("span", { className: "text-xs text-amber-600", children: "На модерации" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(new Date(c.created_at), "d MMM yyyy", { locale: ru }) }),
              isAdmin && /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                !c.is_approved && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-6 px-2 text-xs", onClick: () => handleApprove(c.id), children: "✓" }),
                /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-6 px-2 text-destructive", onClick: () => handleDelete(c.id), children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: c.content })
        ]
      },
      c.id
    )),
    user ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(
        Textarea,
        {
          placeholder: "Написать комментарий...",
          value: text,
          onChange: (e) => setText(e.target.value),
          className: "min-h-[60px]"
        }
      ),
      /* @__PURE__ */ jsx(Button, { size: "sm", onClick: handleSubmit, disabled: loading || !text.trim(), children: "Отправить" })
    ] }) : /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx("a", { href: "/auth", className: "text-primary hover:underline", children: "Войдите" }),
      ", чтобы оставить комментарий"
    ] })
  ] });
};
const stripHtml = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const ResearchPostDetail = ({ articleId, onBack }) => {
  const { data: article } = useQuery({
    queryKey: ["research-article", articleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_articles").select("*").eq("id", articleId).single();
      if (error) throw error;
      return data;
    }
  });
  const { data: attachments = [] } = useQuery({
    queryKey: ["research-attachments", articleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_article_attachments").select("*").eq("article_id", articleId).order("sort_order");
      if (error) throw error;
      return data;
    }
  });
  const { data: reactions = [], refetch: refetchReactions } = useQuery({
    queryKey: ["research-reactions", articleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_article_reactions").select("*").eq("article_id", articleId);
      if (error) throw error;
      return data;
    }
  });
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["research-comments", articleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_article_comments_public").select("*").eq("article_id", articleId).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  if (!article) return null;
  const imageUrl = article.image_path ? supabase.storage.from("research-attachments").getPublicUrl(article.image_path).data.publicUrl : null;
  const imageAttachments = attachments.filter((a) => a.file_type === "image");
  const videoAttachments = attachments.filter((a) => a.file_type === "video");
  const previewableAttachments = attachments.filter((a) => ["pdf", "spreadsheet"].includes(a.file_type));
  const fileAttachments = attachments.filter((a) => !["image", "video", "pdf", "spreadsheet"].includes(a.file_type));
  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-red-500" });
      case "video":
        return /* @__PURE__ */ jsx(Film, { className: "w-5 h-5 text-purple-500" });
      case "spreadsheet":
        return /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-5 h-5 text-green-500" });
      default:
        return /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-500" });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: `${article.title} — Проф. Тарусин Д.И.`,
        description: (article.excerpt || stripHtml(article.content || "")).slice(0, 200),
        path: `/research/${article.id}`,
        image: imageUrl || void 0,
        type: "article"
      }
    ),
    /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "gap-2", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      " Назад к ленте"
    ] }),
    imageUrl && /* @__PURE__ */ jsx("div", { className: "rounded-xl overflow-hidden border bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("img", { src: imageUrl, alt: article.title, className: "w-full h-auto object-contain" }) }),
    /* @__PURE__ */ jsx(SocialBar, {}),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: getCategoryLabel(article.category) }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: format(new Date(article.created_at), "d MMMM yyyy", { locale: ru }) })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold text-foreground", children: article.title }),
      article.excerpt && /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground italic", children: article.excerpt })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "prose prose-sm max-w-none text-foreground",
        dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(article.content) }
      }
    ),
    imageAttachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: imageAttachments.map((att) => {
      const url = supabase.storage.from("research-attachments").getPublicUrl(att.file_path).data.publicUrl;
      return /* @__PURE__ */ jsx("div", { className: "rounded-lg overflow-hidden border bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("img", { src: url, alt: att.file_name, className: "w-full h-auto object-contain" }) }, att.id);
    }) }),
    videoAttachments.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Видео" }),
      videoAttachments.map((att) => {
        const url = supabase.storage.from("research-attachments").getPublicUrl(att.file_path).data.publicUrl;
        return /* @__PURE__ */ jsxs("div", { className: "rounded-lg overflow-hidden border bg-black", children: [
          /* @__PURE__ */ jsxs("video", { controls: true, className: "w-full max-h-[500px]", controlsList: "nodownload", children: [
            /* @__PURE__ */ jsx("source", { src: url }),
            "Ваш браузер не поддерживает видео"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-muted px-3 py-1.5 text-xs text-muted-foreground truncate", children: att.file_name })
        ] }, att.id);
      })
    ] }),
    previewableAttachments.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Документы" }),
      previewableAttachments.map((att) => {
        const url = supabase.storage.from("research-attachments").getPublicUrl(att.file_path).data.publicUrl;
        return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs(Dialog, { children: [
            /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors w-full text-left", children: [
              getFileIcon(att.file_type),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground flex-1 truncate", children: att.file_name }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Предпросмотр" })
            ] }) }),
            /* @__PURE__ */ jsx(DialogContent, { className: "max-w-4xl w-[95vw] h-[80vh] p-0", children: /* @__PURE__ */ jsx(
              "iframe",
              {
                src: `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`,
                className: "w-full h-full rounded-lg",
                title: att.file_name
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline ml-10 inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
            " Скачать"
          ] })
        ] }, att.id);
      })
    ] }),
    fileAttachments.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Вложения" }),
      fileAttachments.map((att) => {
        const url = supabase.storage.from("research-attachments").getPublicUrl(att.file_path).data.publicUrl;
        return /* @__PURE__ */ jsxs(
          "a",
          {
            href: url,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
            children: [
              getFileIcon(att.file_type),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground flex-1 truncate", children: att.file_name }),
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 text-muted-foreground" })
            ]
          },
          att.id
        );
      })
    ] }),
    /* @__PURE__ */ jsx(ResearchReactions, { articleId, reactions, onReactionChange: () => refetchReactions() }),
    /* @__PURE__ */ jsx("div", { className: "border-t pt-6", children: /* @__PURE__ */ jsx(ResearchComments, { articleId, comments, onCommentChange: () => refetchComments() }) })
  ] });
};
const ResearchPostForm = ({ article, onSave, onCancel }) => {
  const { toast: toast$1 } = useToast();
  const [loading, setLoading] = useState(false);
  const autoSaveKey = article ? `research_edit_${article.id}` : "research_new";
  const getSafeStoragePath = (folder, file) => {
    var _a;
    const rawExt = ((_a = file.name.split(".").pop()) == null ? void 0 : _a.toLowerCase()) || "bin";
    const safeExt = rawExt.replace(/[^a-z0-9]/g, "") || "bin";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
    return `${folder}/${uniqueName}`;
  };
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [title, setTitle] = useState((article == null ? void 0 : article.title) || "");
  const [content, setContent] = useState((article == null ? void 0 : article.content) || "");
  const [excerpt, setExcerpt] = useState((article == null ? void 0 : article.excerpt) || "");
  const [category, setCategory] = useState((article == null ? void 0 : article.category) || "general");
  const [ageGroup, setAgeGroup] = useState((article == null ? void 0 : article.age_group) || "all");
  const [isPublished, setIsPublished] = useState((article == null ? void 0 : article.is_published) ?? false);
  const [coverFile, setCoverFile] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const formData = useMemo(() => ({
    title,
    content,
    excerpt,
    category,
    ageGroup,
    isPublished
  }), [title, content, excerpt, category, ageGroup, isPublished]);
  const { save, loadDraft, clearDraft, hasDraft } = useAutoSave({
    key: autoSaveKey,
    data: formData
  });
  useEffect(() => {
    if (draftLoaded) return;
    setDraftLoaded(true);
    const draft = loadDraft();
    if (draft) {
      toast("Найден черновик", {
        description: "Восстановить несохранённые изменения?",
        action: {
          label: "Восстановить",
          onClick: () => {
            if (draft.title) setTitle(draft.title);
            if (draft.content) setContent(draft.content);
            if (draft.excerpt !== void 0) setExcerpt(draft.excerpt);
            if (draft.category) setCategory(draft.category);
            if (draft.ageGroup) setAgeGroup(draft.ageGroup);
            if (draft.isPublished !== void 0) setIsPublished(draft.isPublished);
            toast.success("Черновик восстановлен");
          }
        },
        cancel: {
          label: "Отклонить",
          onClick: () => clearDraft()
        },
        duration: 1e4
      });
    }
  }, []);
  const handleSubmit = async () => {
    var _a;
    if (!title.trim()) {
      toast$1({ title: "Укажите название", variant: "destructive" });
      return;
    }
    setLoading(true);
    setUploadProgress(true);
    try {
      let imagePath = (article == null ? void 0 : article.image_path) || null;
      if (coverFile) {
        const path = getSafeStoragePath("covers", coverFile);
        const { error: uploadError } = await supabase.storage.from("research-attachments").upload(path, coverFile);
        if (uploadError) throw uploadError;
        imagePath = path;
      }
      let articleId = article == null ? void 0 : article.id;
      if (article) {
        const { error } = await supabase.from("research_articles").update({
          title: title.trim(),
          content,
          excerpt: excerpt.trim() || null,
          category,
          age_group: ageGroup,
          image_path: imagePath,
          is_published: isPublished
        }).eq("id", article.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("research_articles").insert({
          title: title.trim(),
          content,
          excerpt: excerpt.trim() || null,
          category,
          age_group: ageGroup,
          image_path: imagePath,
          is_published: isPublished
        }).select("id").single();
        if (error) throw error;
        articleId = data.id;
      }
      for (const file of attachmentFiles) {
        const ext = ((_a = file.name.split(".").pop()) == null ? void 0 : _a.toLowerCase()) || "";
        const fileType = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "image" : ext === "pdf" ? "pdf" : ["mp4", "mov", "webm", "avi", "mkv"].includes(ext) ? "video" : ["xlsx", "xls", "csv"].includes(ext) ? "spreadsheet" : "document";
        const path = getSafeStoragePath(`attachments/${articleId}`, file);
        const { error: uploadError } = await supabase.storage.from("research-attachments").upload(path, file);
        if (uploadError) throw uploadError;
        const { error: attachmentError } = await supabase.from("research_article_attachments").insert({
          article_id: articleId,
          file_path: path,
          file_name: file.name,
          file_type: fileType
        });
        if (attachmentError) throw attachmentError;
      }
      toast$1({ title: article ? "Статья обновлена" : "Статья создана" });
      clearDraft();
      onSave();
    } catch (err) {
      toast$1({ title: "Ошибка сохранения", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  };
  const removeAttachment = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Название *" }),
      /* @__PURE__ */ jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Название исследования" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Категория" }),
      /* @__PURE__ */ jsxs(Select, { value: category, onValueChange: setCategory, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: RESEARCH_CATEGORIES.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c.value, children: c.label }, c.value)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Возрастная группа" }),
      /* @__PURE__ */ jsxs(Select, { value: ageGroup, onValueChange: setAgeGroup, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: AGE_GROUPS.map((ag) => /* @__PURE__ */ jsxs(SelectItem, { value: ag.value, children: [
          ag.emoji,
          " ",
          ag.label
        ] }, ag.value)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Краткая аннотация" }),
      /* @__PURE__ */ jsx(Textarea, { value: excerpt, onChange: (e) => setExcerpt(e.target.value), placeholder: "Краткое описание для превью...", className: "min-h-[60px]" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Обложка" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors", children: [
          /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: coverFile ? coverFile.name : "Выбрать изображение" }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
            var _a;
            return setCoverFile(((_a = e.target.files) == null ? void 0 : _a[0]) || null);
          } })
        ] }),
        coverFile && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setCoverFile(null), children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Текст статьи" }),
      /* @__PURE__ */ jsx(RichTextEditor, { content, onChange: setContent })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Вложения (изображения, PDF, документы)" }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors w-fit", children: [
        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Добавить файлы" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            multiple: true,
            accept: "image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,video/*",
            className: "hidden",
            onChange: (e) => {
              if (e.target.files) {
                setAttachmentFiles((prev) => [...prev, ...Array.from(e.target.files)]);
              }
            }
          }
        )
      ] }),
      attachmentFiles.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1 mt-2", children: attachmentFiles.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: f.name }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2", onClick: () => removeAttachment(i), children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Switch, { checked: isPublished, onCheckedChange: setIsPublished }),
      /* @__PURE__ */ jsx(Label, { children: "Опубликовать" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-center", children: [
      /* @__PURE__ */ jsxs(Button, { onClick: handleSubmit, disabled: loading, children: [
        uploadProgress && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
        article ? "Сохранить" : "Создать"
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onCancel, disabled: loading, children: "Отмена" }),
      /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: save, disabled: loading, className: "ml-auto gap-1 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        " Сохранить черновик"
      ] }),
      hasDraft() && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
        clearDraft();
        toast$1({ title: "Черновик удалён" });
      }, disabled: loading, className: "gap-1 text-destructive hover:text-destructive", children: [
        /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
        " Удалить черновик"
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Автосохранение каждые 3 минуты" })
  ] });
};
const ResearchPostCard = ({ article, commentCount, reactionCount, viewMode, onClick, onEdit, onDelete }) => {
  const imageUrl = article.image_path ? supabase.storage.from("research-attachments").getPublicUrl(article.image_path).data.publicUrl : null;
  if (viewMode === "grid") {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        onClick,
        className: "group cursor-pointer rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-all",
        children: [
          /* @__PURE__ */ jsx("div", { className: "bg-muted overflow-hidden flex items-center justify-center", children: imageUrl ? /* @__PURE__ */ jsx("img", { src: imageUrl, alt: article.title, className: "w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/10 to-accent/10", children: "📄" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-1.5", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: getCategoryLabel(article.category) }),
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground line-clamp-2 leading-tight", children: article.title }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { children: format(new Date(article.created_at), "d MMM yyyy", { locale: ru }) }),
              reactionCount > 0 && /* @__PURE__ */ jsxs("span", { children: [
                "👍 ",
                reactionCount
              ] }),
              commentCount > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5", children: [
                /* @__PURE__ */ jsx(MessageCircle, { className: "w-3 h-3" }),
                " ",
                commentCount
              ] })
            ] }),
            !article.is_published && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs text-amber-600 border-amber-300", children: "Черновик" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              onEdit && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs", onClick: (e) => {
                e.stopPropagation();
                onEdit();
              }, children: [
                /* @__PURE__ */ jsx(Pencil, { className: "w-3 h-3 mr-1" }),
                " Ред."
              ] }),
              onDelete && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs text-destructive hover:text-destructive", onClick: (e) => {
                e.stopPropagation();
                onDelete();
              }, children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3 mr-1" }),
                " Удалить"
              ] })
            ] })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick,
      className: "cursor-pointer rounded-xl border bg-card hover:shadow-md transition-all overflow-hidden",
      children: /* @__PURE__ */ jsxs("div", { className: "flex gap-4 p-4", children: [
        imageUrl && /* @__PURE__ */ jsx("div", { className: "w-24 md:w-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx("img", { src: imageUrl, alt: article.title, className: "w-full h-auto object-contain" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: getCategoryLabel(article.category) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(new Date(article.created_at), "d MMM yyyy", { locale: ru }) }),
            !article.is_published && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs text-amber-600 border-amber-300", children: "Черновик" })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-foreground line-clamp-2", children: article.title }),
          article.excerpt && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: article.excerpt }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
            reactionCount > 0 && /* @__PURE__ */ jsxs("span", { children: [
              "👍 ",
              reactionCount
            ] }),
            commentCount > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5", children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "w-3 h-3" }),
              " ",
              commentCount
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 ml-auto", children: [
              onEdit && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs", onClick: (e) => {
                e.stopPropagation();
                onEdit();
              }, children: [
                /* @__PURE__ */ jsx(Pencil, { className: "w-3 h-3 mr-1" }),
                " Ред."
              ] }),
              onDelete && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs text-destructive hover:text-destructive", onClick: (e) => {
                e.stopPropagation();
                onDelete();
              }, children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3 mr-1" }),
                " Удалить"
              ] })
            ] })
          ] })
        ] })
      ] })
    }
  );
};
const SortableResearchCard = ({ article, isSorting, ...rest }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: article.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : void 0
  };
  if (!isSorting) {
    return /* @__PURE__ */ jsx(ResearchPostCard, { article, ...rest });
  }
  return /* @__PURE__ */ jsxs("div", { ref: setNodeRef, style, className: "relative", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        ...attributes,
        ...listeners,
        className: "absolute top-2 left-2 z-10 bg-primary text-primary-foreground rounded-md p-1.5 cursor-grab active:cursor-grabbing shadow-lg",
        children: /* @__PURE__ */ jsx(GripVertical, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(ResearchPostCard, { article, ...rest })
  ] });
};
const Research = () => {
  const { isAdmin, isEditor } = useAuth();
  const canEdit = isAdmin || isEditor;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState("grid");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterAgeGroup, setFilterAgeGroup] = useState(null);
  const [isSorting, setIsSorting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await Promise.all([
        supabase.from("research_article_attachments").delete().eq("article_id", deleteId),
        supabase.from("research_article_reactions").delete().eq("article_id", deleteId),
        supabase.from("research_article_comments").delete().eq("article_id", deleteId)
      ]);
      const { error } = await supabase.from("research_articles").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Публикация удалена");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["research-all-reactions"] });
      queryClient.invalidateQueries({ queryKey: ["research-all-comments"] });
    } catch (err) {
      toast.error("Ошибка удаления: " + err.message);
    } finally {
      setDeleteId(null);
    }
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const { data: articles = [], isLoading, refetch } = useQuery({
    queryKey: ["research-articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_articles").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const { data: allReactions = [] } = useQuery({
    queryKey: ["research-all-reactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_article_reactions").select("article_id, reaction_type");
      if (error) throw error;
      return data;
    }
  });
  const { data: allComments = [] } = useQuery({
    queryKey: ["research-all-comments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_article_comments").select("article_id, is_approved");
      if (error) throw error;
      return data;
    }
  });
  const filtered = isSorting ? articles : articles.filter((a) => !filterCategory || a.category === filterCategory).filter((a) => !filterAgeGroup || a.age_group === filterAgeGroup || a.age_group === "all");
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex((a) => a.id === active.id);
    const newIndex = filtered.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filtered, oldIndex, newIndex);
    queryClient.setQueryData(["research-articles"], reordered);
    try {
      const updates = reordered.map(
        (article, index) => supabase.from("research_articles").update({ sort_order: index }).eq("id", article.id)
      );
      await Promise.all(updates);
      toast.success("Порядок сохранён");
    } catch {
      toast.error("Ошибка сохранения порядка");
      refetch();
    }
  }, [filtered, queryClient, refetch]);
  useHashOpen("article", articles.length > 0, useCallback((id) => {
    setSelectedId(id);
  }, []));
  if (selectedId) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background pb-14", children: [
      /* @__PURE__ */ jsx(Header, {}),
      /* @__PURE__ */ jsx("main", { className: "pt-24 md:pt-28", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsx(ResearchPostDetail, { articleId: selectedId, onBack: () => setSelectedId(null) }) }) }),
      /* @__PURE__ */ jsx(Footer, {}),
      /* @__PURE__ */ jsx(StickyBottomPanel, {})
    ] });
  }
  if (showForm || editArticle) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background pb-14", children: [
      /* @__PURE__ */ jsx(Header, {}),
      /* @__PURE__ */ jsx("main", { className: "pt-24 md:pt-28", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground mb-6", children: editArticle ? "Редактировать публикацию" : "Новая публикация" }),
        /* @__PURE__ */ jsx(
          ResearchPostForm,
          {
            article: editArticle,
            onSave: () => {
              setShowForm(false);
              setEditArticle(null);
              refetch();
            },
            onCancel: () => {
              setShowForm(false);
              setEditArticle(null);
            }
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {}),
      /* @__PURE__ */ jsx(StickyBottomPanel, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background pb-14", children: [
    /* @__PURE__ */ jsx(PageMeta, { title: "Наши исследования — Профессор Тарусин Д.И.", description: "Научные исследования и публикации профессора Тарусина Д.И. в области детской урологии-андрологии и микрохирургии.", path: "/research" }),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { className: "pt-24 md:pt-28", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground", children: "Наши исследования" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Научные публикации и исследования команды" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex border rounded-lg overflow-hidden", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("grid"),
                className: `p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`,
                children: /* @__PURE__ */ jsx(Grid3X3, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("feed"),
                className: `p-2 ${viewMode === "feed" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`,
                children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
              }
            )
          ] }),
          canEdit && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: isSorting ? "default" : "outline",
                size: "sm",
                onClick: () => setIsSorting(!isSorting),
                className: "gap-1",
                children: [
                  isSorting ? /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-4 h-4" }),
                  isSorting ? "Готово" : "Сортировка"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(Button, { onClick: () => setShowForm(true), className: "gap-2", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
              " Новая публикация"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(SocialBar, { className: "mb-4" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: AGE_GROUPS.map((ag) => /* @__PURE__ */ jsxs(
        Badge,
        {
          variant: filterAgeGroup === (ag.value === "all" ? null : ag.value) ? "default" : "secondary",
          className: "cursor-pointer",
          onClick: () => setFilterAgeGroup(ag.value === "all" ? null : ag.value),
          children: [
            ag.emoji,
            " ",
            ag.label
          ]
        },
        ag.value
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-6", children: [
        /* @__PURE__ */ jsx(
          Badge,
          {
            variant: filterCategory === null ? "default" : "secondary",
            className: "cursor-pointer",
            onClick: () => setFilterCategory(null),
            children: "Все темы"
          }
        ),
        RESEARCH_CATEGORIES.map((c) => /* @__PURE__ */ jsx(
          Badge,
          {
            variant: filterCategory === c.value ? "default" : "secondary",
            className: "cursor-pointer",
            onClick: () => setFilterCategory(c.value),
            children: c.label
          },
          c.value
        ))
      ] }),
      isLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-16", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsx("p", { className: "text-4xl mb-4", children: "📚" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground", children: filterCategory ? "В этой категории пока нет публикаций" : "Публикации скоро появятся" })
      ] }) : /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: /* @__PURE__ */ jsx(
        SortableContext,
        {
          items: filtered.map((a) => a.id),
          strategy: viewMode === "grid" ? rectSortingStrategy : verticalListSortingStrategy,
          children: /* @__PURE__ */ jsx("div", { className: viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4 max-w-3xl", children: filtered.map((article) => /* @__PURE__ */ jsx(
            SortableResearchCard,
            {
              article,
              commentCount: allComments.filter((c) => c.article_id === article.id && c.is_approved).length,
              reactionCount: allReactions.filter((r) => r.article_id === article.id).length,
              viewMode,
              onClick: () => !isSorting && setSelectedId(article.id),
              onEdit: canEdit && !isSorting ? () => setEditArticle(article) : void 0,
              onDelete: canEdit && !isSorting ? () => setDeleteId(article.id) : void 0,
              isSorting
            },
            article.id
          )) })
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {}),
    /* @__PURE__ */ jsx(StickyBottomPanel, {}),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteId, onOpenChange: (open) => !open && setDeleteId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить публикацию?" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие необратимо. Публикация, все вложения, реакции и комментарии будут удалены." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Удалить" })
      ] })
    ] }) })
  ] });
};
export {
  Research as default
};
