// Loader для DiseaseDetailPage. Используется и при SSG-сборке (Node), и при SPA-навигации.
// Не используем supabase-js клиент, чтобы не тащить лишний код в build-сборщик и в браузерный prefetch.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const HEADERS = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
};

export interface DiseaseLoaderData {
  article: any;
  related: any[];
}

/**
 * Безопасный JSON-парсинг ответа. Если сервер вернул HTML (например, прокси/SPA
 * отдал index.html вместо REST-ответа), не падаем с "Unexpected token '<'",
 * а возвращаем null — компонент догрузит данные клиентским supabase-клиентом.
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

export async function diseaseLoader({ params }: { params: { slug?: string } }): Promise<DiseaseLoaderData> {
  const slug = params.slug;
  const empty: DiseaseLoaderData = { article: null, related: [] };
  if (!slug) return empty;
  if (!SUPABASE_URL || !SUPABASE_ANON) return empty;

  try {
    const articleUrl = `${SUPABASE_URL}/rest/v1/disease_articles?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*&limit=1`;
    const articleRes = await fetch(articleUrl, { headers: HEADERS });
    if (!articleRes.ok) return empty;
    const articles = (await safeJson(articleRes)) as any[] | null;
    const article = Array.isArray(articles) ? articles[0] : null;
    if (!article) return empty;

    const relUrl = `${SUPABASE_URL}/rest/v1/disease_articles?category=eq.${encodeURIComponent(article.category)}&is_published=eq.true&id=neq.${article.id}&select=id,slug,title,description,category&limit=3`;
    const relRes = await fetch(relUrl, { headers: HEADERS });
    const relatedRaw = relRes.ok ? await safeJson(relRes) : null;
    const related = Array.isArray(relatedRaw) ? relatedRaw : [];

    return { article, related };
  } catch (e) {
    console.warn("[diseaseLoader] fallback to client-side fetch:", e);
    return empty;
  }
}

// getStaticPaths: вызывается только при сборке. Возвращает список путей для пре-рендеринга
// всех опубликованных статей. Запускается в Node при `vite-react-ssg build`.
export async function diseaseStaticPaths(): Promise<string[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/disease_articles?is_published=eq.true&select=slug`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.warn("[SSG] Failed to fetch disease slugs:", res.status);
      return [];
    }
    const rows = (await safeJson(res)) as { slug: string }[] | null;
    if (!Array.isArray(rows)) return [];
    return rows.filter((r) => r.slug).map((r) => `/for-parents/${r.slug}/`);
  } catch (e) {
    console.warn("[SSG] diseaseStaticPaths error:", e);
    return [];
  }
}
