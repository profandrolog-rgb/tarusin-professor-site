// Admin-only DB maintenance: VACUUM FULL + REINDEX on specific tables.
// Also exposes a "stats" action returning size/connections/wal/rollback metrics
// for the admin health widget.

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

const ALLOWED_TABLES = new Set([
  "embedding_batches",
  "translation_batches",
  "rubric_embeddings",
  "ai_messages",
  "ai_conversations",
]);

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    console.log("[db-maintenance] no bearer token");
    return false;
  }
  const token = auth.slice("Bearer ".length);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    console.log("[db-maintenance] auth failure", JSON.stringify(userErr), "user:", !!userData?.user);
    return false;
  }
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) console.log("[db-maintenance] role lookup error", error.message);
  if (!data) console.log("[db-maintenance] user", userData.user.id, "is not admin");
  return !!data;
}


async function runStats(client: Client) {
  const dbSize = await client.queryObject<{ size: string; bytes: string }>(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS size,
            pg_database_size(current_database())::text AS bytes`
  );
  const conn = await client.queryObject<{ total: string; active: string; idle: string; max_conn: string }>(
    `SELECT count(*)::text AS total,
            count(*) FILTER (WHERE state='active')::text AS active,
            count(*) FILTER (WHERE state='idle')::text AS idle,
            current_setting('max_connections') AS max_conn
       FROM pg_stat_activity`
  );
  const stat = await client.queryObject<{ xact_rollback: string; deadlocks: string; blks_read: string; blks_hit: string }>(
    `SELECT xact_rollback::text, deadlocks::text, blks_read::text, blks_hit::text
       FROM pg_stat_database WHERE datname = current_database()`
  );
  const tables = await client.queryObject<{ relname: string; size: string; bytes: string }>(
    `SELECT relname,
            pg_size_pretty(pg_total_relation_size(relid)) AS size,
            pg_total_relation_size(relid)::text AS bytes
       FROM pg_stat_user_tables
       ORDER BY pg_total_relation_size(relid) DESC
       LIMIT 10`
  );
  const idleTimeout = await client.queryObject<{ setting: string }>(
    `SELECT current_setting('idle_in_transaction_session_timeout') AS setting`
  );
  return {
    db: dbSize.rows[0],
    connections: conn.rows[0],
    activity: stat.rows[0],
    top_tables: tables.rows,
    idle_in_transaction_timeout_ms: idleTimeout.rows[0]?.setting,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await isAdmin(req))) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "stats";

    const client = new Client(DB_URL);
    await client.connect();

    try {
      if (action === "stats") {
        const out = await runStats(client);
        return new Response(JSON.stringify(out), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "vacuum") {
        const tables: string[] = Array.isArray(body.tables) ? body.tables : [];
        const safe = tables.filter((t) => ALLOWED_TABLES.has(t));
        if (safe.length === 0) {
          return new Response(JSON.stringify({ error: "No allowed tables" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const results: Record<string, { before: string; after: string; ms: number }> = {};
        for (const t of safe) {
          const before = await client.queryObject<{ s: string }>(
            `SELECT pg_size_pretty(pg_total_relation_size('public.${t}')) AS s`
          );
          const t0 = Date.now();
          await client.queryArray(`VACUUM (FULL, ANALYZE) public.${t}`);
          await client.queryArray(`REINDEX TABLE public.${t}`);
          const ms = Date.now() - t0;
          const after = await client.queryObject<{ s: string }>(
            `SELECT pg_size_pretty(pg_total_relation_size('public.${t}')) AS s`
          );
          results[t] = { before: before.rows[0].s, after: after.rows[0].s, ms };
        }
        return new Response(JSON.stringify({ ok: true, results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } finally {
      await client.end();
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
