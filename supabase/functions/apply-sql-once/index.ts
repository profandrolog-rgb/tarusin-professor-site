// One-shot privileged SQL runner (admin-only via shared token).
// Used to bulk-load the treatment catalog. Remove after use.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const TOKEN = Deno.env.get("ADMIN_SQL_TOKEN") ?? "tarusin-catalog-replace-2025";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  const auth = req.headers.get("x-admin-token");
  if (auth !== TOKEN) return new Response("forbidden", { status: 403 });
  const sql = await req.text();
  if (!sql.trim()) return new Response("empty sql", { status: 400 });
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) return new Response("no db url", { status: 500 });
  const client = new Client(dbUrl);
  try {
    await client.connect();
    const r = await client.queryObject(sql);
    return new Response(JSON.stringify({ ok: true, rowCount: r.rowCount ?? null }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  } finally {
    try { await client.end(); } catch {}
  }
});
