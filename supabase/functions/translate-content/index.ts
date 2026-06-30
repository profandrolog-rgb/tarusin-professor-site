// Translate Russian content into English using Lovable AI Gateway (Gemini 3 Flash).
// Accepts either { entity_type, entity_id } (loads from DB and upserts result),
// or { text, title, description } for one-shot translation without persistence.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod";

const SUPPORTED_ENTITIES = ["blog_post", "disease_article", "research_article"] as const;

const BodySchema = z.union([
  z.object({
    entity_type: z.enum(SUPPORTED_ENTITIES),
    entity_id: z.string().uuid(),
    publish: z.boolean().optional(),
  }),
  z.object({
    text: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }),
]);

const SYSTEM_PROMPT = `You are a professional medical translator. Translate Russian medical / educational
content for parents and clinicians into clear, natural, scientifically accurate
American English. Keep medical terminology precise (use ICD-10 style names where
applicable). Preserve markdown / HTML structure, links, image tags, gallery
placeholders like [[GALLERY]], and code blocks EXACTLY. Do not add commentary.
Return JSON only — no prose around it.`;

interface TranslationResult {
  title: string;
  slug: string;
  description: string;
  card_annotation: string;
  content: string;
  keywords: string[];
  seo_title: string;
  seo_description: string;
}

function slugifyEn(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function translateViaGateway(payload: {
  title: string;
  description: string;
  content: string;
  keywords: string[];
}): Promise<TranslationResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const userPrompt = `Translate the following Russian article to English and produce SEO metadata.

RUSSIAN_TITLE: ${payload.title}
RUSSIAN_DESCRIPTION: ${payload.description || "(empty)"}
RUSSIAN_KEYWORDS: ${(payload.keywords || []).join(", ") || "(none)"}

RUSSIAN_CONTENT (markdown/HTML — preserve all formatting/placeholders):
<<<CONTENT_START
${payload.content}
CONTENT_END>>>

Return strictly this JSON shape:
{
  "title": "English title (≤ 70 chars)",
  "slug": "english-url-slug",
  "description": "≤ 200 chars English summary",
  "card_annotation": "1-2 sentences (≤ 180 chars) for the card preview",
  "content": "FULL translated content, same formatting/markdown/HTML preserved",
  "keywords": ["8-15 English SEO keywords / phrases"],
  "seo_title": "≤ 60 chars, includes primary keyword, for <title>",
  "seo_description": "≤ 155 chars, for <meta description>, includes call-to-value"
}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("AI rate limit, retry shortly");
    if (res.status === 402) throw new Error("AI credits exhausted");
    throw new Error(`Gateway error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const j = await res.json();
  const raw = j?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");

  let parsed: any;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    // Extract JSON object best-effort.
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI response not JSON");
    parsed = JSON.parse(m[0]);
  }

  const title = String(parsed.title || payload.title).trim();
  return {
    title,
    slug: (parsed.slug && slugifyEn(String(parsed.slug))) || slugifyEn(title),
    description: String(parsed.description || "").trim(),
    card_annotation: String(parsed.card_annotation || "").trim(),
    content: String(parsed.content || "").trim(),
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.map((k: any) => String(k).trim()).filter(Boolean).slice(0, 20)
      : [],
    seo_title: String(parsed.seo_title || title).slice(0, 70),
    seo_description: String(parsed.seo_description || parsed.description || "").slice(0, 200),
  };
}

async function loadSource(
  client: any,
  entity_type: string,
  entity_id: string,
): Promise<{ title: string; description: string; content: string; keywords: string[]; hash: string }> {
  let table: string;
  let titleCol = "title";
  let descCol = "description";
  let contentCol = "content";
  let keywordsCol: string | null = "keywords";
  if (entity_type === "blog_post") {
    table = "blog_posts";
    contentCol = "content";
  } else if (entity_type === "disease_article") {
    table = "disease_articles";
    contentCol = "article_content";
  } else if (entity_type === "research_article") {
    table = "research_articles";
    contentCol = "content";
    keywordsCol = null;
  } else {
    throw new Error(`Unsupported entity_type: ${entity_type}`);
  }

  const select = `id, ${titleCol}, ${descCol}, ${contentCol}${keywordsCol ? `, ${keywordsCol}` : ""}`;
  const { data, error } = await client.from(table).select(select).eq("id", entity_id).maybeSingle();
  if (error) throw new Error(`DB read failed: ${error.message}`);
  if (!data) throw new Error("Source row not found");

  const content = String((data as any)[contentCol] || "");
  const title = String((data as any)[titleCol] || "");
  const description = String((data as any)[descCol] || "");
  const keywords = keywordsCol ? ((data as any)[keywordsCol] as string[] | null) ?? [] : [];

  // Simple change-detection hash.
  const hashSrc = title + "|" + description + "|" + content;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashSrc));
  const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);

  return { title, description, content, keywords, hash };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // One-shot mode (no persistence) — orchestrator uses this on draft text.
    if ("text" in parsed.data) {
      const result = await translateViaGateway({
        title: parsed.data.title || "",
        description: parsed.data.description || "",
        content: parsed.data.text,
        keywords: parsed.data.keywords || [],
      });
      return new Response(JSON.stringify({ ok: true, translation: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persisted mode — load source row, translate, upsert.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { entity_type, entity_id, publish } = parsed.data;
    const src = await loadSource(admin, entity_type, entity_id);
    const result = await translateViaGateway(src);

    const { data: upserted, error: upErr } = await admin
      .from("content_translations")
      .upsert(
        {
          entity_type,
          entity_id,
          locale: "en",
          title: result.title,
          slug: result.slug,
          description: result.description,
          card_annotation: result.card_annotation,
          content: result.content,
          keywords: result.keywords,
          seo_title: result.seo_title,
          seo_description: result.seo_description,
          status: publish ? "published" : "draft",
          source_hash: src.hash,
          auto_generated: true,
        },
        { onConflict: "entity_type,entity_id,locale" },
      )
      .select()
      .single();
    if (upErr) throw new Error(`DB write failed: ${upErr.message}`);

    return new Response(JSON.stringify({ ok: true, translation: upserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("translate-content error", e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
