// Единая точка проксирования ПУБЛИЧНЫХ ссылок Supabase Storage.
//
// Проблема: <img src>/<video src> не проходят через глобальный fetch-перехват
// (src/lib/backendFailover.ts), поэтому если клиент собран с прямым адресом
// *.supabase.co (dev/превью Lovable), картинки в РФ не грузятся — домен
// блокируется на уровне TLS. На production адрес уже прокси, и подмена не нужна.
//
// Решение: один раз оборачиваем storage.getPublicUrl, чтобы ЛЮБОЙ вызов в проекте
// (34+ мест) получал ссылку через рабочий прокси.

import { supabase } from "@/integrations/supabase/client";
import { DIRECT_BASE } from "./backendEndpoints";

/** Рабочий прокси для публичных файлов (Cloudflare Worker вне РФ). */
export const PUBLIC_STORAGE_PROXY =
  (import.meta.env.VITE_PUBLIC_STORAGE_PROXY as string | undefined)?.replace(/\/$/, "") ||
  "https://api2.tarusin.pro";

/** Перевести публичную ссылку Storage на прокси (если она указывает на прямой домен). */
export function proxyPublicStorageUrl(url: string): string {
  if (!url || !DIRECT_BASE || !PUBLIC_STORAGE_PROXY) return url;
  if (PUBLIC_STORAGE_PROXY === DIRECT_BASE) return url;
  return url.startsWith(DIRECT_BASE) ? PUBLIC_STORAGE_PROXY + url.slice(DIRECT_BASE.length) : url;
}

let installed = false;

/** Однократно оборачивает getPublicUrl у всех бакетов. */
export function installStoragePublicUrlProxy() {
  if (installed) return;
  installed = true;

  const storage = supabase.storage as unknown as {
    from: (bucket: string) => { getPublicUrl: (...args: unknown[]) => { data: { publicUrl: string } } };
  };
  const originalFrom = storage.from.bind(storage);

  storage.from = (bucket: string) => {
    const api = originalFrom(bucket);
    const originalGetPublicUrl = api.getPublicUrl.bind(api);
    api.getPublicUrl = (...args: unknown[]) => {
      const res = originalGetPublicUrl(...args);
      const publicUrl = proxyPublicStorageUrl(res?.data?.publicUrl ?? "");
      return { ...res, data: { ...res.data, publicUrl } };
    };
    return api;
  };
}
