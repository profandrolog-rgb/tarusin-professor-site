// Public smart search across patient-facing content.
// Pulls candidates from disease_articles, blog_posts, video_cases, clinical_cases,
// research_articles and asks Lovable AI to rank the most relevant for a patient query.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

type Candidate = {
  kind: "disease" | "blog" | "video" | "clinical" | "research" | "podcast" | "video_file";
  id: string;
  title: string;
  excerpt: string;
  category?: string | null;
  slug?: string | null;
  url: string;
};

function trunc(s: string | null | undefined, n = 240): string {
  if (!s) return "";
  const t = String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers: corsHeaders });
    }
    const q = query.trim();

    const sb = createClient(SUPABASE_URL, SVC);

    // Build an ILIKE filter from the query: split into 2+ char tokens and OR them.
    const tokens = q
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3)
      .slice(0, 6);

    const orFilter = (cols: string[]) =>
      tokens.length === 0
        ? null
        : cols
            .flatMap((c) => tokens.map((t) => `${c}.ilike.%${t}%`))
            .join(",");

    // Pull candidates in parallel. Two passes: keyword-matching rows + a small fresh top-up.
    const fetchKw = async (
      table: string,
      select: string,
      cols: string[],
      limit = 40,
    ) => {
      const f = orFilter(cols);
      let q1 = sb.from(table).select(select).eq("is_published", true).limit(limit);
      if (f) q1 = q1.or(f);
      const { data } = await q1;
      return data ?? [];
    };

    // Storage videos: filenames only (no metadata table). Filter by token match on the name.
    const fetchStorageVideos = async () => {
      try {
        const { data } = await sb.storage.from("videos").list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
        const files = (data ?? []).filter((f: any) => f.name && f.name !== ".emptyFolderPlaceholder");
        const nameMatches = (n: string) => {
          if (tokens.length === 0) return true;
          const low = n.toLowerCase();
          return tokens.some((t) => low.includes(t));
        };
        return files.filter((f: any) => nameMatches(f.name)).slice(0, 30);
      } catch { return []; }
    };

    const [diseases, blogs, videos, clinical, research, podcasts, videoFiles] = await Promise.all([
      fetchKw("disease_articles", "id, slug, title, description, category", ["title", "description"], 60),
      fetchKw("blog_posts", "id, title, excerpt, content", ["title", "excerpt", "content"], 40),
      fetchKw("video_cases", "id, title, description, category", ["title", "description"], 40),
      fetchKw("clinical_cases", "id, title, category, history, conclusions, recommendations", ["title", "history", "conclusions", "recommendations"], 40),
      fetchKw("research_articles", "id, title, excerpt, content, category", ["title", "excerpt", "content"], 40),
      fetchKw("podcasts", "id, title, description, source, category, external_url", ["title", "description", "source"], 40),
      fetchStorageVideos(),
    ]);

    const candidates: Candidate[] = [];
    (diseases ?? []).forEach((r: any) =>
      candidates.push({
        kind: "disease",
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: trunc(r.description, 300),
        category: r.category,
        url: `/for-parents/${r.slug}`,
      }),
    );
    (blogs ?? []).forEach((r: any) =>
      candidates.push({
        kind: "blog",
        id: r.id,
        title: r.title,
        excerpt: trunc(r.excerpt || r.content, 300),
        url: `/blog#post-${r.id}`,
      }),
    );
    (videos ?? []).forEach((r: any) =>
      candidates.push({
        kind: "video",
        id: r.id,
        title: r.title,
        excerpt: trunc(r.description, 300),
        category: r.category,
        url: `/video-cases#video-${r.id}`,
      }),
    );
    (clinical ?? []).forEach((r: any) => {
      const body = [r.history, r.conclusions, r.recommendations].filter(Boolean).join(" — ");
      candidates.push({
        kind: "clinical",
        id: r.id,
        title: r.title,
        excerpt: trunc(body, 320),
        category: r.category,
        url: `/clinical-cases#case-${r.id}`,
      });
    });
    (research ?? []).forEach((r: any) =>
      candidates.push({
        kind: "research",
        id: r.id,
        title: r.title,
        excerpt: trunc(r.excerpt || r.content, 300),
        category: r.category,
        url: `/research#article-${r.id}`,
      }),
    );
    (podcasts ?? []).forEach((r: any) =>
      candidates.push({
        kind: "podcast",
        id: r.id,
        title: r.title,
        excerpt: trunc([r.source, r.description].filter(Boolean).join(" — "), 300),
        category: r.category,
        url: r.external_url ? r.external_url : `/media#podcast-${r.id}`,
      }),
    );
    (videoFiles ?? []).forEach((f: any) => {
      // Pretty title from filename: drop extension, replace separators.
      const pretty = String(f.name).replace(/\.[a-z0-9]+$/i, "").replace(/[_\-]+/g, " ").trim();
      candidates.push({
        kind: "video_file",
        id: f.name,
        title: pretty || f.name,
        excerpt: "Видео из библиотеки клиники",
        url: `/videos`,
      });
    });

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build compact catalog for the model
    const indexed = candidates.map((c, i) => ({
      i,
      t: `[${c.kind}] ${c.title}${c.category ? ` (${c.category})` : ""}`,
      e: c.excerpt,
    }));

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: corsHeaders });
    }

    const prompt = `Пациент задал вопрос: "${q}"

Ниже — список материалов сайта (с номерами). Выбери до 6 материалов, ДЕЙСТВИТЕЛЬНО релевантных вопросу пациента (по смыслу, не по случайным совпадениям слов). Если по-настоящему релевантных меньше — верни меньше. Если ничего не подходит — верни пустой массив [].

Сортируй по убыванию релевантности. Ответ — СТРОГО JSON-массив:
[{"i": номер, "reason": "одно короткое предложение, почему этот материал поможет"}]

Материалы:
${indexed.map((x) => `${x.i}. ${x.t}\n   ${x.e}`).join("\n")}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Ты помощник пациента на сайте детского уролога-андролога. Отвечай только валидным JSON-массивом. Будь строг к релевантности." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return new Response(JSON.stringify({ error: `ai ${aiResp.status}`, details: txt.slice(0, 400) }), { status: 500, headers: corsHeaders });
    }
    const aiData = await aiResp.json();
    const raw = aiData?.choices?.[0]?.message?.content ?? "[]";
    const m = String(raw).match(/\[[\s\S]*\]/);
    let picks: Array<{ i: number; reason: string }> = [];
    try {
      picks = JSON.parse(m ? m[0] : raw);
    } catch {
      picks = [];
    }

    const results = picks
      .filter((p) => Number.isInteger(p.i) && p.i >= 0 && p.i < candidates.length)
      .slice(0, 6)
      .map((p) => ({ ...candidates[p.i], reason: p.reason }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});
