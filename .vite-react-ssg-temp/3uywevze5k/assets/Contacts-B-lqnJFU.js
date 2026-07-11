import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { ArrowLeft, Phone, MapPin, Clock, Navigation, Train, Bus, Send, MessageCircle, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { e as useToast, P as PageMeta, C as Card, a as CardContent, L as Label, I as Input, T as Textarea, B as Button, s as supabase } from "../main.mjs";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { J as JsonLd } from "./JsonLd-BQQYXoxB.js";
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
import "react-helmet-async";
const VkIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "w-5 h-5", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.136.678-1.252.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.473 4 7.996c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.472 2.27 4.638 2.86 4.638.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.148-3.574 2.148-3.574.119-.254.305-.491.744-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" }) });
const FacebookIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "w-5 h-5", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) });
const TelegramIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "w-5 h-5", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" }) });
const Contacts = () => {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", age: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socialLinks = [
    { name: "Telegram", Icon: TelegramIcon, url: "https://t.me/Professor_DI", handle: "@Professor_DI" },
    { name: "WhatsApp", Icon: MessageCircle, url: "https://wa.me/79778075544", handle: "+7 (977) 807-55-44" },
    { name: "Instagram", Icon: Instagram, url: "https://www.instagram.com/androlog_di/", handle: "@androlog_di" },
    { name: isEn ? "VKontakte" : "ВКонтакте", Icon: VkIcon, url: "https://vk.com/androlog_di", handle: "androlog_di" },
    { name: "Facebook", Icon: FacebookIcon, url: "https://www.facebook.com/andrologDI/", handle: "andrologDI" },
    { name: "YouTube", Icon: Youtube, url: "https://www.youtube.com/@tarusindi", handle: "@tarusindi" }
  ];
  const contactSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().max(30).optional().or(z.literal("")),
    age: z.string().max(50).optional().or(z.literal("")),
    message: z.string().trim().min(1).max(5e3)
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      toast({ title: isEn ? "Invalid input" : "Проверьте данные", description: parsed.error.errors.map((e2) => e2.message).join(", "), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from("appointment_requests").insert({ parent_name: parsed.data.name, contact_email: parsed.data.email, contact_phone: parsed.data.phone || null, child_age: parsed.data.age || (isEn ? "Not specified" : "Не указан"), problem_description: parsed.data.message });
    if (error) {
      toast({ title: isEn ? "Error" : "Ошибка", description: isEn ? "Could not send request. Please try later." : "Не удалось отправить заявку. Попробуйте позже.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    toast({ title: isEn ? "Request Sent" : "Заявка отправлена", description: isEn ? "We will contact you shortly" : "Мы свяжемся с вами в ближайшее время" });
    setFormData({ name: "", email: "", phone: "", age: "", message: "" });
    setIsSubmitting(false);
  };
  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(PageMeta, { title: isEn ? "Contacts & Booking — Prof. Tarusin D.I." : "Контакты и запись — Проф. Тарусин Д.И.", description: isEn ? "Book an appointment with Professor Tarusin at Dr. Matara's Clinic in Moscow. Address, phone numbers and directions." : "Запись на приём к профессору Тарусину Д.И. в Клинике доктора Матара в Москве. Адрес, телефоны и схема проезда.", path: "/contacts" }),
    /* @__PURE__ */ jsx(
      JsonLd,
      {
        data: [
          {
            "@context": "https://schema.org",
            "@type": "MedicalClinic",
            name: "Клиника доктора Матара",
            url: "https://tarusin.pro/contacts",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Коровинское шоссе, д. 9, к. 2",
              addressLocality: "Москва",
              addressCountry: "RU"
            },
            geo: { "@type": "GeoCoordinates", latitude: 55.893, longitude: 37.5565 },
            medicalSpecialty: ["Urology", "PediatricSurgery"]
          }
        ]
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Back to Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Contacts" : "Контакты" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "Get in touch to book a consultation or ask any questions" : "Свяжитесь со мной для записи на консультацию или по любым вопросам" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto mb-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-6", children: isEn ? "Dr. Matara's Clinic" : "Клиника доктора Матара" }),
        /* @__PURE__ */ jsx(Card, { className: "mb-6 flex-shrink-0", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5 text-accent" }) }),
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: isEn ? "Phones" : "Телефоны" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 ml-14", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsx("a", { href: "tel:+74953030000", className: "text-primary font-medium hover:underline", children: "+7 (495) 303-00-00" }),
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-sm ml-3", children: [
                  "(",
                  isEn ? "reception" : "регистратура",
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsx("a", { href: "tel:+79263030111", className: "text-primary font-medium hover:underline", children: "+7 (926) 303-01-11" }),
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-sm ml-3", children: [
                  "(",
                  isEn ? "booking" : "запись",
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsx("a", { href: "tel:+79160303031", className: "text-primary font-medium hover:underline", children: "+7 (916) 030-30-31" }),
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-sm ml-3", children: [
                  "(",
                  isEn ? "booking" : "запись",
                  ")"
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-primary" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-1", children: isEn ? "Location" : "Место приёма" }),
              /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: isEn ? "Dr. Matara's Clinic" : "Клиника доктора Матара" }),
                /* @__PURE__ */ jsx("br", {}),
                isEn ? "Moscow, Korovinskoye Hwy 9, Bldg 2" : "г. Москва, Коровинское шоссе д. 9 к. 2"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-primary" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-1", children: isEn ? "Schedule" : "Приём" }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: isEn ? "By appointment only" : "Только по предварительной записи" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx(Card, { className: "mb-6 overflow-hidden flex-shrink-0", children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("iframe", { src: "https://yandex.ru/map-widget/v1/?ll=37.556500%2C55.893000&z=16&pt=37.556500%2C55.893000%2Cpm2rdm&l=map", width: "100%", height: "280", frameBorder: "0", title: isEn ? "Dr. Matara's Clinic Map" : "Карта Клиники доктора Матара", className: "w-full", allowFullScreen: true }) }) }),
        /* @__PURE__ */ jsx(Card, { className: "flex-1", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Navigation, { className: "w-5 h-5 text-primary" }) }),
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground text-lg", children: isEn ? "Directions" : "Как добраться" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
                /* @__PURE__ */ jsx(Train, { className: "w-4 h-4 text-primary" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground text-sm", children: isEn ? "Metro" : "Метро" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-3 bg-secondary/50 rounded-lg", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-primary", children: isEn ? "Seligerskaya" : "М Селигерская" }),
                    /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: isEn ? "15 min" : "15 мин" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: isEn ? "Bus 672, 179 to 'Korovinskoye Hwy'" : "Авт. 672, 179 до «Коровинское ш.»" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-3 bg-secondary/50 rounded-lg", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-primary", children: isEn ? "Khovrino" : "М Ховрино" }),
                    /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: isEn ? "10 min" : "10 мин" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: isEn ? "Bus 672 to 'Korovinskoye Hwy'" : "Авт. 672 до «Коровинское ш.»" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
                /* @__PURE__ */ jsx(Bus, { className: "w-4 h-4 text-primary" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground text-sm", children: isEn ? "Buses" : "Автобусы" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-3 bg-secondary/50 rounded-lg", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground mb-1", children: "№ 672" }),
                  /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: isEn ? "from Khovrino / Seligerskaya" : "от м. Ховрино / Селигерская" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-3 bg-secondary/50 rounded-lg", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground mb-1", children: "№ 179" }),
                  /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: isEn ? "from Seligerskaya" : "от м. Селигерская" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 bg-accent/10 rounded-lg flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg", children: "🚶" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: isEn ? "Walk from Khovrino" : "Пешком от м. Ховрино" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: isEn ? "~20 min (1.5 km). Exit #3, along Korovinskoye Hwy towards suburbs to Bldg 9/2" : "~20 мин (1.5 км). Выход №3, по Коровинскому шоссе в сторону области до д. 9 к. 2" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 bg-accent/10 rounded-lg flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg", children: "🚗" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: isEn ? "Parking" : "Парковка" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: isEn ? /* @__PURE__ */ jsxs(Fragment, { children: [
                "Enter from the outer side (not the courtyard). Gates ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-primary", children: "#1" }),
                " and ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-primary", children: "#3" }),
                " — call the clinic to open."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                "Въезд к наружной стороне дома (не во двор). Шлагбаумы ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-primary", children: "№1" }),
                " и ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-primary", children: "№3" }),
                " — для открытия позвоните по одному из телефонов клиники."
              ] }) })
            ] })
          ] })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-4", children: isEn ? "Social Media" : "Социальные сети" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", children: socialLinks.map((social, index) => {
          const IconComponent = social.Icon;
          return /* @__PURE__ */ jsx(Card, { className: "group cursor-pointer hover:shadow-lg transition-all hover:border-primary/50", onClick: () => window.open(social.url, "_blank"), children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0", children: /* @__PURE__ */ jsx(IconComponent, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground text-sm", children: social.name }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: social.handle })
            ] })
          ] }) }) }, index);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-6", children: isEn ? "Request Form" : "Форма заявки" }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: isEn ? "Name *" : "Имя *" }),
              /* @__PURE__ */ jsx(Input, { id: "name", name: "name", value: formData.name, onChange: handleChange, placeholder: isEn ? "Your name" : "Ваше имя", required: true })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "age", children: isEn ? "Patient Age" : "Возраст пациента" }),
              /* @__PURE__ */ jsx(Input, { id: "age", name: "age", value: formData.age, onChange: handleChange, placeholder: isEn ? "e.g.: 7 years" : "Например: 7 лет" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email *" }),
              /* @__PURE__ */ jsx(Input, { id: "email", name: "email", type: "email", value: formData.email, onChange: handleChange, placeholder: "email@example.com", required: true })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: isEn ? "Phone" : "Телефон" }),
              /* @__PURE__ */ jsx(Input, { id: "phone", name: "phone", type: "tel", value: formData.phone, onChange: handleChange, placeholder: "+7 (___) ___-__-__" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "message", children: isEn ? "Brief Problem Description *" : "Краткое описание проблемы *" }),
            /* @__PURE__ */ jsx(Textarea, { id: "message", name: "message", value: formData.message, onChange: handleChange, placeholder: isEn ? "Describe your situation or question..." : "Опишите вашу ситуацию или вопрос...", rows: 5, required: true })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", size: "lg", className: "w-full bg-accent hover:bg-accent/90 text-accent-foreground", disabled: isSubmitting, children: isSubmitting ? isEn ? "Sending..." : "Отправка..." : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
            isEn ? "Submit Request" : "Отправить заявку"
          ] }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: isEn ? "By submitting, you agree to the processing of personal data" : "Нажимая кнопку, вы соглашаетесь с обработкой персональных данных" })
        ] }) }) })
      ] })
    ] })
  ] });
};
export {
  Contacts as default
};
