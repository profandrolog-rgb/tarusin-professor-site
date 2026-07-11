import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import mammoth from "mammoth";
import { u as useAuth, e as useToast, s as supabase, B as Button, L as Label, I as Input, T as Textarea, b as Badge } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { R as RichTextEditor } from "./RichTextEditor-Dy3yot2p.js";
import { m as markdownToHtml } from "./galleryMarkers-BtRCpzSB.js";
import { ArrowLeft, X, Sparkles, Loader2, Wand2, CheckCircle2, Eye, EyeOff, Save } from "lucide-react";
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
import "@radix-ui/react-select";
import "@tiptap/react";
import "@tiptap/starter-kit";
import "@tiptap/extension-underline";
import "@tiptap/extension-image";
import "marked";
import "turndown";
import "turndown-plugin-gfm";
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
function slugifyRu(s) {
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya"
  };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
const PUBLISHER_DRAFT_KEY = "publisher:draft:v1";
const PUBLISHER_DRAFT_TTL_MS = 30 * 24 * 3600 * 1e3;
const AdminArticleImport = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [category, setCategory] = useState("general");
  const [ageGroup, setAgeGroup] = useState("children");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [filename, setFilename] = useState("");
  const [aiReview, setAiReview] = useState(null);
  const draftHydratingRef = useRef(true);
  const draftLoadedRef = useRef(false);
  const location = useLocation();
  const incoming = location.state || null;
  const existingRef = (incoming == null ? void 0 : incoming.existingRef) ?? null;
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    if (incoming == null ? void 0 : incoming.text) {
      draftHydratingRef.current = false;
      return;
    }
    try {
      const raw = localStorage.getItem(PUBLISHER_DRAFT_KEY);
      if (!raw) {
        draftHydratingRef.current = false;
        return;
      }
      const d = JSON.parse(raw);
      if (!(d == null ? void 0 : d.savedAt) || Date.now() - d.savedAt > PUBLISHER_DRAFT_TTL_MS) {
        draftHydratingRef.current = false;
        return;
      }
      if (typeof d.title === "string") setTitle(d.title);
      if (typeof d.slug === "string") setSlug(d.slug);
      if (typeof d.excerpt === "string") setExcerpt(d.excerpt);
      if (Array.isArray(d.keywords)) setKeywords(d.keywords);
      if (typeof d.category === "string") setCategory(d.category);
      if (d.ageGroup === "children" || d.ageGroup === "adults") setAgeGroup(d.ageGroup);
      if (typeof d.content === "string") setContent(d.content);
      if (typeof d.isPublished === "boolean") setIsPublished(d.isPublished);
      if (typeof d.filename === "string") setFilename(d.filename);
      const when = new Date(d.savedAt);
      toast({ title: "Черновик публикатора восстановлен", description: `Автосохранение от ${when.toLocaleString("ru-RU")}` });
    } catch (e) {
      console.warn("[publisher] draft restore failed", e);
    } finally {
      setTimeout(() => {
        draftHydratingRef.current = false;
      }, 300);
    }
  }, []);
  useEffect(() => {
    if (draftHydratingRef.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PUBLISHER_DRAFT_KEY, JSON.stringify({
          savedAt: Date.now(),
          title,
          slug,
          excerpt,
          keywords,
          category,
          ageGroup,
          content,
          isPublished,
          filename
        }));
      } catch (e) {
        console.warn("[publisher] draft save failed", e);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [title, slug, excerpt, keywords, category, ageGroup, content, isPublished, filename]);
  function resetPublisherDraft() {
    if (!confirm("Сбросить черновик публикатора? Все поля очистятся.")) return;
    try {
      localStorage.removeItem(PUBLISHER_DRAFT_KEY);
    } catch {
    }
    setTitle("");
    setSlug("");
    setExcerpt("");
    setKeywords([]);
    setKeywordInput("");
    setCategory("general");
    setAgeGroup("children");
    setContent("");
    setIsPublished(false);
    setFilename("");
    setAiReview(null);
    toast({ title: "Черновик сброшен" });
  }
  useEffect(() => {
    if (!(incoming == null ? void 0 : incoming.text)) return;
    const plain = incoming.text;
    setContent(markdownToHtml(plain));
    if (incoming.title) {
      const cleaned = incoming.title.replace(/\.(docx?|txt|md|rtf)$/i, "").replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
      setTitle(cleaned);
      setSlug(slugifyRu(cleaned));
    }
    setFilename(incoming.source === "orchestrator" ? "Из оркестратора" : "");
    if (incoming.seoMeta) {
      const m = incoming.seoMeta;
      if (m.title) {
        setTitle(m.title);
        setSlug(slugifyRu(m.title));
      }
      if (m.slug) setSlug(m.slug);
      if (m.excerpt) setExcerpt(m.excerpt);
      if (Array.isArray(m.keywords)) setKeywords(m.keywords);
      if (m.category && categoryLabels[m.category]) setCategory(m.category);
      if (m.age_group === "adults" || m.age_group === "children") setAgeGroup(m.age_group);
      toast({ title: "SEO-поля перенесены из оркестратора" });
      return;
    }
    setSeoLoading(true);
    toast({ title: "Анализирую статью…", description: "ИИ заполняет SEO-поля" });
    supabase.functions.invoke("import-article-meta", { body: { text: plain, filename: incoming.title || "article" } }).then(({ data, error }) => {
      if (error) throw error;
      if (data == null ? void 0 : data.error) throw new Error(data.error);
      if (data.title && !incoming.title) setTitle(data.title);
      if (data.slug) setSlug(data.slug);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (Array.isArray(data.keywords)) setKeywords(data.keywords);
      if (data.category && categoryLabels[data.category]) setCategory(data.category);
      if (data.age_group === "adults" || data.age_group === "children") setAgeGroup(data.age_group);
      toast({ title: "Готово", description: "Осталось только Форматировать и Сохранить" });
    }).catch((err) => toast({ title: "SEO не получен", description: err.message, variant: "destructive" })).finally(() => setSeoLoading(false));
  }, []);
  if (authLoading) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: "Загрузка…" });
  if (!isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-destructive", children: "Доступ только для администраторов" });
  }
  const handleAutoLoad = () => {
    var _a;
    return (_a = fileRef.current) == null ? void 0 : _a.click();
  };
  const handleFile = async (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    setFilename(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const [{ value: html }, { value: rawText }] = await Promise.all([
        mammoth.convertToHtml({ arrayBuffer: buf }),
        mammoth.extractRawText({ arrayBuffer: buf })
      ]);
      setContent(html);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      if (!title) {
        setTitle(baseName);
        setSlug(slugifyRu(baseName));
      }
      setSeoLoading(true);
      toast({ title: "Анализирую статью…", description: "ИИ извлекает заголовок, slug и ключевые слова" });
      supabase.functions.invoke("import-article-meta", {
        body: { text: rawText, filename: file.name }
      }).then(({ data, error }) => {
        if (error) throw error;
        if (data == null ? void 0 : data.error) throw new Error(data.error);
        if (data.title) setTitle(data.title);
        if (data.slug) setSlug(data.slug);
        else if (data.title) setSlug(slugifyRu(data.title));
        if (data.excerpt) setExcerpt(data.excerpt);
        if (Array.isArray(data.keywords)) setKeywords(data.keywords);
        if (data.category && categoryLabels[data.category]) setCategory(data.category);
        if (data.age_group === "adults" || data.age_group === "children") setAgeGroup(data.age_group);
        toast({ title: "Готово", description: "SEO-данные заполнены ИИ" });
      }).catch((err) => {
        toast({ title: "SEO не получен", description: err.message, variant: "destructive" });
      }).finally(() => setSeoLoading(false));
    } catch (err) {
      toast({ title: "Ошибка чтения Word", description: err.message, variant: "destructive" });
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const runAiAnalysis = async () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = content;
    const plain = (tmp.textContent || tmp.innerText || "").trim();
    if (plain.length < 50) {
      toast({ title: "Слишком мало текста", description: "Загрузите Word или вставьте содержимое в редактор", variant: "destructive" });
      return;
    }
    setSeoLoading(true);
    setAiReview(null);
    toast({ title: "ИИ-анализ запущен…", description: "Подбираю заголовок, slug, ключевые слова, аннотацию" });
    try {
      const { data, error } = await supabase.functions.invoke("import-article-meta", {
        body: { text: plain, filename: filename || title || "article" }
      });
      if (error) throw error;
      if (data == null ? void 0 : data.error) throw new Error(data.error);
      if (data.title) setTitle(data.title);
      if (data.slug) setSlug(data.slug);
      else if (data.title) setSlug(slugifyRu(data.title));
      if (data.excerpt) setExcerpt(data.excerpt);
      if (Array.isArray(data.keywords)) setKeywords(data.keywords);
      if (data.category && categoryLabels[data.category]) setCategory(data.category);
      if (data.age_group === "adults" || data.age_group === "children") setAgeGroup(data.age_group);
      setAiReview({ ...data, _words: plain.split(/\s+/).filter(Boolean).length });
      toast({ title: "Готово", description: "ИИ заполнил SEO-поля — проверьте ревью ниже" });
    } catch (err) {
      toast({ title: "Ошибка ИИ-анализа", description: err.message, variant: "destructive" });
    } finally {
      setSeoLoading(false);
    }
  };
  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k)) setKeywords([...keywords, k]);
    setKeywordInput("");
  };
  const removeKeyword = (k) => setKeywords(keywords.filter((x) => x !== k));
  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({ title: "Заполните заголовок и slug", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (existingRef) {
        const contentField = existingRef.kind === "disease_articles" ? "article_content" : "content";
        const payload = {
          title: title.trim(),
          slug: slug.trim(),
          [contentField]: content,
          is_published: isPublished
        };
        if (existingRef.kind === "disease_articles") {
          payload.description = excerpt.trim() || null;
          payload.keywords = keywords.length ? keywords : null;
          payload.category = category;
          payload.age_group = ageGroup;
        } else {
          payload.excerpt = excerpt.trim() || null;
        }
        const { error } = await supabase.from(existingRef.kind).update(payload).eq("id", existingRef.id);
        if (error) throw error;
        toast({ title: "Статья обновлена", description: "Изменения сохранены" });
        try {
          localStorage.removeItem(PUBLISHER_DRAFT_KEY);
        } catch {
        }
        try {
          localStorage.removeItem("orchestrator:draft:v1");
        } catch {
        }
        const back = existingRef.kind === "disease_articles" ? "/admin/disease-articles" : existingRef.kind === "blog_posts" ? "/admin" : "/admin";
        navigate(back);
      } else {
        const { error } = await supabase.from("disease_articles").insert({
          title: title.trim(),
          slug: slug.trim(),
          description: excerpt.trim() || null,
          keywords: keywords.length ? keywords : null,
          category,
          age_group: ageGroup,
          article_content: content,
          is_published: isPublished
        });
        if (error) throw error;
        toast({ title: "Статья сохранена", description: isPublished ? "Опубликована" : "В черновиках" });
        try {
          localStorage.removeItem(PUBLISHER_DRAFT_KEY);
        } catch {
        }
        try {
          localStorage.removeItem("orchestrator:draft:v1");
        } catch {
        }
        navigate("/admin/disease-articles");
      }
    } catch (err) {
      toast({ title: "Ошибка сохранения", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto max-w-4xl px-4 py-8 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate("/admin"), className: "gap-2", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " В админку"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "📥 Импорт статьи" }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: resetPublisherDraft, className: "gap-2", title: "Очистить локальный черновик публикатора", children: [
        /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
        " Сбросить черновик"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold mb-1", children: "Это финальная форма сохранения." }),
        /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
          "Для ИИ-ревью статьи несколькими моделями, выбора правок галочками и переписывания с сохранением вашего голоса — начните с ",
          /* @__PURE__ */ jsx("b", { children: "Оркестратора статей" }),
          ". Оттуда по кнопке «Разместить» текст и SEO-поля придут сюда автоматически."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => navigate("/admin/article-orchestrator"), className: "shrink-0", children: "Открыть оркестратор" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Загрузите готовый Word-документ — я извлеку текст, подберу заголовок, slug, ключевые слова и аннотацию." }),
      /* @__PURE__ */ jsxs(Button, { size: "lg", onClick: handleAutoLoad, disabled: parsing || seoLoading, className: "gap-2", children: [
        parsing || seoLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5" }),
        "Автоподгрузка из Word"
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileRef,
          type: "file",
          accept: ".docx",
          className: "hidden",
          onChange: handleFile
        }
      ),
      filename && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Файл: ",
        filename
      ] }),
      seoLoading && /* @__PURE__ */ jsxs("p", { className: "text-xs text-primary animate-pulse", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 inline animate-spin mr-1" }),
        "ИИ анализирует SEO в фоне…"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Wand2, { className: "w-4 h-4 text-primary" }),
          " Ручной ИИ-анализ статьи"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "Запустите, если правили текст в редакторе — ИИ перечитает и обновит заголовок, slug, ключевые слова, аннотацию и категорию." })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: runAiAnalysis, disabled: seoLoading || !content, className: "gap-2", children: [
        seoLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
        "Запустить ИИ-анализ"
      ] })
    ] }),
    aiReview && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border-2 border-green-500/40 bg-green-500/5 p-4 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-medium text-green-700 dark:text-green-400", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }),
        " Ревью ИИ"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2 text-sm md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Заголовок:" }),
          " ",
          aiReview.title || "—"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Slug:" }),
          " ",
          /* @__PURE__ */ jsx("code", { className: "text-xs", children: aiReview.slug || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Категория:" }),
          " ",
          categoryLabels[aiReview.category] || aiReview.category || "—"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Возраст:" }),
          " ",
          aiReview.age_group === "adults" ? "Взрослые" : "Дети"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Аннотация:" }),
          " ",
          aiReview.excerpt || "—"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Ключевые слова:" }),
          " ",
          Array.isArray(aiReview.keywords) && aiReview.keywords.length ? aiReview.keywords.join(", ") : "—"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 text-xs text-muted-foreground", children: [
          "Объём текста: ",
          aiReview._words,
          " слов. Все поля уже подставлены в форму — можете править вручную."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Заголовок *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: title,
            onChange: (e) => {
              setTitle(e.target.value);
              if (!slug) setSlug(slugifyRu(e.target.value));
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Slug (URL) *" }),
        /* @__PURE__ */ jsx(Input, { value: slug, onChange: (e) => setSlug(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Категория" }),
        /* @__PURE__ */ jsxs(Select, { value: category, onValueChange: setCategory, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(categoryLabels).map(([k, v]) => /* @__PURE__ */ jsx(SelectItem, { value: k, children: v }, k)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Возрастная группа" }),
        /* @__PURE__ */ jsxs(Select, { value: ageGroup, onValueChange: (v) => setAgeGroup(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "children", children: "Дети" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "adults", children: "Взрослые" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Краткая аннотация" }),
        /* @__PURE__ */ jsx(Textarea, { value: excerpt, onChange: (e) => setExcerpt(e.target.value), rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Ключевые слова" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              value: keywordInput,
              onChange: (e) => setKeywordInput(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addKeyword();
                }
              },
              placeholder: "Добавить и нажать Enter"
            }
          ),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: addKeyword, children: "+" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: keywords.map((k) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
          k,
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeKeyword(k), children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
        ] }, k)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Содержимое статьи (форматирование доступно в редакторе)" }),
      /* @__PURE__ */ jsx(RichTextEditor, { content, onChange: setContent })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-lg border bg-background/95 backdrop-blur p-3 shadow-lg", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: isPublished ? "default" : "outline",
          onClick: () => setIsPublished(!isPublished),
          className: "gap-2",
          title: "Видимость на сайте",
          children: [
            isPublished ? /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }),
            isPublished ? "Опубликовано" : "Скрыто"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving, className: "gap-2", children: [
        saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        "Сохранить"
      ] })
    ] })
  ] });
};
export {
  AdminArticleImport as default
};
