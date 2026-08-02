// Смысловой поиск по видео: расширение запроса, вектор + FTS, RRF, кластеры, правила.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { embedOne } from "../_shared/videoEmbeddings.ts";
import { callWithFallback } from "../_shared/aiCallWithFallback.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PRIMARY = "google/gemini-3-flash-preview";
const FALLBACK = "google/gemini-2.5-flash";

const URGENT_MARKERS = ["резко", "внезапно", "опухло", "посинело", "сильно болит", "рвота", "не могу терпеть"];
const KID_MARKERS = ["сын", "ребёнок", "ребенок", "мальчик", "подросток"];

const RRF_K = 60;

type Src = {
  slug: string;
  title: string;
  poster_url: string | null;
  duration_sec: number | null;
  rubric: string | null;
  start_sec: number;
  snippet: string;
  same_cluster: Array<{ slug: string; title: string; poster_url: string | null }>;
};

function detectedAgeUnder18(q: string): boolean {
  const m = q.match(/(\d{1,2})\s*(?:год|года|лет|г\.)/i);
  if (!m) return false;
  const n = Number(m[1]);
  return n > 0 && n < 18;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const filters = body?.filters ?? {};
    if (query.length < 2) {
      return new Response(JSON.stringify({ error: "query required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SVC);
    const low = query.toLowerCase();

    // 1. Расширение запроса синонимами жалоб
    let expanded = query;
    {
      const tokens = low
        .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 4)
        .slice(0, 6);
      if (tokens.length) {
        const { data: syn } = await sb
          .from("symptom_synonyms")
          .select("canonical_term")
          .or(tokens.map((t) => `patient_phrase.ilike.%${t}%`).join(","))
          .limit(12);
        const extra = (syn ?? []).map((s: any) => s.canonical_term).filter(Boolean);
        if (extra.length) expanded += " " + [...new Set(extra)].join(" ");
      }
    }


    // 2. Векторный поиск
    let vector: Array<{ video_id: string; chunk_id: string; start_sec: number; content: string }> = [];
    try {
      const emb = await embedOne(expanded);
      const { data } = await sb.rpc("match_video_chunks", {
        query_embedding: emb as unknown as string,
        match_count: 20,
      });
      vector = (data ?? []) as any[];
    } catch (e) {
      console.warn("video-search vector stage failed", e);
    }

    // 3. Полнотекстовый поиск
    let fts: Array<{ video_id: string; rank: number }> = [];
    try {
      const { data } = await sb.rpc("search_videos_fts", { q: expanded, match_count: 20 });
      fts = (data ?? []) as any[];
    } catch (e) {
      console.warn("video-search fts stage failed", e);
    }

    // 4. RRF
    const scores = new Map<string, number>();
    const bestChunk = new Map<string, { start_sec: number; content: string }>();
    vector.forEach((r, i) => {
      scores.set(r.video_id, (scores.get(r.video_id) ?? 0) + 1 / (RRF_K + i + 1));
      if (!bestChunk.has(r.video_id)) {
        bestChunk.set(r.video_id, { start_sec: r.start_sec ?? 0, content: r.content ?? "" });
      }
    });
    fts.forEach((r, i) => {
      scores.set(r.video_id, (scores.get(r.video_id) ?? 0) + 1 / (RRF_K + i + 1));
    });

    const ids = [...scores.keys()];
    if (!ids.length) {
      return new Response(
        JSON.stringify({ answer: "", urgent: false, sources: [], related_questions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let q = sb
      .from("videos")
      .select("id, slug, title, poster_url, duration_sec, rubric, cluster_slug, summary_plain, summary_short, audience, age_groups, format, tags, faq_questions")
      .in("id", ids)
      .eq("is_published", true)
      .eq("access_level", "public");
    if (filters?.rubric) q = q.eq("rubric", filters.rubric);
    if (filters?.format) q = q.eq("format", filters.format);
    if (filters?.audience) q = q.contains("audience", [filters.audience]);
    if (filters?.age) q = q.contains("age_groups", [filters.age]);
    if (filters?.tag) q = q.contains("tags", [filters.tag]);

    const { data: videos, error } = await q;
    if (error) throw new Error(error.message);

    const rows = (videos ?? []).map((v: any) => ({ ...v, _score: scores.get(v.id) ?? 0 }));

    // 6. Жёсткие правила
    const urgent = URGENT_MARKERS.some((m) => low.includes(m));
    const kidContext = KID_MARKERS.some((m) => low.includes(m)) || detectedAgeUnder18(low);

    rows.sort((a, b) => {
      if (urgent) {
        const au = a.rubric === "ostraya-bol" ? 1 : 0;
        const bu = b.rubric === "ostraya-bol" ? 1 : 0;
        if (au !== bu) return bu - au;
      }
      if (kidContext) {
        const kid = (v: any) => ((v.audience || []).some((x: string) => x === "roditelyam" || x === "podrostki") ? 1 : 0);
        const ak = kid(a), bk = kid(b);
        if (ak !== bk) return bk - ak;
      }
      return b._score - a._score;
    });

    // 5. Кластеры: лучший в выдачу, остальные — в same_cluster
    const seenCluster = new Map<string, Src>();
    const sources: Src[] = [];
    for (const v of rows) {
      const chunk = bestChunk.get(v.id);
      const snippet = (chunk?.content || v.summary_short || v.summary_plain || "").slice(0, 300);
      const src: Src = {
        slug: v.slug,
        title: v.title,
        poster_url: v.poster_url,
        duration_sec: v.duration_sec,
        rubric: v.rubric,
        start_sec: chunk?.start_sec ?? 0,
        snippet,
        same_cluster: [],
      };
      if (v.cluster_slug) {
        const leader = seenCluster.get(v.cluster_slug);
        if (leader) {
          leader.same_cluster.push({ slug: v.slug, title: v.title, poster_url: v.poster_url });
          continue;
        }
        seenCluster.set(v.cluster_slug, src);
      }
      sources.push(src);
    }

    // 7. Генерация ответа
    let answer = "";
    const related: string[] = [];
    try {
      const top = sources.slice(0, 3);
      const context = top
        .map((s, i) => `[${i + 1}] «${s.title}» (/video/${s.slug}): ${s.snippet}`)
        .join("\n");
      const { json } = await callWithFallback({
        url: "https://ai.gateway.lovable.dev/v1/chat/completions",
        headers: { "Lovable-API-Key": LOVABLE_API_KEY },
        primary: PRIMARY,
        fallback: FALLBACK,
        timeoutMs: 45000,
        label: "video-search-answer",
        buildBody: (model) => ({
          model,
          messages: [
            {
              role: "system",
              content:
                "Ты помощник на сайте детского уролога-андролога. Отвечай на русском, 4–6 предложений, простым языком для родителя. " +
                "НИКОГДА не назначай лечение, не указывай препараты и дозировки. Ссылайся на видео сносками вида [1], [2]. " +
                "В конце верни JSON: {\"answer\":\"...\",\"related_questions\":[\"...\"]} без markdown.",
            },
            { role: "user", content: `Вопрос: ${query}\n\nВидео:\n${context}` },
          ],
          temperature: 0.3,
        }),
      });
      const raw = String(json?.choices?.[0]?.message?.content ?? "");
      try {
        const parsed = JSON.parse(raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
        answer = parsed.answer ?? raw;
        if (Array.isArray(parsed.related_questions)) related.push(...parsed.related_questions);
      } catch {
        answer = raw;
      }
    } catch (e) {
      console.warn("video-search answer stage failed", e);
    }

    if (!related.length) {
      const pool = rows.flatMap((v: any) => v.faq_questions || []);
      related.push(...pool.slice(0, 5));
    }

    return new Response(
      JSON.stringify({ answer, urgent, sources: sources.slice(0, 5), related_questions: related.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("video-search", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ошибка" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
