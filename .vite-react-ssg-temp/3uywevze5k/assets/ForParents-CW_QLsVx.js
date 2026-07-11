import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, BookOpen, ExternalLink, FileText, Download, Video, Headphones, X, Save, Pencil, ChevronUp, ChevronDown, RefreshCw, WifiOff, AlertCircle, Filter, Search, List, LayoutGrid, SortDesc, SortAsc, CheckCircle, AlertTriangle, Phone, ClipboardList, Scissors, HeartPulse, ArrowLeft, Baby, User } from "lucide-react";
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { s as supabase, C as Card, a as CardContent, B as Button, I as Input, T as Textarea, u as useAuth, b as Badge, P as PageMeta } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { useTranslation } from "react-i18next";
import { A as AgeConfirmationModal } from "./AgeConfirmationModal-COJlSvbH.js";
import { A as AspectRatio } from "./aspect-ratio-Dpegpaxz.js";
import { p as proxyImage } from "./proxyImage-Ng0mzHWC.js";
import { r as resolveMaterialPreview, p as pagesLabel } from "./parentsMaterialsBucket-BE8GfiP2.js";
import DOMPurify from "dompurify";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { toast } from "sonner";
import { R as RichTextEditor } from "./RichTextEditor-Dy3yot2p.js";
import { B as BentoImageCell, D as DiseaseBentoCard } from "./DiseaseBentoCard-Di1W66C4.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, c as AccordionContent } from "./accordion-CN1jpepQ.js";
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
import "@radix-ui/react-tabs";
import "@radix-ui/react-aspect-ratio";
import "@radix-ui/react-collapsible";
import "@tiptap/react";
import "@tiptap/starter-kit";
import "@tiptap/extension-underline";
import "@tiptap/extension-image";
import "@radix-ui/react-select";
import "@radix-ui/react-accordion";
const UsefulMaterials = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("parents_materials").select("*").eq("is_published", true).order("kind", { ascending: true }).order("sort_order", { ascending: true });
      if (error) {
        console.warn("[UsefulMaterials] load error:", error.message);
      }
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);
  const pickTitle = (m) => isEn && m.title_en ? m.title_en : m.title;
  const pickDesc = (m) => isEn && m.description_en ? m.description_en : m.description || "";
  const articles = items.filter((i) => i.kind === "article");
  const videos = items.filter((i) => i.kind === "video");
  const podcasts = items.filter((i) => i.kind === "podcast");
  const handouts = items.filter((i) => i.kind === "handout");
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center py-16", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    articles.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(BookOpen, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Articles" : "Статьи" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: articles.map((article) => {
        const preview = resolveMaterialPreview(article);
        return /* @__PURE__ */ jsxs(
          Card,
          {
            className: "group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer",
            onClick: () => window.open(article.url, "_blank"),
            children: [
              /* @__PURE__ */ jsx("div", { className: "relative overflow-hidden", children: /* @__PURE__ */ jsxs(AspectRatio, { ratio: 16 / 10, children: [
                preview ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: proxyImage(preview),
                    alt: pickTitle(article),
                    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                    onError: (e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }
                  }
                ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx(BookOpen, { className: "w-10 h-10 text-muted-foreground" }) }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" }),
                article.source && /* @__PURE__ */ jsx("div", { className: "absolute top-3 left-3", children: /* @__PURE__ */ jsx("span", { className: "bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full", children: article.source }) }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-3 left-3 right-3", children: /* @__PURE__ */ jsxs("h3", { className: "text-white font-semibold text-base leading-snug line-clamp-2", children: [
                  article.emoji ? `${article.emoji} ` : "",
                  pickTitle(article)
                ] }) })
              ] }) }),
              /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
                pickDesc(article) && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm line-clamp-3 mb-3", children: pickDesc(article) }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center text-primary text-sm font-medium group-hover:underline", children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "w-3.5 h-3.5 mr-1.5" }),
                  isEn ? "Read article" : "Читать статью"
                ] })
              ] })
            ]
          },
          article.id
        );
      }) })
    ] }),
    handouts.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Downloadable Materials" : "Материалы для скачивания" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: handouts.map((h) => {
        const preview = resolveMaterialPreview(h);
        return /* @__PURE__ */ jsx(Link, { to: `/for-parents/materials/${h.slug}/`, className: "group", children: /* @__PURE__ */ jsxs(Card, { className: "h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer", children: [
          /* @__PURE__ */ jsx("div", { className: "relative overflow-hidden", children: /* @__PURE__ */ jsxs(AspectRatio, { ratio: 16 / 10, children: [
            preview ? /* @__PURE__ */ jsx("img", { src: proxyImage(preview), alt: pickTitle(h), className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", onError: (e) => {
              e.currentTarget.src = "/placeholder.svg";
            } }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx(FileText, { className: "w-12 h-12 text-muted-foreground" }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-3 left-3", children: /* @__PURE__ */ jsxs("span", { className: "bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full", children: [
              "PDF",
              h.pages_count ? ` · ${pagesLabel(h.pages_count)}` : ""
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-3 left-3 right-3", children: /* @__PURE__ */ jsxs("h3", { className: "text-white font-semibold text-base leading-snug line-clamp-2", children: [
              h.emoji ? `${h.emoji} ` : "",
              pickTitle(h)
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
            pickDesc(h) && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm line-clamp-3 mb-3", children: pickDesc(h) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center text-primary text-sm font-medium group-hover:underline", children: [
              /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5 mr-1.5" }),
              isEn ? "Download" : "Скачать"
            ] })
          ] })
        ] }) }, h.id);
      }) })
    ] }),
    videos.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Video, { className: "w-6 h-6 text-accent" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Videos for Parents" : "Видео для родителей" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-6", children: videos.map((video) => {
        const preview = resolveMaterialPreview(video);
        return /* @__PURE__ */ jsxs(Card, { className: "group overflow-hidden hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsxs("div", { className: "aspect-video bg-muted relative overflow-hidden", children: [
            preview ? /* @__PURE__ */ jsx(
              "img",
              {
                src: proxyImage(preview),
                alt: pickTitle(video),
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                onError: (e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Video, { className: "w-12 h-12 text-muted-foreground" }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-accent flex items-center justify-center", children: /* @__PURE__ */ jsx(Video, { className: "w-8 h-8 text-accent-foreground" }) }) })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: pickTitle(video) }),
            pickDesc(video) && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: pickDesc(video) }),
            /* @__PURE__ */ jsxs(Button, { className: "w-full bg-accent hover:bg-accent/90 text-accent-foreground", onClick: () => window.open(video.url, "_blank"), children: [
              /* @__PURE__ */ jsx(Video, { className: "w-4 h-4 mr-2" }),
              isEn ? "Watch video" : "Смотреть видео"
            ] })
          ] })
        ] }, video.id);
      }) })
    ] }),
    podcasts.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-secondary flex items-center justify-center", children: /* @__PURE__ */ jsx(Headphones, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Podcasts" : "Подкасты" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-6", children: podcasts.map((podcast) => /* @__PURE__ */ jsx(Card, { className: "group hover:shadow-lg transition-shadow", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Headphones, { className: "w-8 h-8 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          podcast.source && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mb-1", children: podcast.source }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: pickTitle(podcast) }),
          pickDesc(podcast) && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm mb-4", children: pickDesc(podcast) }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => window.open(podcast.url, "_blank"), children: [
            /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
            isEn ? "Listen" : "Слушать"
          ] })
        ] })
      ] }) }) }, podcast.id)) })
    ] }),
    items.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-16 text-muted-foreground", children: isEn ? "Materials will appear here soon." : "Материалы скоро появятся." })
  ] });
};
const getPublicUrl = (path) => {
  const { data } = supabase.storage.from("disease-media").getPublicUrl(path);
  return data.publicUrl;
};
const DiseaseArticleCard = ({ article, isAdmin, onArticleUpdated }) => {
  var _a, _b, _c;
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    article.video_path ? "video" : article.audio_path ? "audio" : "text"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editDescription, setEditDescription] = useState(article.description || "");
  const [editContent, setEditContent] = useState(article.article_content || "");
  const [saving, setSaving] = useState(false);
  const hasVideo = !!article.video_path;
  const hasAudio = !!article.audio_path;
  const hasText = !!article.article_content;
  const handleEdit = () => {
    setEditTitle(article.title);
    setEditDescription(article.description || "");
    setEditContent(article.article_content || "");
    setIsEditing(true);
    setIsArticleOpen(true);
    setActiveTab("text");
  };
  const handleCancel = () => {
    setIsEditing(false);
  };
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("disease_articles").update({
      title: editTitle,
      description: editDescription || null,
      article_content: editContent || null,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", article.id);
    setSaving(false);
    if (error) {
      toast.error("Ошибка сохранения: " + error.message);
    } else {
      toast.success("Статья сохранена");
      setIsEditing(false);
      onArticleUpdated == null ? void 0 : onArticleUpdated();
    }
  };
  return /* @__PURE__ */ jsx(Card, { className: "overflow-hidden hover:shadow-lg transition-shadow select-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
    isAdmin && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2 px-4 py-2 bg-muted/50 border-b", children: isEditing ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", onClick: handleCancel, disabled: saving, children: [
        /* @__PURE__ */ jsx(X, { className: "w-4 h-4 mr-1" }),
        " Отмена"
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: handleSave, disabled: saving, children: [
        /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-1" }),
        " ",
        saving ? "Сохранение..." : "Сохранить"
      ] })
    ] }) : /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: handleEdit, children: [
      /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4 mr-1" }),
      " Править"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex border-b bg-muted/30", children: [
      hasVideo && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("video"),
          className: `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "video" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`,
          children: [
            /* @__PURE__ */ jsx(Video, { className: "w-4 h-4" }),
            "Смотреть"
          ]
        }
      ),
      hasAudio && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("audio"),
          className: `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "audio" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`,
          children: [
            /* @__PURE__ */ jsx(Headphones, { className: "w-4 h-4" }),
            "Слушать"
          ]
        }
      ),
      (hasText || isEditing) && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("text"),
          className: `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`,
          children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
            "Читать"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-6", children: isEditing ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-1 block", children: "Заголовок" }),
        /* @__PURE__ */ jsx(Input, { value: editTitle, onChange: (e) => setEditTitle(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-1 block", children: "Описание" }),
        /* @__PURE__ */ jsx(Textarea, { value: editDescription, onChange: (e) => setEditDescription(e.target.value), rows: 2 })
      ] }),
      activeTab === "text" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground mb-1 block", children: "Текст статьи" }),
        /* @__PURE__ */ jsx(RichTextEditor, { content: editContent, onChange: setEditContent })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: /* @__PURE__ */ jsx(Link, { to: `/for-parents/${article.slug}/`, className: "hover:text-primary transition-colors", children: article.title }) }),
      article.description && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm mb-4", children: article.description }),
      (((_a = article.bento_image_1) == null ? void 0 : _a.path) || ((_b = article.bento_image_2) == null ? void 0 : _b.path) || ((_c = article.bento_image_3) == null ? void 0 : _c.path)) && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2 mb-4 max-w-md", children: [article.bento_image_1, article.bento_image_2, article.bento_image_3].map((c, i) => /* @__PURE__ */ jsx(
        BentoImageCell,
        {
          image: c,
          className: "aspect-square shadow-sm ring-1 ring-border/70",
          rounded: "rounded-lg"
        },
        i
      )) }),
      activeTab === "video" && hasVideo && /* @__PURE__ */ jsx(
        "div",
        {
          className: "aspect-video bg-black rounded-lg overflow-hidden mb-4",
          onContextMenu: (e) => e.preventDefault(),
          children: /* @__PURE__ */ jsx(
            "video",
            {
              controls: true,
              controlsList: "nodownload noplaybackrate",
              disablePictureInPicture: true,
              className: "w-full h-full",
              src: getPublicUrl(article.video_path),
              poster: article.thumbnail_path ? getPublicUrl(article.thumbnail_path) : void 0,
              onContextMenu: (e) => e.preventDefault()
            }
          )
        }
      ),
      activeTab === "audio" && hasAudio && /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-secondary rounded-lg p-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Headphones, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsx(
          "audio",
          {
            controls: true,
            controlsList: "nodownload",
            className: "w-full",
            src: getPublicUrl(article.audio_path),
            onContextMenu: (e) => e.preventDefault()
          }
        )
      ] }) }),
      activeTab === "text" && hasText && /* @__PURE__ */ jsxs(Fragment, { children: [
        isAdmin && /* @__PURE__ */ jsxs(Collapsible, { open: isArticleOpen, onOpenChange: setIsArticleOpen, children: [
          /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full mb-2", children: isArticleOpen ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4 mr-2" }),
            "Свернуть статью (admin preview)"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 mr-2" }),
            "Развернуть статью (admin preview)"
          ] }) }) }),
          /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "prose prose-sm max-w-none text-foreground bg-secondary/30 rounded-lg p-4 [&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_th]:bg-muted [&_th]:p-2 [&_th]:border [&_th]:border-border [&_td]:p-2 [&_td]:border [&_td]:border-border",
              dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(article.article_content) },
              onCopy: (e) => e.preventDefault()
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "secondary", className: "w-full mt-2", children: /* @__PURE__ */ jsxs(Link, { to: `/for-parents/${article.slug}/`, children: [
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
          "Открыть полную страницу"
        ] }) })
      ] })
    ] }) })
  ] }) });
};
const ICONS = {
  loading: /* @__PURE__ */ jsx(RefreshCw, { className: "w-8 h-8 text-primary animate-spin" }),
  empty: /* @__PURE__ */ jsx(BookOpen, { className: "w-8 h-8 text-muted-foreground" }),
  error: /* @__PURE__ */ jsx(WifiOff, { className: "w-8 h-8 text-destructive" }),
  notFound: /* @__PURE__ */ jsx(AlertCircle, { className: "w-8 h-8 text-muted-foreground" })
};
const DEFAULT_COPY = {
  loading: {
    title: "Загружаем материалы…",
    description: "Подключаемся к базе знаний. Это займёт пару секунд."
  },
  empty: {
    title: "Материалы скоро появятся",
    description: "Этот раздел сейчас пополняется. Загляните позже — или посмотрите другие материалы профессора."
  },
  error: {
    title: "Не удалось загрузить материалы",
    description: "Похоже, временные перебои со связью. Проверьте интернет и попробуйте ещё раз — данные не потеряны."
  },
  notFound: {
    title: "Материал не найден",
    description: "Возможно, страница была удалена или ещё не опубликована."
  }
};
function FriendlyFallback({
  variant,
  title,
  description,
  onRetry,
  primaryHref,
  primaryLabel,
  className = ""
}) {
  const copy = DEFAULT_COPY[variant];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex flex-col items-center justify-center text-center px-4 py-16 ${className}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4", children: ICONS[variant] }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-2", children: title ?? copy.title }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-md mb-6", children: description ?? copy.description }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-3", children: [
          onRetry && /* @__PURE__ */ jsxs(Button, { onClick: onRetry, variant: "default", size: "sm", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
            " Попробовать снова"
          ] }),
          primaryHref && /* @__PURE__ */ jsx(Link, { to: primaryHref, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: primaryLabel ?? "Перейти в каталог" }) })
        ] })
      ]
    }
  );
}
function DiseaseCardsSkeleton({ count = 4 }) {
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6", "aria-hidden": "true", children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: "rounded-xl border border-border bg-card p-5 animate-pulse",
      children: [
        /* @__PURE__ */ jsx("div", { className: "h-5 w-2/3 bg-muted rounded mb-3" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-full bg-muted rounded mb-2" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-5/6 bg-muted rounded mb-4" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "h-6 w-20 bg-muted rounded-full" }),
          /* @__PURE__ */ jsx("div", { className: "h-6 w-16 bg-muted rounded-full" })
        ] })
      ]
    },
    i
  )) });
}
const FEATURED_KEYWORDS = ["крипторхиз", "варикоцел", "гинекомасти", "сперматоцел", "пупочн"];
const isFeatured = (a) => {
  const hay = `${a.title} ${a.slug}`.toLowerCase();
  return FEATURED_KEYWORDS.some((k) => hay.includes(k));
};
const DiseaseArticlesList = ({ ageGroup, initialArticles }) => {
  const { isAdmin } = useAuth();
  const seeded = (initialArticles || []).filter((a) => a.age_group === ageGroup);
  const [articles, setArticles] = useState(seeded);
  const [loading, setLoading] = useState(seeded.length === 0);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState("bento");
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase.from("disease_articles").select("*").eq("age_group", ageGroup).eq("is_published", true).order("sort_order", { ascending: true });
    if (error) {
      setLoadError(true);
      setArticles([]);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  }, [ageGroup]);
  useEffect(() => {
    if (seeded.length > 0 && !isAdmin) return;
    fetchArticles();
  }, [fetchArticles, isAdmin, seeded.length]);
  const categories = useMemo(() => {
    const cats = new Set(articles.map((a) => a.category));
    return Array.from(cats).sort();
  }, [articles]);
  const categoryLabels2 = {
    general: "Общее",
    urology: "Урология",
    andrology: "Андрология",
    surgery: "Хирургия",
    endocrinology: "Эндокринология",
    psychology: "Психология",
    sexology: "Сексология",
    genetics: "Генетика"
  };
  const filtered = useMemo(() => {
    let result = articles;
    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => {
          var _a, _b;
          return a.title.toLowerCase().includes(q) || ((_a = a.description) == null ? void 0 : _a.toLowerCase().includes(q)) || ((_b = a.keywords) == null ? void 0 : _b.some((k) => k.toLowerCase().includes(q)));
        }
      );
    }
    return result;
  }, [articles, searchQuery, selectedCategory]);
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
    /* @__PURE__ */ jsx("div", { className: "hidden lg:block w-64 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-24 space-y-1", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold text-foreground mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4" }),
        "Разделы"
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSelectedCategory(null),
          className: `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === null ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`,
          children: [
            "Все заболевания (",
            articles.length,
            ")"
          ]
        }
      ),
      categories.map((cat) => {
        const count = articles.filter((a) => a.category === cat).length;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setSelectedCategory(cat === selectedCategory ? null : cat),
            className: `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedCategory === cat ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx("span", { children: categoryLabels2[cat] || cat }),
              /* @__PURE__ */ jsx("span", { className: `text-xs ${selectedCategory === cat ? "text-primary-foreground/70" : "text-muted-foreground"}`, children: count })
            ]
          },
          cat
        );
      })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Поиск по заболеваниям...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-10"
            }
          )
        ] }),
        categories.length > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap lg:hidden", children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: selectedCategory === null ? "default" : "outline",
              className: "cursor-pointer",
              onClick: () => setSelectedCategory(null),
              children: "Все"
            }
          ),
          categories.map((cat) => /* @__PURE__ */ jsx(
            Badge,
            {
              variant: selectedCategory === cat ? "default" : "outline",
              className: "cursor-pointer",
              onClick: () => setSelectedCategory(cat === selectedCategory ? null : cat),
              children: categoryLabels2[cat] || cat
            },
            cat
          ))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mr-2", children: "Вид:" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              size: "sm",
              variant: viewMode === "list" ? "default" : "outline",
              onClick: () => setViewMode("list"),
              className: "h-8 px-2",
              "aria-label": "Список",
              children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              size: "sm",
              variant: viewMode === "bento" ? "default" : "outline",
              onClick: () => setViewMode("bento"),
              className: "h-8 px-2",
              "aria-label": "Плитка",
              children: /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx(DiseaseCardsSkeleton, { count: 4 }) : loadError ? /* @__PURE__ */ jsx(
        FriendlyFallback,
        {
          variant: "error",
          onRetry: fetchArticles,
          description: "Не удалось загрузить список заболеваний. Проверьте интернет — данные не потеряны, можно повторить попытку."
        }
      ) : filtered.length === 0 ? searchQuery || selectedCategory ? /* @__PURE__ */ jsx(
        FriendlyFallback,
        {
          variant: "empty",
          title: "Ничего не нашлось",
          description: "Попробуйте изменить поисковый запрос или сбросить фильтр по разделу."
        }
      ) : /* @__PURE__ */ jsx(
        FriendlyFallback,
        {
          variant: "empty",
          title: ageGroup === "children" ? "Материалы для детей скоро появятся" : "Материалы для взрослых скоро появятся",
          description: "Раздел сейчас пополняется. Загляните позже — или посмотрите другие материалы профессора.",
          primaryHref: "/for-parents?tab=useful",
          primaryLabel: "Полезные материалы"
        }
      ) : viewMode === "bento" ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[minmax(140px,auto)]", children: filtered.map((article) => /* @__PURE__ */ jsx(
        DiseaseBentoCard,
        {
          article,
          featured: isFeatured(article),
          categoryLabel: categoryLabels2[article.category] || article.category
        },
        article.id
      )) }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6", children: filtered.map((article) => /* @__PURE__ */ jsx(
        DiseaseArticleCard,
        {
          article,
          isAdmin,
          onArticleUpdated: fetchArticles
        },
        article.id
      )) })
    ] })
  ] });
};
const categoryLabels = {
  varicocele: "Варикоцеле",
  cryptorchidism: "Крипторхизм",
  hydrocele: "Гидроцеле / ВОБ / Сперматоцеле",
  foreskin: "Крайняя плоть",
  hypospadias: "Гипоспадия / аномалии",
  puberty: "Половое развитие / пубертат",
  ultrasound: "УЗ-диагностика",
  reproductive: "Репродуктивное здоровье",
  psychology: "Психология / сексология",
  organization: "Организация специальности",
  acute: "Острые состояния мошонки",
  microlithiasis: "Тестикулярный микролитиаз",
  asur: "Конференции АСУР",
  monograph: "Монография / диссертация",
  guidelines: "Главы в руководствах"
};
const publications = [
  { n: 1, title: "Методика микрохирургической варикоцелэктомии с сохранением лимфатических сосудов у детей", authors: "Тарусин Д.И., Задыкян С.С.", source: "Андрология и генитальная хирургия. — 2001. — Приложение. — С. 45", year: "2001", categories: ["varicocele"] },
  { n: 2, title: "Ультразвуковая допплерография органов репродуктивной системы у мальчиков", authors: "Тарусин Д.И., Быковский В.А.", source: "Российский вестник перинатологии и педиатрии. — 2001", year: "2001", categories: ["ultrasound"] },
  { n: 3, title: "Ранние исследования по спермиологии подростков", authors: "Тарусин Д.И., Бухтуев А.Д., Корякин М.В.", source: "Андрология и генитальная хирургия. — 2001. — Приложение", year: "2001", categories: ["reproductive"] },
  { n: 4, title: "Репродуктивное здоровье мальчиков и юношей-подростков (глава в руководстве)", authors: "Тарусин Д.И.", source: "В кн.: Руководство по охране репродуктивного здоровья / под ред. Кулакова В.И., Серова В.Н. — М., 2003", year: "2003", categories: ["monograph", "guidelines"] },
  { n: 5, title: "Детская уроандрология в системе охраны здоровья детей", authors: "Тарусин Д.И., Казанская И.В., Окулов А.Б.", source: "Приказ МЗ РФ № 404 от 12.08.2003 г.", year: "2003", categories: ["organization"] },
  { n: 6, title: "Крипторхизм. Классификация, диагностика, тактика лечения", authors: "Казанская И.В., Григорьев К.И., Тарусин Д.И., Окулов А.Б.", source: "Педиатрия. — 2004", year: "2004", categories: ["cryptorchidism"] },
  { n: 7, title: "Организация уроандрологической помощи в детской поликлинике", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2004", categories: ["organization"] },
  { n: 8, title: "Ранняя диагностика и дифференцированная тактика лечения идиопатического левостороннего варикоцеле у детей и подростков", authors: "Тарусин Д.И.", source: "Кандидатская диссертация. НИИ детской гематологии МЗ РФ, Москва", year: "2000", url: "https://rusneb.ru/catalog/000200_000018_RU_NLR_bibl_256615/", categories: ["monograph", "varicocele"] },
  { n: 9, title: "Факторы риска репродуктивных расстройств у мальчиков и юношей-подростков", authors: "Тарусин Д.И.", source: "Докторская диссертация. РГМУ, Москва", year: "2005", url: "https://medical-diss.com/medicina/faktory-riska-reproduktivnyh-rasstroystv-u-malchikov-i-yunoshey-podrostkov", categories: ["monograph"] },
  { n: 9, title: "Детская урология-андрология. Глава в национальном руководстве по педиатрии", authors: "Тарусин Д.И., Казанская И.В.", source: "Национальное руководство по педиатрии. — М.: ГЭОТАР-Медиа, 2005", year: "2005", categories: ["guidelines"] },
  { n: 10, title: "Детская уроандрология в системе охраны здоровья", authors: "Окулов А.Б., Казанская И.В., Тарусин Д.И.", source: "Андрология и генитальная хирургия. — 2005. — № 3. — С. 55–58", year: "2005", categories: ["organization", "varicocele"] },
  { n: 11, title: "Воспалительные заболевания в детской андрологической практике", authors: "Тарусин Д.И., Садчиков С.С.", source: "Лечащий врач. — 2005. — № 10", year: "2005", url: "https://www.lvrach.ru/2005/10/4533235", categories: ["foreskin"] },
  { n: 12, title: "Организация анестезиологической помощи детям в амбулаторной хирургической практике", authors: "Тарусин Д.И., Петрова Ж.И., Курилова Е.С. и др.", source: "Анестезиология и реаниматология. — 2006. — PMID: 16613048", year: "2006", url: "https://pubmed.ncbi.nlm.nih.gov/16613048/", categories: ["ultrasound", "organization"] },
  { n: 13, title: "Диспансерное наблюдение мальчиков с заболеваниями репродуктивной системы", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2006", categories: ["organization"] },
  { n: 14, title: "Эпидемиология заболеваний репродуктивной системы у мальчиков Москвы", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2007", categories: ["organization"] },
  { n: 15, title: "Девиации кавернозных тел полового члена у подростков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2007", categories: ["hypospadias"] },
  { n: 16, title: "Организация уроандрологической службы для детей. Глава в национальном руководстве", authors: "Тарусин Д.И.", source: "Национальное руководство по детской хирургии. — М.: ГЭОТАР-Медиа, 2008", year: "2008", categories: ["guidelines"] },
  { n: 17, title: "Инфекции, передаваемые половым путём, у подростков-урологических пациентов", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2008", categories: ["reproductive"] },
  { n: 18, title: "Пособие по обследованию состояния репродуктивной системы детей и подростков", authors: "Уварова Е.В., Тарусин Д.И.", source: "М.: МИА, 2009. — 232 с.", year: "2009", url: "https://hum-ecol.ru/1728-0869/article/view/42420", categories: ["ultrasound"] },
  { n: 19, title: "Оценка репродуктивного прогноза при заболеваниях вагинального отростка брюшины", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2009", categories: ["hydrocele"] },
  { n: 20, title: "Заболевания репродуктивной системы у мальчиков (глава)", authors: "Тарусин Д.И.", source: "Национальное руководство по детской урологии-андрологии. — М., 2010", year: "2010", categories: ["guidelines"] },
  { n: 21, title: "Иммунологические аспекты мужского бесплодия в педиатрической практике", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2010", categories: ["reproductive"] },
  { n: 22, title: "Клиническое значение кист придатка яичка у мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2010", categories: ["hydrocele"] },
  { n: 23, title: "Хирургическое лечение сперматоцеле у подростков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2011", categories: ["hydrocele"] },
  { n: 24, title: "Варикоцеле и тестикулярный микролитиаз у детей (глава)", authors: "Тарусин Д.И.", source: "Национальное руководство по урологии / под ред. Лопаткина Н.А. — М.: ГЭОТАР-Медиа, 2012", year: "2012", categories: ["guidelines", "varicocele"] },
  { n: 25, title: "Гормональная терапия при задержке полового развития у мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2012", categories: ["puberty"] },
  { n: 26, title: "Ранние хирургические вмешательства при крипторхизме и их влияние на фертильность", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2012", categories: ["cryptorchidism"] },
  { n: 27, title: "Детская урология в Российской Федерации: путь, достижения, перспективы", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2013", year: "2013", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] },
  { n: 28, title: "Реорганизация здравоохранения — новые вызовы к порядку и качеству уроандрологической помощи детям", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2013", year: "2013", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] },
  { n: 29, title: "Частно-государственное партнёрство в детской урологии-андрологии", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2013", year: "2013", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] },
  { n: 30, title: "Микроциркуляция в тканях яичка и её нарушения при варикоцеле", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2013", categories: ["varicocele"] },
  { n: 31, title: "Диагностика перекрута яичка в педиатрической практике", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2014", categories: ["acute"] },
  { n: 32, title: "Охрана репродуктивного здоровья мальчиков (глава в руководстве)", authors: "Тарусин Д.И., Окулов А.Б., Казанская И.В.", source: "Национальное руководство по детской урологии-андрологии. Изд. 2-е. — М., 2015", year: "2015", url: "https://online.zakon.kz/Document/?doc_id=30439112", categories: ["guidelines"] },
  { n: 33, title: "IV съезд детских урологов-андрологов. Резолюция (соавтор)", authors: "Казанская И.В., Тарусин Д.И., Файзулин А.К. и др.", source: "CyberLeninka / Детская хирургия. — 2015", year: "2015", url: "https://cyberleninka.ru/article/n/17518011.pdf", categories: ["organization"] },
  { n: 34, title: "Тестостерон и его роль в развитии репродуктивной системы мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2015", categories: ["puberty"] },
  { n: 35, title: "Новые аппаратные технологии в детской урологии-андрологии", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2015", categories: ["organization"] },
  { n: 36, title: "Задержка полового развития мальчиков: когда надо беспокоиться? (интервью)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеоинтервью. — 2016", year: "2016", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["puberty"] },
  { n: 37, title: "Половое созревание мальчиков: норма и патология", authors: "Тарусин Д.И.", source: "АиФ. Здоровье / Аргументы и Факты. — 2016", year: "2016", url: "https://aif.ru/opinion/author/13585", categories: ["puberty"] },
  { n: 38, title: "Конгестивная простатопатия у подростков с варикоцеле", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2016", categories: ["varicocele"] },
  { n: 39, title: "Варикоцеле, тестикулярный микролитиаз и сочетанная патология у подростков (тезисы)", authors: "Тарусин Д.И. и соавт.", source: "IX Московский городской съезд педиатров. Тезисы. — М., 2017", year: "2017", categories: ["microlithiasis", "varicocele"] },
  { n: 40, title: "Варикоцеле и тестикулярный микролитиаз у детей школьного возраста: распространённость и клиническое значение", authors: "Тарусин Д.И. и соавт.", source: "Вестник урологии. — 2017. — № 4", year: "2017", categories: ["varicocele", "microlithiasis"] },
  { n: 41, title: "Операция Murmur в собственной оригинальной модификации у детей. 8 лет опыта", authors: "Тарусин Д.И., Жидков М.В., Тарусин В.Д. и др.", source: "VII Всероссийская Школа. Тезисы. — М., 2018", year: "2018", url: "https://uroweb.ru/sites/default/files/tezisi-det-shkola-2018.pdf", categories: ["varicocele"] },
  { n: 42, title: "Сонографические критерии венозной недостаточности при левостороннем варикоцеле у детей", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "VII Всероссийская Школа. Тезисы. — М., 2018", year: "2018", url: "https://uroweb.ru/sites/default/files/tezisi-det-shkola-2018.pdf", categories: ["varicocele"] },
  { n: 43, title: "Крайняя плоть — бескрайняя", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2018", year: "2018", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] },
  { n: 44, title: "Ультразвуковая диагностика острых заболеваний органов мошонки", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2018", year: "2018", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["ultrasound", "acute"] },
  { n: 45, title: "Детская и подростковая андрология (интервью)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеоинтервью. — 2018", year: "2018", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["puberty"] },
  { n: 46, title: "Орхопексия: сравнение методик при различных формах крипторхизма", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2018", categories: ["cryptorchidism"] },
  { n: 47, title: "Ультразвуковая диагностика в детской урологии-андрологии (глава)", authors: "Тарусин Д.И.", source: "Национальное руководство по ультразвуковой диагностике. — М., 2019", year: "2019", categories: ["guidelines", "ultrasound"] },
  { n: 48, title: "Стратегия и тактика диагностики и лечения варикоцеле у детей и подростков", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2019", year: "2019", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] },
  { n: 49, title: "Болезни крайней плоти: новые морфологические данные о структуре патологических процессов", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2019", year: "2019", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] },
  { n: 50, title: "Лимфатический отёк после операции по поводу варикоцеле. Диагностика и лечение", authors: "Тарусин Д.И.", source: "Андрология и генитальная хирургия. — 2019", year: "2019", categories: ["hydrocele", "varicocele"] },
  { n: 51, title: "Неотложные состояния в детской урологии-андрологии", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2017", year: "2017", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["acute"] },
  { n: 52, title: "Андрология детского возраста", authors: "Тарусин Д.И.", source: "Медиаметрикс. Радио. — 2019", year: "2019", url: "https://mediametrics.ru/articles/view.html?id=60788", categories: ["reproductive"] },
  { n: 53, title: "Ошибки, опасности и юридические стратегии в повседневной практике детского уролога-андролога", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2019", year: "2019", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] },
  { n: 54, title: "Хирургический дневной стационар детской многопрофильной больницы", authors: "Корочкин М.В., Кравчук С.В., Поддубный Г.С. и др.", source: "Проблемы социальной гигиены. — 2019. — PMID: 31747150", year: "2019", url: "https://pubmed.ncbi.nlm.nih.gov/31747150/", categories: ["organization"] },
  { n: 55, title: "Психологические аспекты расстройств полового развития у мальчиков-подростков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2019", categories: ["psychology"] },
  { n: 56, title: "Нарушения эрекции у подростков: диагностика и коррекция", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2019", categories: ["psychology"] },
  { n: 57, title: "Очаговые и диффузные поражения ткани яичка у детей и подростков. Тестикулярный микролитиаз", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2020", year: "2020", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["microlithiasis"] },
  { n: 58, title: "Проблема репродуктивного здоровья подростков мужского пола: комплексный взгляд", authors: "Тарусин Д.И.", source: "Медицинский совет. — 2020", year: "2020", categories: ["reproductive"] },
  { n: 59, title: "Сонография органов мошонки у детей и подростков: нормативные показатели", authors: "Тарусин Д.И., Жидков М.В.", source: "Ультразвуковая и функциональная диагностика. — 2020", year: "2020", categories: ["ultrasound"] },
  { n: 60, title: "Мочеиспускательные дисфункции у мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2020", categories: ["psychology"] },
  { n: 61, title: "Варикоцеле. Ab ovo ad absurdum", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2021", year: "2021", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] },
  { n: 62, title: "Варикоцеле: от ребёнка к взрослому. Необычно об обычном (круглый стол)", authors: "Тарусин Д.И. и соавт.", source: "Uro.TV. Видеотрансляция. — 2021", year: "2021", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] },
  { n: 63, title: "Андрология и пубертат: опыт 20 лет", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2021", categories: ["reproductive"] },
  { n: 64, title: "Поздние осложнения оперативного лечения гипоспадии", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2021", categories: ["hypospadias"] },
  { n: 65, title: "Группировка исходов оперативного лечения варикоцеле", authors: "Тарусин Д.И., Матар А.А. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 67", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["varicocele"] },
  { n: 66, title: "Топическая диагностика венозной недостаточности в системе оттока от левого яичка", authors: "Тарусин Д.И., Матар А.А. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 70", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["varicocele"] },
  { n: 67, title: "Гидролимфоцеле. Памяти профессора А.П. Ерохина", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "XI Всероссийская Школа. Тезисы. — М., 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2023.pdf", categories: ["hydrocele"] },
  { n: 68, title: "Грыжевой мешок — так ли все безобидно?", authors: "Тарусин Д.И., Матар А.А. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 72", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["hydrocele"] },
  { n: 69, title: "Операция Е.А. Ефремова в детской уроандрологической практике. Анонс", authors: "Середницкая Н.А., Тарусин Д.И. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 69", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["reproductive"] },
  { n: 70, title: "Симбиоз детского и взрослого уролога как фундамент мужского здоровья", authors: "Коршунов М.Н., Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2022", year: "2022", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] },
  { n: 71, title: "Варикоцеле: современный взгляд на классификацию и лечение у детей", authors: "Тарусин Д.И.", source: "Детская хирургия. — 2022", year: "2022", categories: ["varicocele"] },
  { n: 72, title: "Микрохирургическая варикоцелэктомия с использованием индигокармина", authors: "Тарусин Д.И., Матар А.А.", source: "eLibrary.ru / РИНЦ", year: "2022", categories: ["varicocele"] },
  { n: 73, title: "Простатопатия у пациентов с варикоцеле — миф или реальность?", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "XI Всероссийская Школа. Тезисы. — М., 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2023.pdf", categories: ["varicocele"] },
  { n: 74, title: "Варикоцеле. To be or not to beat (доклад-обзор)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] },
  { n: 75, title: "«Double Decker» пластика крайней плоти", authors: "Тарусин Д.И., Середницкая Н.А. и др.", source: "XI Всероссийская Школа. Тезисы. — М., 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2023.pdf", categories: ["foreskin"] },
  { n: 76, title: "Лимфангиома мошонки (клиническое наблюдение)", authors: "Сафин Д.А., Тарусин Д.И., Матар А.А.", source: "Урология (Urologiia). — 2023. — № 2. — С. 107–110. DOI: 10.18565/urology.2023.2.107-110", year: "2023", url: "https://urologyjournal.ru/ru/archive/article/42874", categories: ["acute"] },
  { n: 77, title: "Армагеддон в андрологии: последствия ошибок лечения", authors: "Тарусин Д.И.", source: "Uro.TV / UroWeb.ru. Трансляция. — 2023", year: "2023", url: "https://uroweb.ru/news/tarusin-di---armageddon-v-andrologii-posledstviya-oshibok-lecheniya", categories: ["organization"] },
  { n: 78, title: "Психогенные нарушения мочеиспускания у детей", authors: "Тарусин Д.И. и соавт.", source: "XII Всероссийская Школа. Тезисы. — М., 2024", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["psychology"] },
  { n: 79, title: "Современные методы диагностики и лечения сосудистых аномалий урогенитальной области", authors: "Тарусин Д.И., Матар А.А. и др.", source: "10-я Школа АСУР. — Севастополь, 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/programma_asur.pdf", categories: ["asur"] },
  { n: 80, title: "Варикоцеле у детей (доклад на конгрессе АСУР)", authors: "Тарусин Д.И.", source: "VII Конгресс АСУР. — М., 2023", year: "2023", categories: ["asur", "varicocele"] },
  { n: 81, title: "Заболевания крайней плоти и головки полового члена у детей", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] },
  { n: 82, title: "Острые и хронические заболевания крайней плоти у детей", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] },
  { n: 83, title: "Проблема баланопостита у детей", authors: "Тарусин Д.И., Матар А.А. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 14", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["foreskin"] },
  { n: 84, title: "Типичные ошибки в диагностике непальпируемого яичка", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 17", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["cryptorchidism"] },
  { n: 85, title: "Клиническое наблюдение — полное удвоение уретры при гипоспадии", authors: "Матар А.А., Середницкая Н.А., Тарусин Д.И. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 18", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["hypospadias"] },
  { n: 86, title: "Клиническое наблюдение — полное удвоение уретры при гипоспадии (видеодоклад)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["hypospadias"] },
  { n: 87, title: "Паттерн ночной эрекции — что, зачем, почему?", authors: "Тарусин Д.И., Матар А.А. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 13", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["reproductive"] },
  { n: 88, title: "Новое слово в лечении дисфункции мышц тазового дна и ассоциированных с ним расстройств", authors: "Тарусин Д.И., Матар А.А. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 11", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["reproductive"] },
  { n: 89, title: "Новое слово в лечении дисфункции мышц тазового дна (видеодоклад)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["reproductive"] },
  // --- Дополнительные публикации, найденные при поиске в интернете ---
  { n: 90, title: "Болезнь Боуэна — симптомы и лечение (энциклопедическая статья)", authors: "Тарусин Д.И.", source: "ПроБолезни (probolezny.ru). — 2023", year: "2023", url: "https://probolezny.ru/bolezn-bouena/", categories: ["reproductive"] },
  { n: 91, title: "«Проблемой репродуктивного здоровья мальчиков занимались все и никто» (интервью)", authors: "Тарусин Д.И.", source: "Эффективная фармакотерапия. Педиатрия. — № 1", year: "2010", url: "https://umedp.ru/articles/print/1183/", categories: ["organization", "reproductive"] },
  { n: 92, title: "Чем Спок взял весь мир? (колонка эксперта)", authors: "Тарусин Д.И.", source: "АиФ. Здоровье / Аргументы и Факты. — 2016", year: "2016", url: "https://aif.ru/health/opinion/chem_spok_vzyal_ves_mir", categories: ["organization"] },
  { n: 93, title: "Амбулаторная детская хирургия (интервью, программа «Здоровое детство»)", authors: "Тарусин Д.И.", source: "Медиадоктор / doctor.ru. — 2018", year: "2018", url: "https://doctor.ru/view/54982/", categories: ["organization"] },
  { n: 94, title: "Андрология детского возраста (интервью, программа «Здоровое детство»)", authors: "Тарусин Д.И.", source: "Медиадоктор / doctor.ru. — 2019", year: "2019", url: "https://doctor.ru/view/60788/", categories: ["reproductive"] },
  // --- Диссертации под руководством Тарусина Д.И. ---
  { n: 95, title: "Синдром хронической рецидивирующей промежностной и тазовой боли у детей и подростков (дифференциальная диагностика и тактика лечения)", authors: "Аристангалиев М.Т.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И. — М., 2004", year: "2004", url: "https://www.dissercat.com/content/sindrom-retsidiviruyushchikh-bolei-vnizu-zhivota-u-malchikov-i-podrostkov-klinicheskoe-znach", categories: ["monograph", "psychology"] },
  { n: 96, title: "Диагностика и лечение левостороннего варикоцеле у подростков", authors: "Задыкян С.С.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И. — М., 2002", year: "2002", url: "https://rusneb.ru/catalog/000199_000009_000285519/", categories: ["monograph", "varicocele"] },
  { n: 97, title: "Распространенность предикторов расстройств репродуктивного здоровья у мальчиков и юношей-подростков", authors: "Омаров М.Г.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И. — М., 2004", year: "2004", url: "https://www.dissercat.com/content/rasprostranennost-prediktorov-rasstroistv-reproduktivnogo-zdorovya-u-malchikov-i-yunoshei-po", categories: ["monograph", "reproductive"] },
  { n: 98, title: "Диагностика и дифференцированная тактика лечения заболеваний крайней плоти у детей", authors: "Садчиков С.С.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И. — М., 2004", year: "2004", url: "https://www.dissercat.com/content/diagnostika-i-differentsirovannaya-taktika-lecheniya-zabolevanii-krainei-ploti-u-detei", categories: ["monograph", "foreskin"] },
  { n: 99, title: "Репродуктивные нарушения у мужчин, излеченных от лимфомы Ходжкина различными протоколами полихимиотерапии", authors: "Винокуров А.А.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И. — М., 2016", year: "2016", url: "https://rusneb.ru/catalog/000199_000009_006661344/", categories: ["monograph", "reproductive"] },
  // --- I Конгресс РОДУА, 2026 ---
  { n: 100, title: "Глюкокортикостероиды в лечении заболеваний крайней плоти у детей: эффективность, рецидивы и предикторы неудачи терапии", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 52", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["foreskin"] },
  { n: 101, title: "Контрастная лимфопресервация при микрохирургическом лигировании вен левого семенного канатика у пациентов с варикоцеле", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 57", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["varicocele"] },
  { n: 102, title: "Скрытый половой член: анализ эмбриологических причин патологии и эффективность упрощённой хирургической техники", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 58", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["hypospadias"] },
  { n: 103, title: "Гинекомастия и гинеколипомастия у подростков: алгоритм показаний к операции и результаты субареолярной мастэктомии с предварительной тумесцентной липоскацией", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 59", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["puberty"] },
  { n: 104, title: "Хроническая боль в мошонке у детей и взрослых: роль патологически изменённых гидатид и результаты хирургического лечения через минидоступ", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 61", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["acute"] },
  { n: 105, title: "Микрокисты головки придатка яичка у детей и подростков: тактика обоснованной эскалации лечебной агрессии и показания к микрохирургической энуклеации", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 62", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["hydrocele"] },
  { n: 106, title: "Нарушение архитектоники ночного сна как ведущий патогенетический механизм первичного ночного энуреза у детей: клинические маркеры и этапная терапия", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 63", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["psychology"] },
  { n: 107, title: "Умеют ли делать операцию обрезания? Анализ типичных технических ошибок и их последствий в педиатрической практике", authors: "Тарусин Д.И., Матар А.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 65", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["foreskin"] }
];
const stats = [
  { value: "107", label: "публикаций" },
  { value: "6", label: "глав в руководствах" },
  { value: "2", label: "диссертации (канд. + докт.)" },
  { value: "5", label: "науч. руководство дисс." }
];
const PublicationsList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  useMemo(() => {
    const allYears = [...new Set(publications.map((p) => p.year))].sort((a, b) => parseInt(b) - parseInt(a));
    return allYears;
  }, []);
  const usedCategories = useMemo(() => {
    const cats = /* @__PURE__ */ new Set();
    publications.forEach((p) => p.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort((a, b) => categoryLabels[a].localeCompare(categoryLabels[b]));
  }, []);
  const filteredPublications = useMemo(() => {
    let result = [...publications];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q) || p.source.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categories.includes(selectedCategory));
    }
    result.sort((a, b) => {
      const ya = parseInt(a.year) || 0;
      const yb = parseInt(b.year) || 0;
      const diff = ya - yb;
      return sortOrder === "desc" ? -diff : diff;
    });
    return result;
  }, [searchQuery, selectedCategory, sortOrder]);
  const groupedPublications = useMemo(() => {
    return filteredPublications.reduce((acc, pub) => {
      const yr = parseInt(pub.year);
      const decadeLabel = isNaN(yr) ? "Год не указан" : `${Math.floor(yr / 10) * 10}-е`;
      if (!acc[decadeLabel]) {
        acc[decadeLabel] = [];
      }
      acc[decadeLabel].push(pub);
      return acc;
    }, {});
  }, [filteredPublications]);
  const sortedDecades = useMemo(() => {
    return Object.keys(groupedPublications).sort(
      (a, b) => sortOrder === "desc" ? parseInt(b) - parseInt(a) : parseInt(a) - parseInt(b)
    );
  }, [groupedPublications, sortOrder]);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: stats.map((stat) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "text-center p-4 bg-primary/5 rounded-xl",
        children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xl md:text-3xl font-bold text-primary", children: stat.value }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: stat.label })
        ]
      },
      stat.label
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-3 mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Поиск по названию, автору или источнику...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "w-full"
        }
      ) }),
      /* @__PURE__ */ jsxs(Select, { value: selectedCategory, onValueChange: setSelectedCategory, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-[260px]", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(SelectValue, { placeholder: "Все тематики" })
        ] }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все тематики" }),
          usedCategories.map((cat) => /* @__PURE__ */ jsx(SelectItem, { value: cat, children: categoryLabels[cat] }, cat))
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSortOrder(sortOrder === "desc" ? "asc" : "desc"),
          className: "flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-secondary/50 transition-colors text-sm whitespace-nowrap",
          children: [
            sortOrder === "desc" ? /* @__PURE__ */ jsx(SortDesc, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(SortAsc, { className: "w-4 h-4" }),
            sortOrder === "desc" ? "Сначала новые" : "Сначала старые"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mb-4", children: [
      "Найдено: ",
      filteredPublications.length,
      " из ",
      publications.length
    ] }),
    sortedDecades.map((decade) => /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-foreground mb-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm", children: decade }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-sm font-normal", children: [
          "(",
          groupedPublications[decade].length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: groupedPublications[decade].map((pub) => /* @__PURE__ */ jsx(
        Card,
        {
          className: "bg-card hover:bg-secondary/50 transition-colors border-border/50",
          children: /* @__PURE__ */ jsx(CardContent, { className: "p-3 md:p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "flex-shrink-0 w-12 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded text-center", children: pub.year }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-foreground font-medium text-sm leading-relaxed mb-0.5", children: pub.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-0.5", children: pub.authors }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/70 mb-1", children: pub.source }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
                pub.categories.map((cat) => /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: "text-[10px] px-1.5 py-0 cursor-pointer hover:bg-primary/10",
                    onClick: () => setSelectedCategory(cat),
                    children: categoryLabels[cat]
                  },
                  cat
                )),
                /* @__PURE__ */ jsx("span", { className: "flex-1" }),
                pub.url ? /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: pub.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "inline-flex items-center gap-1 text-xs text-primary hover:underline",
                    children: [
                      /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
                      "Источник"
                    ]
                  }
                ) : /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: `https://elibrary.ru/query_results.asp?search_text=${encodeURIComponent(pub.title)}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline",
                    children: [
                      /* @__PURE__ */ jsx(Search, { className: "w-3 h-3" }),
                      "Найти в eLibrary"
                    ]
                  }
                )
              ] })
            ] })
          ] }) })
        },
        pub.n
      )) })
    ] }, decade)),
    filteredPublications.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-muted-foreground", children: /* @__PURE__ */ jsx("p", { children: "Публикации не найдены. Попробуйте изменить параметры поиска." }) }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-muted-foreground mt-8", children: "Составлено с использованием открытых источников: PubMed, Uro.TV, UroWeb.ru, CyberLeninka.ru, eLibrary.ru, Google Scholar" })
  ] });
};
const guideCategories = [
  {
    id: "before-visit",
    icon: ClipboardList,
    title: "Подготовка к приёму",
    items: [
      {
        question: "Какие документы взять на приём?",
        answer: "Паспорт (свидетельство о рождении ребёнка), полис ОМС или ДМС, направление (при наличии), результаты предыдущих обследований (УЗИ, анализы крови, спермограмма), выписки из стационаров, фотографии (если есть)."
      },
      {
        question: "Какие анализы подготовить заранее?",
        answer: "Общий анализ крови и мочи (не старше 2 недель), УЗИ органов мошонки / паховых каналов (если есть). Профессор проводит экспертное УЗИ на приёме, но наличие предыдущих исследований поможет оценить динамику."
      },
      {
        question: "Как подготовить ребёнка к визиту?",
        answer: "Объясните ребёнку в спокойной обстановке, что врач — друг, который хочет помочь. Не пугайте и не обманывайте. Для маленьких детей можно взять любимую игрушку. Профессор имеет большой опыт работы с детьми всех возрастов и умеет находить подход даже к самым тревожным пациентам."
      },
      {
        question: "Сколько длится первичный приём?",
        answer: "Первичная консультация длится 30–60 минут. Включает подробный сбор анамнеза, осмотр, УЗИ-диагностику (при необходимости), постановку диагноза и обсуждение плана лечения. Профессор уделяет достаточно времени, чтобы ответить на все ваши вопросы."
      }
    ]
  },
  {
    id: "before-surgery",
    icon: Scissors,
    title: "Подготовка к операции",
    items: [
      {
        question: "Какие анализы нужны перед операцией?",
        answer: "Общий анализ крови (с лейкоцитарной формулой), общий анализ мочи, биохимический анализ крови, коагулограмма, группа крови и резус-фактор, ЭКГ, рентген грудной клетки (по показаниям), консультация анестезиолога. Все анализы должны быть не старше 14 дней."
      },
      {
        question: "Как подготовиться в день операции?",
        answer: "Последний приём пищи — за 6 часов до операции, прозрачные жидкости — за 2 часа. Приём необходимо вымыть ребёнка, надеть чистое бельё. Возьмите с собой сменную одежду, тапочки, средства гигиены, воду без газа. Не наносите кремы и мази на область операции."
      },
      {
        question: "Какую анестезию используют?",
        answer: "В зависимости от объёма операции и возраста пациента применяется комбинированная анестезия: общий наркоз + местная или региональная анестезия. Это обеспечивает полное обезболивание во время и после операции. Анестезиолог проводит предварительную консультацию."
      }
    ]
  },
  {
    id: "after-surgery",
    icon: HeartPulse,
    title: "Послеоперационный период",
    items: [
      {
        question: "Как ухаживать за ребёнком после операции?",
        answer: "Соблюдайте все рекомендации хирурга. Обеспечьте покой и ограничение физической активности. Перевязки и обработка швов — по назначению врача. Регулярно измеряйте температуру первые 3 дня. Диета — щадящая, обильное питьё."
      },
      {
        question: "Когда можно вернуться к обычной жизни?",
        answer: "Зависит от вида операции. После микрохирургических операций (варикоцеле) — через 5–7 дней. После операций на органах мошонки — через 7–10 дней. Полное заживление и снятие ограничений по физической нагрузке — через 3–4 недели. Школа/детский сад — через 7–14 дней."
      },
      {
        question: "Когда нужно срочно обратиться к врачу?",
        answer: "Немедленно обращайтесь при: повышении температуры выше 38°С, нарастающем отёке и покраснении, выделениях из раны, сильной боли, не снимаемой назначенными препаратами, тошноте и рвоте. Звоните по указанным телефонам — профессор Тарусин доступен для своих пациентов."
      }
    ]
  },
  {
    id: "useful-info",
    icon: FileText,
    title: "Полезная информация",
    items: [
      {
        question: "Можно ли получить консультацию онлайн?",
        answer: "Да, я провожу предварительные онлайн-консультации. Вы можете отправить результаты обследований и фотографии для оценки ситуации. Это поможет определить, нужен ли очный визит, и подготовиться к нему. Свяжитесь по телефонам клиник или через форму на сайте."
      },
      {
        question: "Принимаете ли иногородних пациентов?",
        answer: "Да, ко мне обращаются пациенты со всей России и из-за рубежа. Для иногородних пациентов мы стараемся максимально сконцентрировать обследование и лечение, чтобы сократить время пребывания в Москве. Предварительная онлайн-консультация позволит спланировать визит."
      },
      {
        question: "Как записаться на операцию?",
        answer: "Запись на операцию возможна только после очной консультации. На приёме я определю показания, объём и сроки вмешательства. Далее вы получите список необходимых анализов и дату операции. Обычно ожидание составляет 1–3 недели."
      }
    ]
  }
];
const PatientGuide = () => {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsx(Card, { className: "bg-primary/5 border-primary/20", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 md:p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-primary" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: "Памятка для пациентов и родителей" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Здесь собрана практическая информация, которая поможет вам подготовиться к визиту, операции и послеоперационному периоду. Если у вас остались вопросы — не стесняйтесь звонить или писать." })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Card, { className: "bg-destructive/5 border-destructive/20", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6 text-destructive flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-1", children: "Экстренная связь" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "При срочных послеоперационных вопросах звоните:" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-3", children: /* @__PURE__ */ jsxs("a", { href: "tel:+79778075544", className: "inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors", children: [
          /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4" }),
          "+7 (977) 807-55-44"
        ] }) })
      ] })
    ] }) }) }),
    guideCategories.map((category) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(category.icon, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground", children: category.title })
      ] }),
      /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "space-y-2", children: category.items.map((item, idx) => /* @__PURE__ */ jsxs(AccordionItem, { value: `${category.id}-${idx}`, className: "border rounded-lg px-4", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm font-medium text-left hover:no-underline", children: item.question }),
        /* @__PURE__ */ jsx(AccordionContent, { className: "text-sm text-muted-foreground leading-relaxed", children: item.answer })
      ] }, idx)) })
    ] }, category.id))
  ] });
};
const VALID_TABS = ["useful", "children", "adults", "guide", "publications"];
const ForParents = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const loaderData = useLoaderData();
  const initialArticles = (loaderData == null ? void 0 : loaderData.articles) || [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("useful");
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  return /* @__PURE__ */ jsx(AgeConfirmationModal, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background select-none", onContextMenu: (e) => e.preventDefault(), onCopy: (e) => e.preventDefault(), children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "For Parents & Patients — Prof. Tarusin D.I." : "Для родителей и пациентов — материалы о мужском здоровье | проф. Тарусин Д.И.",
        description: isEn ? "Useful materials about men's health from Professor Tarusin: articles, videos and podcasts." : "Полезные материалы о мужском здоровье: статьи о детских и взрослых болезнях, видео, подкасты, памятки от проф. Тарусина.",
        path: "/for-parents"
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Back to Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "For Parents & Patients" : "Для родителей и пациентов" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "Useful materials about men's health: articles, videos and podcasts" : "Полезные материалы о мужском здоровье: статьи, видео и подкасты" })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "container mx-auto px-4 py-12 md:py-16", children: /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: (v) => {
      setActiveTab(v);
      const sp = new URLSearchParams(searchParams);
      sp.set("tab", v);
      setSearchParams(sp, { replace: true });
    }, className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "w-full grid grid-cols-5 h-auto mb-10", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "useful", className: "flex items-center gap-2 py-3 text-xs md:text-base", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4 hidden sm:block" }),
          isEn ? "Useful Materials" : "Полезные материалы"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "children", className: "flex items-center gap-2 py-3 text-xs md:text-base", children: [
          /* @__PURE__ */ jsx(Baby, { className: "w-4 h-4 hidden sm:block" }),
          isEn ? "Pediatric Conditions" : "О детских болезнях"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "adults", className: "flex items-center gap-2 py-3 text-xs md:text-base", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4 hidden sm:block" }),
          isEn ? "Adult Conditions" : "О взрослых болезнях"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "guide", className: "flex items-center gap-2 py-3 text-xs md:text-base", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4 hidden sm:block" }),
          isEn ? "Patient Guide" : "Памятка пациенту"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "publications", className: "flex items-center gap-2 py-3 text-xs md:text-base", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 hidden sm:block" }),
          isEn ? "Publications" : "Публикации"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "useful", children: /* @__PURE__ */ jsx(UsefulMaterials, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "children", children: /* @__PURE__ */ jsx(DiseaseArticlesList, { ageGroup: "children", initialArticles }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "adults", children: /* @__PURE__ */ jsx(DiseaseArticlesList, { ageGroup: "adults", initialArticles }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "guide", children: /* @__PURE__ */ jsx(PatientGuide, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "publications", children: /* @__PURE__ */ jsx(PublicationsList, {}) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-secondary py-12 md:py-16", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground mb-4", children: isEn ? "Have Questions?" : "Остались вопросы?" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-8 max-w-xl mx-auto", children: isEn ? "Come to me for a consultation and we'll figure everything out together" : "Приходите ко мне на консультацию, и мы всё решим" }),
      /* @__PURE__ */ jsx(Link, { to: "/#contact", children: /* @__PURE__ */ jsx(Button, { size: "lg", className: "bg-accent hover:bg-accent/90 text-accent-foreground", children: isEn ? "Book an Appointment" : "Записаться на приём" }) })
    ] }) })
  ] }) });
};
export {
  ForParents as default
};
