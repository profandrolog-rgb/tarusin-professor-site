import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { B as Button, P as PageMeta, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, H as Header, b as Badge, C as Card, a as CardContent, F as Footer } from "../main.mjs";
import { Link } from "react-router-dom";
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
const COOKIE_NAME = "age_confirmed_18";
const COOKIE_DAYS = 365;
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}
function setCookie(name, value, days) {
  const d = /* @__PURE__ */ new Date();
  d.setTime(d.getTime() + days * 864e5);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
const cases = [
  { id: "1", categoryRu: "Гипоспадия", categoryEn: "Hypospadias", titleRu: "Коррекция дистальной гипоспадии", titleEn: "Distal Hypospadias Repair", descRu: "Одноэтапная коррекция у ребёнка 2 лет. Отличный косметический результат.", descEn: "Single-stage repair in a 2-year-old child. Excellent cosmetic outcome." },
  { id: "2", categoryRu: "Варикоцеле", categoryEn: "Varicocele", titleRu: "Микрохирургическая варикоцелэктомия", titleEn: "Microsurgical Varicocelectomy", descRu: "Операция методом Мармара у подростка 15 лет. Полное восстановление кровотока.", descEn: "Marmar technique in a 15-year-old adolescent. Full blood flow restoration." },
  { id: "3", categoryRu: "Крипторхизм", categoryEn: "Cryptorchidism", titleRu: "Орхипексия при паховом крипторхизме", titleEn: "Orchiopexy for Inguinal Cryptorchidism", descRu: "Низведение яичка у ребёнка 1.5 лет. Успешная фиксация в мошонке.", descEn: "Testicular descent in a 1.5-year-old. Successful fixation in the scrotum." },
  { id: "4", categoryRu: "Фимоз", categoryEn: "Phimosis", titleRu: "Пластика крайней плоти", titleEn: "Foreskin Plasty", descRu: "Органосохраняющая операция у ребёнка 5 лет без циркумцизии.", descEn: "Organ-preserving surgery in a 5-year-old without circumcision." }
];
const Results = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [confirmed, setConfirmed] = useState(true);
  const [denied, setDenied] = useState(false);
  const [activeCategory, setActiveCategory] = useState(t("gallery.all"));
  useEffect(() => {
    setConfirmed(getCookie(COOKIE_NAME) === "true");
  }, []);
  const handleConfirm = () => {
    setCookie(COOKIE_NAME, "true", COOKIE_DAYS);
    setConfirmed(true);
  };
  const handleDeny = () => {
    setDenied(true);
  };
  const allCategories = [t("gallery.all"), ...Array.from(new Set(cases.map((c) => isEn ? c.categoryEn : c.categoryRu)))];
  const filtered = activeCategory === t("gallery.all") ? cases : cases.filter((c) => (isEn ? c.categoryEn : c.categoryRu) === activeCategory);
  if (denied) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-8", children: [
      /* @__PURE__ */ jsx(ShieldAlert, { className: "w-16 h-16 text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground mb-2", children: isEn ? "Access Denied" : "Доступ ограничен" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: isEn ? "This section is only available for adults (18+)." : "Данный раздел доступен только для лиц старше 18 лет." }),
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsxs(Button, { children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        isEn ? "Back to Home" : "На главную"
      ] }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Surgical Results — Professor Tarusin" : "Результаты операций — Профессор Тарусин",
        description: isEn ? "Before and after surgical results by Professor Tarusin. Adult content (18+)." : "Результаты операций до и после. Контент 18+.",
        path: "/results"
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: !confirmed, onOpenChange: () => {
    }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-lg", onPointerDownOutside: (e) => e.preventDefault(), onEscapeKeyDown: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(ShieldAlert, { className: "w-6 h-6 text-destructive" }) }),
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl", children: isEn ? "Age Restriction 18+" : "Возрастное ограничение 18+" })
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-sm text-muted-foreground leading-relaxed", children: isEn ? "This section contains medical images and clinical photographs of a scientific and educational nature. They are not intended to arouse sexual interest. All materials are published with informed consent for scientific and educational purposes. View at your own discretion." : "Материалы данного раздела носят научно-образовательный характер и содержат медицинские изображения и фотографии клинических случаев. Они не предназначены для возбуждения сексуального интереса. Все материалы опубликованы на основании информированного согласия для научных и образовательных целей. Просмотр осуществляется на ваш страх и риск." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mt-4", children: [
        /* @__PURE__ */ jsx(Button, { onClick: handleConfirm, className: "flex-1", size: "lg", children: isEn ? "I am 18+, continue" : "Мне есть 18 лет, продолжить" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleDeny, variant: "outline", className: "flex-1", size: "lg", children: isEn ? "Go back" : "Назад" })
      ] })
    ] }) }),
    confirmed && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Header, {}),
      /* @__PURE__ */ jsx("main", { className: "py-16 md:py-24", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
          isEn ? "Back to Home" : "На главную"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "mb-4", children: "18+" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("gallery.title") }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("gallery.subtitle") })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-2 mb-10", children: allCategories.map((cat) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveCategory(cat), className: `px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`, children: cat }, cat)) }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-6 max-w-5xl mx-auto", children: filtered.map((c) => /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden border-border", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-full aspect-[4/3] bg-muted rounded-t-lg overflow-hidden flex items-center justify-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1/2 bg-muted-foreground/5 flex items-center justify-center border-r border-border", children: /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium", children: isEn ? "Before" : "До" }) }),
              /* @__PURE__ */ jsx("div", { className: "w-1/2 bg-primary/5 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium", children: isEn ? "After" : "После" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-4", children: [
              /* @__PURE__ */ jsx(Lock, { className: "w-8 h-8 text-muted-foreground mx-auto mb-2" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: t("gallery.photosOnVisit") }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("gallery.privacyNote") })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: isEn ? c.categoryEn : c.categoryRu }) }),
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-1", children: isEn ? c.titleEn : c.titleRu }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: isEn ? c.descEn : c.descRu })
          ] })
        ] }, c.id)) }),
        /* @__PURE__ */ jsx("div", { className: "text-center mt-10", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          t("gallery.fullPhotos"),
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/contacts", className: "text-primary hover:underline", children: t("gallery.bookLink") })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] })
  ] });
};
export {
  Results as default
};
