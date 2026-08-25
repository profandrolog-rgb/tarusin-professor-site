// Снимок нативного fetch, сделанный ДО установки backend-failover патча.
// Нужен для диагностических probe-запросов: патч переписывает любой
// backend-host на активный маршрут, из-за чего probe альтернативы измерял бы
// активный маршрут вместо реального кандидата.
const native: typeof fetch | null =
  typeof window !== "undefined" && typeof window.fetch === "function"
    ? window.fetch.bind(window)
    : typeof globalThis !== "undefined" && typeof globalThis.fetch === "function"
      ? globalThis.fetch.bind(globalThis)
      : null;

export function rawFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!native) return Promise.reject(new Error("fetch unavailable"));
  return native(input as any, init);
}
