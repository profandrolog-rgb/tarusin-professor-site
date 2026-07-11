import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import mammoth from "mammoth";
import { u as useAuth, e as useToast, B as Button, C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "../main.mjs";
import { ArrowLeft, Sparkles, Loader2, Upload } from "lucide-react";
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
function AdminArticleUpload() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  if (loading) return /* @__PURE__ */ jsx("div", { className: "container py-12", children: "Загрузка…" });
  if (!user || !isAdmin) return /* @__PURE__ */ jsx("div", { className: "container py-12", children: "Доступ запрещён" });
  const onFile = async (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: buf });
      const text = (rawText || "").trim();
      if (text.length < 50) {
        toast({ title: "Слишком короткий текст", description: "В файле менее 50 символов", variant: "destructive" });
        return;
      }
      const title = file.name.replace(/\.[^.]+$/, "");
      toast({ title: "Файл загружен", description: "Открываю Оркестратор…" });
      navigate("/admin/article-orchestrator", { state: { text, title, autoStart: false } });
    } catch (err) {
      toast({ title: "Ошибка чтения", description: (err == null ? void 0 : err.message) || "Не удалось распарсить .docx", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-3xl py-8 space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
      " Админ"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "w-7 h-7 text-amber-500" }),
        " ИИ-загрузка статьи"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Загрузите Word-файл — статья автоматически откроется в Оркестраторе для ревью несколькими ИИ." })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "1. Загрузить .docx" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-10 text-center cursor-pointer hover:bg-primary/10 transition",
          onClick: () => {
            var _a;
            return (_a = inputRef.current) == null ? void 0 : _a.click();
          },
          children: [
            parsing ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 text-muted-foreground", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin" }),
              /* @__PURE__ */ jsx("div", { children: "Читаю файл…" })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
              /* @__PURE__ */ jsx(Upload, { className: "w-10 h-10 text-primary" }),
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Перетащите или нажмите для выбора .docx" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Word-документ с текстом статьи" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: inputRef,
                type: "file",
                accept: ".docx",
                hidden: true,
                onChange: onFile
              }
            )
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Дальнейший поток" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "text-sm text-muted-foreground space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: "1." }),
          " Загрузка .docx (здесь)"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: "2." }),
          " Авто-открытие ",
          /* @__PURE__ */ jsx("b", { children: "Оркестратора" }),
          " — ревью всех моделей"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: "3." }),
          " Выбор правок галочками"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: "4." }),
          " Переписывание с сохранением вашего голоса"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: "5." }),
          " Кнопка «Разместить» → форма импорта (SEO) → Сохранить"
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminArticleUpload as default
};
