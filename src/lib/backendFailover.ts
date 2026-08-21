// Маршрутизация запросов к бэкенду через активный прокси.
//
// Правила (сознательно консервативные):
//  • любой запрос переписывается на АКТИВНЫЙ маршрут (по умолчанию — api2);
//  • рабочие запросы НЕ обрываются таймаутами — таймаут есть только у probe
//    в src/lib/backendRouteManager.ts;
//  • ровно один повтор — только для GET/HEAD и только при сетевой ошибке
//    или 502/503/504. Записи (POST/PATCH/PUT/DELETE) не повторяются никогда,
//    чтобы не создавать дубли;
//  • 401/403 — это ответ приложения, а не отказ маршрута;
//  • после успешного GET/HEAD через запасной маршрут он становится активным.
//
// Realtime/WebSocket остаётся на адресе, с которым создан supabase-клиент
// (VITE_SUPABASE_PROXY_URL): перехват fetch на WS не действует.

import { PRIMARY_BASE, rebaseUrl } from "./backendEndpoints";
import { routeManager, hasAlternativeRoutes } from "./backendRouteManager";

const RETRYABLE_STATUS = new Set([502, 503, 504]);

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  const m = init?.method || (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET");
  return (m || "GET").toUpperCase();
}

/** Сохранить параметры Request при переписывании только его backend-host. */
function withUrl(input: RequestInfo | URL, url: string): RequestInfo | URL {
  if (requestUrl(input) === url) return input;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return new Request(url, input);
  }
  return url;
}

export function installBackendFailover() {
  // Пререндер (vite-react-ssg) выполняет модуль в Node: window/fetch может
  // отсутствовать — любые обращения делаем только в браузере.
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof window.fetch !== "function") return;
  if ((window as any).__backendFailoverInstalled) return;
  (window as any).__backendFailoverInstalled = true;
  if (!PRIMARY_BASE) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const active = routeManager.getActive();
    const url = rebaseUrl(requestUrl(input), active);
    const isBackend = url.startsWith(active);

    if (isBackend && hasAlternativeRoutes) {
      // Фоновая диагностика: не чаще одного цикла в 5 минут на вкладку.
      void routeManager.maybeProbe();
    }

    const method = requestMethod(input, init);
    const retryable = isBackend && hasAlternativeRoutes && (method === "GET" || method === "HEAD");

    // Кандидата фиксируем ДО возможного reportFailure, иначе после смены
    // активного маршрута «альтернативой» станет только что отказавший адрес.
    const alt = retryable ? routeManager.getAlternatives()[0] || null : null;

    try {
      const resp = await originalFetch(withUrl(input, url) as any, init);
      if (retryable && RETRYABLE_STATUS.has(resp.status)) {
        if (alt) {
          const retried = await originalFetch(withUrl(input, rebaseUrl(url, alt)) as any, init);
          if (retried.ok) routeManager.reportSuccess(alt);
          return retried;
        }
      }
      return resp;
    } catch (e) {
      if (isBackend) routeManager.reportFailure(active);
      if (retryable) {
        if (alt) {
          const retried = await originalFetch(withUrl(input, rebaseUrl(url, alt)) as any, init);
          if (retried.ok) routeManager.reportSuccess(alt);
          return retried;
        }
      }
      throw e;
    }
  };
}
