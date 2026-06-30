import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SITE_URL, getAlternates, getLangFromPath, stripLangPrefix } from "@/lib/i18nUrls";

interface PageMetaProps {
  title: string;
  description: string;
  /** «Голый» путь без префикса /en, например "/for-parents/" или "/". */
  path: string;
  image?: string;
  type?: "website" | "article";
  /** Принудительно задать язык страницы. Иначе определяется из URL. */
  lang?: "ru" | "en";
  /** SEO-ключи (выводятся как <meta name="keywords">), опционально. */
  keywords?: string[];
}

const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const PageMeta = ({ title, description, path, image, type = "website", lang, keywords }: PageMetaProps) => {

  // Определяем язык — либо явно передан, либо вычислен из текущего URL.
  let pathname = "/";
  try {
    pathname = useLocation().pathname;
  } catch {
    // вне Router — используем path
    pathname = path;
  }
  const currentLang = lang ?? getLangFromPath(pathname);

  // Канонический путь — с учётом текущего языка.
  const bare = stripLangPrefix(path === "" ? "/" : path);
  const normalized = bare === "/" || bare.endsWith("/") ? bare : `${bare}/`;
  const canonicalPath =
    currentLang === "en"
      ? normalized === "/"
        ? "/en/"
        : `/en${normalized}`
      : normalized;
  const url = `${SITE_URL}${canonicalPath}`;

  const alts = getAlternates(canonicalPath);
  const ogImage = image || DEFAULT_IMAGE;
  const ogLocale = currentLang === "en" ? "en_US" : "ru_RU";

  return (
    <Helmet htmlAttributes={{ lang: currentLang }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="ru" href={alts.ru} />
      <link rel="alternate" hrefLang="en" href={alts.en} />
      <link rel="alternate" hrefLang="x-default" href={alts.xDefault} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content="Профессор Тарусин Д.И." />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
};

export default PageMeta;
