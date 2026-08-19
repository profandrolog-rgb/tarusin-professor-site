// Единственный маршрут к бэкенду — прокси (PRIMARY_BASE).
//
// Раньше здесь была схема с резервными адресами, зондами и «сетевыми»
// таймаутами. На практике она давала сбои: запрос обрывался таймаутом или
// уходил на медленный резервный прокси. Возвращаем прежнюю простую логику:
// один маршрут через прокси, без запасных путей и без обрыва запросов.
//
// Единственное, что делает перехват fetch — переписывает старые/прямые адреса
// Supabase на текущий прокси, чтобы ни один экран не ходил в обход.

import { PRIMARY_BASE, normalizeBackendUrl } from "./backendEndpoints";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/** Сохранить параметры Request при переписывании только его backend-host. */
function normalizedInput(input: RequestInfo | URL, normalizedUrl: string): RequestInfo | URL {
  if (requestUrl(input) === normalizedUrl) return input;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return new Request(normalizedUrl, input);
  }
  return normalizedUrl;
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

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = normalizeBackendUrl(requestUrl(input));
    return originalFetch(normalizedInput(input, url) as any, init);
  };
}
