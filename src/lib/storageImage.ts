// Трансформация публичных URL Supabase Storage в сжатые превью.
// /storage/v1/object/public/... -> /storage/v1/render/image/public/...?width=&quality=
// Экономит 4-5x трафика на карточках (367 КБ -> 78 КБ на типичном фото).
const OBJECT_MARK = "/storage/v1/object/public/";
const RENDER_MARK = "/storage/v1/render/image/public/";

/** Возвращает сжатый вариант; если URL не из Storage — отдаёт исходный без изменений. */
export function storageThumb(
  url: string | null | undefined,
  width = 640,
  quality = 70,
): string {
  if (!url) return "";
  if (!url.includes(OBJECT_MARK)) return url;
  // SVG и GIF трансформатор не обрабатывает — оставляем как есть.
  if (/\.(svg|gif)(\?|$)/i.test(url)) return url;
  const base = url.split("?")[0].replace(OBJECT_MARK, RENDER_MARK);
  return `${base}?width=${width}&quality=${quality}`;
}

/** Исходный (несжатый) URL — для fallback в onError. */
export function storageOriginal(url: string | null | undefined): string {
  if (!url) return "";
  return url.split("?")[0].replace(RENDER_MARK, OBJECT_MARK);
}
