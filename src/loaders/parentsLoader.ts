// Loader для каталога /for-parents/. Используется и при SSG (Node), и при SPA-навигации.
// Тянет список ВСЕХ опубликованных болезней одним REST-запросом, чтобы pre-render
// получал готовый список карточек без клиентских useEffect.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const HEADERS = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
  Accept: "application/json",
};

export interface ParentsLoaderData {
  articles: any[];
}

/**
 * Безопасный fetch + JSON-парсинг.
 * - Проверяет HTTP-статус (4xx/5xx, в т.ч. 502 от прокси).
 * - Проверяет Content-Type: парсим только `application/json`.
 *   Если пришёл HTML/DOCTYPE (SPA fallback) или text/plain — лог + null.
 */
async function fetchJson(tag: string, url: string): Promise<any | null> {
  let res: Response;
  try {
    res = await fetch(url, { headers: HEADERS });
  } catch (e) {
    console.warn(`[parentsLoader:${tag}] network error:`, (e as Error)?.message || e);
    return null;
  }

  const ct = res.headers.get("content-type") || "";

  if (!res.ok) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.text()).slice(0, 200);
    } catch {
      /* ignore */
    }
    console.warn(
      `[parentsLoader:${tag}] HTTP ${res.status} ${res.statusText} (ct=${ct || "n/a"}) — ${bodyPreview}`,
    );
    return null;
  }

  if (!ct.toLowerCase().includes("application/json")) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.text()).slice(0, 120);
    } catch {
      /* ignore */
    }
    console.warn(
      `[parentsLoader:${tag}] non-JSON response (ct=${ct || "empty"}) — likely proxy/HTML fallback. Preview: ${bodyPreview}`,
    );
    return null;
  }

  try {
    return await res.json();
  } catch (e) {
    console.warn(`[parentsLoader:${tag}] JSON parse error:`, (e as Error)?.message || e);
    return null;
  }
}

export async function parentsLoader(): Promise<ParentsLoaderData> {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn("[parentsLoader] missing SUPABASE env vars — skipping prefetch");
    return { articles: [] };
  }
  const url = `${SUPABASE_URL}/rest/v1/disease_articles?is_published=eq.true&select=*&order=sort_order.asc`;
  const articles = (await fetchJson("list", url)) as any[] | null;
  return { articles: Array.isArray(articles) ? articles : [] };
}
