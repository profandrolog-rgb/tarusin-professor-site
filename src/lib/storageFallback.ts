// Фолбэк для картинок из Storage: если основной хост (прокси) недоступен,
// один раз подменяем ссылку на резервный адрес (второй прокси или прямой домен).

import { supabase } from "@/integrations/supabase/client";
import { DIRECT_BASE, FALLBACK_BASES, PRIMARY_BASE, swapBase } from "./backendEndpoints";

/**
 * Прокси для публичных файлов Storage на случай, когда клиент собран с прямым
 * адресом *.supabase.co (dev/превью): в РФ этот домен блокируется на уровне TLS,
 * поэтому картинки не грузятся. Публичные ссылки уводим на рабочий прокси.
 */
const PUBLIC_STORAGE_PROXY = "https://api2.tarusin.pro";

/** Публичная ссылка на файл в бакете, гарантированно доступная из РФ. */
export function publicStorageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  if (DIRECT_BASE && url.startsWith(DIRECT_BASE)) {
    return PUBLIC_STORAGE_PROXY + url.slice(DIRECT_BASE.length);
  }
  return url;
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
