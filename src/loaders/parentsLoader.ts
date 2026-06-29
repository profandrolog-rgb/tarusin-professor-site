// Loader для каталога /for-parents/. Используется и при SSG (Node), и при SPA-навигации.
// Тянет список ВСЕХ опубликованных болезней одним REST-запросом, чтобы pre-render
// получал готовый список карточек без клиентских useEffect.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const HEADERS = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
};

export interface ParentsLoaderData {
  articles: any[];
}

/**
 * Безопасный JSON-парсинг. Если ответ — HTML (DOCTYPE), возвращаем null,
 * чтобы не падать с "Unexpected token '<'" в loader-е React Router.
 */
async function safeJson(res: Response): Promise<any | null> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function parentsLoader(): Promise<ParentsLoaderData> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return { articles: [] };
  try {
    const url = `${SUPABASE_URL}/rest/v1/disease_articles?is_published=eq.true&select=*&order=sort_order.asc`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.warn("[SSG] Failed to fetch disease list:", res.status);
      return { articles: [] };
    }
    const articles = (await safeJson(res)) as any[] | null;
    return { articles: Array.isArray(articles) ? articles : [] };
  } catch (e) {
    console.warn("[SSG] parentsLoader error:", e);
    return { articles: [] };
  }
}
