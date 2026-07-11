import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, ChevronRight, ArrowLeft, FileText, Lock, Download } from "lucide-react";
import { toast } from "sonner";
import { s as supabase, S as SITE_URL, P as PageMeta, C as Card, a as CardContent, L as Label, I as Input, B as Button } from "../main.mjs";
import { J as JsonLd } from "./JsonLd-BQQYXoxB.js";
import { A as AspectRatio } from "./aspect-ratio-Dpegpaxz.js";
import { p as proxyImage } from "./proxyImage-Ng0mzHWC.js";
import { r as resolveMaterialPreview, a as parentsMediaPublicUrl, p as pagesLabel, f as formatBytes } from "./parentsMaterialsBucket-BE8GfiP2.js";
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
import "@radix-ui/react-aspect-ratio";
const audienceLabelRu = {
  parent: "Памятка для родителей",
  adult_man: "Материал для взрослого пациента",
  pediatric_patient: "Материал для юного пациента",
  professional: "Материал для врача"
};
const audienceLabelEn = {
  parent: "Handout for parents",
  adult_man: "Handout for adult patient",
  pediatric_patient: "Handout for young patient",
  professional: "Handout for medical professional"
};
const ParentsMaterialLanding = () => {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);
  const unlockKey = (id) => `pm_unlocked_${id}`;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("parents_materials").select("*").eq("slug", slug).eq("kind", "handout").eq("is_published", true).maybeSingle();
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const rec = data;
      setItem(rec);
      const { data: rel } = await supabase.from("parents_materials").select("*").eq("kind", "handout").eq("is_published", true).neq("id", rec.id).eq("audience", rec.audience ?? "parent").order("sort_order", { ascending: true }).limit(3);
      let relRows = (rel ?? []).slice(0, 3);
      if (relRows.length < 3) {
        const { data: fallback } = await supabase.from("parents_materials").select("*").eq("kind", "handout").eq("is_published", true).neq("id", rec.id).order("created_at", { ascending: false }).limit(3 - relRows.length);
        const extra = (fallback ?? []).filter(
          (r) => !relRows.some((x) => x.id === r.id)
        );
        relRows = [...relRows, ...extra].slice(0, 3);
      }
      if (!cancelled) setRelated(relRows);
      if (!cancelled) {
        try {
          if (typeof window !== "undefined" && window.localStorage.getItem(unlockKey(rec.id))) {
            setUnlocked(true);
          }
        } catch {
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (notFound || !item) return /* @__PURE__ */ jsx(Navigate, { to: "/404", replace: true });
  const title = isEn && item.title_en || item.title;
  const description = isEn && item.description_en || item.description || "";
  const longDesc = isEn && item.long_description_en || item.long_description || "";
  const seoTitle = isEn && item.seo_title_en || item.seo_title || title;
  const seoDesc = isEn && item.seo_description_en || item.seo_description || description || title;
  const preview = resolveMaterialPreview(item);
  const ogImage = item.og_image_path ? parentsMediaPublicUrl(item.og_image_path) : preview;
  const audLabel = item.audience ? isEn ? audienceLabelEn[item.audience] : audienceLabelRu[item.audience] : isEn ? "Handout" : "Памятка";
  const gateRequired = !!item.gated && !unlocked;
  const triggerDownload = async () => {
    if (!item.file_path) {
      toast.error(isEn ? "PDF not available yet" : "PDF пока не прикреплён");
      return;
    }
    setDownloading(true);
    try {
      await supabase.rpc("increment_material_download", { material_id: item.id });
    } catch {
    }
    const url = parentsMediaPublicUrl(item.file_path);
    window.open(url, "_blank", "noopener,noreferrer");
    setDownloading(false);
  };
  const handleDownload = async () => {
    if (gateRequired) return;
    await triggerDownload();
  };
  const submitLead = async (e) => {
    e.preventDefault();
    const email = leadEmail.trim();
    const phone = leadPhone.trim();
    if (!email && !phone) {
      toast.error(isEn ? "Please provide email or phone" : "Укажите email или телефон");
      return;
    }
    setSubmittingLead(true);
    try {
      const { error } = await supabase.from("parents_material_leads").insert({
        material_id: item.id,
        name: leadName.trim() || null,
        email: email || null,
        phone: phone || null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null
      });
      if (error) throw error;
      try {
        window.localStorage.setItem(unlockKey(item.id), "1");
      } catch {
      }
      setUnlocked(true);
      toast.success(isEn ? "Thanks! Starting download…" : "Спасибо! Начинаю скачивание…");
      await triggerDownload();
    } catch (err) {
      toast.error((err == null ? void 0 : err.message) || (isEn ? "Failed to submit" : "Не удалось отправить"));
    } finally {
      setSubmittingLead(false);
    }
  };
  const pageUrl = `${SITE_URL}/for-parents/materials/${item.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: seoTitle,
    description: seoDesc,
    image: ogImage ? [ogImage] : void 0,
    datePublished: item.created_at,
    dateModified: item.updated_at,
    author: {
      "@type": "Person",
      name: "Тарусин Дмитрий Игоревич",
      url: SITE_URL
    },
    publisher: {
      "@type": "Organization",
      name: "Профессор Тарусин Д.И.",
      url: SITE_URL
    },
    mainEntityOfPage: pageUrl
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: seoTitle,
        description: seoDesc,
        path: `/for-parents/materials/${item.slug}/`,
        image: ogImage || void 0,
        type: "article"
      }
    ),
    /* @__PURE__ */ jsx(JsonLd, { data: jsonLd }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-4xl", children: [
      /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap", "aria-label": "breadcrumbs", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-foreground", children: isEn ? "Home" : "Главная" }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ jsx(Link, { to: "/for-parents", className: "hover:text-foreground", children: isEn ? "For Parents" : "Для родителей" }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ jsx(Link, { to: "/for-parents?tab=useful", className: "hover:text-foreground", children: isEn ? "Materials" : "Материалы" }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ jsx("span", { className: "text-foreground truncate", children: title })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/for-parents?tab=useful", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Back to materials" : "Ко всем материалам"
      ] }),
      /* @__PURE__ */ jsxs("header", { className: "mb-8", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground mb-3", children: title }),
        /* @__PURE__ */ jsxs("p", { className: "text-base text-muted-foreground", children: [
          audLabel,
          item.pages_count ? ` · ${pagesLabel(item.pages_count)}` : "",
          " · PDF"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "mb-8 overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-[1.2fr_1fr] gap-0", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-muted", children: /* @__PURE__ */ jsx(AspectRatio, { ratio: 4 / 3, children: preview ? /* @__PURE__ */ jsx(
          "img",
          {
            src: proxyImage(preview),
            alt: title,
            className: "w-full h-full object-cover",
            onError: (e) => {
              e.currentTarget.src = "/placeholder.svg";
            }
          }
        ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(FileText, { className: "w-16 h-16 text-muted-foreground" }) }) }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-8 flex flex-col justify-center gap-4", children: [
          description && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: description }),
          gateRequired ? /* @__PURE__ */ jsxs("form", { onSubmit: submitLead, className: "space-y-3 rounded-lg border bg-muted/30 p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
              /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-primary" }),
              isEn ? "Leave your contact to get the PDF" : "Оставьте контакт — и PDF откроется"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "lead-name", className: "text-xs", children: isEn ? "Name (optional)" : "Имя (по желанию)" }),
                /* @__PURE__ */ jsx(Input, { id: "lead-name", value: leadName, onChange: (e) => setLeadName(e.target.value), placeholder: isEn ? "Your name" : "Ваше имя", autoComplete: "name" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "lead-email", className: "text-xs", children: "Email" }),
                /* @__PURE__ */ jsx(Input, { id: "lead-email", type: "email", value: leadEmail, onChange: (e) => setLeadEmail(e.target.value), placeholder: "you@example.com", autoComplete: "email" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "lead-phone", className: "text-xs", children: isEn ? "Phone" : "Телефон" }),
                /* @__PURE__ */ jsx(Input, { id: "lead-phone", type: "tel", value: leadPhone, onChange: (e) => setLeadPhone(e.target.value), placeholder: "+7 ___ ___ __ __", autoComplete: "tel" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: isEn ? "Provide email or phone. Submitting means consent to be contacted about this material." : "Достаточно email или телефона. Отправляя форму, вы соглашаетесь на связь по этой памятке." })
            ] }),
            /* @__PURE__ */ jsxs(Button, { type: "submit", size: "lg", disabled: submittingLead || !item.file_path, className: "w-full", children: [
              submittingLead ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "w-5 h-5 mr-2" }),
              isEn ? "Get the PDF" : "Получить PDF",
              item.file_size_bytes ? ` · ${formatBytes(item.file_size_bytes)}` : ""
            ] })
          ] }) : /* @__PURE__ */ jsxs(Button, { size: "lg", onClick: handleDownload, disabled: downloading || !item.file_path, className: "w-full", children: [
            downloading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "w-5 h-5 mr-2" }),
            isEn ? "Download PDF" : "Скачать PDF",
            item.file_size_bytes ? ` · ${formatBytes(item.file_size_bytes)}` : ""
          ] }),
          !item.file_path && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: isEn ? "PDF will be available soon." : "PDF будет доступен в ближайшее время." })
        ] })
      ] }) }),
      longDesc && /* @__PURE__ */ jsx("article", { className: "prose prose-slate dark:prose-invert max-w-none mb-12\n            prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3\n            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2\n            prose-p:leading-relaxed prose-blockquote:border-primary prose-blockquote:text-muted-foreground\n            prose-a:text-primary hover:prose-a:underline", children: /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: longDesc }) }),
      related.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl md:text-2xl font-semibold mb-4", children: isEn ? "Related materials" : "Материалы по теме" }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-4", children: related.map((r) => {
          const p = resolveMaterialPreview(r);
          const t = isEn && r.title_en || r.title;
          return /* @__PURE__ */ jsx(Link, { to: `/for-parents/materials/${r.slug}/`, className: "group", children: /* @__PURE__ */ jsxs(Card, { className: "h-full overflow-hidden hover:shadow-lg transition-shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-muted", children: /* @__PURE__ */ jsx(AspectRatio, { ratio: 16 / 10, children: p ? /* @__PURE__ */ jsx("img", { src: proxyImage(p), alt: t, className: "w-full h-full object-cover group-hover:scale-105 transition-transform" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-muted-foreground" }) }) }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mb-1.5", children: [
                "PDF",
                r.pages_count ? ` · ${pagesLabel(r.pages_count)}` : ""
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "font-medium text-sm text-foreground group-hover:text-primary line-clamp-3", children: t })
            ] })
          ] }) }, r.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-secondary p-6 md:p-8 text-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: isEn ? "Have questions?" : "Остались вопросы?" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: isEn ? "Book a consultation and we'll figure everything out together." : "Приходите ко мне на консультацию, и мы всё решим." }),
        /* @__PURE__ */ jsx(Link, { to: "/#contact", children: /* @__PURE__ */ jsx(Button, { size: "lg", className: "bg-accent hover:bg-accent/90 text-accent-foreground", children: isEn ? "Book an Appointment" : "Записаться на приём" }) })
      ] })
    ] })
  ] });
};
export {
  ParentsMaterialLanding as default
};
