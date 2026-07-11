import { jsxs, jsx } from "react/jsx-runtime";
import { ArrowLeft, Calendar, MapPin, Presentation, Globe, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { P as PageMeta, C as Card, a as CardContent, b as Badge } from "../main.mjs";
import { useTranslation } from "react-i18next";
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
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
const Masterclasses = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const pastEvents = isEn ? [
    { year: "2024", events: [
      { title: "Labyrinths of Pediatric Urology", location: "Moscow", type: "Author's Project", description: "Educational project for physicians — systematization of knowledge in pediatric urology-andrology" },
      { title: "National School of Pediatric Urology-Andrology", location: "Russia", type: "School", description: "Annual educational program for physicians from across the country" }
    ] },
    { year: "2023", events: [
      { title: "Congress of the Russian Society of Urologists", location: "Moscow", type: "Report", description: "Plenary reports on diagnosis and treatment of pediatric reproductive system diseases" },
      { title: "International Congress of Pediatric Surgeons", location: "International", type: "Presentation", description: "Presentation of original microsurgical treatment techniques" }
    ] },
    { year: "2022", events: [
      { title: "School of Pediatric Andrology", location: "Moscow", type: "School", description: "Practical master classes for young specialists" },
      { title: "Reproductive Medicine Conference", location: "St. Petersburg", type: "Report", description: "Modern approaches to preserving male reproductive health" }
    ] }
  ] : [
    { year: "2024", events: [
      { title: "Лабиринты детской урологии", location: "Москва", type: "Авторский проект", description: "Образовательный проект для врачей — систематизация знаний в детской урологии-андрологии" },
      { title: "Всероссийская школа по детской урологии-андрологии", location: "Россия", type: "Школа", description: "Ежегодная образовательная программа для врачей со всей страны" }
    ] },
    { year: "2023", events: [
      { title: "Конгресс Российского общества урологов", location: "Москва", type: "Доклад", description: "Пленарные доклады по диагностике и лечению заболеваний репродуктивной системы у детей" },
      { title: "Международный конгресс детских хирургов", location: "Международный", type: "Выступление", description: "Презентация авторских методик микрохирургического лечения" }
    ] },
    { year: "2022", events: [
      { title: "Школа детской андрологии", location: "Москва", type: "Школа", description: "Практические мастер-классы для молодых специалистов" },
      { title: "Конференция по репродуктивной медицине", location: "Санкт-Петербург", type: "Доклад", description: "Современные подходы к сохранению мужского репродуктивного здоровья" }
    ] }
  ];
  const stats = [
    { icon: Presentation, value: "860+", label: isEn ? "Presentations & reports" : "Выступлений и докладов" },
    { icon: Globe, value: "15+", label: isEn ? "Countries for master classes" : "Стран для мастер-классов" },
    { icon: Users, value: "600+", label: isEn ? "Trained physicians" : "Обученных врачей" },
    { icon: Award, value: "12+", label: isEn ? "Years of PUA School" : "Лет школы ДУА" }
  ];
  const typeColors = {
    "Школа": "bg-primary/10 text-primary",
    "School": "bg-primary/10 text-primary",
    "Доклад": "bg-accent/10 text-accent-foreground",
    "Report": "bg-accent/10 text-accent-foreground",
    "Выступление": "bg-secondary text-foreground",
    "Presentation": "bg-secondary text-foreground",
    "Авторский проект": "bg-primary/20 text-primary",
    "Author's Project": "bg-primary/20 text-primary"
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Master Classes & Presentations — Prof. Tarusin D.I." : "Мастер-классы и выступления — Проф. Тарусин Д.И.",
        description: isEn ? "Master classes, presentations, and educational programs by Professor Tarusin. Over 860 reports, training physicians from 15+ countries." : "Мастер-классы, выступления и образовательные программы профессора Тарусина. Более 860 докладов, обучение врачей из 15+ стран.",
        path: "/masterclasses"
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Master Classes & Presentations" : "Мастер-классы и выступления" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "My educational activities, lectures, and international presentations" : "Моя образовательная деятельность, лекции и международные выступления" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-12", children: stats.map((stat, i) => /* @__PURE__ */ jsx(Card, { className: "bg-secondary border-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
        /* @__PURE__ */ jsx(stat.icon, { className: "w-6 h-6 text-primary mx-auto mb-2" }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl md:text-3xl font-bold text-primary mb-1", children: stat.value }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: stat.label })
      ] }) }, i)) }),
      /* @__PURE__ */ jsx(Card, { className: "mb-12 bg-primary/5 border-primary/20", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-foreground mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-primary" }),
          isEn ? "Current Projects" : "Текущие проекты"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg p-4 border border-border", children: [
            /* @__PURE__ */ jsx(Badge, { className: typeColors[isEn ? "Author's Project" : "Авторский проект"], children: isEn ? "Author's Project" : "Авторский проект" }),
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mt-2 mb-1", children: isEn ? "Labyrinths of Pediatric Urology" : "Лабиринты детской урологии" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: isEn ? "Educational project for physicians since 2024. Systematization of 42 years of experience in practical case reviews and clinical recommendations." : "Образовательный проект для врачей с 2024 года. Систематизация 42-летнего опыта в формате практических разборов и клинических рекомендаций." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg p-4 border border-border", children: [
            /* @__PURE__ */ jsx(Badge, { className: typeColors[isEn ? "School" : "Школа"], children: isEn ? "Annual" : "Ежегодная" }),
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mt-2 mb-1", children: isEn ? "National School of PUA" : "Всероссийская школа по ДУА" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: isEn ? "Co-chair since 2012. Annual training program for pediatric urology-andrology specialists from across Russia." : "Сопредседатель с 2012 года. Ежегодная программа подготовки врачей-специалистов по детской урологии-андрологии со всей России." })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-8 text-center", children: isEn ? "Presentation Archive" : "Архив выступлений" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-8 max-w-4xl mx-auto", children: pastEvents.map((group) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-primary flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-primary-foreground font-bold text-sm", children: group.year }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-border" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-4 ml-7", children: group.events.map((event, i) => /* @__PURE__ */ jsx(Card, { className: "hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: typeColors[event.type] || "", children: event.type }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-1 text-sm", children: event.title }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground mb-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
            event.location
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: event.description })
        ] }) }, i)) })
      ] }, group.year)) }),
      /* @__PURE__ */ jsx(Card, { className: "mt-12 bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 md:p-12 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold mb-4", children: isEn ? "Master Class Invitation" : "Приглашение на мастер-класс" }),
        /* @__PURE__ */ jsx("p", { className: "text-primary-foreground/80 max-w-2xl mx-auto mb-6", children: isEn ? "I am open to invitations for conferences, master classes, and educational events. To arrange a presentation, please use the contact form." : "Я открыт к приглашениям на конференции, мастер-классы и образовательные мероприятия. Для организации выступления свяжитесь через форму обратной связи." }),
        /* @__PURE__ */ jsx(Link, { to: "/contacts", children: /* @__PURE__ */ jsx("button", { className: "bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-md font-medium transition-colors", children: isEn ? "Contact" : "Связаться" }) })
      ] }) })
    ] })
  ] });
};
export {
  Masterclasses as default
};
