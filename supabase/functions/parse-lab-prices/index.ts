import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";

function extractPrice(text: string): number | null {
  if (!text) return null;
  const re = /(\d[\d\s\u00a0]{0,7}(?:[.,]\d{1,2})?)\s*(?:₽|руб\.?|RUB)/gi;
  const prices: number[] = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].replace(/[\s\u00a0]/g, "").replace(",", ".");
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 50 && n <= 50000) prices.push(n);
  }
  if (!prices.length) return null;
  prices.sort((a, b) => a - b);
  return prices[0];
}

async function fcScrape(apiKey: string, url: string) {
  const res = await fetch(`${FIRECRAWL}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  if (!res.ok) return null;
  return await res.json();
}

async function fcSearch(apiKey: string, query: string) {
  const res = await fetch(`${FIRECRAWL}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `${query} цена site:kdlmed.ru`,
      limit: 2, lang: "ru", country: "ru",
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!res.ok) return null;
  return await res.json();
}

async function parseOne(supabase: any, apiKey: string, row: any) {
  const sources: Array<{ source: string; url: string; price: number; fetched_at: string }> = [];

  if (row.kdl_slug) {
    const url = row.kdl_slug.startsWith("http")
      ? row.kdl_slug
      : `https://kdlmed.ru/patsientam/vse-issledovaniya/${row.kdl_slug.replace(/^\/+/, "")}`;
    const data = await fcScrape(apiKey, url);
    const md = data?.data?.markdown || data?.markdown || "";
    const p = extractPrice(md);
    if (p) sources.push({ source: "kdlmed.ru", url, price: p, fetched_at: new Date().toISOString() });
  }

  if (!sources.length) {
    const query = row.short_name || row.name;
    const data = await fcSearch(apiKey, query);
    const results = data?.data?.web ?? data?.data ?? [];
    for (const r of results) {
      const md = r?.markdown || r?.description || r?.title || "";
      const p = extractPrice(md);
      if (p) {
        sources.push({ source: "kdlmed.ru", url: r?.url || "", price: p, fetched_at: new Date().toISOString() });
        break;
      }
    }
  }

  if (!sources.length) {
    await supabase.from("price_parse_log").insert({
      entity_type: "lab", entity_id: row.id, entity_name: row.name,
      status: "fail", sources_count: 0, error: "no prices found",
    });
    return { ok: false, error: "no prices found" };
  }

  const price = sources[0].price;
  await supabase.from("lab_tests_catalog").update({
    price_auto: price,
    price_auto_updated_at: new Date().toISOString(),
    price_auto_sources: sources,
  }).eq("id", row.id);

  await supabase.from("price_parse_log").insert({
    entity_type: "lab", entity_id: row.id, entity_name: row.name,
    status: "ok", sources_count: sources.length, price_result: price,
  });

  return { ok: true, price, sources };
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
    const isCron = req.headers.get("x-cron-token") === SUPABASE_SERVICE_ROLE_KEY;

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
    if (body?.lab_id) {
      const { data, error } = await supabase
        .from("lab_tests_catalog")
        .select("id, name, short_name, kdl_slug")
        .eq("id", body.lab_id).single();
      if (error) throw error;
      rows = [data];
    } else if (body?.batch) {
      const limit = Math.min(Number(body.limit) || 20, 50);
      const { data, error } = await supabase
        .from("lab_tests_catalog")
        .select("id, name, short_name, kdl_slug, price_auto_updated_at")
        .eq("is_active", true)
        .order("price_auto_updated_at", { ascending: true, nullsFirst: true })
        .limit(limit);
      if (error) throw error;
      rows = data || [];
    } else {
      return new Response(JSON.stringify({ error: "lab_id or batch required" }), {
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
    console.error("parse-lab-prices error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
