// Прокси для https://openrouter.ai/api/v1/models — каталог моделей недоступен
// напрямую из браузера в РФ. Кешируется на 30 минут.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

let cache: { ts: number; data: unknown } | null = null;
const TTL_MS = 30 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const r = await fetch("https://openrouter.ai/api/v1/models");
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error(`OpenRouter models failed [${r.status}]: ${text.slice(0, 500)}`);
      return new Response(
        JSON.stringify({ error: "OpenRouter models fetch failed", status: r.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const data = await r.json();
    cache = { ts: Date.now(), data };
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
