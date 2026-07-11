import { jsxs, jsx } from "react/jsx-runtime";
import { Quote, Award, Stethoscope, GraduationCap, ArrowLeft, RefreshCw, Star, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { C as Card, a as CardContent, u as useAuth, s as supabase, t as toast, P as PageMeta, B as Button } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { useTranslation } from "react-i18next";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import "@radix-ui/react-tabs";
const ColleagueReviews = () => {
  const { t } = useTranslation();
  const colleagueReviews = [
    {
      name: "Проф. И.В. Казанская",
      title: "Д.м.н., профессор, детский уролог",
      icon: Award,
      text: "Дмитрий Игоревич — один из немногих специалистов, кто по-настоящему понимает проблему мужского репродуктивного здоровья с детского возраста. Его вклад в создание специальности «детская урология-андрология» невозможно переоценить."
    },
    {
      name: "К.м.н., врач высшей категории",
      title: "Детский хирург, стаж 25 лет",
      icon: Stethoscope,
      text: "Мастер-классы профессора Тарусина — это квинтэссенция десятилетий практического опыта. Его хирургическая техника поражает деликатностью и точностью. Многие методики, которые он разработал, стали стандартом в нашей практике."
    },
    {
      name: "Участник Всероссийской школы ДУА",
      title: "Уролог-андролог, региональная больница",
      icon: GraduationCap,
      text: "Образовательные программы Дмитрия Игоревича кардинально изменили мой подход к диагностике и лечению. Его умение передать сложнейший материал доступным языком и практические навыки, полученные на мастер-классах, бесценны."
    },
    {
      name: "Врач-хирург",
      title: "Детская городская больница, Москва",
      icon: Stethoscope,
      text: "Работая с профессором Тарусиным, я поражаюсь его преданности делу. Даже после десятков тысяч операций он подходит к каждому случаю как к уникальному. Для молодых врачей — это школа жизни, а не только хирургии."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground mb-4", children: t("reviews.colleagueTitle") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-xl mx-auto", children: t("reviews.colleagueSubtitle") })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-6", children: colleagueReviews.map((review, index) => /* @__PURE__ */ jsx(Card, { className: "bg-card border-border hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsx(Quote, { className: "w-6 h-6 text-primary/30 mb-3" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed mb-4 italic", children: [
        "«",
        review.text,
        "»"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-3 border-t border-border", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(review.icon, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground text-sm", children: review.name }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: review.title })
        ] })
      ] })
    ] }) }, index)) })
  ] });
};
const prodoctorovLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAABQCAIAAADJH48sAAAD40lEQVR4AexYa0iTURh+913mppXhiizLCgoKsYsF9ccuBFaaJRX9sJ8GZVSEUkEZRgQZmregMAssKjCsIBQz+5GRZIlIlmRahmimmTfUuYv7vs6cuSlr7Nt5NzPOOPu+91ze9zyXs/NjnDz9PxxM/w/j8G94yHxgPmApwM4SlpJ0dZgPdPphZTMfsJSkq8N8oNMPK5v5gKUkXR3mA51+WNnMBywl3a/jbCXzwZkqvh9jPvhec2c7Mh+cqeL7MeaD7zV3tuOU+UD+qtYbpWvlhtisgcpGszNs7o5NDQdZhpYuS06pvuidqXtALng9DTm8/GROKzE+q5fNFqvY5hHZ+vL062sfOvvl9BJDRqmxrtVitlBBH6fsIw6SDCaz/P6r/nSh/kmNqXdIGkdAH3iZgywPDkuff1geV5uO3BlKvD/S1DF6euiBO1TA42AyQnMj1L6FVy+gvBiePgSL5deAlFumTykaziozNLRjau9AAXA4SA0fIT0VMi5A7mXIuwr52VBwHUbMPXoorpO+90rkInLcFTdG4DDS1spdOgNvKqClGX52QF8vDA2C0aAUaE6ZofyDJ5csAgfhwU3o7QZqqXuG5MwyxcyJUggcoKaKFEJp/XpPblsMDoMDKAQ8LoLBIWiOx9u7THR3EoGDvDkKVCp3N/z7Ok4FoTpP8HiSMwmGFBcvRWwEtd+kcaXd9UuFs7FapVlkPQIHXqeDo6cg4Rhs3QGr18PS5TA/BAJnKzUnZo24KpQnmJQ2BA4EKxe8AKL3weEkSE6F81fgYjak3QBBDA1SpcQIYSE8Tw6KUmhur8fgYNuM40CrhRkzYXYQ6OZCcAhwnEbNRa/zz08IuJcYsGmFoBbAG1zwOBAmt3Nh75axlpQA7W1kzNYW67i0A/53E/x2rBJnaREuAFtZ2xOVw4ZIW1Hr81sTFBdZA4dv6Dy/41Gak9s1YQs9OfcOlSaEqBzC1sDMQHv5iucWo8neHY0CtSpixbndmj0Raj9hdIj6gcpBVEP4Wjukvh6+vtbedYiWzOGTtouHInmNaB3ViFSnC5UDwbMtmjzsrbrSHk+MRJE/GBlwIkqzcZmQvFMzcVJZD5vD2g3WS2kcw5cGME0+TuOTJIhbp86M918eTAWDKpmAmNx4HsIj7INdnUBo2PteibA5CALs2g8LF4+BJV3HX/nYKPILmwOBtzIc8gqhpMrabj2CRX/4kCnvNC9w8A5QF1UZBxfi+HCK+eBDsV1sxXxwIY7CKZrlzAca9fBymQ94WtJUYj7QqIeXy3zA05KmEvOBRj28XOYDnpY0lZgPNOrh5TIf8LSkqfQ/+PAbAAD//7WGQnoAAAAGSURBVAMAHnes7YsTWDcAAAAASUVORK5CYII=";
const yandexHealthLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAABQCAIAAADA9C9WAAADv0lEQVR4AexXO0gjURS9Y4wmZiUTECxCwHZbYQuRtXDF0g8owlqkUPEDAWMKi4j4QUS0EsUq2mgRe0uthe1E2EpjIwgiKKwKWsyeF2efxo06n/eGQV64ydz75p7z7rnXPCcVxud6VdDneik9/p6nmo+aj5cdUH9vXnbb/l5qPvZ75iVCzcfLbtvfS83Hfs+8RKj5eNlt+3up+djvmZcIv83HrXalx20H5eLVfOT21y27mo/bDsrFq/nI7a9bdjUftx2Ui1fzkdtft+xqPm47KBev5vN+f4+PaW+PtrYon2fO6WmZdCwiJ583kAYHkDJJDpfEzQdVzs3R0BClUsbEBI2Pw6HhYVpfp8tLszo4CLGYSrEEpMEBBEDAzSRXF0F6zs9pepqWlujwkAoF7fqaLi7g0P4+ZbO0tkb398zgIMRioYAElgYHEAABB4krLQwsQs/tLS0s0M4O3d0xypdvw6CbG0L7NzYIBgchFpETDBJM0+AyIOAgARWLnb9F6Dk7o91ds4S3LpkMwfjdmhp6eGDW1sbXGAmonmMnngg929t0deVk81cYkIDq1aLNUISegwMbm/b20uoqrayYkLExFk5OmqEtKhNTchGh5+iohPL9oKWFnXujo2ZWVxcL+/rM0BaViSm5iNBTX19C6SZwTSVAj9HcbEMC/uHgTItETEh7OyFsbHwK7VE9YUo/BejRurspFCqldRSFQozKEZSDBOih1lZqauKMlpzHR5qZYfbysQAkoLKEfzNJhJ5o1BgZoXj8zU3+vwE9s7MEOzkxb8bjjCQaNUOnFxF6AgGts5Nw5uq6wzJ0HXBGEgg4ZPgHE6EHXNXVOHYNPAHgEQahLQsGGRDnBEhsAcslC9JTpNampoxs1kCzi6GVDyQDAqCVZCs5IvVgPw2Pz+k01dXB/9iQlk4zyMepVjME66HKSg2/f3A8fPjNLp4iSAbEarEW8kTrwZaxmJbJGAMD9M6XOxBAAtIoFgNCoEnQg+p0XVtepmQSbnlLJlmCrpe/62JVjh4UVFFBuZwxOEjhMKJnC4fZYi5HSHheFeZJ01OsUFtcNPr7iT+tRSIIsVi8KeVDrh520OEE7+mhqiqYAQcHII41KVqI/vySrIdIa2jQ5ueNjg4YHIQk7/Xl22s9UvZKJLTNTRglElL4X5B6ogf71dYSDI5k80qPZBmcXunhrfClo+bjy7HwotR8eCt86aj5+HIsvCg1H94KXzpqPr4cCy9KzYe3wpeOmo8vx8KL8vt8eKFWnN87Pz6Vnq/ff/4FAAD//+tMmkUAAAAGSURBVAMAmNizYM9WWo4AAAAASUVORK5CYII=";
const docdocLogo = "data:image/png;base64,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";
const logoMap = { prodoctorov: prodoctorovLogo, "yandex-health": yandexHealthLogo, docdoc: docdocLogo };
const fallbackPlatforms = [
  { platform_name: "ProDoctorov", rating: "5.0", review_count: "26", description_ru: "Крупнейший сервис поиска врачей в России", description_en: "Russia's largest doctor search service", url: "https://prodoctorov.ru/moskva/vrach/32554-tarusin/", logo_key: "prodoctorov" },
  { platform_name: "Yandex Health", rating: "5.0", review_count: "40", description_ru: "Медицинский сервис Яндекса", description_en: "Yandex medical service", url: "https://yandex.ru/medicine/doctor/tarusin_dmitriy_FoTXtQPJy5wOJ", logo_key: "yandex-health" },
  { platform_name: "DocDoc", rating: "4.5", review_count: "13", description_ru: "Сервис записи к врачам онлайн", description_en: "Online doctor booking service", url: "https://docdoc.ru/doctor/Tarusin_Dmitriy", logo_key: "docdoc" }
];
const Reviews = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { data: platforms } = useQuery({
    queryKey: ["review-platforms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("review_platforms").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1e3
  });
  useEffect(() => {
    if (!platforms || platforms.length === 0) return;
    const oldest = platforms.reduce((min, p) => {
      const t2 = p.last_scraped_at ? new Date(p.last_scraped_at).getTime() : 0;
      return t2 < min ? t2 : min;
    }, Date.now());
    const ageH = (Date.now() - oldest) / 36e5;
    if (ageH > 24 && isAdmin && !refreshing) {
      handleRefresh(true);
    }
  }, [platforms, isAdmin]);
  const handleRefresh = async (silent = false) => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-reviews", { body: {} });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["review-platforms"] });
      if (!silent) toast({ title: "Отзывы обновлены", description: "Данные платформ перезагружены" });
    } catch (e) {
      if (!silent) toast({ title: "Не удалось обновить", description: (e == null ? void 0 : e.message) || "Ошибка", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };
  const reviewPlatforms = platforms && platforms.length > 0 ? platforms.map((p) => ({ ...p, description_ru: p.description, description_en: p.description })) : fallbackPlatforms;
  reviewPlatforms.filter((p) => p.logo_key !== "docdoc");
  const totalReviews = reviewPlatforms.reduce((sum, p) => sum + parseInt(p.review_count || "0", 10), 0);
  const avgRating = "4.92";
  const lastScraped = (platforms || []).reduce((max, p) => {
    const t2 = p.last_scraped_at ? new Date(p.last_scraped_at).getTime() : 0;
    return t2 > max ? t2 : max;
  }, 0);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Patient Reviews — Prof. Tarusin D.I." : "Отзывы пациентов — Проф. Тарусин Д.И.",
        description: isEn ? `Real patient reviews of Professor Tarusin. Rating ${avgRating} on ${reviewPlatforms.length}+ platforms.` : `Реальные отзывы пациентов профессора Тарусина Д.И. Рейтинг ${avgRating}.`,
        path: "/reviews"
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Back to Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Reviews & Ratings" : "Отзывы и рейтинги" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? `Real patient reviews on independent platforms — ${reviewPlatforms.length}+ medical aggregators` : `Реальные отзывы пациентов на независимых платформах — ${reviewPlatforms.length}+ медицинских агрегатора` })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "container mx-auto px-4 py-12 md:py-16", children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "patients", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "w-full grid grid-cols-2 h-auto mb-8", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "patients", className: "py-3", children: isEn ? "Patient Reviews" : "Отзывы пациентов" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "colleagues", className: "py-3", children: isEn ? "Colleague Reviews" : "Отзывы коллег" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "patients", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-12", children: [
          /* @__PURE__ */ jsx(Card, { className: "bg-secondary border-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-3xl md:text-4xl font-bold text-primary mb-1", children: [
              totalReviews,
              "+"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "Reviews" : "Отзывов" })
          ] }) }),
          /* @__PURE__ */ jsx(Card, { className: "bg-secondary border-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl md:text-4xl font-bold text-primary mb-1", children: avgRating }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "Avg. Rating" : "Средний рейтинг" })
          ] }) }),
          /* @__PURE__ */ jsx(Card, { className: "bg-secondary border-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-3xl md:text-4xl font-bold text-primary mb-1", children: [
              reviewPlatforms.length,
              "+"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "Platforms" : "Платформы" })
          ] }) }),
          /* @__PURE__ */ jsx(Card, { className: "bg-secondary border-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl md:text-4xl font-bold text-primary mb-1", children: "42" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "Years of Experience" : "Года опыта" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Read Reviews on Platforms" : "Читать отзывы на платформах" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              lastScraped > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                isEn ? "Updated" : "Обновлено",
                ": ",
                new Date(lastScraped).toLocaleString(isEn ? "en-US" : "ru-RU", { dateStyle: "medium", timeStyle: "short" })
              ] }),
              isAdmin && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleRefresh(false), disabled: refreshing, children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}` }),
                refreshing ? isEn ? "Updating…" : "Обновляю…" : isEn ? "Refresh" : "Обновить"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-6", children: reviewPlatforms.map((platform, index) => /* @__PURE__ */ jsx(Card, { className: "group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer", onClick: () => window.open(platform.url, "_blank"), children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4 overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: logoMap[platform.logo_key], alt: platform.platform_name, className: "w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-1", children: platform.platform_name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4", children: isEn ? platform.description_en : platform.description_ru }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: [1, 2, 3, 4, 5].map((s) => /* @__PURE__ */ jsx(Star, { className: "w-4 h-4 text-yellow-500 fill-yellow-500" }, s)) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: platform.rating })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                platform.review_count,
                " ",
                isEn ? "reviews" : "отзывов"
              ] }),
              /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" })
            ] })
          ] }) }, index)) })
        ] }),
        /* @__PURE__ */ jsx(Card, { className: "mb-12 bg-accent/10 border-accent/30", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-4", children: isEn ? "Online Visibility Assessment" : "Оценка интернет-видимости" }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mb-1", children: isEn ? "Professional Visibility" : "Профессиональная видимость" }),
              /* @__PURE__ */ jsx("div", { className: "font-bold text-primary", children: isEn ? "HIGH" : "ВЫСОКАЯ" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mb-1", children: isEn ? "Reputation" : "Репутация" }),
              /* @__PURE__ */ jsx("div", { className: "font-bold text-primary", children: isEn ? "EXCELLENT" : "ПРЕВОСХОДНАЯ" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mb-1", children: isEn ? "Medical Aggregators" : "Медицинские агрегаторы" }),
              /* @__PURE__ */ jsxs("div", { className: "font-bold text-primary", children: [
                reviewPlatforms.length,
                "+ ",
                isEn ? "PLATFORMS" : "ПЛАТФОРМЫ"
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { className: "bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 md:p-12 text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold mb-4", children: isEn ? "Patient Trust — The Greatest Reward" : "Доверие пациентов — главная награда" }),
          /* @__PURE__ */ jsx("p", { className: "text-primary-foreground/80 max-w-2xl mx-auto mb-8", children: isEn ? "Over 42 years of practice, thousands of families have trusted me with their children's health. Every positive review is a story of successful treatment and gratitude that inspires me to continue." : "За 42 года практики тысячи семей доверили мне здоровье своих детей. Каждый положительный отзыв — это история успешного лечения и благодарность, которая вдохновляет продолжать работу." }),
          /* @__PURE__ */ jsx(Link, { to: "/contacts", children: /* @__PURE__ */ jsx(Button, { size: "lg", className: "bg-accent hover:bg-accent/90 text-accent-foreground", children: isEn ? "Book a Consultation" : "Записаться на консультацию" }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "colleagues", children: /* @__PURE__ */ jsx(ColleagueReviews, {}) })
    ] }) })
  ] });
};
export {
  Reviews as default
};
