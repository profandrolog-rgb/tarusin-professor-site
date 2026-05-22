import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";

// Русский — язык по умолчанию для всех страниц.
// Английская версия включается:
//   1) автоматически в LangBoundary для URL /en/*
//   2) вручную через переключатель языка (он пишет в localStorage)
// Navigator/querystring-детект НЕ используем — иначе сайт открывается на английском
// у пользователей с en-локалью браузера, что ломает SEO.
let initialLang = "ru";
if (typeof window !== "undefined") {
  // Приоритет 1: явный префикс /en/ в URL
  if (window.location.pathname.startsWith("/en")) {
    initialLang = "en";
  } else {
    // Приоритет 2: ручной выбор пользователя (только если он есть)
    const stored = window.localStorage.getItem("i18nextLng");
    if (stored === "en" || stored === "ru") initialLang = stored;
  }
}

i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, en: { translation: en } },
  lng: initialLang,
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

export default i18n;
