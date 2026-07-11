import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { u as useAuth, e as useToast, s as supabase, P as PageMeta, B as Button, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, I as Input, T as Textarea, l as DialogFooter, C as Card, b as Badge } from "../main.mjs";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, List, LayoutGrid, Plus, Image, X, Move, Upload, Edit2, ArrowUp, ArrowDown, EyeOff, Eye, Trash2, ChevronDown, ThumbsUp, ThumbsDown, ChevronUp, MessageSquare, Check, Send } from "lucide-react";
import { R as RichTextEditor } from "./RichTextEditor-Dy3yot2p.js";
import { u as useAutoSave } from "./useAutoSave-DcIiKxWj.js";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { u as useHashOpen } from "./useHashOpen-DHCIwQ6Z.js";
import "vite-react-ssg";
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
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@tiptap/react";
import "@tiptap/starter-kit";
import "@tiptap/extension-underline";
import "@tiptap/extension-image";
const IMAGE_HEIGHT_PX = 220;
const LINE_HEIGHT_PX = 24;
function estimateImageSlots(text) {
  const lines = Math.max(1, Math.ceil(text.length / 80));
  const textHeight = lines * LINE_HEIGHT_PX;
  const slots = Math.max(1, Math.floor(textHeight / IMAGE_HEIGHT_PX));
  return slots;
}
const Blog = () => {
  const { user, isAdmin } = useAuth();
  const { toast: toast$1 } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "", excerpt: "", card_annotation: "", card_background_path: null });
  const blogAutoSaveKey = useMemo(() => editingPost ? `blog_edit_${editingPost.id}` : "blog_new", [editingPost]);
  const { save: saveBlogDraft, loadDraft: loadBlogDraft, clearDraft: clearBlogDraft } = useAutoSave({
    key: blogAutoSaveKey,
    data: postForm,
    enabled: isCreating
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [cardBgFile, setCardBgFile] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [expandedPosts, setExpandedPosts] = useState(/* @__PURE__ */ new Set());
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [draggingImageId, setDraggingImageId] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem("blog-view-mode") || "list";
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("blog-view-mode", viewMode);
  }, [viewMode]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && lightboxUrl) setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxUrl]);
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const { data: allPostImages = [] } = useQuery({
    queryKey: ["blog-post-images"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_post_images").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const { data: allComments = [] } = useQuery({
    queryKey: ["blog-comments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_comments_public").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const { data: allReactions = [] } = useQuery({
    queryKey: ["blog-reactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_post_reactions").select("*");
      if (error) throw error;
      return data;
    }
  });
  const getImageUrl = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  };
  const uploadImage = async (file) => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(fileName, file);
    if (error) throw error;
    return fileName;
  };
  const savePost = async () => {
    var _a;
    setSavingPost(true);
    try {
      let imagePath = (editingPost == null ? void 0 : editingPost.image_path) || null;
      let cardBgPath = postForm.card_background_path;
      if (cardBgFile) {
        cardBgPath = await uploadImage(cardBgFile);
      }
      const payload = {
        title: postForm.title,
        content: postForm.content,
        excerpt: postForm.excerpt || null,
        image_path: imagePath,
        card_background_path: cardBgPath,
        card_annotation: ((_a = postForm.card_annotation) == null ? void 0 : _a.trim()) || null
      };
      let postId;
      if (editingPost) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingPost.id);
        if (error) throw error;
        postId = editingPost.id;
      } else {
        const { data, error } = await supabase.from("blog_posts").insert({ ...payload, sort_order: posts.length }).select("id").single();
        if (error) throw error;
        postId = data.id;
      }
      if (imageFiles.length > 0) {
        const existingCount = allPostImages.filter((i) => i.post_id === postId).length;
        for (let i = 0; i < imageFiles.length; i++) {
          const path = await uploadImage(imageFiles[i]);
          await supabase.from("blog_post_images").insert({
            post_id: postId,
            image_path: path,
            sort_order: existingCount + i
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post-images"] });
      setEditingPost(null);
      setIsCreating(false);
      setPostForm({ title: "", content: "", excerpt: "", card_annotation: "", card_background_path: null });
      setImageFiles([]);
      setCardBgFile(null);
      clearBlogDraft();
      toast$1({ title: editingPost ? "Запись обновлена" : "Запись создана" });
    } catch (err) {
      toast$1({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSavingPost(false);
    }
  };
  const togglePublish = useMutation({
    mutationFn: async ({ id, published }) => {
      const { error } = await supabase.from("blog_posts").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
  });
  const deletePost = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post-images"] });
    }
  });
  const deleteImage = useMutation({
    mutationFn: async (imageId) => {
      const { error } = await supabase.from("blog_post_images").delete().eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-post-images"] })
  });
  const updateImagePosition = useMutation({
    mutationFn: async ({ imageId, position }) => {
      const { error } = await supabase.from("blog_post_images").update({ object_position: position }).eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-post-images"] })
  });
  const reorderPosts = useMutation({
    mutationFn: async (orderedIds) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase.from("blog_posts").update({ sort_order: i }).eq("id", orderedIds[i]);
        if (error) throw error;
      }
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["blog-posts"] });
      const previous = queryClient.getQueryData(["blog-posts"]);
      if (previous) {
        const reordered = orderedIds.map((id) => previous.find((p) => p.id === id)).filter(Boolean);
        queryClient.setQueryData(["blog-posts"], reordered.map((p, i) => ({ ...p, sort_order: i })));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context == null ? void 0 : context.previous) {
        queryClient.setQueryData(["blog-posts"], context.previous);
      }
      toast$1({ title: "Ошибка сортировки", variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
  });
  const toggleReaction = useMutation({
    mutationFn: async ({ postId, type }) => {
      if (!user) throw new Error("Не авторизован");
      const existing = allReactions.find((r) => r.post_id === postId && r.user_id === user.id);
      if (existing) {
        if (existing.reaction_type === type) {
          const { error } = await supabase.from("blog_post_reactions").delete().eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("blog_post_reactions").update({ reaction_type: type }).eq("id", existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("blog_post_reactions").insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: type
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-reactions"] })
  });
  const addComment = useMutation({
    mutationFn: async ({ postId, content }) => {
      if (!user) throw new Error("Не авторизован");
      const { error } = await supabase.from("blog_comments").insert({
        post_id: postId,
        user_id: user.id,
        author_email: user.email || "Аноним",
        content
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
      setCommentTexts((prev) => ({ ...prev, [vars.postId]: "" }));
      toast$1({ title: "Комментарий отправлен", description: "Он появится после модерации" });
    }
  });
  const approveComment = useMutation({
    mutationFn: async ({ id, approved }) => {
      const { error } = await supabase.from("blog_comments").update({ is_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-comments"] })
  });
  const deleteComment = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("blog_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-comments"] })
  });
  const openCreate = () => {
    setPostForm({ title: "", content: "", excerpt: "", card_annotation: "", card_background_path: null });
    setImageFiles([]);
    setCardBgFile(null);
    setEditingPost(null);
    setIsCreating(true);
    setTimeout(() => {
      const draft = loadBlogDraft();
      if (draft && (draft.title || draft.content)) {
        toast("Найден черновик", {
          description: "Восстановить несохранённые изменения?",
          action: { label: "Восстановить", onClick: () => {
            setPostForm({
              title: draft.title || "",
              content: draft.content || "",
              excerpt: draft.excerpt || "",
              card_annotation: draft.card_annotation || "",
              card_background_path: draft.card_background_path || null
            });
            toast.success("Черновик восстановлен");
          } },
          cancel: { label: "Отклонить", onClick: () => clearBlogDraft() },
          duration: 1e4
        });
      }
    }, 100);
  };
  const openEdit = (post) => {
    setPostForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      card_annotation: post.card_annotation || "",
      card_background_path: post.card_background_path || null
    });
    setImageFiles([]);
    setCardBgFile(null);
    setEditingPost(post);
    setIsCreating(true);
  };
  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };
  const movePost = (postId, direction) => {
    const currentOrder = visiblePosts.map((p) => p.id);
    const index = currentOrder.indexOf(postId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentOrder.length) return;
    currentOrder.splice(index, 1);
    currentOrder.splice(newIndex, 0, postId);
    reorderPosts.mutate(currentOrder);
  };
  const handlePositionDrag = useCallback((imageId, e) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const startY = e.clientY;
    const img = allPostImages.find((i) => i.id === imageId);
    const currentPos = (img == null ? void 0 : img.object_position) || "center";
    let startPct = 50;
    const match = currentPos.match(/(\d+)%\s*$/);
    if (match) startPct = parseInt(match[1]);
    if (currentPos === "top") startPct = 0;
    if (currentPos === "bottom") startPct = 100;
    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      const pct = Math.max(0, Math.min(100, startPct + dy / rect.height * 100));
      const imgEl = container.querySelector("img");
      if (imgEl) imgEl.style.objectPosition = `center ${Math.round(pct)}%`;
    };
    const onUp = (ev) => {
      const dy = ev.clientY - startY;
      const pct = Math.max(0, Math.min(100, Math.round(startPct + dy / rect.height * 100)));
      updateImagePosition.mutate({ imageId, position: `center ${pct}%` });
      setDraggingImageId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    setDraggingImageId(imageId);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [allPostImages, updateImagePosition]);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    const maxSlots2 = estimateImageSlots(postForm.content);
    const currentCount = editingPost ? allPostImages.filter((i) => i.post_id === editingPost.id).length + imageFiles.length : imageFiles.length;
    const remaining = Math.max(0, maxSlots2 - currentCount);
    setImageFiles((prev) => [...prev, ...files.slice(0, remaining)]);
  }, [postForm.content, editingPost, allPostImages, imageFiles]);
  const handleFileSelect = (e) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    const maxSlots2 = estimateImageSlots(postForm.content);
    const currentCount = editingPost ? allPostImages.filter((i) => i.post_id === editingPost.id).length + imageFiles.length : imageFiles.length;
    const remaining = Math.max(0, maxSlots2 - currentCount);
    setImageFiles((prev) => [...prev, ...files.slice(0, remaining)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeNewFile = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const getReactionCounts = (postId) => {
    var _a;
    const postReactions = allReactions.filter((r) => r.post_id === postId);
    return {
      likes: postReactions.filter((r) => r.reaction_type === "like").length,
      dislikes: postReactions.filter((r) => r.reaction_type === "dislike").length,
      userReaction: user ? ((_a = postReactions.find((r) => r.user_id === user.id)) == null ? void 0 : _a.reaction_type) || null : null
    };
  };
  const visiblePosts = isAdmin ? posts : posts.filter((p) => p.is_published);
  useHashOpen("post", visiblePosts.length > 0, useCallback((id) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []));
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  const maxSlots = estimateImageSlots(postForm.content);
  const existingImages = editingPost ? allPostImages.filter((i) => i.post_id === editingPost.id) : [];
  const totalImages = existingImages.length + imageFiles.length;
  const canAddMore = totalImages < maxSlots;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background select-none", onContextMenu: (e) => e.preventDefault(), onCopy: (e) => e.preventDefault(), children: [
    /* @__PURE__ */ jsx(PageMeta, { title: isEn ? "Reflections — Prof. Tarusin" : "Размышлизмы — Проф. Тарусин Д.И.", description: isEn ? "Professor Tarusin's personal blog — reflections on medicine, andrology, life and professional journey." : "Авторский блог профессора Тарусина — размышления о медицине, андрологии, жизни и профессиональном пути.", path: "/blog" }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 pt-24", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-8 border border-destructive rounded-lg p-4 text-sm text-muted-foreground leading-relaxed space-y-3", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Статус материалов." }),
          " Все тексты в разделе «Размышлизмы» являются авторскими публикациями в форме личных заметок, комментариев и рассуждений. Сведения, мнения и выводы отражают исключительно личную позицию автора на момент публикации и могут изменяться."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Оценочные суждения." }),
          " Значительная часть высказываний в данном разделе носит характер оценочных суждений, гипотез, допущений и субъективной интерпретации событий. Оценочные суждения не претендуют на установление фактов и не являются утверждениями о достоверно известных обстоятельствах."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "О фактах и источниках." }),
          " Там, где приводятся фактические данные, автор старается указывать первоисточники и открытые публикации. При обнаружении ошибок, неточностей, устаревшей информации или некорректных формулировок автор готов внести правки или дать уточнение по запросу через форму обратной связи."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Отсутствие призывов и инструкций." }),
          " Публикации не содержат и не преследуют цели побуждения к противоправным действиям, насилию, вражде, дискриминации, распространению запрещенной информации либо совершению действий, нарушающих права третьих лиц. Материалы не являются инструкциями к действию и предназначены для обсуждения идей и общественных явлений."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Уважение к различным взглядам и чувствительным темам." }),
          " В разделе могут затрагиваться спорные общественные вопросы (в т.ч. работа системы здравоохранения, вопросы управления, цензуры, идеологии, религии, безопасности и иные темы). Автор исходит из принципов уважения к людям и их убеждениям; критика направлена на явления, решения, практики и публичные позиции, а не на унижение достоинства конкретных лиц или социальных групп."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Об армии, государстве, религии и иных охраняемых темах." }),
          " Любые упоминания государственных институтов, общественных организаций, религиозных взглядов и символов, а также обсуждение вопросов, связанных с армией и безопасностью, носят публицистический/аналитический характер и представляют собой мнение автора. Автор не ставит целью оскорбление, унижение, разжигание ненависти, дискредитацию кого-либо либо формирование враждебного отношения к людям по признакам принадлежности к группе."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Комментарии пользователей." }),
          " Автор/администрация сайта оставляет за собой право модерировать и удалять комментарии и материалы пользователей, содержащие оскорбления, клевету, персональные данные без согласия, призывы к насилию/вражде, запрещенную информацию или иные нарушения законодательства и прав третьих лиц."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Персональные данные и частная жизнь." }),
          " В публикациях не ставится цель распространения персональных данных; при выявлении персональных данных, размещенных без надлежащих оснований, просьба сообщить — информация будет удалена или обезличена."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Контакты для претензий." }),
          " Для обращений правообладателей, государственных органов и лиц, считающих, что материал нарушает их права, доступен канал связи через форму обратной связи на сайте. Обращения рассматриваются в разумный срок; при необходимости материал может быть временно ограничен до уточнения обстоятельств."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: isEn ? "Reflections" : "Размышлизмы" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: isEn ? "My personal blog" : "Мой личный блог" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-md border border-border overflow-hidden", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: viewMode === "list" ? "default" : "ghost",
                size: "sm",
                className: "rounded-none gap-1",
                onClick: () => setViewMode("list"),
                title: isEn ? "List view" : "Списком",
                children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: viewMode === "cards" ? "default" : "ghost",
                size: "sm",
                className: "rounded-none gap-1",
                onClick: () => setViewMode("cards"),
                title: isEn ? "Card view" : "Карточками",
                children: /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" })
              }
            )
          ] }),
          isAdmin && /* @__PURE__ */ jsxs(Button, { onClick: openCreate, className: "gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            " ",
            isEn ? "New Post" : "Новая запись"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Dialog, { open: isCreating, onOpenChange: setIsCreating, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: editingPost ? "Редактировать запись" : "Новая запись" }),
          /* @__PURE__ */ jsx(DialogDescription, { children: "Заполните поля и сохраните" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Название темы",
              value: postForm.title,
              onChange: (e) => setPostForm((p) => ({ ...p, title: e.target.value }))
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              placeholder: "Краткая аннотация (будет видна в свёрнутом виде)",
              value: postForm.excerpt,
              onChange: (e) => setPostForm((p) => ({ ...p, excerpt: e.target.value })),
              rows: 2
            }
          ),
          /* @__PURE__ */ jsx(
            RichTextEditor,
            {
              content: postForm.content,
              onChange: (html) => setPostForm((p) => ({ ...p, content: html })),
              placeholder: "Текст..."
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg p-3 space-y-3 bg-muted/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [
              /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" }),
              " Настройки карточки (вид «карточками»)"
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Короткая аннотация под карточкой (1–2 предложения)",
                value: postForm.card_annotation,
                onChange: (e) => setPostForm((p) => ({ ...p, card_annotation: e.target.value })),
                maxLength: 180
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              (cardBgFile || postForm.card_background_path) && /* @__PURE__ */ jsx("div", { className: "relative w-20 h-14 rounded overflow-hidden border border-border flex-shrink-0", children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: cardBgFile ? URL.createObjectURL(cardBgFile) : getImageUrl(postForm.card_background_path),
                  alt: "",
                  className: "w-full h-full object-cover"
                }
              ) }),
              /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground", children: [
                /* @__PURE__ */ jsx(Image, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: cardBgFile || postForm.card_background_path ? "Заменить фон карточки" : "Загрузить фон карточки" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*",
                    className: "hidden",
                    onChange: (e) => {
                      var _a;
                      const f = (_a = e.target.files) == null ? void 0 : _a[0];
                      if (f) setCardBgFile(f);
                    }
                  }
                )
              ] }),
              (cardBgFile || postForm.card_background_path) && /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => {
                    setCardBgFile(null);
                    setPostForm((p) => ({ ...p, card_background_path: null }));
                  },
                  children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Изображение будет показано полупрозрачным фоном карточки, текст — поверх." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
            "Фото: ",
            totalImages,
            " / ",
            maxSlots,
            " (рассчитано по длине текста)"
          ] }),
          existingImages.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground", children: "Загруженные фото" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Перетаскивайте фото вверх/вниз для настройки кадрирования" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: existingImages.map((img) => {
              const url = getImageUrl(img.image_path);
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `relative group rounded-lg overflow-hidden border ${draggingImageId === img.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`,
                  children: [
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "relative h-24 cursor-move select-none",
                        onMouseDown: (e) => {
                          e.preventDefault();
                          handlePositionDrag(img.id, e);
                        },
                        children: [
                          /* @__PURE__ */ jsx(
                            "img",
                            {
                              src: url,
                              alt: "",
                              className: "w-full h-full object-cover pointer-events-none",
                              style: { objectPosition: img.object_position || "center" }
                            }
                          ),
                          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20", children: /* @__PURE__ */ jsx(Move, { className: "w-5 h-5 text-white drop-shadow" }) })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        size: "icon",
                        variant: "destructive",
                        className: "absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                        onClick: () => deleteImage.mutate(img.id),
                        children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
                      }
                    )
                  ]
                },
                img.id
              );
            }) })
          ] }),
          imageFiles.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground", children: "Новые фото" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: imageFiles.map((file, i) => /* @__PURE__ */ jsxs("div", { className: "relative group rounded-lg overflow-hidden border border-border", children: [
              /* @__PURE__ */ jsx("img", { src: URL.createObjectURL(file), alt: "", className: "w-full h-24 object-cover" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "icon",
                  variant: "destructive",
                  className: "absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                  onClick: () => removeNewFile(i),
                  children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
                }
              )
            ] }, i)) })
          ] }),
          canAddMore && /* @__PURE__ */ jsxs(
            "div",
            {
              onDragOver: handleDragOver,
              onDragLeave: handleDragLeave,
              onDrop: handleDrop,
              onClick: () => {
                var _a;
                return (_a = fileInputRef.current) == null ? void 0 : _a.click();
              },
              className: `border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`,
              children: [
                /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 mx-auto mb-2 text-muted-foreground" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Перетащите фото сюда или нажмите для выбора" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                  "Можно добавить ещё ",
                  maxSlots - totalImages
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    ref: fileInputRef,
                    type: "file",
                    accept: "image/*",
                    multiple: true,
                    className: "hidden",
                    onChange: handleFileSelect
                  }
                )
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setIsCreating(false), children: "Отмена" }),
          /* @__PURE__ */ jsxs(Button, { onClick: savePost, disabled: savingPost || !postForm.title.trim() || !postForm.content.trim(), children: [
            savingPost ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : null,
            editingPost ? "Сохранить изменения" : "Создать"
          ] })
        ] })
      ] }) }),
      lightboxUrl && /* @__PURE__ */ jsxs(
        "div",
        {
          className: "fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer",
          onClick: () => setLightboxUrl(null),
          children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: lightboxUrl,
                alt: "",
                className: "max-w-[90vw] max-h-[90vh] object-contain rounded-lg",
                onClick: (e) => e.stopPropagation()
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "absolute top-4 right-4 text-white/80 hover:text-white",
                onClick: () => setLightboxUrl(null),
                children: /* @__PURE__ */ jsx(X, { className: "w-8 h-8" })
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx(Dialog, { open: showLoginDialog, onOpenChange: setShowLoginDialog, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: "Требуется регистрация" }),
          /* @__PURE__ */ jsx(DialogDescription, { children: "Для отправки комментариев и оценок необходимо зарегистрироваться на сайте." })
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setShowLoginDialog(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { children: "Зарегистрироваться" }) })
        ] })
      ] }) }),
      visiblePosts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground py-16", children: isEn ? "No posts yet" : "Записей пока нет" }),
      viewMode === "cards" && visiblePosts.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10", children: visiblePosts.map((post) => {
        const bgUrl = post.card_background_path ? getImageUrl(post.card_background_path) : null;
        const postImages = allPostImages.filter((i) => i.post_id === post.id);
        const fallbackImg = postImages.length > 0 ? getImageUrl(postImages[0].image_path) : post.image_path ? getImageUrl(post.image_path) : null;
        const cardImg = bgUrl || fallbackImg;
        return /* @__PURE__ */ jsxs(
          Card,
          {
            className: "relative overflow-hidden cursor-pointer group h-56 flex flex-col justify-end border border-border hover:shadow-lg transition-shadow",
            onClick: () => {
              setViewMode("list");
              setExpandedPosts((prev) => new Set(prev).add(post.id));
              setTimeout(() => {
                const el = document.getElementById(`post-${post.id}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            },
            children: [
              cardImg && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: cardImg,
                    alt: "",
                    className: "absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative p-4 z-10", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground leading-snug line-clamp-3 mb-2", children: post.title }),
                (post.card_annotation || post.excerpt) && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 italic", children: post.card_annotation || post.excerpt }),
                isAdmin && !post.is_published && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "mt-2", children: "Черновик" })
              ] }),
              isAdmin && /* @__PURE__ */ jsx("div", { className: "absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx(Button, { size: "icon", variant: "secondary", className: "h-7 w-7", onClick: (e) => {
                e.stopPropagation();
                openEdit(post);
              }, children: /* @__PURE__ */ jsx(Edit2, { className: "w-3 h-3" }) }) })
            ]
          },
          `card-${post.id}`
        );
      }) }),
      viewMode === "list" && /* @__PURE__ */ jsx("div", { className: "space-y-6", children: visiblePosts.map((post) => {
        var _a;
        const postImages = allPostImages.filter((i) => i.post_id === post.id);
        const legacyUrl = post.image_path ? getImageUrl(post.image_path) : null;
        const firstImage = postImages.length > 0 ? getImageUrl(postImages[0].image_path) : legacyUrl;
        const firstImagePosition = postImages.length > 0 ? postImages[0].object_position : "center";
        const hasImages = postImages.length > 0 || legacyUrl;
        const postComments = allComments.filter((c) => c.post_id === post.id);
        const visibleComments = isAdmin ? postComments : postComments.filter((c) => c.is_approved || c.user_id === (user == null ? void 0 : user.id));
        const isExpanded = expandedPosts.has(post.id);
        const { likes, dislikes, userReaction } = getReactionCounts(post.id);
        return /* @__PURE__ */ jsxs(
          Card,
          {
            id: `post-${post.id}`,
            className: "p-6 lg:p-8 transition-shadow scroll-mt-24",
            children: [
              isAdmin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "icon",
                    variant: "ghost",
                    onClick: () => movePost(post.id, "up"),
                    disabled: visiblePosts.indexOf(post) === 0,
                    children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-4 h-4" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "icon",
                    variant: "ghost",
                    onClick: () => movePost(post.id, "down"),
                    disabled: visiblePosts.indexOf(post) === visiblePosts.length - 1,
                    children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-4 h-4" })
                  }
                ),
                /* @__PURE__ */ jsx(Badge, { variant: post.is_published ? "default" : "secondary", children: post.is_published ? "Опубликовано" : "Черновик" }),
                /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", onClick: () => togglePublish.mutate({ id: post.id, published: !post.is_published }), children: post.is_published ? /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", onClick: () => openEdit(post), children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", className: "text-destructive", onClick: () => deletePost.mutate(post.id), children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
              ] }),
              !isExpanded && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "cursor-pointer",
                  onClick: () => toggleExpanded(post.id),
                  children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
                    firstImage && /* @__PURE__ */ jsx("div", { className: "sm:w-48 flex-shrink-0", children: /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: firstImage,
                        alt: post.title,
                        className: "w-full h-36 sm:h-32 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity",
                        style: { objectPosition: firstImagePosition },
                        onClick: (e) => {
                          e.stopPropagation();
                          setLightboxUrl(firstImage);
                        }
                      }
                    ) }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-1", children: post.title }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-2", children: format(new Date(post.created_at), "d MMMM yyyy", { locale: ru }) }),
                      post.excerpt && /* @__PURE__ */ jsx("p", { className: "text-foreground/70 text-sm line-clamp-3", children: post.excerpt }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-3", children: [
                        /* @__PURE__ */ jsxs("span", { className: "text-primary text-sm font-medium flex items-center gap-1", children: [
                          isEn ? "Read more" : "Читать далее",
                          " ",
                          /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
                        ] }),
                        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-3 text-sm text-muted-foreground", children: [
                          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                            /* @__PURE__ */ jsx(ThumbsUp, { className: "w-3.5 h-3.5" }),
                            " ",
                            likes
                          ] }),
                          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                            /* @__PURE__ */ jsx(ThumbsDown, { className: "w-3.5 h-3.5" }),
                            " ",
                            dislikes
                          ] })
                        ] })
                      ] })
                    ] })
                  ] })
                }
              ),
              isExpanded && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "cursor-pointer flex items-center gap-1 text-primary text-sm font-medium mb-4",
                    onClick: () => toggleExpanded(post.id),
                    children: [
                      isEn ? "Collapse" : "Свернуть",
                      " ",
                      /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" })
                    ]
                  }
                ),
                hasImages ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "lg:w-48 flex-shrink-0 flex flex-col gap-2", children: [
                    postImages.map((img) => {
                      const url = getImageUrl(img.image_path);
                      return /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                        /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: url,
                            alt: post.title,
                            className: "w-full h-36 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity",
                            style: { objectPosition: img.object_position || "center" },
                            onClick: () => setLightboxUrl(url)
                          }
                        ),
                        isAdmin && /* @__PURE__ */ jsx(
                          Button,
                          {
                            size: "icon",
                            variant: "destructive",
                            className: "absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                            onClick: () => deleteImage.mutate(img.id),
                            children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" })
                          }
                        )
                      ] }, img.id);
                    }),
                    legacyUrl && postImages.length === 0 && /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: legacyUrl,
                        alt: post.title,
                        className: "w-full h-36 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity",
                        onClick: () => setLightboxUrl(legacyUrl)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0 relative", children: /* @__PURE__ */ jsxs("div", { className: "lg:absolute lg:inset-0 lg:overflow-y-auto lg:pr-2", children: [
                    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: post.title }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-4", children: format(new Date(post.created_at), "d MMMM yyyy", { locale: ru }) }),
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "prose prose-sm max-w-none text-foreground/90",
                        dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(post.content) }
                      }
                    )
                  ] }) })
                ] }) : /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: post.title }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-4", children: format(new Date(post.created_at), "d MMMM yyyy", { locale: ru }) }),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "prose prose-sm max-w-none text-foreground/90",
                      dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(post.content) }
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxs(
                    Button,
                    {
                      variant: userReaction === "like" ? "default" : "outline",
                      size: "sm",
                      className: "gap-2",
                      onClick: () => {
                        if (!user) {
                          setShowLoginDialog(true);
                          return;
                        }
                        toggleReaction.mutate({ postId: post.id, type: "like" });
                      },
                      children: [
                        /* @__PURE__ */ jsx(ThumbsUp, { className: "w-4 h-4" }),
                        " ",
                        likes
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    Button,
                    {
                      variant: userReaction === "dislike" ? "default" : "outline",
                      size: "sm",
                      className: "gap-2",
                      onClick: () => {
                        if (!user) {
                          setShowLoginDialog(true);
                          return;
                        }
                        toggleReaction.mutate({ postId: post.id, type: "dislike" });
                      },
                      children: [
                        /* @__PURE__ */ jsx(ThumbsDown, { className: "w-4 h-4" }),
                        " ",
                        dislikes
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-border pt-6", children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4", children: [
                    /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4" }),
                    isEn ? "Comments" : "Комментарии",
                    " (",
                    visibleComments.filter((c) => c.is_approved).length,
                    ")"
                  ] }),
                  visibleComments.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-3 mb-4", children: visibleComments.map((comment) => /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: `p-3 rounded-lg text-sm ${comment.is_approved ? "bg-secondary" : "bg-secondary/50 border border-dashed border-border"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: (comment.author_email || "Пользователь").replace(/(.{2})(.*)(@.*)/, "$1***$3") }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(new Date(comment.created_at), "d MMM yyyy, HH:mm", { locale: ru }) }),
                            isAdmin && !comment.is_approved && /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", className: "h-6 w-6", onClick: () => approveComment.mutate({ id: comment.id, approved: true }), children: /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 text-green-600" }) }),
                            isAdmin && /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", className: "h-6 w-6", onClick: () => deleteComment.mutate(comment.id), children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3 text-destructive" }) })
                          ] })
                        ] }),
                        !comment.is_approved && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs mb-1", children: "На модерации" }),
                        /* @__PURE__ */ jsx("p", { className: "text-foreground/80", children: comment.content })
                      ]
                    },
                    comment.id
                  )) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        placeholder: user ? isEn ? "Write a comment..." : "Написать комментарий..." : isEn ? "Sign in to comment" : "Войдите, чтобы комментировать",
                        value: commentTexts[post.id] || "",
                        onChange: (e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value })),
                        onFocus: () => {
                          if (!user) setShowLoginDialog(true);
                        },
                        readOnly: !user
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        size: "icon",
                        disabled: !user || !((_a = commentTexts[post.id]) == null ? void 0 : _a.trim()),
                        onClick: () => addComment.mutate({ postId: post.id, content: commentTexts[post.id].trim() }),
                        children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" })
                      }
                    )
                  ] })
                ] })
              ] })
            ]
          },
          post.id
        );
      }) })
    ] })
  ] });
};
export {
  Blog as default
};
