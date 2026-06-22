// Cron recovery for embedding_batches stuck in "processing" with no progress for >4 min.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_MINUTES = 4;
const TARGET_FN = "embed-rubrics-batch";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const baseUrl = Deno.env.get("SUPABASE_URL")!;

    const { data: stuck, error } = await supabase
      .from("embedding_batches")
      .select("id, rubric_ids, partial_results, subbatch_size, updated_at")
      .eq("status", "processing")
      .lt("updated_at", new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString());
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const restarted: { id: string; nextIndex: number }[] = [];
    for (const b of stuck || []) {
      const ids: string[] = Array.isArray(b.rubric_ids) ? b.rubric_ids : [];
      const subSize = Math.max(10, Math.min(500, b.subbatch_size || 200));
      const totalSub = Math.ceil(ids.length / subSize);
      const partial: any[] = Array.isArray(b.partial_results) ? b.partial_results : [];
      const doneIdx = new Set(partial.filter((p: any) => p && (p.ok_count !== undefined || p.error)).map((p: any) => p.subbatch_index));
      let nextIdx = 0;
      while (doneIdx.has(nextIdx)) nextIdx++;

      console.log(`[embed-recovery] re-triggering batch ${b.id} → subbatchIndex=${nextIdx} (done=${doneIdx.size}/${totalSub})`);
      await supabase.rpc("append_embedding_batch_log", {
        _batch_id: b.id,
        _entry: { stage: "recovery_trigger", subbatch_index: nextIdx, done: doneIdx.size, total_subbatches: totalSub, stale_since: b.updated_at },
      }).then(() => undefined, () => undefined);

      fetch(`${baseUrl}/functions/v1/${TARGET_FN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          "x-internal-chain": "1",
        },
        body: JSON.stringify({ batchId: b.id, subbatchIndex: nextIdx }),
      }).catch((e) => console.log(`[embed-recovery] failed to trigger ${b.id}:`, e?.message));

      restarted.push({ id: b.id, nextIndex: nextIdx });
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
