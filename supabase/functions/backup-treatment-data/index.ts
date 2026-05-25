import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const TABLES = [
  "treatment_catalog",
  "protocol_templates",
  "protocol_template_items",
  "treatment_plans",
  "treatment_plan_items",
  "treatment_plan_versions",
  "treatment_plan_lab_control",
  "lab_tests_catalog",
] as const;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_KEY = Deno.env.get("CRON_INVOKE_KEY") || "";
const RETENTION_DAYS = 30;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

async function isAdminFromAuth(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const cli = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await cli.auth.getUser();
  if (!user) return false;
  const { data } = await admin().from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return !!data;
}

async function dumpAll(supabase: any) {
  const result: Record<string, any[]> = {};
  for (const t of TABLES) {
    const rows: any[] = [];
    let from = 0;
    const pageSize = 1000;
    // paginate to bypass 1000-row default
    while (true) {
      const { data, error } = await supabase.from(t).select("*").range(from, from + pageSize - 1);
      if (error) throw new Error(`${t}: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }
    result[t] = rows;
  }
  return result;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function snapshotToStorage(supabase: any) {
  const dump = await dumpAll(supabase);
  const payload = {
    generated_at: new Date().toISOString(),
    version: 1,
    tables: dump,
  };
  const filename = `tarusin-treatment-backup-${todayStr()}.json`;
  const body = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const { error } = await supabase.storage.from("backups").upload(filename, body, {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw new Error(`upload: ${error.message}`);

  // cleanup old
  const { data: list } = await supabase.storage.from("backups").list("", { limit: 1000 });
  const cutoff = Date.now() - RETENTION_DAYS * 86400 * 1000;
  const toDelete = (list || [])
    .filter((f: any) => f?.created_at && new Date(f.created_at).getTime() < cutoff)
    .map((f: any) => f.name);
  if (toDelete.length) {
    await supabase.storage.from("backups").remove(toDelete);
  }
  const counts: Record<string, number> = {};
  for (const t of TABLES) counts[t] = dump[t].length;
  return { filename, counts, deleted_old: toDelete.length };
}

async function restore(supabase: any, payload: any, strategy: "replace" | "merge" | "new") {
  const tables = payload?.tables || {};
  const stats: Record<string, { inserted: number; skipped?: number; truncated?: boolean }> = {};

  if (strategy === "replace") {
    // delete in reverse dep order
    const reverse = [...TABLES].reverse();
    for (const t of reverse) {
      const { error } = await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw new Error(`truncate ${t}: ${error.message}`);
    }
  }

  for (const t of TABLES) {
    const rows: any[] = tables[t] || [];
    if (!rows.length) { stats[t] = { inserted: 0, truncated: strategy === "replace" }; continue; }

    if (strategy === "new") {
      const ids = rows.map(r => r.id).filter(Boolean);
      const { data: existing } = await supabase.from(t).select("id").in("id", ids);
      const existingSet = new Set((existing || []).map((r: any) => r.id));
      const fresh = rows.filter(r => !existingSet.has(r.id));
      const chunks = chunk(fresh, 500);
      let inserted = 0;
      for (const c of chunks) {
        const { error } = await supabase.from(t).insert(c);
        if (error) throw new Error(`insert ${t}: ${error.message}`);
        inserted += c.length;
      }
      stats[t] = { inserted, skipped: rows.length - inserted };
    } else {
      // merge / replace -> upsert by id
      const chunks = chunk(rows, 500);
      let inserted = 0;
      for (const c of chunks) {
        const { error } = await supabase.from(t).upsert(c, { onConflict: "id" });
        if (error) throw new Error(`upsert ${t}: ${error.message}`);
        inserted += c.length;
      }
      stats[t] = { inserted, truncated: strategy === "replace" };
    }
  }
  return stats;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const isCron = !!CRON_KEY && req.headers.get("x-cron-key") === CRON_KEY;
    const isAdmin = isCron || await isAdminFromAuth(req);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = admin();
    const action = url.searchParams.get("action") || (req.method === "GET" ? "download" : "snapshot");

    if (action === "download") {
      const dump = await dumpAll(supabase);
      const payload = { generated_at: new Date().toISOString(), version: 1, tables: dump };
      const filename = `tarusin-treatment-backup-${todayStr()}.json`;
      return new Response(JSON.stringify(payload, null, 2), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (action === "snapshot") {
      const res = await snapshotToStorage(supabase);
      return new Response(JSON.stringify({ ok: true, ...res }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "restore") {
      const body = await req.json();
      const strategy = body.strategy as "replace" | "merge" | "new";
      if (!["replace", "merge", "new"].includes(strategy)) {
        return new Response(JSON.stringify({ error: "invalid strategy" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const stats = await restore(supabase, body.payload, strategy);
      return new Response(JSON.stringify({ ok: true, strategy, stats }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backup error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
