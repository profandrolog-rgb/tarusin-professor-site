// Сетевой failover для бэкенда.
//
// Основной хост — прокси api.tarusin.pro (Supabase напрямую заблокирован в РФ).
// Если прокси не отвечает или отдаёт 5xx, один раз повторяем тот же запрос
// напрямую на домен Supabase и дальше в этой сессии сразу ходим напрямую.

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const PROXY_BASE = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "").replace(/\/$/, "");
const DIRECT_BASE = PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : "";

let preferDirect = false;

/** Максимум ожидания ответа прокси, после чего уходим напрямую в Supabase. */
const PROXY_TIMEOUT_MS = 4000;
/** Быстрая стартовая проверка прокси: если он мёртв — сразу работаем напрямую. */
const PROBE_TIMEOUT_MS = 2500;



function toDirect(url: string): string | null {
  if (!DIRECT_BASE || !PROXY_BASE || DIRECT_BASE === PROXY_BASE) return null;
  return url.startsWith(PROXY_BASE) ? DIRECT_BASE + url.slice(PROXY_BASE.length) : null;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function installBackendFailover() {
  if (typeof window === "undefined") return;
  if ((window as any).__backendFailoverInstalled) return;
  (window as any).__backendFailoverInstalled = true;
  if (!DIRECT_BASE || !PROXY_BASE || DIRECT_BASE === PROXY_BASE) return;

  const originalFetch = window.fetch.bind(window);

  // Стартовый зонд: если прокси не отвечает за 2.5 с — сразу помечаем direct,
  // чтобы первый вход/загрузка данных не ждали мёртвый прокси.
  void (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await originalFetch(`${PROXY_BASE}/auth/v1/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      if (res.status >= 500) preferDirect = true;
    } catch {
      preferDirect = true;
    } finally {
      clearTimeout(timer);
    }
  })();



  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const direct = toDirect(url);

    if (direct && preferDirect) {
      return originalFetch(direct, init);
    }

    if (!direct) return originalFetch(input as any, init);

    // Прокси может «висеть» без ответа — ограничиваем ожидание и уходим напрямую.
    const controller = new AbortController();
    const external = init?.signal ?? null;
    const onExternalAbort = () => controller.abort();
    external?.addEventListener("abort", onExternalAbort);
    const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    try {
      const res = await originalFetch(input as any, { ...init, signal: controller.signal });
      if (res.status >= 500 && res.status <= 599) {
        preferDirect = true;
        return originalFetch(direct, init);
      }
      return res;
    } catch (err) {
      // Отмена пользователем/вызывающим кодом — пробрасываем как есть.
      if (external?.aborted) throw err;
      preferDirect = true;
      return originalFetch(direct, init);
    } finally {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    }
  };
}

