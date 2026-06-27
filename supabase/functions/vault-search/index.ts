// Semantic search across the caller's vault using Voyage embeddings.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VOYAGE_KEY = Deno.env.get("VOYAGE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    const sbUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user } } = await sbUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    if (!VOYAGE_KEY) return new Response(JSON.stringify({ error: "VOYAGE_API_KEY not configured" }), { status: 500, headers: corsHeaders });

    const { query, limit = 10 } = await req.json();
    if (!query) return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers: corsHeaders });

    const r = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${VOYAGE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "voyage-3", input: [query], input_type: "query" }),
    });
    if (!r.ok) return new Response(JSON.stringify({ error: `voyage ${r.status}` }), { status: 500, headers: corsHeaders });
    const vec = (await r.json())?.data?.[0]?.embedding;
    if (!vec) return new Response(JSON.stringify({ error: "no embedding" }), { status: 500, headers: corsHeaders });

    const sb = createClient(SUPABASE_URL, SVC);
    const { data, error } = await sb.rpc("search_vault_by_embedding", {
      _owner_id: user.id, _query: `[${vec.join(",")}]`, _limit: Math.min(limit, 20),
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

    return new Response(JSON.stringify({ results: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});
