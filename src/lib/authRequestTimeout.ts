// Таймаут для запросов обновления токена сессии (POST …/auth/v1/token).
//
// Зачем: если такой запрос подвисает в сети, встроенный «замок» сессии в
// библиотеке Supabase держится до встроенного таймаута (10 с) и все обращения
// к базе/хранилищу падают с «signal is aborted without reason». Прерывая
// подвисший запрос по нашему таймауту, освобождаем «замок» за секунды и даём
// библиотеке показать понятную ошибку вместо тихого зависания.
//
// Устанавливается как самый внутренний слой window.fetch (подключается раньше,
// чем installBackendFailover в main.tsx, поэтому failover остаётся внешним
// слоем и не меняется).

const REFRESH_TIMEOUT_MS = 12_000;

export function installAuthRequestTimeout() {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  const w = window as unknown as {
    __authRequestTimeoutInstalled?: boolean;
    fetch: typeof fetch;
  };
  if (w.__authRequestTimeoutInstalled) return;
  w.__authRequestTimeoutInstalled = true;

  const originalFetch = w.fetch.bind(w);

  w.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (
      init?.method ||
      (input instanceof Request ? input.method : "GET") ||
      "GET"
    ).toUpperCase();

    const isTokenRequest = method === "POST" && url.includes("/auth/v1/token");
    if (!isTokenRequest) return originalFetch(input, init);

    const callerSignal = init?.signal as AbortSignal | undefined;
    if (callerSignal?.aborted) return originalFetch(input, init);

    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, REFRESH_TIMEOUT_MS);

    const forwardCallerAbort = () => ctrl.abort();
    if (callerSignal?.addEventListener) {
      callerSignal.addEventListener("abort", forwardCallerAbort);
    }

    let signal: AbortSignal | undefined = ctrl.signal;
    if (callerSignal && typeof AbortSignal !== "undefined" && "any" in AbortSignal) {
      signal = AbortSignal.any([callerSignal, ctrl.signal]);
    }

    try {
      return await originalFetch(input, { ...init, signal });
    } catch (e) {
      if (timedOut) {
        throw new Error(
          "Обновление сессии: сервер не ответил вовремя. Повторите действие через минуту.",
        );
      }
      throw e;
    } finally {
      clearTimeout(timer);
      if (callerSignal?.removeEventListener) {
        callerSignal.removeEventListener("abort", forwardCallerAbort);
      }
    }
  };
}

installAuthRequestTimeout();
