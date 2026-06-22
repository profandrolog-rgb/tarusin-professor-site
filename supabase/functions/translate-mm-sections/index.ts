// Translate Materia Medica (Boericke) sections EN -> RU on demand.
// Input: { remedy_ids: string[] }  (admin only)
// For each given remedy, translates any boericke section where body_ru IS NULL.
// Stores translation in materia_medica_sections.body_ru and returns updated rows.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const PRIMARY_MODEL = "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-sonnet-4-5-20250929";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function requireAdmin(authHeader: string | null) {
  if (!authHeader) throw new Error("Unauthorized");
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = admin();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles || []).some((r: any) => r.role === "admin")) throw new Error("Forbidden");
}

async function translate(apiKey: string, heading: string, body: string): Promise<string> {
  const sys = [
    "Ты — переводчик гомеопатической литературы (Materia Medica Бёрике) с английского на русский.",
    "Сохраняй ВСЕ латинские названия препаратов и их сокращения (Sep., Ign., Nat-m., Apis, Calc.) без перевода.",
    "Переводи медицинские термины естественным русским языком, не дословно.",
    "Сохраняй структуру (точки с запятой, скобки). Не добавляй пояснений. Верни ТОЛЬКО перевод тела раздела.",
  ].join("\n");
  const user = `Раздел: "${heading}"\n\nТекст для перевода:\n${body}`;
  const tryOnce = (m: string) => fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: m, max_tokens: 2000, system: sys, messages: [{ role: "user", content: user }] }),
  });
  let resp = await tryOnce(PRIMARY_MODEL);
  if (!resp.ok && resp.status === 404) resp = await tryOnce(FALLBACK_MODEL);
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${t.slice(0, 300)}`);
  }
  const j = await resp.json();
  return (j?.content?.[0]?.text || "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    await requireAdmin(req.headers.get("Authorization"));
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
    const { remedy_ids } = await req.json();
    if (!Array.isArray(remedy_ids) || remedy_ids.length === 0) {
      return new Response(JSON.stringify({ ok: true, translated: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = admin();
    const { data: rows, error } = await supabase
      .from("materia_medica_sections")
      .select("id, heading, body")
      .in("remedy_id", remedy_ids)
      .eq("source", "boericke")
      .is("body_ru", null);
    if (error) throw error;

    let translated = 0;
    // Process in parallel chunks of 5 to be polite
    const chunkSize = 5;
    for (let i = 0; i < (rows || []).length; i += chunkSize) {
      const chunk = (rows || []).slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (r: any) => {
        try {
          const ru = await translate(apiKey, r.heading || "", r.body || "");
          if (ru) {
            await supabase.from("materia_medica_sections").update({ body_ru: ru }).eq("id", r.id);
            translated++;
          }
        } catch (e) {
          console.log("[translate-mm] failed", r.id, (e as Error).message);
        }
      }));
    }

    return new Response(JSON.stringify({ ok: true, translated, total: (rows || []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
