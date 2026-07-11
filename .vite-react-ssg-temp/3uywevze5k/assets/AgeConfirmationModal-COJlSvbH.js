import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, B as Button } from "../main.mjs";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
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
const AgeConfirmationModal = ({ children }) => {
  const [confirmed, setConfirmed] = useState(true);
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  useEffect(() => {
    setConfirmed(getCookie(COOKIE_NAME) === "true");
  }, []);
  const handleConfirm = () => {
    setCookie(COOKIE_NAME, "true", COOKIE_DAYS);
    setConfirmed(true);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Dialog, { open: !confirmed, onOpenChange: () => {
    }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-lg", onPointerDownOutside: (e) => e.preventDefault(), onEscapeKeyDown: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(ShieldAlert, { className: "w-6 h-6 text-destructive" }) }),
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl", children: isEn ? "Age Restriction 18+" : "Возрастное ограничение 18+" })
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-sm text-muted-foreground leading-relaxed", children: isEn ? "This section contains medical images and clinical videos of a scientific and educational nature. They are not intended to arouse sexual interest. All materials are published with informed consent for scientific and educational purposes. View at your own discretion." : /* @__PURE__ */ jsxs(Fragment, { children: [
          "Материалы данного раздела носят научно-образовательный характер и содержат медицинские изображения и видео клинических случаев. Они не предназначены для возбуждения сексуального интереса и не являются «информацией порнографического характера» в смысле п. 8 ст. 2 ФЗ № 436‑ФЗ.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("br", {}),
          "Все материалы опубликованы на основании универсального информированного согласия для использования в научных, аналитических, учебных и просветительских целях. Просмотр осуществляется на ваш страх и риск."
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: handleConfirm, className: "w-full mt-4", size: "lg", children: isEn ? "I am 18+, continue" : "Мне есть 18 лет, продолжить" })
    ] }) }),
    children
  ] });
};
export {
  AgeConfirmationModal as A
};
