// Loader для DiseaseDetailPage. Используется и при SSG-сборке (Node), и при SPA-навигации.
// Не используем supabase-js клиент, чтобы не тащить лишний код в build-сборщик и в браузерный prefetch.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const HEADERS = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
  Accept: "application/json",
};

export interface DiseaseLoaderData {
  article: any;
  related: any[];
}

/**
 * Безопасный fetch + JSON-парсинг.
 * - Проверяет HTTP-статус (4xx/5xx → null + лог причины).
 * - Проверяет Content-Type: только `application/json` парсится.
 *   Если прокси/SPA вернул HTML (DOCTYPE), 502 от gateway или text/plain —
 *   возвращаем null с подробным логом, чтобы страница догрузилась клиентом.
 */
async function fetchJson(
  tag: string,
  url: string,
  init?: RequestInit,
): Promise<any | null> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init?.headers || {}) } });
  } catch (e) {
    console.warn(`[diseaseLoader:${tag}] network error:`, (e as Error)?.message || e);
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
      `[diseaseLoader:${tag}] HTTP ${res.status} ${res.statusText} (ct=${ct || "n/a"}) — ${bodyPreview}`,
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
      `[diseaseLoader:${tag}] non-JSON response (ct=${ct || "empty"}) — likely proxy/HTML fallback. Preview: ${bodyPreview}`,
    );
    return null;
  }

  try {
    return await res.json();
  } catch (e) {
    console.warn(`[diseaseLoader:${tag}] JSON parse error:`, (e as Error)?.message || e);
    return null;
  }
}

export async function diseaseLoader({ params }: { params: { slug?: string } }): Promise<DiseaseLoaderData> {
  const slug = params.slug;
  const empty: DiseaseLoaderData = { article: null, related: [] };
  if (!slug) return empty;
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn("[diseaseLoader] missing SUPABASE env vars — skipping prefetch");
    return empty;
  }

  const columns = [
    "id",
    "slug",
    "title",
    "description",
    "category",
    "age_group",
    "article_content",
    "video_path",
    "audio_path",
    "thumbnail_path",
    "keywords",
  ].join(",");
  const articleUrl = `${SUPABASE_URL}/rest/v1/disease_articles?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=${columns}&limit=1`;
  const articles = (await fetchJson("article", articleUrl)) as any[] | null;
  const article = Array.isArray(articles) ? articles[0] : null;
  if (!article) return empty;

  const relUrl = `${SUPABASE_URL}/rest/v1/disease_articles?category=eq.${encodeURIComponent(article.category)}&is_published=eq.true&id=neq.${article.id}&select=id,slug,title,description,category&limit=3`;
  const relatedRaw = await fetchJson("related", relUrl);
  const related = Array.isArray(relatedRaw) ? relatedRaw : [];

  return { article, related };
}

// getStaticPaths: вызывается только при сборке. Возвращает список путей для пре-рендеринга
// всех опубликованных статей. Запускается в Node при `vite-react-ssg build`.
export async function diseaseStaticPaths(): Promise<string[]> {
  const url = `${SUPABASE_URL}/rest/v1/disease_articles?is_published=eq.true&select=slug`;
  const rows = (await fetchJson("static-paths", url)) as { slug: string }[] | null;
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r.slug).map((r) => `/for-parents/${r.slug}/`);
}
