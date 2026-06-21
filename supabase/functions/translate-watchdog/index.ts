// Watchdog: detects stuck translation batches and resumes them. Also kicks
// the queue runner if no batch is currently active. Designed for hourly cron.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STUCK_AFTER_MINUTES = 10;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function callBatch(batchId: string, subbatchIndex: number) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-rubrics-batch`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "x-internal-chain": "1",
    },
    body: JSON.stringify({ batchId, subbatchIndex }),
  }).catch(() => undefined);
}

async function callRunner() {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-queue-runner`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({}),
  }).catch(() => undefined);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = admin();
  const cutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60_000).toISOString();
  const actions: any[] = [];

  try {
    // 1) Resume stuck batches (processing/queued and not updated for a while).
    const { data: stuck } = await sb
      .from("translation_batches")
      .select("id, status, processed_rubrics, subbatch_size, total_rubrics, updated_at")
      .in("status", ["processing", "queued"])
      .lt("updated_at", cutoff);

    for (const b of stuck || []) {
      const size = b.subbatch_size || 150;
      const done = b.processed_rubrics || 0;
      const nextIdx = Math.floor(done / size);
      await callBatch(b.id, nextIdx);
      actions.push({ resumed: b.id, subbatchIndex: nextIdx, processed: done, total: b.total_rubrics });
    }

    // 2) If no active batch at all, ask the runner to pick the next chapter.
    const { data: active } = await sb
      .from("translation_batches")
      .select("id")
      .in("status", ["processing", "queued"])
      .limit(1);
    if (!active || active.length === 0) {
      await callRunner();
      actions.push({ runner: "kicked" });
    }

    return new Response(JSON.stringify({ ok: true, actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, actions }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
