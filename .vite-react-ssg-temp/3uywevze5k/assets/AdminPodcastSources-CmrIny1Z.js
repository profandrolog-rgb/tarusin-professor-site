import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Headphones, Search, CheckSquare, Square, Download, FileText, ExternalLink } from "lucide-react";
import { u as useAuth, s as supabase, C as Card, c as CardHeader, d as CardTitle, v as CardDescription, a as CardContent, I as Input, B as Button, b as Badge } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-CJYPrMmK.js";
import { toast } from "sonner";
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
import "@radix-ui/react-tabs";
const KIND_LABEL = {
  blog_posts: "Размышлизмы (блог)",
  disease_articles: "Материалы о заболеваниях",
  research_articles: "Наши исследования",
  clinical_cases: "Клинические случаи"
};
function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  tmp.querySelectorAll("p,div,br,li,h1,h2,h3,h4,h5,h6,tr").forEach((el) => {
    el.insertAdjacentText("afterend", "\n");
  });
  return (tmp.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}
function sanitizeFilename(s) {
  return s.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "untitled";
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
const AdminPodcastSources = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [onlyPublished, setOnlyPublished] = useState(true);
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/podcast-sources" } });
  }, [user, isAdmin, authLoading, navigate]);
  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      setLoading(true);
      try {
        const [blog, disease, research, cases] = await Promise.all([
          supabase.from("blog_posts").select("id,title,content,excerpt,is_published,updated_at").order("updated_at", { ascending: false }),
          supabase.from("disease_articles").select("id,title,article_content,description,category,age_group,is_published,updated_at").order("updated_at", { ascending: false }),
          supabase.from("research_articles").select("id,title,content,excerpt,category,is_published,updated_at").order("updated_at", { ascending: false }),
          supabase.from("clinical_cases").select("id,title,category,history,conclusions,recommendations,is_published,updated_at").order("updated_at", { ascending: false })
        ]);
        const all = [];
        for (const r of blog.data ?? []) {
          all.push({
            id: `blog_posts:${r.id}`,
            kind: "blog_posts",
            title: r.title,
            excerpt: r.excerpt ?? stripHtml(r.content).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            textBuilder: () => `${r.title}

${stripHtml(r.content)}`
          });
        }
        for (const r of disease.data ?? []) {
          all.push({
            id: `disease_articles:${r.id}`,
            kind: "disease_articles",
            title: r.title,
            excerpt: r.description ?? stripHtml(r.article_content).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            category: [r.category, r.age_group].filter(Boolean).join(" · "),
            textBuilder: () => `${r.title}
${r.description ?? ""}

${stripHtml(r.article_content)}`
          });
        }
        for (const r of research.data ?? []) {
          all.push({
            id: `research_articles:${r.id}`,
            kind: "research_articles",
            title: r.title,
            excerpt: r.excerpt ?? stripHtml(r.content).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            category: r.category ?? void 0,
            textBuilder: () => `${r.title}

${stripHtml(r.content)}`
          });
        }
        for (const r of cases.data ?? []) {
          const body = `Анамнез:
${stripHtml(r.history)}

Заключение:
${stripHtml(r.conclusions)}

Рекомендации:
${stripHtml(r.recommendations)}`;
          all.push({
            id: `clinical_cases:${r.id}`,
            kind: "clinical_cases",
            title: r.title,
            excerpt: stripHtml(r.history).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            category: r.category ?? void 0,
            textBuilder: () => `${r.title}
${r.category ? "Категория: " + r.category + "\n" : ""}
${body}`
          });
        }
        setItems(all);
      } catch (e) {
        toast.error("Не удалось загрузить материалы: " + ((e == null ? void 0 : e.message) ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isAdmin]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (tab !== "all" && it.kind !== tab) return false;
      if (onlyPublished && !it.is_published) return false;
      if (!q) return true;
      return it.title.toLowerCase().includes(q) || (it.excerpt ?? "").toLowerCase().includes(q);
    });
  }, [items, tab, query, onlyPublished]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const toggle = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAllVisible = () => {
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) filtered.forEach((i) => n.delete(i.id));
      else filtered.forEach((i) => n.add(i.id));
      return n;
    });
  };
  const downloadOne = (it) => {
    const txt = it.textBuilder();
    downloadText(`${sanitizeFilename(it.title)}.txt`, txt);
  };
  const downloadSelected = (mode) => {
    const list = items.filter((i) => selected.has(i.id));
    if (!list.length) {
      toast.error("Не выбрано ни одного материала");
      return;
    }
    if (mode === "separate") {
      list.forEach((it, idx) => setTimeout(() => downloadOne(it), idx * 150));
      toast.success(`Скачиваю ${list.length} файл(ов)`);
    } else {
      const big = list.map((it) => `===== ${it.title} [${KIND_LABEL[it.kind]}] =====

${it.textBuilder()}`).join("\n\n\n");
      downloadText(`podcast-sources-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.txt`, big);
      toast.success(`Объединено ${list.length} материалов в один файл`);
    }
  };
  if (authLoading || !user && !authLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-6xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "В админ-панель"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-foreground mb-2 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Headphones, { className: "w-7 h-7 text-fuchsia-500" }),
        "Исходники для подкастов"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Скачивайте текстовые материалы (блог, статьи о заболеваниях, исследования, клинические случаи) для загрузки в NotebookLM или другие генераторы подкастов." })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "mb-4", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Фильтры и выбор" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Выберите несколько материалов и скачайте их как отдельные .txt файлы или одним общим документом." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: query,
                onChange: (e) => setQuery(e.target.value),
                placeholder: "Поиск по названию или фрагменту…",
                className: "pl-9"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOnlyPublished((v) => !v), children: onlyPublished ? "Только опубликованные" : "Все (в т.ч. черновики)" })
        ] }),
        /* @__PURE__ */ jsx(Tabs, { value: tab, onValueChange: (v) => setTab(v), children: /* @__PURE__ */ jsxs(TabsList, { className: "flex flex-wrap h-auto", children: [
          /* @__PURE__ */ jsx(TabsTrigger, { value: "all", children: "Все" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "blog_posts", children: "Блог" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "disease_articles", children: "Заболевания" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "research_articles", children: "Исследования" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "clinical_cases", children: "Случаи" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 pt-2 border-t", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: toggleAllVisible, children: [
            allVisibleSelected ? /* @__PURE__ */ jsx(CheckSquare, { className: "w-4 h-4 mr-1" }) : /* @__PURE__ */ jsx(Square, { className: "w-4 h-4 mr-1" }),
            allVisibleSelected ? "Снять все" : "Выбрать все видимые"
          ] }),
          /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
            "Выбрано: ",
            selected.size
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1" }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", disabled: !selected.size, onClick: () => downloadSelected("separate"), children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-1" }),
            " Скачать отдельными"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", disabled: !selected.size, onClick: () => downloadSelected("combined"), children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-1" }),
            " Один файл"
          ] })
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground py-12", children: "Ничего не найдено" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: filtered.map((it) => {
      const isSel = selected.has(it.id);
      return /* @__PURE__ */ jsx(Card, { className: isSel ? "border-primary/60" : "", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 sm:p-4 flex gap-3 items-start", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => toggle(it.id),
            className: "mt-1 shrink-0",
            "aria-label": isSel ? "Убрать из подборки" : "Добавить в подборку",
            children: isSel ? /* @__PURE__ */ jsx(CheckSquare, { className: "w-5 h-5 text-primary" }) : /* @__PURE__ */ jsx(Square, { className: "w-5 h-5 text-muted-foreground" })
          }
        ),
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-muted-foreground shrink-0 mt-0.5 hidden sm:block" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold truncate", children: it.title }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: KIND_LABEL[it.kind] }),
            it.category && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: it.category }),
            !it.is_published && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "text-xs", children: "черновик" })
          ] }),
          it.excerpt && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mt-1", children: it.excerpt }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Обновлено: ",
            new Date(it.updated_at).toLocaleDateString("ru-RU")
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => downloadOne(it), children: /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }) })
      ] }) }, it.id);
    }) }),
    /* @__PURE__ */ jsx(Card, { className: "mt-6 bg-muted/30", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-sm text-muted-foreground space-y-1", children: [
      /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 font-medium text-foreground", children: [
        /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }),
        " Как сделать подкаст в NotebookLM"
      ] }),
      /* @__PURE__ */ jsx("p", { children: "1. Скачайте выбранные материалы одним файлом или по отдельности." }),
      /* @__PURE__ */ jsxs("p", { children: [
        "2. Откройте ",
        /* @__PURE__ */ jsx("a", { href: "https://notebooklm.google.com", target: "_blank", rel: "noreferrer", className: "underline", children: "notebooklm.google.com" }),
        ", создайте новый блокнот и загрузите .txt файлы как источники."
      ] }),
      /* @__PURE__ */ jsx("p", { children: "3. В разделе Studio нажмите «Audio Overview» — NotebookLM сгенерирует диалоговый подкаст по этим материалам." })
    ] }) })
  ] }) });
};
export {
  AdminPodcastSources as default
};
