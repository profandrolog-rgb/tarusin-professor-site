import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link, useLoaderData } from "react-router-dom";
import { ArrowLeft, ChevronRight, Languages } from "lucide-react";
import { s as supabase, u as useAuth, g as getLangFromPath, P as PageMeta, B as Button, C as Card, a as CardContent } from "../main.mjs";
import { A as AgeConfirmationModal } from "./AgeConfirmationModal-COJlSvbH.js";
import { P as PlaceholderGallery, I as ImageGallery, M as MarkdownArticle } from "./MarkdownArticle-VHzx3tCj.js";
import DOMPurify from "dompurify";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
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
import "react-markdown";
import "remark-gfm";
import "rehype-raw";
import "@dnd-kit/core";
import "@dnd-kit/sortable";
import "@dnd-kit/utilities";
import "react-image-crop";
import "./galleryMarkers-BtRCpzSB.js";
import "marked";
import "turndown";
import "turndown-plugin-gfm";
const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”]([^"'“”]*)["'“”]\s*((?:\|[^\]]*)?)\]\]|<div\b(?=[^>]*(?:\bdata-gallery-placeholder(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?|\bdata-type\s*=\s*(?:"galleryPlaceholder"|'galleryPlaceholder'|galleryPlaceholder)))([^>]*)>[\s\S]*?<\/div>/gi;
const HR_HTML = '<hr style="border:none;border-top:2px solid #E2EBF5;margin:32px 0;" />';
const HR_STYLE = "border:none;border-top:2px solid #E2EBF5;margin:32px 0;";
const H2_STYLE = "font-size:26px;font-weight:700;color:#1B4F8A;margin-top:40px;margin-bottom:16px;line-height:1.3;";
const H3_STYLE = "font-size:20px;font-weight:600;color:#333;margin-top:28px;margin-bottom:12px;line-height:1.35;";
function readHtmlAttr(attrs, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  return ((m == null ? void 0 : m[1]) || (m == null ? void 0 : m[2]) || (m == null ? void 0 : m[3]) || "").replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function withInlineStyle(attrs, style) {
  return `${attrs.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")} style="${style}"`;
}
function normalizeHr(html) {
  let out = html;
  out = out.replace(/<p[^>]*>\s*(?:<(?:strong|em|b|i)>\s*)*-{3,}\s*(?:<\/(?:strong|em|b|i)>\s*)*<\/p>/gi, HR_HTML);
  out = out.replace(/(?:<(?:strong|em|b|i)>\s*)+-{3,}(?:\s*<\/(?:strong|em|b|i)>)+/gi, HR_HTML);
  out = out.replace(/<br\s*\/?>\s*-{3,}\s*<br\s*\/?>/gi, HR_HTML);
  out = out.replace(/(<h[1-6][^>]*>)([\s\S]*?)<br\s*\/?>\s*-{3,}\s*(<\/h[1-6]>)/gi, "$1$2$3" + HR_HTML);
  return out;
}
function applyArticleStyles(html) {
  return html.replace(/<hr\b[^>]*\/?\s*>/gi, `<hr style="${HR_STYLE}" />`).replace(/<h2\b([^>]*)>/gi, (_m, attrs) => `<h2${withInlineStyle(attrs, H2_STYLE)}>`).replace(/<h3\b([^>]*)>/gi, (_m, attrs) => `<h3${withInlineStyle(attrs, H3_STYLE)}>`);
}
function stripDuplicateTitle(html, title) {
  if (!title) return html;
  const norm = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const target = norm(title);
  const duplicatesTitle = (s) => {
    const value = norm(s);
    return value === target || value.startsWith(`${target}:`) || value.startsWith(`${target} —`) || value.startsWith(`${target} -`);
  };
  const patterns = [
    /^\s*<h1\b[^>]*>([\s\S]*?)<\/h1>/i,
    /^\s*<h2\b[^>]*>([\s\S]*?)<\/h2>/i,
    /^\s*<p\b[^>]*>\s*<strong[^>]*>([\s\S]*?)<\/strong>\s*<\/p>/i,
    /^\s*<p\b[^>]*>([\s\S]*?)<\/p>/i
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && duplicatesTitle(m[1])) {
      return html.replace(re, "");
    }
  }
  return html;
}
function splitOnGalleryMarkers(html) {
  const segments = [];
  let last = 0;
  const re = new RegExp(GALLERY_RE.source, "g");
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) segments.push({ type: "html", html: html.slice(last, m.index) });
    const isTextMarker = m[1] !== void 0;
    const caption = isTextMarker ? m[1] || "" : readHtmlAttr(m[3] || "", "data-caption");
    const files = (isTextMarker ? m[2] || "" : readHtmlAttr(m[3] || "", "data-files")).split("|").map((s) => s.trim()).filter(Boolean);
    segments.push({ type: "gallery", marker: m[0], caption, files });
    last = m.index + m[0].length;
  }
  if (last < html.length) segments.push({ type: "html", html: html.slice(last) });
  return segments;
}
const ARTICLE_CLASS = "prose prose-base max-w-none overflow-x-visible text-foreground [&_p]:mb-7 [&_p]:leading-[1.85] [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-[#1B4F8A] [&_h1]:leading-tight [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[#1B4F8A] [&_h2]:leading-tight [&_h3]:text-[20px] [&_h3]:font-semibold [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-[#1A1A1A] [&_h3]:leading-snug [&_hr]:border-0 [&_hr]:border-t-2 [&_hr]:border-[#E2EBF5] [&_hr]:my-8 [&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full [&_img]:h-auto [&_img]:block";
const HtmlArticle = ({ content, articleId, articleSlug, isAdmin, title, onContentChange }) => {
  const segments = useMemo(() => {
    const normalized = applyArticleStyles(normalizeHr(stripDuplicateTitle(content, title)));
    return splitOnGalleryMarkers(normalized);
  }, [content, title]);
  return /* @__PURE__ */ jsx("div", { className: "article-markdown overflow-x-visible", onCopy: (e) => e.preventDefault(), children: segments.map((seg, i) => {
    var _a;
    if (seg.type === "html") {
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: ARTICLE_CLASS,
          dangerouslySetInnerHTML: {
            __html: DOMPurify.sanitize(seg.html || "", { ADD_ATTR: ["style"] })
          }
        },
        i
      );
    }
    if ((((_a = seg.files) == null ? void 0 : _a.length) || 0) === 0) {
      if (!isAdmin) return null;
      return /* @__PURE__ */ jsx(
        PlaceholderGallery,
        {
          articleId,
          articleSlug,
          caption: seg.caption || "",
          marker: seg.marker || "",
          fullContent: content,
          onContentChange
        },
        i
      );
    }
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(ImageGallery, { caption: seg.caption || "", files: seg.files || [] }),
      isAdmin && /* @__PURE__ */ jsx(
        PlaceholderGallery,
        {
          articleId,
          articleSlug,
          caption: seg.caption || "",
          marker: seg.marker || "",
          fullContent: content,
          existingFiles: seg.files || [],
          onContentChange
        }
      )
    ] }, i);
  }) });
};
function useContentTranslation(entity_type, entity_id, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled && !!entity_id);
  useEffect(() => {
    if (!enabled || !entity_id) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: row } = await supabase.from("content_translations").select("*").eq("entity_type", entity_type).eq("entity_id", entity_id).eq("locale", "en").eq("status", "published").maybeSingle();
      if (cancelled) return;
      setData(row ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entity_type, entity_id, enabled]);
  return { translation: data, loading };
}
const isMarkdownContent = (s) => {
  const trimmed = s.trim();
  return !/^<[a-zA-Z!]/.test(trimmed);
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
const stripHtml = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function useLoaderDataSafe() {
  try {
    return useLoaderData();
  } catch {
    return void 0;
  }
}
const DiseaseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const loaderData = useLoaderDataSafe();
  const { isAdmin } = useAuth();
  const isEn = getLangFromPath(location.pathname) === "en";
  const [article, setArticle] = useState((loaderData == null ? void 0 : loaderData.article) ?? null);
  const [related, setRelated] = useState((loaderData == null ? void 0 : loaderData.related) ?? []);
  const [notFound, setNotFound] = useState(false);
  const { translation, loading: trLoading } = useContentTranslation(
    "disease_article",
    article == null ? void 0 : article.id,
    isEn
  );
  const enMissing = isEn && !trLoading && !translation && !!article;
  const displayTitle = isEn && (translation == null ? void 0 : translation.title) ? translation.title : article == null ? void 0 : article.title;
  const displayDescription = isEn && (translation == null ? void 0 : translation.description) ? translation.description : article == null ? void 0 : article.description;
  const displayContent = isEn && (translation == null ? void 0 : translation.content) ? translation.content : article == null ? void 0 : article.article_content;
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [slug]);
  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;
    let cancelled = false;
    (async () => {
      const { data: art, error } = await supabase.from("disease_articles").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (cancelled) return;
      if (error || !art) {
        if (!article) setNotFound(true);
        return;
      }
      setArticle(art);
      const { data: rel } = await supabase.from("disease_articles").select("id,slug,title,description,category").eq("category", art.category).eq("is_published", true).neq("id", art.id).limit(3);
      if (cancelled) return;
      setRelated(rel || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);
  if (notFound) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center", children: [
      /* @__PURE__ */ jsx(
        PageMeta,
        {
          title: "Материал не найден | проф. Тарусин Д.И.",
          description: "Запрошенная страница о заболевании не найдена.",
          path: `/for-parents/${slug ?? ""}`
        }
      ),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground mb-3", children: "Материал не найден" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "Возможно, страница была удалена или ещё не опубликована." }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => navigate("/for-parents"), children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        " К каталогу болезней"
      ] })
    ] });
  }
  if (!article) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-12 max-w-3xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "animate-pulse space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "h-4 w-32 bg-muted rounded" }),
        /* @__PURE__ */ jsx("div", { className: "h-10 w-3/4 bg-muted rounded" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-full bg-muted rounded" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-5/6 bg-muted rounded" }),
        /* @__PURE__ */ jsx("div", { className: "h-64 w-full bg-muted rounded-xl mt-6" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground mt-8", children: [
        "Загружаем материал профессора… Если страница не открылась за несколько секунд,",
        " ",
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => navigate("/for-parents"),
            className: "underline text-primary hover:text-primary/80",
            children: "вернуться в каталог"
          }
        ),
        "."
      ] })
    ] }) });
  }
  const rawDesc = displayDescription || (displayContent ? stripHtml(displayContent) : displayTitle);
  const metaDesc = (rawDesc || "").length > 160 ? (rawDesc || "").slice(0, 157) + "..." : rawDesc;
  const pageTitle = isEn ? `${(translation == null ? void 0 : translation.seo_title) || displayTitle} | Prof. Tarusin D.I.` : `${displayTitle} | проф. Тарусин Д.И.`;
  const pageDesc = isEn ? (translation == null ? void 0 : translation.seo_description) || metaDesc : metaDesc;
  const path = isEn ? `/en/for-parents/${article.slug}` : `/for-parents/${article.slug}`;
  return /* @__PURE__ */ jsx(AgeConfirmationModal, { children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "min-h-screen bg-background select-none",
      onContextMenu: (e) => e.preventDefault(),
      onCopy: (e) => e.preventDefault(),
      children: [
        /* @__PURE__ */ jsx(
          PageMeta,
          {
            title: pageTitle,
            description: pageDesc,
            path,
            type: "article",
            keywords: isEn ? (translation == null ? void 0 : translation.keywords) || void 0 : void 0
          }
        ),
        (() => {
          const catalogTab = article.age_group === "adults" ? "adults" : "children";
          const catalogHref = isEn ? `/en/for-parents?tab=${catalogTab}` : `/for-parents?tab=${catalogTab}`;
          return /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-10 md:py-16", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
            /* @__PURE__ */ jsxs("nav", { className: "flex items-center flex-wrap gap-1 text-sm text-primary-foreground/80 mb-6", children: [
              /* @__PURE__ */ jsx(Link, { to: isEn ? "/en/" : "/", className: "hover:text-primary-foreground transition-colors", children: isEn ? "Home" : "Главная" }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsx(Link, { to: catalogHref, className: "hover:text-primary-foreground transition-colors", children: isEn ? "Conditions catalog" : "Каталог болезней" }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsx("span", { className: "text-primary-foreground", children: displayTitle })
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: displayTitle }),
            displayDescription && /* @__PURE__ */ jsx("p", { className: "text-lg text-primary-foreground/80 max-w-3xl", children: displayDescription })
          ] }) });
        })(),
        /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-10 md:py-14 max-w-4xl overflow-x-visible", children: [
          enMissing ? /* @__PURE__ */ jsx(Card, { className: "border-dashed border-2 border-primary/30 bg-primary/5", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-10 text-center", children: [
            /* @__PURE__ */ jsx(Languages, { className: "w-10 h-10 text-primary mx-auto mb-4" }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-2", children: "English translation coming soon" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6 max-w-md mx-auto", children: "This article has not been translated yet. You can read the Russian original or browse our growing English library." }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-center flex-wrap", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: () => navigate(`/for-parents/${article.slug}` + location.search + location.hash),
                  variant: "default",
                  children: "Read in Russian"
                }
              ),
              /* @__PURE__ */ jsx(Button, { onClick: () => navigate("/en/for-parents"), variant: "outline", children: "English catalog" })
            ] })
          ] }) }) : displayContent ? isMarkdownContent(displayContent) ? /* @__PURE__ */ jsx(
            MarkdownArticle,
            {
              content: displayContent,
              articleId: article.id,
              articleSlug: article.slug,
              isAdmin: !!isAdmin && !isEn,
              title: displayTitle,
              onContentChange: (c) => !isEn && setArticle({ ...article, article_content: c })
            }
          ) : /* @__PURE__ */ jsx(
            HtmlArticle,
            {
              content: displayContent,
              articleId: article.id,
              articleSlug: article.slug,
              isAdmin: !!isAdmin && !isEn,
              title: displayTitle,
              onContentChange: (c) => !isEn && setArticle({ ...article, article_content: c })
            }
          ) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: isEn ? "Full text coming soon." : "Полный текст статьи скоро появится." }),
          !enMissing && related.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-16", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-6", children: isEn ? "See also" : "Смотрите также" }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: related.map((r) => /* @__PURE__ */ jsx(
              Link,
              {
                to: `${isEn ? "/en" : ""}/for-parents/${r.slug}/`,
                className: "block group",
                children: /* @__PURE__ */ jsx(Card, { className: "h-full transition-all duration-300 ease-out will-change-transform group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:shadow-xl", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-primary mb-2 uppercase tracking-wide", children: categoryLabels[r.category] || r.category }),
                  /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground group-hover:text-primary transition-colors mb-2", children: r.title }),
                  r.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-3", children: r.description })
                ] }) })
              },
              r.id
            )) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-12 pt-8 border-t", children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: `${isEn ? "/en" : ""}/for-parents?tab=${article.age_group === "adults" ? "adults" : "children"}`,
              className: "inline-flex items-center gap-2 text-primary hover:underline",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
                " ",
                isEn ? "Back to catalog" : "Назад к каталогу болезней"
              ]
            }
          ) })
        ] })
      ]
    }
  ) });
};
export {
  DiseaseDetailPage as default
};
