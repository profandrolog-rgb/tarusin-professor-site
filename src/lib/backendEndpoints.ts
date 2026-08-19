// Единая точка расчёта адресов бэкенда.
//
// Ситуация: домены Supabase (*.supabase.co) избирательно блокируются в РФ на
// уровне ТСПУ/DPI — TCP-соединение открывается, но TLS-сессия «зависает».
// Поэтому и браузеры посетителей, и сервер сборки должны ходить через прокси,
// который стоит НЕ в России (VPS в зарубежной локации или Cloudflare Worker).
//
// Переменные окружения:
//   VITE_SUPABASE_URL           — основной адрес (например, https://api.tarusin.pro)
//   VITE_SUPABASE_PROXY_URL     — явный production override для управляемого Lovable URL;
//                                 при наличии предпочитается перед VITE_SUPABASE_URL
//   VITE_BACKEND_FALLBACK_URL   — резервный прокси (можно перечислить несколько через запятую)
//   VITE_SUPABASE_BUILD_URL     — адрес, используемый при SSG-сборке (Node на сервере сборки)
//   VITE_SUPABASE_PROJECT_ID    — из него собирается прямой адрес Supabase (последний кандидат)

const stripSlash = (url: string) => url.replace(/\/$/, "");

const env = import.meta.env as Record<string, string | undefined>;

export const PROJECT_ID = env.VITE_SUPABASE_PROJECT_ID;

/**
 * Прямой адрес Supabase. В РФ блокируется на уровне TLS, поэтому по умолчанию
 * НЕ используется ни как резерв, ни при сборке — только если явно разрешено
 * переменной VITE_ALLOW_DIRECT_SUPABASE=true.
 */
export const DIRECT_BASE = PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : "";

/** Разрешён ли прямой домен Supabase как путь обхода (по умолчанию — нет). */
export const ALLOW_DIRECT = String(env.VITE_ALLOW_DIRECT_SUPABASE ?? "").toLowerCase() === "true";

/** Основной адрес, которым пользуется supabase-js (прокси, предпочитая VITE_SUPABASE_PROXY_URL). */
export const PRIMARY_BASE = stripSlash(env.VITE_SUPABASE_PROXY_URL || env.VITE_SUPABASE_URL || "");

/**
 * Кандидаты обхода в порядке приоритета: только прокси из env. Прямой домен
 * Supabase добавляется исключительно при VITE_ALLOW_DIRECT_SUPABASE=true.
 */
export const FALLBACK_BASES: string[] = (() => {
  const configured = (env.VITE_BACKEND_FALLBACK_URL ?? "")
    .split(",")
    .map((s) => stripSlash(s.trim()))
    .filter(Boolean);

  const all = [...configured, ...(ALLOW_DIRECT ? [DIRECT_BASE] : [])].filter(Boolean);
  return Array.from(new Set(all)).filter((base) => base !== PRIMARY_BASE);
})();

/**
 * Адрес для SSG-сборки (Node). Сборка идёт на сервере в РФ, поэтому прямой
 * адрес Supabase там может быть недоступен: сначала берём явный build-URL,
 * затем резервный прокси, затем основной, и лишь потом прямой домен.
 */
export const BUILD_BASE: string =
  stripSlash(env.VITE_SUPABASE_BUILD_URL ?? "") ||
  FALLBACK_BASES.find((base) => base !== DIRECT_BASE) ||
  PRIMARY_BASE ||
  (ALLOW_DIRECT ? DIRECT_BASE : "");

/** Базовый адрес для загрузчиков: BUILD_BASE при пререндере, PRIMARY_BASE в браузере. */
export const loaderBase = (): string =>
  typeof window === "undefined" ? BUILD_BASE || PRIMARY_BASE : PRIMARY_BASE || BUILD_BASE;

/** Переписать URL с основного адреса на кандидата обхода. */
export const swapBase = (url: string, base: string): string | null => {
  if (!PRIMARY_BASE || !base || base === PRIMARY_BASE) return null;
  return url.startsWith(PRIMARY_BASE) ? base + url.slice(PRIMARY_BASE.length) : null;
};
