/**
 * «Будильник» бэкенда.
 *
 * Бесплатный тир Lovable Cloud засыпает после длительной неактивности, и тогда
 * первый вход в админку падает с ошибкой «не отвечает сервер авторизации».
 * Чтобы этого не происходило, при открытии сайта делаем один лёгкий запрос
 * к бэкенду — но не чаще одного раза в сутки (метка в localStorage).
 *
 * Запрос идёт и через прокси (api.tarusin.pro), и напрямую — что дойдёт,
 * то и разбудит. Ошибки полностью проглатываются: это фоновая профилактика,
 * пользователь о ней знать не должен.
 */

const STORAGE_KEY = "backend-keepalive-last-ping";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAYS_MS = [5_000, 20_000, 60_000];

const readLastPing = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

const writeLastPing = (ts: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(ts));
  } catch {
    /* приватный режим — просто пингуем при каждом заходе */
  }
};

/** Один тихий запрос к health-эндпоинту бэкенда. true — бэкенд ответил. */
const pingOnce = async (): Promise<boolean> => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!baseUrl || !apikey) return false;

  const targets = [`${baseUrl.replace(/\/$/, "")}/auth/v1/health`];

  const results = await Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "GET",
        headers: { apikey },
        cache: "no-store",
        keepalive: true,
      }),
    ),
  );

  return results.some((r) => r.status === "fulfilled" && r.value.ok);
};

/**
 * Разбудить бэкенд, если с последнего пинга прошли сутки.
 * Вызывается один раз при монтировании корневого layout.
 */
export const scheduleBackendKeepAlive = () => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - readLastPing() < ONE_DAY_MS) return;

  // Помечаем сразу, чтобы параллельные вкладки не дублировали пинг.
  writeLastPing(now);

  void (async () => {
    if (await pingOnce()) return;

    // Спящий инстанс просыпается не мгновенно — даём ему несколько попыток.
    for (const delay of RETRY_DELAYS_MS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (await pingOnce()) return;
    }

    // Не дозвонились — снимаем метку, чтобы следующий заход попробовал снова.
    writeLastPing(0);
  })();
};
