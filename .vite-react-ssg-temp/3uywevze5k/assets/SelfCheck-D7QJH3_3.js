import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { P as PageMeta, H as Header, C as Card, a as CardContent, F as Footer } from "../main.mjs";
import { HeartPulse, ArrowRight } from "lucide-react";
import { a as allChecklists } from "./index-CiZhs5Rt.js";
import "react";
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
const iconMap = {
  HeartPulse
};
const SelfCheck = () => {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: "Самодиагностика — Профессор Тарусин",
        description: "Пройдите бесплатные тесты для предварительной оценки урологических проблем. Результат не заменяет консультацию врача.",
        path: "/self-check"
      }
    ),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 max-w-2xl mx-auto", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: "Самодиагностика" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground", children: "Пройдите короткий тест для предварительной оценки проблемы. Это не заменяет консультацию врача, но поможет понять, стоит ли обратиться к специалисту." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto", children: allChecklists.map((cl) => {
        const Icon = iconMap[cl.icon] || HeartPulse;
        return /* @__PURE__ */ jsx(Link, { to: `/self-check/${cl.slug}`, children: /* @__PURE__ */ jsx(Card, { className: "h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50 group", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 rounded-lg bg-primary/10 w-fit", children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors", children: cl.shortTitle }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: cl.description })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center text-primary text-sm font-medium", children: [
            "Пройти тест ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-1" })
          ] })
        ] }) }) }, cl.slug);
      }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
};
export {
  SelfCheck as default
};
