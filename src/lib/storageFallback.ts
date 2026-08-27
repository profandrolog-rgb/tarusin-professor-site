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

/** Ссылка на оригинал, если картинка запрашивалась через трансформацию. */
function originalObjectUrl(url: string): string | null {
  if (!url.includes("/storage/v1/render/image/public/")) return null;
  return url.replace("/storage/v1/render/image/public/", "/storage/v1/object/public/").split("?")[0];
}

/**
 * onError для <img>: сначала откатываемся с трансформации на оригинал,
 * затем — на резервный домен бэкенда. Повторов не делаем.
 */
export function handleStorageImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (!img.dataset.originalApplied) {
    const orig = originalObjectUrl(img.src);
    if (orig) {
      img.dataset.originalApplied = "1";
      img.removeAttribute("srcset");
      img.src = orig;
      return;
    }
    img.dataset.originalApplied = "1";
  }
  if (img.dataset.fallbackApplied) return;
  const next = directStorageUrl(img.src);
  if (!next) return;
  img.dataset.fallbackApplied = "1";
  img.removeAttribute("srcset");
  img.src = next;
}

