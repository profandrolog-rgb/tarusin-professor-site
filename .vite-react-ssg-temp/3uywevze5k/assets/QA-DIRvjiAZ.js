import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { e as useToast, s as supabase, P as PageMeta, I as Input, D as Dialog, f as DialogTrigger, B as Button, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, T as Textarea } from "../main.mjs";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, c as AccordionContent } from "./accordion-CN1jpepQ.js";
import { useTranslation } from "react-i18next";
import { J as JsonLd } from "./JsonLd-BQQYXoxB.js";
import "vite-react-ssg";
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
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-accordion";
const QA = () => {
  const [search, setSearch] = useState("");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", question: "" });
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const { data: questions = [] } = useQuery({
    queryKey: ["published-questions-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions_public").select("*").eq("is_published", true).not("answer_text", "is", null).order("answered_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const filtered = questions.filter((q) => q.question_text.toLowerCase().includes(search.toLowerCase()) || q.answer_text && q.answer_text.toLowerCase().includes(search.toLowerCase()));
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.question.trim()) {
      toast({ title: t("sticky.fillAll"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("questions").insert({ author_name: formData.name.trim(), author_email: formData.email.trim(), question_text: formData.question.trim() });
      if (error) throw error;
      toast({ title: t("sticky.questionSent"), description: t("sticky.questionSentDesc") });
      setFormData({ name: "", email: "", question: "" });
      setQuestionOpen(false);
    } catch {
      toast({ title: t("sticky.errorSending"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(PageMeta, { title: isEn ? "Q&A — Prof. Tarusin D.I." : "Вопросы и ответы — Проф. Тарусин Д.И.", description: isEn ? "Answers from Professor Tarusin to patient questions." : "Ответы профессора Тарусина Д.И. на вопросы пациентов.", path: "/qa" }),
    questions.length > 0 && /* @__PURE__ */ jsx(
      JsonLd,
      {
        data: {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: questions.slice(0, 50).map((q) => ({
            "@type": "Question",
            name: q.question_text,
            acceptedAnswer: {
              "@type": "Answer",
              text: q.answer_text || "",
              author: { "@type": "Person", name: "Профессор Тарусин Д.И." }
            }
          }))
        }
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Back to Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Questions & Answers" : "Вопросы и ответы" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "My answers to patient and parent questions" : "Мои ответы на вопросы пациентов и их родителей" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 mb-8 max-w-3xl mx-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { placeholder: isEn ? "Search questions..." : "Поиск по вопросам...", className: "pl-10", value: search, onChange: (e) => setSearch(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs(Dialog, { open: questionOpen, onOpenChange: setQuestionOpen, children: [
          /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { className: "bg-accent hover:bg-accent/90 text-accent-foreground gap-2", children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "w-4 h-4" }),
            isEn ? "Ask a Question" : "Задать вопрос"
          ] }) }),
          /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
            /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: t("sticky.questionTitle") }) }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmitQuestion, className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: t("sticky.yourName") }),
                /* @__PURE__ */ jsx(Input, { placeholder: "...", value: formData.name, onChange: (e) => setFormData((p) => ({ ...p, name: e.target.value })) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: t("sticky.emailForReply") }),
                /* @__PURE__ */ jsx(Input, { type: "email", placeholder: "example@mail.com", value: formData.email, onChange: (e) => setFormData((p) => ({ ...p, email: e.target.value })) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: t("sticky.yourQuestion") }),
                /* @__PURE__ */ jsx(Textarea, { placeholder: "...", rows: 4, value: formData.question, onChange: (e) => setFormData((p) => ({ ...p, question: e.target.value })) })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("sticky.questionHint") }),
              /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full bg-accent hover:bg-accent/90 text-accent-foreground", disabled: isSubmitting, children: isSubmitting ? t("sticky.sendingQuestion") : t("sticky.sendQuestion") })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto", children: filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsx(MessageCircle, { className: "w-12 h-12 text-muted-foreground/30 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: search ? isEn ? "Nothing found for your query" : "Ничего не найдено по вашему запросу" : isEn ? "No published questions yet" : "Пока нет опубликованных вопросов" })
      ] }) : /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "space-y-3", children: filtered.map((q) => /* @__PURE__ */ jsxs(AccordionItem, { value: q.id, className: "bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-left hover:no-underline py-5", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground text-base", children: q.question_text }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            q.author_name,
            " • ",
            new Date(q.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU")
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(AccordionContent, { className: "pb-5", children: /* @__PURE__ */ jsxs("div", { className: "pl-4 border-l-2 border-primary/30", children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground whitespace-pre-line", children: q.answer_text }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-primary mt-2 font-medium", children: t("qa.answeredBy") })
        ] }) })
      ] }, q.id)) }) })
    ] })
  ] });
};
export {
  QA as default
};
