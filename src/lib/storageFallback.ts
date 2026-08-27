// Фолбэк для картинок из Storage: если основной хост (прокси) недоступен,
// один раз подменяем ссылку на резервный адрес (второй прокси или прямой домен).

import { FALLBACK_BASES, PRIMARY_BASE, swapBase } from "./backendEndpoints";

/** Ссылка на тот же объект в обход прокси (или null, если подмена не нужна). */
export function directStorageUrl(url: string): string | null {
  if (!url || !PRIMARY_BASE) return null;
  for (const base of FALLBACK_BASES) {
    if (url.startsWith(base)) return null;
    const next = swapBase(url, base);
    if (next) return next;
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
