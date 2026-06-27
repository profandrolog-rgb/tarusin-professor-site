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
  kind: "disease" | "blog" | "video" | "clinical" | "research";
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

    // Pull candidates in parallel. Keep payloads small.
    const [diseases, blogs, videos, clinical, research] = await Promise.all([
      sb.from("disease_articles").select("id, slug, title, description, category").eq("is_published", true).limit(120),
      sb.from("blog_posts").select("id, title, excerpt, content").eq("is_published", true).limit(80),
      sb.from("video_cases").select("id, title, description, category").eq("is_published", true).limit(80),
      sb.from("clinical_cases").select("id, title, category").eq("is_published", true).limit(80),
      sb.from("research_articles").select("id, title, excerpt, category").eq("is_published", true).limit(60),
    ]);

    const candidates: Candidate[] = [];
    (diseases.data ?? []).forEach((r: any) =>
      candidates.push({
        kind: "disease",
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: trunc(r.description),
        category: r.category,
        url: `/for-parents/${r.slug}`,
      }),
    );
    (blogs.data ?? []).forEach((r: any) =>
      candidates.push({
        kind: "blog",
        id: r.id,
        title: r.title,
        excerpt: trunc(r.excerpt || r.content),
        url: `/blog#post-${r.id}`,
      }),
    );
    (videos.data ?? []).forEach((r: any) =>
      candidates.push({
        kind: "video",
        id: r.id,
        title: r.title,
        excerpt: trunc(r.description),
        category: r.category,
        url: `/video-cases#video-${r.id}`,
      }),
    );
    (clinical.data ?? []).forEach((r: any) =>
      candidates.push({
        kind: "clinical",
        id: r.id,
        title: r.title,
        excerpt: "",
        category: r.category,
        url: `/clinical-cases#case-${r.id}`,
      }),
    );
    (research.data ?? []).forEach((r: any) =>
      candidates.push({
        kind: "research",
        id: r.id,
        title: r.title,
        excerpt: trunc(r.excerpt),
        category: r.category,
        url: `/research#article-${r.id}`,
      }),
    );

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

Ниже — список материалов сайта (с номерами). Выбери 6 наиболее подходящих под вопрос пациента. Учитывай совпадение по смыслу, а не только по словам. Верни СТРОГО JSON-массив вида:
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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ты помощник пациента на сайте детского уролога-андролога. Отвечай только валидным JSON-массивом." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
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
