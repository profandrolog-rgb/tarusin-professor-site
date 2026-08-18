// Фолбэк для картинок из Storage: если основной хост (прокси api.tarusin.pro)
// недоступен, один раз подменяем ссылку на прямой домен Supabase.

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const DIRECT_BASE = PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : "";
const CURRENT_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

/** Прямая ссылка на тот же объект в обход прокси (или null, если подмена не нужна). */
export function directStorageUrl(url: string): string | null {
  if (!DIRECT_BASE || !url) return null;
  if (url.startsWith(DIRECT_BASE)) return null;
  if (CURRENT_BASE && url.startsWith(CURRENT_BASE)) {
    return DIRECT_BASE + url.slice(CURRENT_BASE.length);
  }
  return null;
}

/** onError для <img>: пробуем прямой домен Supabase, повторов не делаем. */
export function handleStorageImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied) return;
  const next = directStorageUrl(img.src);
  if (!next) return;
  img.dataset.fallbackApplied = "1";
  img.src = next;
}
