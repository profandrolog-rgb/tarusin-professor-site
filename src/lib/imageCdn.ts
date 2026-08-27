// Ускорение картинок статей: раздача через трансформацию Storage
// (/storage/v1/render/image/public/...) вместо оригиналов.
//
// Зачем:
//  1) ресайз под реальный размер отображения — оригиналы по 300–400 КБ
//     превращаются в 60–120 КБ;
//  2) браузер получает WebP автоматически (сервер смотрит заголовок Accept);
//  3) ответы трансформации приходят с Cache-Control: max-age=3600,
//     поэтому Cloudflare (api2.tarusin.pro) их кэширует, а оригиналы
//     с `no-cache` кэшировать не мог.

const OBJECT_SEG = "/storage/v1/object/public/";
const RENDER_SEG = "/storage/v1/render/image/public/";

/** Качество по умолчанию: медицинские снимки должны остаться читаемыми. */
export const IMAGE_QUALITY = 80;

/** Ширины для srcset: телефон / планшет / десктоп / retina. */
export const GALLERY_WIDTHS = [480, 900, 1400] as const;

export interface CdnOptions {
  width?: number;
  quality?: number;
  /** contain (по умолчанию у Storage) либо cover для карточек-плиток. */
  resize?: "contain" | "cover";
}

/**
 * Преобразует публичный URL объекта Storage в URL трансформации.
 * Не-Storage ссылки (Unsplash, внешние картинки, data:) возвращаются как есть.
 */
export function cdnImage(url: string | null | undefined, opts: CdnOptions = {}): string {
  if (!url) return "";
  if (!url.includes(OBJECT_SEG)) return url;
  // Уже трансформированная ссылка — не трогаем.
  if (url.includes(RENDER_SEG)) return url;

  const [base, existingQuery] = url.split("?");
  const rendered = base.replace(OBJECT_SEG, RENDER_SEG);
  const params = new URLSearchParams(existingQuery || "");
  if (opts.width) params.set("width", String(Math.round(opts.width)));
  params.set("quality", String(opts.quality ?? IMAGE_QUALITY));
  if (opts.resize) params.set("resize", opts.resize);
  const qs = params.toString();
  return qs ? `${rendered}?${qs}` : rendered;
}

/** srcset для адаптивной загрузки; пустая строка для не-Storage ссылок. */
export function cdnSrcSet(
  url: string | null | undefined,
  widths: readonly number[] = GALLERY_WIDTHS,
  opts: Omit<CdnOptions, "width"> = {},
): string | undefined {
  if (!url || !url.includes(OBJECT_SEG)) return undefined;
  return widths.map((w) => `${cdnImage(url, { ...opts, width: w })} ${w}w`).join(", ");
}

/** Заголовок кэша для новых загрузок в Storage: год, вместо дефолтного no-cache. */
export const UPLOAD_CACHE_CONTROL = "31536000";
