import { ReactNode } from "react";
import i18n from "i18next";

interface LangBoundaryProps {
  lang: "ru" | "en";
  children: ReactNode;
}

/**
 * Синхронно переключает i18n-язык до рендера дочерних компонентов.
 * Используется для оборачивания двух параллельных деревьев роутов:
 * "/" (RU) и "/en" (EN). Также обновляет document.documentElement.lang
 * на клиенте (на сервере lang устанавливает PageMeta через Helmet).
 */
const LangBoundary = ({ lang, children }: LangBoundaryProps) => {
  if (i18n.language !== lang) {
    // changeLanguage синхронен, когда ресурсы уже подгружены inline (наш случай).
    i18n.changeLanguage(lang);
  }
  if (typeof document !== "undefined" && document.documentElement.lang !== lang) {
    document.documentElement.lang = lang;
  }
  return <>{children}</>;
};

export default LangBoundary;
