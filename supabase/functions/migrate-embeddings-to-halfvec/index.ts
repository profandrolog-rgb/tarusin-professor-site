// One-shot admin migration: convert rubric_embeddings.embedding from vector(1024)
// to halfvec(1024). Halves storage (~600 MB saved) with negligible search quality loss.
// Runs over a direct Postgres connection to bypass the 30s migrations-API timeout.
//
// Rollback: re-run with { rollback: true } — converts halfvec back to vector.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const cli = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await cli.auth.getUser();
  if (!user) return false;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data } = await admin.from("user_roles")
    .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return !!data;
}

function migrationSql(rollback: boolean): string {
  const targetType = rollback ? "vector(1024)" : "halfvec(1024)";
  const opclass = rollback ? "vector_cosine_ops" : "halfvec_cosine_ops";
  const castType = rollback ? "vector(1024)" : "halfvec(1024)";
  const rpcCast = rollback ? "vector(1024)" : "halfvec(1024)";
  const rpcDeclare = rollback
    ? "_q vector(1024) := _query;"
    : "_q halfvec(1024) := _query::halfvec(1024);";

  return `
-- 1. Drop old ivfflat index (~755 MB freed).
DROP INDEX IF EXISTS public.rubric_embeddings_ivfflat;

-- 2. Convert column type (table rewrite).
ALTER TABLE public.rubric_embeddings
  ALTER COLUMN embedding TYPE ${targetType}
  USING embedding::${castType};

-- 3. Rebuild ivfflat index for the new opclass.
CREATE INDEX rubric_embeddings_ivfflat
  ON public.rubric_embeddings
  USING ivfflat (embedding ${opclass})
  WITH (lists = 100);

-- 4. Keep RPC signature (vector in) stable; cast internally.
CREATE OR REPLACE FUNCTION public.search_rubrics_by_embedding(_query vector, _limit integer DEFAULT 8)
 RETURNS TABLE(rubric_id uuid, name text, name_ru text, chapter_id uuid, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '25s'
AS $fn$
DECLARE
  ${rpcDeclare}
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.name_ru, r.chapter_id,
         (1 - (e.embedding <=> _q))::float AS similarity
  FROM public.rubric_embeddings e
  JOIN public.repertory_rubrics r ON r.id = e.rubric_id
  ORDER BY e.embedding <=> _q
  LIMIT _limit;
END;
$fn$;
`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!await isAdmin(req)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rollback: boolean = !!body?.rollback;

    const client = new Client(DB_URL);
    await client.connect();
    const t0 = Date.now();
    try {
      const sizeBefore = await client.queryObject<{ total: string }>(
        "SELECT pg_size_pretty(pg_total_relation_size('public.rubric_embeddings')) AS total"
      );

      await client.queryArray("BEGIN");
      await client.queryArray("SET LOCAL statement_timeout = 0");
      await client.queryArray("SET LOCAL lock_timeout = 0");
      await client.queryArray("SET LOCAL idle_in_transaction_session_timeout = 0");
      await client.queryArray(migrationSql(rollback));
      await client.queryArray("COMMIT");

      // VACUUM cannot run inside a transaction.
      await client.queryArray("VACUUM ANALYZE public.rubric_embeddings");

      const sizeAfter = await client.queryObject<{ total: string }>(
        "SELECT pg_size_pretty(pg_total_relation_size('public.rubric_embeddings')) AS total"
      );
      const rows = await client.queryObject<{ c: bigint }>(
        "SELECT count(*)::bigint AS c FROM public.rubric_embeddings"
      );
      const elapsed = Math.round((Date.now() - t0) / 1000);

      return new Response(JSON.stringify({
        ok: true,
        direction: rollback ? "halfvec→vector (rollback)" : "vector→halfvec",
        rows: Number(rows.rows[0].c),
        size_before: sizeBefore.rows[0].total,
        size_after: sizeAfter.rows[0].total,
        elapsed_seconds: elapsed,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      try { await client.queryArray("ROLLBACK"); } catch (_) { /* ignore */ }
      throw e;
    } finally {
      await client.end();
    }
  } catch (e) {
    console.error("migrate-embeddings-to-halfvec error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
