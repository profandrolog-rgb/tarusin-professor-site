import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { P as PageMeta, H as Header, F as Footer } from "../main.mjs";
import { useTranslation } from "react-i18next";
import "react";
import "vite-react-ssg";
import "react-router-dom";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "lucide-react";
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
const Consent = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Data Processing Consent — Prof. Tarusin D.I." : "Согласие на обработку данных — Проф. Тарусин Д.И.",
        description: isEn ? "Consent to personal data processing on the website of Professor Tarusin D.I." : "Согласие на обработку персональных данных на сайте профессора Тарусина Д.И.",
        path: "/consent"
      }
    ),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { className: "pt-20 md:pt-24", children: /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 max-w-3xl", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground mb-8", children: isEn ? "Consent to Personal Data Processing" : "Согласие на обработку персональных данных" }),
      /* @__PURE__ */ jsx("div", { className: "prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground", children: isEn ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { children: 'I hereby, acting freely, of my own will and in my own interest, give consent to the processing of my personal data to Professor Tarusin Dmitry Igorevich (hereinafter — the "Operator").' }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "1. Personal Data" }),
        /* @__PURE__ */ jsx("p", { children: "Full name; phone number; email address; child's age; description of the problem/inquiry." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "2. Purposes of Processing" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 space-y-2", children: [
          /* @__PURE__ */ jsx("li", { children: "Processing consultation requests" }),
          /* @__PURE__ */ jsx("li", { children: "Contacting the patient to clarify inquiry details" }),
          /* @__PURE__ */ jsx("li", { children: "Scheduling appointments" }),
          /* @__PURE__ */ jsx("li", { children: "Maintaining internal inquiry statistics" })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "3. Methods of Processing" }),
        /* @__PURE__ */ jsx("p", { children: "Collection, recording, systematization, accumulation, storage, clarification (updating, modification), extraction, use, transfer (provision, access), anonymization, blocking, deletion, destruction — both with and without automation tools." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "4. Consent Duration" }),
        /* @__PURE__ */ jsx("p", { children: "This consent is valid from the moment of provision until withdrawn. Consent may be revoked by sending a written notification to the contact details provided on the website." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "5. Legal Basis" }),
        /* @__PURE__ */ jsx("p", { children: "Personal data processing is carried out in accordance with applicable data protection legislation." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "6. Contact Information" }),
        /* @__PURE__ */ jsx("p", { children: "For questions about personal data processing, please call +7 (495) 303-00-00 or use the contact form on the website." })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { children: "Настоящим я, действуя свободно, своей волей и в своём интересе, даю согласие на обработку моих персональных данных профессору Тарусину Дмитрию Игоревичу (далее — «Оператор»)." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "1. Перечень персональных данных" }),
        /* @__PURE__ */ jsx("p", { children: "Фамилия, имя, отчество; номер телефона; адрес электронной почты; возраст ребёнка; описание проблемы/обращения." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "2. Цели обработки" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 space-y-2", children: [
          /* @__PURE__ */ jsx("li", { children: "Обработка заявки на консультацию" }),
          /* @__PURE__ */ jsx("li", { children: "Связь с пациентом для уточнения деталей обращения" }),
          /* @__PURE__ */ jsx("li", { children: "Запись на приём" }),
          /* @__PURE__ */ jsx("li", { children: "Ведение внутренней статистики обращений" })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "3. Способы обработки" }),
        /* @__PURE__ */ jsx("p", { children: "Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ), обезличивание, блокирование, удаление, уничтожение — как с использованием средств автоматизации, так и без." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "4. Срок действия согласия" }),
        /* @__PURE__ */ jsx("p", { children: "Настоящее согласие действует с момента его предоставления и до момента отзыва. Согласие может быть отозвано путём направления письменного уведомления по контактным данным, указанным на сайте." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "5. Правовая основа" }),
        /* @__PURE__ */ jsx("p", { children: "Обработка персональных данных осуществляется в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных»." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "6. Контактная информация" }),
        /* @__PURE__ */ jsx("p", { children: "По вопросам обработки персональных данных обращайтесь по телефону +7 (495) 303-00-00 или через форму обратной связи на сайте." })
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
};
export {
  Consent as default
};
