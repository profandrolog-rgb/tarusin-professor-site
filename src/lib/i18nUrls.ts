export const SITE_URL = "https://tarusin.pro";

/** Возвращает «голый» путь без префикса /en (для построения альтернатив). */
export function stripLangPrefix(pathname: string): string {
  if (pathname === "/en" || pathname === "/en/") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3); // оставляем ведущий "/"
  return pathname;
}

/** Определяет язык страницы по URL. */
export function getLangFromPath(pathname: string): "ru" | "en" {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ru";
}

/** Строит абсолютные URL для альтернативных языковых версий. */
export function getAlternates(pathname: string): {
  ru: string;
  en: string;
  xDefault: string;
} {
  const base = stripLangPrefix(pathname);
  const normalized =
    base === "/" || base.endsWith("/") ? base : `${base}/`;
  const ru = `${SITE_URL}${normalized}`;
  const en =
    normalized === "/"
      ? `${SITE_URL}/en/`
      : `${SITE_URL}/en${normalized}`;
  return { ru, en, xDefault: ru };
}
