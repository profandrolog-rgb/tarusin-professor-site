// Сетевой failover для бэкенда.
//
// Основной хост — прокси (Supabase напрямую избирательно блокируется в РФ на
// уровне TLS). Если прокси не отвечает или отдаёт 5xx, повторяем тот же запрос
// на резервном адресе (второй прокси, затем прямой домен Supabase) и дальше
// в этой сессии сразу ходим на выбранный резерв.

import { FALLBACK_BASES, PRIMARY_BASE, swapBase } from "./backendEndpoints";

/** Выбранный на эту сессию резервный адрес (null — работаем через основной). */
let activeFallback: string | null = null;

/** Максимум ожидания ответа прокси, после чего уходим на резерв. */
const PROXY_TIMEOUT_MS = 4000;
/** Быстрая стартовая проверка прокси: если он мёртв — сразу работаем на резерве. */
const PROBE_TIMEOUT_MS = 2500;

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function installBackendFailover() {
  // Пререндер (vite-react-ssg) выполняет модуль в Node: window/fetch может
  // отсутствовать — любые обращения делаем только в браузере.
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof window.fetch !== "function" || typeof AbortController === "undefined") return;
  if ((window as any).__backendFailoverInstalled) return;
  (window as any).__backendFailoverInstalled = true;
  if (!PRIMARY_BASE || FALLBACK_BASES.length === 0) return;

  const originalFetch = window.fetch.bind(window);

  /** Проверка адреса: true — health-эндпоинт ответил не 5xx. */
  const probe = async (base: string, timeout: number): Promise<boolean> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await originalFetch(`${base}/auth/v1/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      return res.status < 500;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  /** Найти первый живой резервный адрес; результат кэшируется на сессию. */
  const pickFallback = async (): Promise<string | null> => {
    if (activeFallback) return activeFallback;
    for (const base of FALLBACK_BASES) {
      if (await probe(base, PROBE_TIMEOUT_MS)) {
        activeFallback = base;
        return base;
      }
    }
    // Ни один резерв не ответил на health — всё равно пробуем первый,
    // health может быть закрыт прокси, а рабочие пути открыты.
    activeFallback = FALLBACK_BASES[0] ?? null;
    return activeFallback;
  };

  // Стартовый зонд основного адреса: если прокси мёртв — сразу выбираем резерв,
  // чтобы первый вход/загрузка данных не ждали неотвечающий прокси.
  void (async () => {
    if (!(await probe(PRIMARY_BASE, PROBE_TIMEOUT_MS))) {
      await pickFallback();
    }
  })();

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);

    if (activeFallback) {
      const direct = swapBase(url, activeFallback);
      if (direct) return originalFetch(direct, init);
    }

    if (!url.startsWith(PRIMARY_BASE)) return originalFetch(input as any, init);

    // Прокси может «висеть» без ответа — ограничиваем ожидание и уходим на резерв.
    const controller = new AbortController();
    const external = init?.signal ?? null;
    const onExternalAbort = () => controller.abort();
    external?.addEventListener("abort", onExternalAbort);
    const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    try {
      const res = await originalFetch(input as any, { ...init, signal: controller.signal });
      if (res.status >= 500 && res.status <= 599) {
        const base = await pickFallback();
        const retry = base ? swapBase(url, base) : null;
        if (retry) return originalFetch(retry, init);
      }
      return res;
    } catch (err) {
      // Отмена пользователем/вызывающим кодом — пробрасываем как есть.
      if (external?.aborted) throw err;
      const base = await pickFallback();
      const retry = base ? swapBase(url, base) : null;
      if (retry) return originalFetch(retry, init);
      throw err;
    } finally {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    }
  };
}
