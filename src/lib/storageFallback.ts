// Фолбэк для картинок из Storage: если основной хост (прокси) недоступен,
// один раз подменяем ссылку на резервный адрес (второй прокси или прямой домен).

import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_BASES, PRIMARY_BASE, swapBase } from "./backendEndpoints";
import { proxyPublicStorageUrl } from "./installStoragePublicUrlProxy";

/**
 * Публичная ссылка на файл в бакете. Проксирование выполняется глобально
 * (src/lib/installStoragePublicUrlProxy.ts), здесь только удобная обёртка.
 */
export function publicStorageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  // Do not rely solely on the startup monkey-patch: this helper remains safe
  // during SSG, isolated renders and early imports before main.tsx executes.
  return proxyPublicStorageUrl(url);
}


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
