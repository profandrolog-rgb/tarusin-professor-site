import { jsxs, jsx } from "react/jsx-runtime";
import { ArrowLeft, Newspaper, ExternalLink, Tv, Play, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { P as PageMeta, C as Card, c as CardHeader, d as CardTitle, a as CardContent, B as Button } from "../main.mjs";
import { useTranslation } from "react-i18next";
import { p as proxyImage } from "./proxyImage-Ng0mzHWC.js";
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
const Media = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const pressArticles = isEn ? [
    { title: "Let Him Become a Father", description: "About boys' reproductive health", source: "Novye Izvestia", url: "https://newizv.ru/news/2009-06-06/pust-on-stanet-papoy-110359", year: "2009" },
    { title: "Adolescents and Oncology: Importance of Early Diagnosis", description: "Breast ultrasound and prevention", source: "Agency for Social Information", url: "https://asi.org.ru/news/2019/04/04/podrostki-onkologiya/", year: "2019" },
    { title: "Moscow Medicine", description: "Publication in the Healthcare Research Institute journal", source: "NIIOZ", url: "https://niioz.ru/upload/iblock/fc0/fc09f5a26ec81a23de29f7402ac03df2.pdf", type: "PDF" },
    { title: "Rosary Boy", description: "Discussion on orchidometers and diagnostics", source: "Vademecum", url: "https://vademec.ru/article/chetki_patsan/" }
  ] : [
    { title: "Пусть он станет папой", description: "О репродуктивном здоровье мальчиков", source: "Новые Известия", url: "https://newizv.ru/news/2009-06-06/pust-on-stanet-papoy-110359", year: "2009" },
    { title: "Подростки и онкология: важность ранней диагностики", description: "УЗИ молочных желез и профилактика", source: "Агентство социальной информации", url: "https://asi.org.ru/news/2019/04/04/podrostki-onkologiya/", year: "2019" },
    { title: "Московская медицина", description: "Материал в издании НИИ организации здравоохранения", source: "НИИОЗ", url: "https://niioz.ru/upload/iblock/fc0/fc09f5a26ec81a23de29f7402ac03df2.pdf", type: "PDF" },
    { title: "Чётки-пацан", description: "Дискуссия об орхидометрах и диагностике", source: "Vademecum", url: "https://vademec.ru/article/chetki_patsan/" }
  ];
  const tvProjects = isEn ? [
    { title: "Grow Up a Man. Dmitry Tarusin.", description: "'Women's Question' project — Union of Women of Russia", videoUrl: "https://www.youtube.com/watch?v=f1O-1x4JPYs", infoUrl: "https://www.wuor.ru/news/17827-zhenskii_vopros_gost_efira_dmitrii_tarusin/", thumbnail: "https://img.youtube.com/vi/f1O-1x4JPYs/maxresdefault.jpg" },
    { title: "Path to Success and Daily Work of a Pediatric Andrologist", description: "Interview about the profession and daily practice", videoUrl: "https://www.youtube.com/watch?v=cVfXJrElYps", thumbnail: "https://img.youtube.com/vi/cVfXJrElYps/maxresdefault.jpg" },
    { title: "Early Diagnosis of Reproductive Health Disorders in Boys", description: "Educational video for specialists and parents", videoUrl: "https://www.youtube.com/watch?v=jO2ikp7Aenc", thumbnail: "https://img.youtube.com/vi/jO2ikp7Aenc/maxresdefault.jpg" }
  ] : [
    { title: "Вырасти мужчиной. Дмитрий Тарусин.", description: "Проект «Женский вопрос» — Союз женщин России", videoUrl: "https://www.youtube.com/watch?v=f1O-1x4JPYs", infoUrl: "https://www.wuor.ru/news/17827-zhenskii_vopros_gost_efira_dmitrii_tarusin/", thumbnail: "https://img.youtube.com/vi/f1O-1x4JPYs/maxresdefault.jpg" },
    { title: "Путь к успеху и рабочие будни детского андролога", description: "Интервью о профессии и ежедневной работе", videoUrl: "https://www.youtube.com/watch?v=cVfXJrElYps", thumbnail: "https://img.youtube.com/vi/cVfXJrElYps/maxresdefault.jpg" },
    { title: "Ранняя диагностика нарушений репродуктивного здоровья мальчиков", description: "Образовательное видео для специалистов и родителей", videoUrl: "https://www.youtube.com/watch?v=jO2ikp7Aenc", thumbnail: "https://img.youtube.com/vi/jO2ikp7Aenc/maxresdefault.jpg" }
  ];
  const podcasts = isEn ? [
    { title: "Child Touching Genitals: What to Do?", description: "Comments from a urologist and psychologist about childhood masturbation", source: "Podcast 'I Just Wanted to Ask' — Mel.fm", url: "https://mel.fm/novosti/3049162-rebenok-trogayet-genitalii-chto-delat-kommentary-urologa-i-psikhologa-v-novom-epizode-podkasta-ya" }
  ] : [
    { title: "Ребёнок трогает гениталии: что делать?", description: "Комментарии уролога и психолога о детской мастурбации", source: "Подкаст «Я просто спросить» — Mel.fm", url: "https://mel.fm/novosti/3049162-rebenok-trogayet-genitalii-chto-delat-kommentary-urologa-i-psikhologa-v-novom-epizode-podkasta-ya" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Media, TV & Podcasts — Prof. Tarusin D.I." : "СМИ, ТВ и подкасты — Проф. Тарусин Д.И.",
        description: isEn ? "Press publications, TV projects, and podcasts featuring Professor Tarusin D.I." : "Публикации в прессе, телевизионные проекты и подкасты с участием профессора Тарусина Д.И.",
        path: "/media"
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Media, TV & Podcasts" : "СМИ, ТВ и подкасты" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "Press publications, TV projects, and podcasts featuring Professor Tarusin" : "Публикации в прессе, телевизионные проекты и подкасты с участием профессора Тарусина" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Newspaper, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Newspapers & Magazines" : "Газеты и журналы" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-6", children: pressArticles.map((article, index) => /* @__PURE__ */ jsxs(Card, { className: "group hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-primary", children: article.source }),
              article.year && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: article.year }),
              article.type && /* @__PURE__ */ jsx("span", { className: "text-xs bg-secondary px-2 py-0.5 rounded", children: article.type })
            ] }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg group-hover:text-primary transition-colors", children: article.title })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: article.description }),
            /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full", onClick: () => window.open(article.url, "_blank"), children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
              isEn ? "Read" : "Читать"
            ] })
          ] })
        ] }, index)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Tv, { className: "w-6 h-6 text-accent" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "TV & Video Projects" : "ТВ и видеопроекты" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: tvProjects.map((project, index) => /* @__PURE__ */ jsxs(Card, { className: "group overflow-hidden hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsxs("div", { className: "aspect-video bg-muted relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("img", { src: proxyImage(project.thumbnail), alt: project.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", onError: (e) => {
              e.currentTarget.src = "/placeholder.svg";
            } }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-accent flex items-center justify-center", children: /* @__PURE__ */ jsx(Play, { className: "w-8 h-8 text-accent-foreground" }) }) })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-2", children: project.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4", children: project.description }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs(Button, { className: "flex-1 bg-accent hover:bg-accent/90 text-accent-foreground", onClick: () => window.open(project.videoUrl, "_blank"), children: [
                /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 mr-2" }),
                isEn ? "Watch" : "Смотреть"
              ] }),
              project.infoUrl && /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => window.open(project.infoUrl, "_blank"), children: /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }) })
            ] })
          ] })
        ] }, index)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-secondary flex items-center justify-center", children: /* @__PURE__ */ jsx(Headphones, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Podcasts" : "Подкасты" })
        ] }),
        podcasts.map((podcast, index) => /* @__PURE__ */ jsx(Card, { className: "group hover:shadow-lg transition-shadow", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 md:p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-start gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Headphones, { className: "w-10 h-10 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm text-primary font-medium mb-2", children: podcast.source }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-2", children: podcast.title }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: podcast.description }),
            /* @__PURE__ */ jsxs(Button, { onClick: () => window.open(podcast.url, "_blank"), children: [
              /* @__PURE__ */ jsx(Headphones, { className: "w-4 h-4 mr-2" }),
              isEn ? "Listen to Podcast" : "Слушать подкаст"
            ] })
          ] })
        ] }) }) }, index))
      ] })
    ] })
  ] });
};
export {
  Media as default
};
