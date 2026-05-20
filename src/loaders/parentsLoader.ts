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

export async function parentsLoader(): Promise<ParentsLoaderData> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/disease_articles?is_published=eq.true&select=*&order=sort_order.asc`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.warn("[SSG] Failed to fetch disease list:", res.status);
      return { articles: [] };
    }
    const articles = (await res.json()) as any[];
    return { articles };
  } catch (e) {
    console.warn("[SSG] parentsLoader error:", e);
    return { articles: [] };
  }
}
