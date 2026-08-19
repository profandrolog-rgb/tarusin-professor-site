// Сетевой failover для бэкенда.
//
// Основной хост — прокси (Supabase напрямую избирательно блокируется в РФ на
// уровне TLS). Если прокси не отвечает или отдаёт 5xx, повторяем тот же запрос
// на резервном адресе (второй прокси, затем прямой домен Supabase) и дальше
// в этой сессии сразу ходим на выбранный резерв.

import { FALLBACK_BASES, PRIMARY_BASE, swapBase } from "./backendEndpoints";

/** Выбранный на эту сессию резервный адрес (null — работаем через основной). */
let activeFallback: string | null = null;
/** Время (ms), когда выбранный резерв перестаёт считаться актуальным. */
let activeFallbackUntil = 0;

/** Максимум ожидания ответа прокси, после чего уходим на резерв. */
const PROXY_TIMEOUT_MS = 8000;
/**
 * Долгие операции (Edge Functions: распознавание протоколов, AI-разборы)
 * штатно длятся десятки секунд — их нельзя рвать «сетевым» таймаутом.
 */
const LONG_TIMEOUT_MS = 300000;
/** Быстрая стартовая проверка прокси: если он мёртв — сразу работаем на резерве. */
const PROBE_TIMEOUT_MS = 2500;
/**
 * Резерв «залипает» только на короткое время: прямой домен Supabase в РФ
 * заблокирован, поэтому один сбой прокси не должен выключать сайт на всю сессию.
 */
const FALLBACK_TTL_MS = 30000;

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

  /** Текущий резерв, если он ещё не «просрочен». */
  const currentFallback = (): string | null => {
    if (activeFallback && Date.now() < activeFallbackUntil) return activeFallback;
    activeFallback = null;
    return null;
  };

  /**
   * Найти живой резервный адрес. Важно: если ни один резерв не отвечает
   * (в РФ прямой домен Supabase заблокирован), остаёмся на основном адресе —
   * переключение на заведомо мёртвый хост полностью ломает вход.
   */
  const pickFallback = async (): Promise<string | null> => {
    const cached = currentFallback();
    if (cached) return cached;
    for (const base of FALLBACK_BASES) {
      if (await probe(base, PROBE_TIMEOUT_MS)) {
        activeFallback = base;
        activeFallbackUntil = Date.now() + FALLBACK_TTL_MS;
        return base;
      }
    }
    activeFallback = null;
    activeFallbackUntil = 0;
    return null;
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

    const active = currentFallback();
    if (active) {
      const direct = swapBase(url, active);
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
