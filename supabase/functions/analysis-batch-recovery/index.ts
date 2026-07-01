// Cron recovery for analysis_batches.
// Finds batches stuck in "processing" with no progress for > 4 minutes
// and re-triggers analyze-documents-batch from the next unprocessed
// subbatch (or final synthesis if everything is already done).
//
// Cron calls this with the anon key. The function itself uses the
// service-role key from env to call analyze-documents-batch as an
// internal chain step — clients can't impersonate that.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_MINUTES = 4;
const TARGET_FN = "analyze-documents-batch";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const cronKey = Deno.env.get("CRON_INVOKE_KEY");
  const serviceKey0 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const providedCron = req.headers.get("x-cron-key");
  const auth = req.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const ok = (cronKey && providedCron === cronKey) || (serviceKey0 && bearer === serviceKey0);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const baseUrl = Deno.env.get("SUPABASE_URL")!;

    const { data: stuck, error } = await supabase
      .from("analysis_batches")
      .select("id, file_paths, partial_results, subbatch_size, updated_at")
      .eq("status", "processing")
      .lt("updated_at", new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString());
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const restarted: { id: string; nextIndex: number; phase: string }[] = [];
    for (const b of stuck || []) {
      const files: string[] = Array.isArray(b.file_paths) ? b.file_paths : [];
      const subSize = Math.max(1, Math.min(15, b.subbatch_size || 7));
      const totalSub = Math.ceil(files.length / subSize);
      const partial: any[] = Array.isArray(b.partial_results) ? b.partial_results : [];
      // Next index = smallest non-negative integer not present in partial_results as a completed entry.
      const doneIdx = new Set(partial.filter((p: any) => p && (p.content || p.error)).map((p: any) => p.subbatch_index));
      let nextIdx = 0;
      while (doneIdx.has(nextIdx)) nextIdx++;
      const phase = nextIdx >= totalSub ? "final" : "subbatch";

      console.log(`[recovery] re-triggering batch ${b.id} → phase=${phase}, subbatchIndex=${nextIdx} (done=${doneIdx.size}/${totalSub}, updated_at=${b.updated_at})`);
      await supabase.rpc("append_analysis_batch_log", {
        _batch_id: b.id,
        _entry: { stage: "recovery_trigger", phase, subbatch_index: nextIdx, done: doneIdx.size, total_subbatches: totalSub, stale_since: b.updated_at },
      }).then(() => undefined, () => undefined);

      // Fire-and-forget the chain step; don't await response body.
      fetch(`${baseUrl}/functions/v1/${TARGET_FN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          "x-internal-chain": "1",
        },
        body: JSON.stringify({ batchId: b.id, phase, subbatchIndex: nextIdx }),
      }).catch((e) => console.log(`[recovery] failed to trigger ${b.id}:`, e?.message));


      restarted.push({ id: b.id, nextIndex: nextIdx, phase });
    }

    return new Response(JSON.stringify({ ok: true, restarted, scanned: stuck?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
