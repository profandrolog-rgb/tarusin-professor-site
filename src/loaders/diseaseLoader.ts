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

export async function diseaseLoader({ params }: { params: { slug?: string } }): Promise<DiseaseLoaderData> {
  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const articleUrl = `${SUPABASE_URL}/rest/v1/disease_articles?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*&limit=1`;
  const articleRes = await fetch(articleUrl, { headers: HEADERS });
  if (!articleRes.ok) throw new Response("DB error", { status: 500 });
  const articles = (await articleRes.json()) as any[];
  if (!articles[0]) throw new Response("Not Found", { status: 404 });

  const article = articles[0];
  const relUrl = `${SUPABASE_URL}/rest/v1/disease_articles?category=eq.${encodeURIComponent(article.category)}&is_published=eq.true&id=neq.${article.id}&select=id,slug,title,description,category&limit=3`;
  const relRes = await fetch(relUrl, { headers: HEADERS });
  const related = relRes.ok ? ((await relRes.json()) as any[]) : [];

  return { article, related };
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
    const rows = (await res.json()) as { slug: string }[];
    return rows.filter((r) => r.slug).map((r) => `/for-parents/${r.slug}`);
  } catch (e) {
    console.warn("[SSG] diseaseStaticPaths error:", e);
    return [];
  }
}
