import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";
const SOURCES = [
  { key: "apteka.ru", site: "apteka.ru" },
  { key: "eapteka.ru", site: "eapteka.ru" },
  { key: "megapteka.ru", site: "megapteka.ru" },
];

function extractPrice(text: string): number | null {
  if (!text) return null;
  // matches "1 234,50 ₽" / "1234 руб" / "от 450 руб"
  const re = /(\d[\d\s\u00a0]{0,7}(?:[.,]\d{1,2})?)\s*(?:₽|руб\.?|RUB)/gi;
  const prices: number[] = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].replace(/[\s\u00a0]/g, "").replace(",", ".");
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 30 && n <= 100000) prices.push(n);
  }
  if (!prices.length) return null;
  prices.sort((a, b) => a - b);
  return prices[0]; // lowest plausible price (avoids "doctor consult 5000 руб" noise — pick smallest)
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function firecrawlSearch(apiKey: string, query: string, site: string) {
  const res = await fetch(`${FIRECRAWL}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `${query} цена site:${site}`,
      limit: 2,
      lang: "ru", country: "ru",
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`firecrawl ${site} ${res.status}: ${t.slice(0, 200)}`);
    return null;
  }
  return await res.json();
}

async function parseOne(supabase: any, apiKey: string, row: any) {
  const query = (row.parse_query || row.name || "").trim();
  if (!query) {
    return { ok: false, error: "empty query" };
  }
  const sources: Array<{ source: string; url: string; price: number; fetched_at: string }> = [];

  for (const src of SOURCES) {
    try {
      const data = await firecrawlSearch(apiKey, query, src.site);
      const results = data?.data?.web ?? data?.data ?? [];
      for (const r of results) {
        const md = r?.markdown || r?.description || r?.title || "";
        const price = extractPrice(md);
        if (price) {
          sources.push({
            source: src.key,
            url: r?.url || "",
            price,
            fetched_at: new Date().toISOString(),
          });
          break;
        }
      }
    } catch (e) {
      console.error(`source ${src.site} failed for ${row.name}`, e);
    }
  }

  if (!sources.length) {
    await supabase.from("price_parse_log").insert({
      entity_type: "drug", entity_id: row.id, entity_name: row.name,
      status: "fail", sources_count: 0, error: "no prices found",
    });
    return { ok: false, error: "no prices found", sources: [] };
  }

  const med = median(sources.map(s => s.price));
  await supabase.from("treatment_catalog").update({
    price_auto: med,
    price_auto_updated_at: new Date().toISOString(),
    price_auto_sources: sources,
  }).eq("id", row.id);

  await supabase.from("price_parse_log").insert({
    entity_type: "drug", entity_id: row.id, entity_name: row.name,
    status: sources.length >= 2 ? "ok" : "partial",
    sources_count: sources.length, price_result: med,
  });

  return { ok: true, price: med, sources };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const cronKey = Deno.env.get("CRON_INVOKE_KEY");
    const isCron = !!cronKey && req.headers.get("x-cron-key") === cronKey;

    if (!isCron) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supaUser.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await supaUser.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));

    let rows: any[] = [];
    if (body?.catalog_id) {
      const { data, error } = await supabase
        .from("treatment_catalog")
        .select("id, name, parse_query")
        .eq("id", body.catalog_id).single();
      if (error) throw error;
      rows = [data];
    } else if (body?.batch) {
      const limit = Math.min(Number(body.limit) || 20, 50);
      const { data, error } = await supabase
        .from("treatment_catalog")
        .select("id, name, parse_query, price_auto_updated_at")
        .order("price_auto_updated_at", { ascending: true, nullsFirst: true })
        .limit(limit);
      if (error) throw error;
      rows = data || [];
    } else {
      return new Response(JSON.stringify({ error: "catalog_id or batch required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const row of rows) {
      const r = await parseOne(supabase, FIRECRAWL_API_KEY, row);
      results.push({ id: row.id, name: row.name, ...r });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-drug-prices error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
