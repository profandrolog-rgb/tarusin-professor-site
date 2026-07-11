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
const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Privacy Policy — Prof. Tarusin D.I." : "Политика конфиденциальности — Проф. Тарусин Д.И.",
        description: isEn ? "Privacy policy of Professor Tarusin D.I.'s website. Protection of patient personal data." : "Политика конфиденциальности сайта профессора Тарусина Д.И. Защита персональных данных пациентов.",
        path: "/privacy-policy"
      }
    ),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { className: "pt-20 md:pt-24", children: /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 max-w-3xl", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground mb-8", children: isEn ? "Privacy Policy" : "Политика конфиденциальности" }),
      /* @__PURE__ */ jsx("div", { className: "prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground", children: isEn ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { children: 'This Privacy Policy defines the procedure for processing and protecting personal data of users of the website of Professor Tarusin Dmitry Igorevich (hereinafter — the "Operator").' }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "1. General Provisions" }),
        /* @__PURE__ */ jsx("p", { children: "1.1. The Operator ensures the protection of processed personal data from unauthorized access and disclosure in accordance with applicable data protection legislation." }),
        /* @__PURE__ */ jsx("p", { children: "1.2. Use of the website constitutes unconditional consent of the user with this Policy and conditions for processing their personal data." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "2. Personal Data Collected" }),
        /* @__PURE__ */ jsx("p", { children: "2.1. When filling out the contact form, the user provides: name, email address, phone number, and message text." }),
        /* @__PURE__ */ jsx("p", { children: "2.2. Additionally, the following may be automatically collected: IP address, cookies, browser and operating system information." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "3. Purposes of Processing" }),
        /* @__PURE__ */ jsx("p", { children: "3.1. Processing consultation requests and providing feedback." }),
        /* @__PURE__ */ jsx("p", { children: "3.2. Improving website functionality and quality of services." }),
        /* @__PURE__ */ jsx("p", { children: "3.3. Informing about upcoming events and educational programs (with user consent)." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "4. Data Protection" }),
        /* @__PURE__ */ jsx("p", { children: "4.1. The Operator takes necessary organizational and technical measures to protect personal data." }),
        /* @__PURE__ */ jsx("p", { children: "4.2. Personal data is not shared with third parties, except in cases provided by applicable legislation." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "5. User Rights" }),
        /* @__PURE__ */ jsx("p", { children: "5.1. The user has the right to request clarification, blocking, or deletion of their personal data by contacting us through the information provided on the website." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "6. Contact Information" }),
        /* @__PURE__ */ jsx("p", { children: "For questions related to personal data processing, please call +7 (495) 303-00-00 or use the contact form on the website." })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { children: "Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта профессора Тарусина Дмитрия Игоревича (далее — «Оператор»)." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "1. Общие положения" }),
        /* @__PURE__ */ jsx("p", { children: "1.1. Оператор обеспечивает защиту обрабатываемых персональных данных от несанкционированного доступа и разглашения в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных»." }),
        /* @__PURE__ */ jsx("p", { children: "1.2. Использование сайта означает безоговорочное согласие пользователя с настоящей Политикой и условиями обработки его персональных данных." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "2. Персональные данные, которые обрабатываются" }),
        /* @__PURE__ */ jsx("p", { children: "2.1. При заполнении формы обратной связи пользователь предоставляет: имя, адрес электронной почты, номер телефона, текст обращения." }),
        /* @__PURE__ */ jsx("p", { children: "2.2. Дополнительно могут автоматически собираться: IP-адрес, данные cookies, информация о браузере и операционной системе." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "3. Цели обработки" }),
        /* @__PURE__ */ jsx("p", { children: "3.1. Обработка заявок на консультацию и обратная связь." }),
        /* @__PURE__ */ jsx("p", { children: "3.2. Улучшение работы сайта и качества предоставляемых услуг." }),
        /* @__PURE__ */ jsx("p", { children: "3.3. Информирование о предстоящих мероприятиях и образовательных программах (с согласия пользователя)." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "4. Защита данных" }),
        /* @__PURE__ */ jsx("p", { children: "4.1. Оператор принимает необходимые организационные и технические меры для защиты персональных данных." }),
        /* @__PURE__ */ jsx("p", { children: "4.2. Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством РФ." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "5. Права пользователя" }),
        /* @__PURE__ */ jsx("p", { children: "5.1. Пользователь вправе потребовать уточнения, блокирования или уничтожения своих персональных данных, обратившись по контактным данным, указанным на сайте." }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mt-8", children: "6. Контактная информация" }),
        /* @__PURE__ */ jsx("p", { children: "По вопросам, связанным с обработкой персональных данных, обращайтесь по телефону +7 (495) 303-00-00 или через форму обратной связи на сайте." })
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
};
export {
  PrivacyPolicy as default
};
