import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Video, Shield, Plus, X, ImagePlus, Loader2, Link2, Play, Pencil, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { e as useToast, u as useAuth, s as supabase, P as PageMeta, D as Dialog, f as DialogTrigger, B as Button, h as DialogContent, i as DialogHeader, j as DialogTitle, I as Input, T as Textarea, l as DialogFooter, m as DialogClose, k as DialogDescription, C as Card, a as CardContent } from "../main.mjs";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-B9yOFgqE.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { u as useAutoSave } from "./useAutoSave-DcIiKxWj.js";
import { toast } from "sonner";
import { A as AgeConfirmationModal } from "./AgeConfirmationModal-COJlSvbH.js";
import { u as useHashOpen } from "./useHashOpen-DHCIwQ6Z.js";
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
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-select";
const CATEGORY_LABELS = {
  hydrocele: "Гидроцеле",
  cryptorchidism: "Крипторхизм",
  hypospadias: "Гипоспадия",
  varicocele: "Варикоцеле",
  phimosis: "Фимоз",
  hernia: "Грыжа",
  spermatocele: "Сперматоцеле",
  spermatic_cord_cyst: "Киста семенного канатика",
  short_frenulum: "Короткая уздечка",
  hydatids: "Гидатиды",
  penile_curvature: "Искривление полового члена",
  nevi: "Невусы",
  papillomas: "Папилломы",
  scars: "Рубцы",
  meatostenosis: "Меатостеноз",
  testicular_torsion: "Перекрут яичка",
  preputial_synechiae: "Синехии крайней плоти",
  paraphimosis: "Парафимоз",
  buried_penis: "Скрытый половой член",
  lymphocele: "Лимфоцеле",
  scrotal_atheroma: "Атерома мошонки",
  micro_tese: "Micro-TESE",
  orchiectomy: "Орхиэктомия",
  // legacy — hidden from UI
  enuresis: "Энурез",
  pelvic_pain: "Тазовая боль",
  scrotal_pain: "Боль в мошонке",
  infertility: "Бесплодие",
  erectile_dysfunction: "Эректильная дисфункция",
  sexology: "Сексология",
  psychology: "Психология",
  complications: "Осложнения",
  other: "Разное",
  rarities: "Редкое"
};
const VISIBLE_CATEGORIES = [
  "hydrocele",
  "cryptorchidism",
  "hypospadias",
  "varicocele",
  "phimosis",
  "hernia",
  "spermatocele",
  "spermatic_cord_cyst",
  "short_frenulum",
  "hydatids",
  "penile_curvature",
  "nevi",
  "papillomas",
  "scars",
  "meatostenosis",
  "testicular_torsion",
  "preputial_synechiae",
  "paraphimosis",
  "buried_penis",
  "lymphocele",
  "scrotal_atheroma",
  "micro_tese",
  "orchiectomy",
  "rarities",
  "other"
];
const VideoCases = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formVideoType, setFormVideoType] = useState("url");
  const [formCategory, setFormCategory] = useState("other");
  const [formThumbnail, setFormThumbnail] = useState(null);
  const [formThumbnailPreview, setFormThumbnailPreview] = useState(null);
  const thumbnailInputRef = useRef(null);
  const { toast: toast$1 } = useToast();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const videoFormData = useMemo(() => ({
    formTitle,
    formDescription,
    formVideoUrl,
    formCategory
  }), [formTitle, formDescription, formVideoUrl, formCategory]);
  const { save: saveVideoDraft, loadDraft: loadVideoDraft, clearDraft: clearVideoDraft } = useAutoSave({
    key: editingCase ? `video_edit_${editingCase.id}` : "video_new",
    data: videoFormData,
    enabled: addDialogOpen || editDialogOpen
  });
  useEffect(() => {
    fetchCases();
  }, [user]);
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    toast$1({ title: "Копирование запрещено", description: "Копирование категорически запрещено!", variant: "destructive" });
  }, [toast$1]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")) {
        e.preventDefault();
        toast$1({ title: "Копирование запрещено", description: "Копирование категорически запрещено!", variant: "destructive" });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toast$1]);
  const fetchCases = async () => {
    try {
      const { data: casesData, error } = await supabase.from("video_cases").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      const { data: reactions } = await supabase.from("video_case_reactions").select("*");
      const enriched = (casesData || []).map((c) => {
        var _a;
        const caseReactions = (reactions || []).filter((r) => r.video_case_id === c.id);
        const likes = caseReactions.filter((r) => r.reaction_type === "like").length;
        const dislikes = caseReactions.filter((r) => r.reaction_type === "dislike").length;
        const userReaction = user ? ((_a = caseReactions.find((r) => r.user_id === user.id)) == null ? void 0 : _a.reaction_type) || null : null;
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          video_path: c.video_path,
          thumbnail_path: c.thumbnail_path || null,
          category: c.category,
          created_at: c.created_at,
          likes,
          dislikes,
          user_reaction: userReaction
        };
      });
      setCases(enriched);
    } catch (error) {
      console.error("Error fetching video cases:", error);
      toast$1({ title: "Ошибка", description: "Не удалось загрузить видео-кейсы", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormVideoUrl("");
    setFormVideoType("url");
    setFormCategory("other");
    setFormThumbnail(null);
    setFormThumbnailPreview(null);
  };
  const handleThumbnailChange = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (file) {
      setFormThumbnail(file);
      setFormThumbnailPreview(URL.createObjectURL(file));
    }
  };
  const uploadThumbnail = async (file) => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("video-cases").upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("video-cases").getPublicUrl(fileName);
    return urlData.publicUrl;
  };
  const handleAdd = async () => {
    if (!formTitle.trim() || !formVideoUrl.trim()) {
      toast$1({ title: "Заполните поля", description: "Название и ссылка на видео обязательны", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let thumbnailUrl = null;
      if (formThumbnail) {
        thumbnailUrl = await uploadThumbnail(formThumbnail);
      }
      const { error } = await supabase.from("video_cases").insert({
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        video_path: formVideoUrl.trim(),
        category: formCategory,
        thumbnail_path: thumbnailUrl
      });
      if (error) throw error;
      toast$1({ title: "Успешно", description: "Видео-кейс добавлен" });
      resetForm();
      clearVideoDraft();
      setAddDialogOpen(false);
      fetchCases();
    } catch (error) {
      toast$1({ title: "Ошибка", description: error.message || "Не удалось добавить", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const openEditDialog = (c) => {
    setEditingCase(c);
    setFormTitle(c.title);
    setFormDescription(c.description || "");
    setFormVideoUrl(c.video_path);
    setFormVideoType(c.video_path.trim().startsWith("<iframe") || c.video_path.trim().startsWith("<embed") ? "embed" : "url");
    setFormCategory(c.category);
    setFormThumbnail(null);
    setFormThumbnailPreview(c.thumbnail_path || null);
    setEditDialogOpen(true);
  };
  const handleEdit = async () => {
    if (!editingCase || !formTitle.trim() || !formVideoUrl.trim()) {
      toast$1({ title: "Заполните поля", description: "Название и ссылка обязательны", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let thumbnailUrl = void 0;
      if (formThumbnail) {
        thumbnailUrl = await uploadThumbnail(formThumbnail);
      }
      const updateData = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        video_path: formVideoUrl.trim(),
        category: formCategory
      };
      if (thumbnailUrl !== void 0) {
        updateData.thumbnail_path = thumbnailUrl;
      }
      const { error } = await supabase.from("video_cases").update(updateData).eq("id", editingCase.id);
      if (error) throw error;
      toast$1({ title: "Сохранено", description: "Видео-кейс обновлён" });
      resetForm();
      clearVideoDraft();
      setEditDialogOpen(false);
      setEditingCase(null);
      if ((selectedVideo == null ? void 0 : selectedVideo.id) === editingCase.id) setSelectedVideo(null);
      fetchCases();
    } catch (error) {
      toast$1({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from("video_cases").delete().eq("id", id);
      if (error) throw error;
      if ((selectedVideo == null ? void 0 : selectedVideo.id) === id) setSelectedVideo(null);
      toast$1({ title: "Удалено", description: "Видео-кейс удалён" });
      fetchCases();
    } catch (error) {
      toast$1({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };
  const handleReaction = async (caseId, type) => {
    if (!user) {
      navigate("/auth", { state: { from: "/video-cases" } });
      return;
    }
    try {
      const existing = cases.find((c) => c.id === caseId);
      if (!existing) return;
      if (existing.user_reaction === type) {
        await supabase.from("video_case_reactions").delete().eq("video_case_id", caseId).eq("user_id", user.id);
      } else if (existing.user_reaction) {
        await supabase.from("video_case_reactions").update({ reaction_type: type }).eq("video_case_id", caseId).eq("user_id", user.id);
      } else {
        await supabase.from("video_case_reactions").insert({ video_case_id: caseId, user_id: user.id, reaction_type: type });
      }
      fetchCases();
    } catch (error) {
      toast$1({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };
  const isEmbedCode = (path) => {
    return path.trim().startsWith("<iframe") || path.trim().startsWith("<embed");
  };
  const getVideoType = (url) => {
    const lower = url.toLowerCase();
    if (lower.endsWith(".mov")) return "video/quicktime";
    if (lower.endsWith(".webm")) return "video/webm";
    return "video/mp4";
  };
  const decodeHtmlEntities = (value) => value.replace(/&amp;/g, "&").replace(/&#38;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const extractEmbedSrc = (embed) => {
    const match = embed.match(/src=["']([^"']+)["']/i);
    return match ? decodeHtmlEntities(match[1]) : "";
  };
  const getPlayableEmbedSrc = (path) => isEmbedCode(path) ? extractEmbedSrc(path) : path;
  const isYandexCloudVideo = (path) => {
    const src = getPlayableEmbedSrc(path);
    try {
      const url = new URL(src);
      return url.hostname === "runtime.video.cloud.yandex.net" && url.pathname.startsWith("/player/");
    } catch {
      return false;
    }
  };
  const groupedCases = useMemo(() => {
    const groups = [];
    for (const cat of VISIBLE_CATEGORIES) {
      const items = cases.filter((c) => c.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, label: CATEGORY_LABELS[cat], items });
      }
    }
    return groups;
  }, [cases]);
  useHashOpen("video", cases.length > 0, useCallback((id) => {
    const v = cases.find((c) => c.id === id);
    if (v) setSelectedVideo(v);
  }, [cases]));
  const CategorySelect = ({ value, onChange }) => /* @__PURE__ */ jsxs(Select, { value, onValueChange: (v) => onChange(v), children: [
    /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Категория" }) }),
    /* @__PURE__ */ jsx(SelectContent, { children: VISIBLE_CATEGORIES.map((cat) => /* @__PURE__ */ jsx(SelectItem, { value: cat, children: CATEGORY_LABELS[cat] }, cat)) })
  ] });
  return /* @__PURE__ */ jsx(AgeConfirmationModal, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background select-none", onContextMenu: handleContextMenu, onCopy: (e) => e.preventDefault(), children: [
    /* @__PURE__ */ jsx(PageMeta, { title: isEn ? "Video Cases — Prof. Tarusin" : "Видео-кейсы — Проф. Тарусин Д.И.", description: isEn ? "Short surgical videos, notes and clinical case reviews by Professor Tarusin." : "Короткие видео из операционной, заметки и разборы клинических случаев профессора Тарусина Д.И.", path: "/video-cases" }),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Video Cases" : "Видео-кейсы" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "Short surgical videos, notes and clinical case reviews" : "Короткие видео из операционной, заметки и разборы клинических случаев" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-12 flex items-center justify-between flex-wrap gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Video, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "All Cases" : "Все кейсы" })
        ] }),
        isAdmin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-primary" }),
            "Администратор"
          ] }),
          /* @__PURE__ */ jsxs(Dialog, { open: addDialogOpen, onOpenChange: (open) => {
            setAddDialogOpen(open);
            if (!open) resetForm();
            if (open) {
              const draft = loadVideoDraft();
              if (draft && (draft.formTitle || draft.formDescription)) {
                toast("Найден черновик", {
                  description: "Восстановить несохранённые изменения?",
                  action: { label: "Восстановить", onClick: () => {
                    if (draft.formTitle) setFormTitle(draft.formTitle);
                    if (draft.formDescription) setFormDescription(draft.formDescription);
                    if (draft.formVideoUrl) setFormVideoUrl(draft.formVideoUrl);
                    if (draft.formCategory) setFormCategory(draft.formCategory);
                    toast.success("Черновик восстановлен");
                  } },
                  cancel: { label: "Отклонить", onClick: () => clearVideoDraft() },
                  duration: 1e4
                });
              }
            }
          }, children: [
            /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              "Добавить кейс"
            ] }) }),
            /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
              /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Новый видео-кейс" }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Название", value: formTitle, onChange: (e) => setFormTitle(e.target.value) }),
                /* @__PURE__ */ jsx(Textarea, { placeholder: "Описание (необязательно)", value: formDescription, onChange: (e) => setFormDescription(e.target.value), rows: 3 }),
                /* @__PURE__ */ jsx(CategorySelect, { value: formCategory, onChange: setFormCategory }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(Button, { type: "button", variant: formVideoType === "url" ? "default" : "outline", size: "sm", onClick: () => setFormVideoType("url"), children: "Ссылка (URL)" }),
                  /* @__PURE__ */ jsx(Button, { type: "button", variant: formVideoType === "embed" ? "default" : "outline", size: "sm", onClick: () => setFormVideoType("embed"), children: "Embed-код" })
                ] }),
                formVideoType === "url" ? /* @__PURE__ */ jsx(Input, { placeholder: "Ссылка на видео (URL)", value: formVideoUrl, onChange: (e) => setFormVideoUrl(e.target.value) }) : /* @__PURE__ */ jsx(Textarea, { placeholder: 'Вставьте embed-код (например <iframe src="..."></iframe>)', value: formVideoUrl, onChange: (e) => setFormVideoUrl(e.target.value), rows: 4 }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-1 block", children: "Обложка (превью)" }),
                  /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", ref: thumbnailInputRef, className: "hidden", onChange: handleThumbnailChange }),
                  formThumbnailPreview ? /* @__PURE__ */ jsxs("div", { className: "relative w-32 h-24 rounded overflow-hidden border", children: [
                    /* @__PURE__ */ jsx("img", { src: formThumbnailPreview, alt: "Превью", className: "w-full h-full object-cover" }),
                    /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "absolute top-0 right-0 bg-black/50 text-white h-6 w-6", onClick: () => {
                      setFormThumbnail(null);
                      setFormThumbnailPreview(null);
                    }, children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
                  ] }) : /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => {
                    var _a;
                    return (_a = thumbnailInputRef.current) == null ? void 0 : _a.click();
                  }, children: [
                    /* @__PURE__ */ jsx(ImagePlus, { className: "w-4 h-4 mr-2" }),
                    "Загрузить обложку"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { onClick: handleAdd, disabled: saving, className: "w-full", children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                "Сохранение..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Link2, { className: "w-4 h-4 mr-2" }),
                "Добавить"
              ] }) }) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Dialog, { open: editDialogOpen, onOpenChange: (open) => {
        setEditDialogOpen(open);
        if (!open) {
          resetForm();
          setEditingCase(null);
        }
      }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
        /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Редактировать видео-кейс" }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(Input, { placeholder: "Название", value: formTitle, onChange: (e) => setFormTitle(e.target.value) }),
          /* @__PURE__ */ jsx(Textarea, { placeholder: "Описание (необязательно)", value: formDescription, onChange: (e) => setFormDescription(e.target.value), rows: 3 }),
          /* @__PURE__ */ jsx(CategorySelect, { value: formCategory, onChange: setFormCategory }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { type: "button", variant: formVideoType === "url" ? "default" : "outline", size: "sm", onClick: () => setFormVideoType("url"), children: "Ссылка (URL)" }),
            /* @__PURE__ */ jsx(Button, { type: "button", variant: formVideoType === "embed" ? "default" : "outline", size: "sm", onClick: () => setFormVideoType("embed"), children: "Embed-код" })
          ] }),
          formVideoType === "url" ? /* @__PURE__ */ jsx(Input, { placeholder: "Ссылка на видео (URL)", value: formVideoUrl, onChange: (e) => setFormVideoUrl(e.target.value) }) : /* @__PURE__ */ jsx(Textarea, { placeholder: 'Вставьте embed-код (например <iframe src="..."></iframe>)', value: formVideoUrl, onChange: (e) => setFormVideoUrl(e.target.value), rows: 4 }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-1 block", children: "Обложка (превью)" }),
            /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", className: "hidden", id: "edit-thumbnail", onChange: handleThumbnailChange }),
            formThumbnailPreview ? /* @__PURE__ */ jsxs("div", { className: "relative w-32 h-24 rounded overflow-hidden border", children: [
              /* @__PURE__ */ jsx("img", { src: formThumbnailPreview, alt: "Превью", className: "w-full h-full object-cover" }),
              /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "absolute top-0 right-0 bg-black/50 text-white h-6 w-6", onClick: () => {
                setFormThumbnail(null);
                setFormThumbnailPreview(null);
              }, children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
            ] }) : /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => {
              var _a;
              return (_a = document.getElementById("edit-thumbnail")) == null ? void 0 : _a.click();
            }, children: [
              /* @__PURE__ */ jsx(ImagePlus, { className: "w-4 h-4 mr-2" }),
              "Загрузить обложку"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { onClick: handleEdit, disabled: saving, className: "w-full", children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
          "Сохранение..."
        ] }) : "Сохранить изменения" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Dialog, { open: !!selectedVideo, onOpenChange: (open) => !open && setSelectedVideo(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "w-auto max-w-[95vw] sm:max-w-none p-0 overflow-hidden bg-background", onContextMenu: handleContextMenu, children: [
        /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "absolute right-3 top-3 z-[60] rounded-full bg-black/70 text-white p-2 hover:bg-black/90 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50", children: [
          /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Закрыть" })
        ] }) }),
        selectedVideo && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(DialogHeader, { className: "sr-only", children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: selectedVideo.title }),
            /* @__PURE__ */ jsx(DialogDescription, { children: selectedVideo.description || "Просмотр видео-кейса" })
          ] }),
          isYandexCloudVideo(selectedVideo.video_path) ? /* @__PURE__ */ jsx(
            YandexCloudVideoPlayer,
            {
              playerUrl: getPlayableEmbedSrc(selectedVideo.video_path),
              title: selectedVideo.title,
              onContextMenu: handleContextMenu
            },
            selectedVideo.id
          ) : isEmbedCode(selectedVideo.video_path) ? /* @__PURE__ */ jsx(
            "iframe",
            {
              title: selectedVideo.title,
              src: extractEmbedSrc(selectedVideo.video_path),
              className: "block h-[min(85vh,820px)] aspect-[9/16] max-w-[95vw] bg-black mx-auto",
              allowFullScreen: true,
              referrerPolicy: "strict-origin-when-cross-origin",
              allow: "autoplay; fullscreen; encrypted-media; accelerometer; gyroscope; picture-in-picture; clipboard-write; web-share; screen-wake-lock",
              frameBorder: "0"
            },
            selectedVideo.id
          ) : /* @__PURE__ */ jsxs(
            "video",
            {
              controls: true,
              autoPlay: true,
              playsInline: true,
              preload: "auto",
              controlsList: "nodownload nofullscreen noremoteplayback",
              disablePictureInPicture: true,
              disableRemotePlayback: true,
              onContextMenu: handleContextMenu,
              onDragStart: (e) => e.preventDefault(),
              className: "block h-[min(85vh,820px)] max-w-[95vw] bg-black mx-auto object-contain",
              children: [
                /* @__PURE__ */ jsx("source", { src: selectedVideo.video_path, type: getVideoType(selectedVideo.video_path) }),
                /* @__PURE__ */ jsx("source", { src: selectedVideo.video_path, type: "video/mp4" }),
                "Ваш браузер не поддерживает воспроизведение этого видео."
              ]
            },
            selectedVideo.id
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full", children: CATEGORY_LABELS[selectedVideo.category] }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-2", children: selectedVideo.title }),
            selectedVideo.description && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: selectedVideo.description }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
              /* @__PURE__ */ jsx(ReactionButtons, { caseItem: selectedVideo, onReaction: handleReaction }),
              isEmbedCode(selectedVideo.video_path) && getPlayableEmbedSrc(selectedVideo.video_path) && /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => window.open(getPlayableEmbedSrc(selectedVideo.video_path), "_blank", "noopener,noreferrer"),
                  children: [
                    /* @__PURE__ */ jsx(Link2, { className: "w-4 h-4 mr-2" }),
                    "Открыть отдельно"
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) : cases.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx(Video, { className: "w-16 h-16 mx-auto text-muted-foreground mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground", children: isEn ? "No video cases added yet" : "Видео-кейсы пока не добавлены" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-16", children: groupedCases.map(({ category, label, items }) => /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-xl md:text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border", children: [
          label,
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-normal text-muted-foreground ml-2", children: [
            "(",
            items.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6", children: items.map((c) => /* @__PURE__ */ jsx("div", { id: `video-${c.id}`, className: "scroll-mt-24 rounded-xl", children: /* @__PURE__ */ jsx(
          VideoCaseCard,
          {
            c,
            isAdmin,
            onSelect: setSelectedVideo,
            onEdit: openEditDialog,
            onDelete: handleDelete,
            onReaction: handleReaction,
            onContextMenu: handleContextMenu,
            isEmbedCode,
            getVideoType
          }
        ) }, c.id)) })
      ] }, category)) })
    ] })
  ] }) });
};
function YandexCloudVideoPlayer({
  playerUrl,
  title,
  onContextMenu
}) {
  var _a, _b;
  const videoRef = useRef(null);
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useNativePlayer, setUseNativePlayer] = useState(false);
  const hlsUrl = (_a = resolved == null ? void 0 : resolved.streams.find((stream) => stream.type === "hls")) == null ? void 0 : _a.url;
  const dashUrl = (_b = resolved == null ? void 0 : resolved.streams.find((stream) => stream.type === "dash")) == null ? void 0 : _b.url;
  const manifestUrl = dashUrl || hlsUrl;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setUseNativePlayer(false);
    setResolved(null);
    supabase.functions.invoke("resolve-yandex-video", { body: { playerUrl } }).then(({ data, error: invokeError }) => {
      if (cancelled) return;
      if (invokeError) throw invokeError;
      setResolved(data);
    }).catch(() => {
      if (!cancelled) setUseNativePlayer(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [playerUrl]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !manifestUrl || useNativePlayer) return;
    let cancelled = false;
    let plyr = null;
    let dash = null;
    import("plyr").then((module) => {
      if (cancelled || !videoRef.current) return;
      const PlyrCtor = module.default ?? module;
      plyr = new PlyrCtor(videoRef.current, {
        controls: ["play-large", "play", "progress", "current-time", "duration", "mute", "volume", "settings", "fullscreen"],
        settings: ["quality", "speed"],
        speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] },
        ratio: "9:16",
        clickToPlay: true,
        hideControls: false,
        invertTime: false,
        i18n: {
          restart: "Сначала",
          rewind: "Назад {seektime} сек",
          play: "Воспроизвести",
          pause: "Пауза",
          fastForward: "Вперёд {seektime} сек",
          seek: "Перемотка",
          played: "Просмотрено",
          buffered: "Загружено",
          currentTime: "Текущее время",
          duration: "Длительность",
          volume: "Громкость",
          mute: "Выключить звук",
          unmute: "Включить звук",
          enableCaptions: "Включить субтитры",
          disableCaptions: "Выключить субтитры",
          enterFullscreen: "На весь экран",
          exitFullscreen: "Выйти из полноэкранного режима",
          settings: "Настройки",
          speed: "Скорость",
          normal: "Обычная",
          quality: "Качество"
        }
      });
    }).catch(() => void 0);
    const failToNative = () => setUseNativePlayer(true);
    video.addEventListener("error", failToNative, { once: true });
    const watchdog = window.setTimeout(() => {
      if (!cancelled && (!video.readyState || video.readyState < 1)) {
        failToNative();
      }
    }, 8e3);
    const clearWatchdog = () => window.clearTimeout(watchdog);
    video.addEventListener("loadedmetadata", clearWatchdog, { once: true });
    if (dashUrl) {
      import("dashjs").then(({ MediaPlayer }) => {
        if (cancelled || !videoRef.current) return;
        try {
          dash = MediaPlayer().create();
          dash.updateSettings({
            streaming: {
              buffer: { stableBufferTime: 30, bufferTimeAtTopQuality: 30 },
              retryIntervals: { MPD: 800, Fragment: 800 },
              retryAttempts: { MPD: 5, Fragment: 5 }
            }
          });
          dash.on(MediaPlayer.events.ERROR, failToNative);
          dash.on(MediaPlayer.events.PLAYBACK_ERROR, failToNative);
          dash.initialize(videoRef.current, dashUrl, true);
        } catch (err) {
          console.warn("[DASH player failed]", err);
          failToNative();
        }
      }).catch(() => failToNative());
    } else if (hlsUrl) {
      video.src = hlsUrl;
      video.play().catch(() => void 0);
    }
    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      video.removeEventListener("error", failToNative);
      video.removeEventListener("loadedmetadata", clearWatchdog);
      try {
        dash == null ? void 0 : dash.reset();
      } catch {
      }
      try {
        plyr == null ? void 0 : plyr.destroy();
      } catch {
      }
    };
  }, [dashUrl, hlsUrl, manifestUrl, useNativePlayer]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "h-[min(85vh,820px)] aspect-[9/16] max-w-[95vw] bg-muted mx-auto flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (useNativePlayer) {
    return /* @__PURE__ */ jsx(
      "iframe",
      {
        title,
        src: playerUrl,
        className: "block h-[min(85vh,820px)] aspect-[9/16] max-w-[95vw] bg-muted mx-auto",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
        allow: "autoplay; fullscreen; encrypted-media; accelerometer; gyroscope; picture-in-picture; clipboard-write; web-share; screen-wake-lock",
        frameBorder: "0"
      }
    );
  }
  if (manifestUrl) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: "relative h-[min(85vh,820px)] aspect-[9/16] max-w-[95vw] bg-black mx-auto overflow-hidden [&_.plyr]:h-full [&_.plyr]:w-full [&_.plyr--video]:bg-black [&_.plyr__video-wrapper]:h-full [&_.plyr__video-wrapper]:bg-black [&_.plyr__control--overlaid]:bg-accent [&_.plyr__control--overlaid]:text-accent-foreground [&_.plyr--full-ui_input[type=range]]:text-primary [&_.plyr__control:hover]:bg-accent [&_.plyr__control:hover]:text-accent-foreground",
        onContextMenu,
        children: [
          /* @__PURE__ */ jsx(
            "video",
            {
              ref: videoRef,
              autoPlay: true,
              playsInline: true,
              preload: "auto",
              poster: (resolved == null ? void 0 : resolved.thumbnail) || void 0,
              controlsList: "nodownload noremoteplayback",
              disablePictureInPicture: true,
              disableRemotePlayback: true,
              onDragStart: (e) => e.preventDefault(),
              className: "h-full w-full bg-black object-contain"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: title })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "h-[min(85vh,820px)] aspect-[9/16] max-w-[95vw] bg-muted mx-auto flex flex-col items-center justify-center gap-4 p-6 text-center", children: [
    /* @__PURE__ */ jsx(Video, { className: "w-12 h-12 text-muted-foreground" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: "Не удалось подготовить встроенный плеер." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Откройте видео отдельно." })
    ] }),
    /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => window.open(playerUrl, "_blank", "noopener,noreferrer"), children: [
      /* @__PURE__ */ jsx(Link2, { className: "w-4 h-4 mr-2" }),
      "Открыть видео отдельно"
    ] }),
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: title })
  ] });
}
function VideoCaseCard({
  c,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
  onReaction,
  onContextMenu,
  isEmbedCode,
  getVideoType
}) {
  return /* @__PURE__ */ jsxs(Card, { className: "group overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col", onContextMenu, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "aspect-[3/4] bg-black relative cursor-pointer overflow-hidden",
        onClick: () => onSelect(c),
        children: [
          c.thumbnail_path ? /* @__PURE__ */ jsx(
            "img",
            {
              src: c.thumbnail_path,
              alt: c.title,
              className: "absolute inset-0 w-full h-full object-cover",
              onContextMenu,
              onDragStart: (e) => e.preventDefault()
            }
          ) : isEmbedCode(c.video_path) ? /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Video, { className: "w-12 h-12 text-muted-foreground" }) }) : /* @__PURE__ */ jsxs(
            "video",
            {
              className: "absolute inset-0 w-full h-full object-cover",
              preload: "metadata",
              playsInline: true,
              muted: true,
              controlsList: "nodownload",
              disablePictureInPicture: true,
              disableRemotePlayback: true,
              onContextMenu,
              onDragStart: (e) => e.preventDefault(),
              children: [
                /* @__PURE__ */ jsx("source", { src: c.video_path + "#t=0.1", type: getVideoType(c.video_path) }),
                /* @__PURE__ */ jsx("source", { src: c.video_path + "#t=0.1", type: "video/mp4" })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsx(Play, { className: "w-8 h-8 text-accent-foreground ml-1" }) }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex flex-col flex-1", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-1 line-clamp-2 min-h-[3rem]", children: c.title }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]", children: c.description || "" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto", children: [
        /* @__PURE__ */ jsx(ReactionButtons, { caseItem: c, onReaction, compact: true }),
        isAdmin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "text-muted-foreground hover:text-primary",
              onClick: (e) => {
                e.stopPropagation();
                onEdit(c);
              },
              children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxs(AlertDialog, { children: [
            /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "text-muted-foreground hover:text-destructive",
                onClick: (e) => e.stopPropagation(),
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            ) }),
            /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
              /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить видео-кейс?" }),
                /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
                  "«",
                  c.title,
                  "» будет удалён без возможности восстановления."
                ] })
              ] }),
              /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
                /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => onDelete(c.id), className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Удалить" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function ReactionButtons({ caseItem, onReaction, compact }) {
  const size = compact ? "sm" : "default";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxs(
      Button,
      {
        variant: caseItem.user_reaction === "like" ? "default" : "outline",
        size,
        onClick: (e) => {
          e.stopPropagation();
          onReaction(caseItem.id, "like");
        },
        className: "gap-1",
        children: [
          /* @__PURE__ */ jsx(ThumbsUp, { className: iconSize }),
          /* @__PURE__ */ jsx("span", { children: caseItem.likes })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      Button,
      {
        variant: caseItem.user_reaction === "dislike" ? "destructive" : "outline",
        size,
        onClick: (e) => {
          e.stopPropagation();
          onReaction(caseItem.id, "dislike");
        },
        className: "gap-1",
        children: [
          /* @__PURE__ */ jsx(ThumbsDown, { className: iconSize }),
          /* @__PURE__ */ jsx("span", { children: caseItem.dislikes })
        ]
      }
    )
  ] });
}
export {
  VideoCases as default
};
