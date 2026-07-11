import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, CheckCircle, Calendar, RotateCcw, Info, AlertTriangle } from "lucide-react";
import { g as getChecklistBySlug } from "./index-CiZhs5Rt.js";
import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { s as supabase, C as Card, a as CardContent, r as Checkbox, B as Button, P as PageMeta, H as Header, F as Footer } from "../main.mjs";
import { P as Progress } from "./progress-Y5q1JT93.js";
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
import "@radix-ui/react-progress";
function getAnonymousId() {
  const KEY = "anonymous_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
function ChecklistRunner({ checklist }) {
  const [phase, setPhase] = useState("intro");
  const [consent, setConsent] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [resultRule, setResultRule] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const startTime = useRef(0);
  const questions = checklist.questions;
  const progress = (currentQ + 1) / questions.length * 100;
  const handleStart = useCallback(() => {
    startTime.current = Date.now();
    setPhase("questions");
  }, []);
  const handleAnswer = useCallback((questionId, value, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { value, score } }));
  }, []);
  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
    } else {
      const score = Object.values(answers).reduce((s, a) => s + a.score, 0);
      setTotalScore(score);
      const rule = checklist.results.find((r) => score >= r.minScore && score <= r.maxScore) || checklist.results[checklist.results.length - 1];
      setResultRule(rule);
      setPhase("result");
      const durationSec = Math.round((Date.now() - startTime.current) / 1e3);
      const payload = {
        checklist_slug: checklist.slug,
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.value])),
        result_level: rule.level,
        result_score: score,
        duration_sec: durationSec,
        anonymous_id: getAnonymousId(),
        user_agent: navigator.userAgent
      };
      supabase.from("checklist_responses").insert(payload).then(({ error }) => {
        if (error) console.error("Failed to save checklist response:", error);
      });
    }
  }, [currentQ, questions.length, answers, checklist]);
  const handleBack = useCallback(() => {
    if (currentQ > 0) setCurrentQ((c) => c - 1);
  }, [currentQ]);
  const handleRestart = useCallback(() => {
    setPhase("intro");
    setConsent(false);
    setCurrentQ(0);
    setAnswers({});
    setResultRule(null);
    setTotalScore(0);
  }, []);
  const currentQuestion = questions[currentQ];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : void 0;
  const resultColors = {
    low: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
  };
  const resultIcons = {
    low: /* @__PURE__ */ jsx(Info, { className: "w-6 h-6" }),
    medium: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6" }),
    high: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6" })
  };
  return /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", children: [
    phase === "intro" && /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.3 }, children: /* @__PURE__ */ jsx(Card, { className: "border-border shadow-lg", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-8 space-y-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground", children: checklist.title }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: checklist.intro }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Тест содержит ",
        questions.length,
        " вопросов и займёт около 2 минут."
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30 cursor-pointer", children: [
        /* @__PURE__ */ jsx(Checkbox, { checked: consent, onCheckedChange: (v) => setConsent(!!v), className: "mt-0.5" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground leading-snug", children: checklist.consentLabel })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleStart, disabled: !consent, className: "w-full", size: "lg", children: [
        "Начать проверку ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] })
    ] }) }) }, "intro"),
    phase === "questions" && currentQuestion && /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.25 }, children: /* @__PURE__ */ jsx(Card, { className: "border-border shadow-lg", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-8 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "Вопрос ",
            currentQ + 1,
            " из ",
            questions.length
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            Math.round(progress),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Progress, { value: progress, className: "h-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: currentQuestion.text }),
        currentQuestion.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: currentQuestion.description })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: currentQuestion.options.map((opt) => /* @__PURE__ */ jsxs(
        "label",
        {
          className: `flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${(currentAnswer == null ? void 0 : currentAnswer.value) === opt.value ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:bg-muted/50"}`,
          onClick: () => handleAnswer(currentQuestion.id, opt.value, opt.score),
          children: [
            /* @__PURE__ */ jsx("div", { className: `w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${(currentAnswer == null ? void 0 : currentAnswer.value) === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"}`, children: (currentAnswer == null ? void 0 : currentAnswer.value) === opt.value && /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary-foreground" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground", children: opt.label })
          ]
        },
        opt.value
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        currentQ > 0 && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: handleBack, children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
          " Назад"
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: handleNext, disabled: !currentAnswer, className: "flex-1", children: currentQ < questions.length - 1 ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "Далее ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          "Получить результат ",
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 ml-2" })
        ] }) })
      ] })
    ] }) }) }, `q-${currentQ}`),
    phase === "result" && resultRule && /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 }, transition: { duration: 0.35 }, children: /* @__PURE__ */ jsx(Card, { className: "border-border shadow-lg", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-8 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: `p-5 rounded-xl border ${resultColors[resultRule.level]}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
          resultIcons[resultRule.level],
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold", children: resultRule.title })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed", children: resultRule.text })
      ] }),
      resultRule.level !== "low" && /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "w-full", children: /* @__PURE__ */ jsxs("a", { href: "/#contact", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 mr-2" }),
        " Записаться на консультацию"
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: handleRestart, className: "flex-1", children: [
        /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4 mr-2" }),
        " Пройти заново"
      ] }) }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground text-center", children: "Результат носит информационный характер и не является медицинским диагнозом. Для точной диагностики обратитесь к врачу." })
    ] }) }) }, "result")
  ] }) });
}
const SelfCheckDetail = () => {
  const { slug } = useParams();
  const checklist = slug ? getChecklistBySlug(slug) : void 0;
  if (!checklist) return /* @__PURE__ */ jsx(Navigate, { to: "/self-check", replace: true });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: `${checklist.shortTitle} — Самодиагностика`,
        description: checklist.description,
        path: `/self-check/${checklist.slug}`
      }
    ),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsx("section", { className: "py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/self-check",
          className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
            "Все тесты"
          ]
        }
      ),
      /* @__PURE__ */ jsx(ChecklistRunner, { checklist })
    ] }) }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
};
export {
  SelfCheckDetail as default
};
