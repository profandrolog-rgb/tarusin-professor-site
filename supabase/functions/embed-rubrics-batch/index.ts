// Batch embedder for repertory rubrics using Voyage AI (voyage-4-lite).
// Chained self-invoke pattern: 1 subbatch (200 rubrics) per invocation,
// EdgeRuntime.waitUntil for the next slice, idempotent on subbatch_index.
//
// Input: { batchId: string, subbatchIndex?: number }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-4-lite";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function logEvent(
  supabase: ReturnType<typeof admin>,
  batchId: string,
  entry: Record<string, unknown>,
) {
  try {
    console.log(`[embed-batch ${batchId}]`, JSON.stringify(entry));
    await supabase.rpc("append_embedding_batch_log", { _batch_id: batchId, _entry: entry });
  } catch (e) {
    console.log(`[embed-batch ${batchId}] log failed:`, (e as Error).message);
  }
}

function selfInvoke(body: Record<string, unknown>) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/embed-rubrics-batch`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "x-internal-chain": "1",
    },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

async function voyageEmbed(apiKey: string, inputs: string[], inputType: "document" | "query") {
  // Tier 1 = 2000 RPM. Short retry on transient 429/5xx.
  for (let attempt = 0; attempt < 5; attempt++) {
    const resp = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: inputs, input_type: inputType }),
    });
    if (resp.status === 429 || resp.status >= 500) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Voyage ${resp.status}: ${body.slice(0, 500)}`);
    }
    const j = await resp.json();
    const data: { index: number; embedding: number[] }[] = j?.data || [];
    return data.sort((a, b) => a.index - b.index).map((x) => x.embedding);
  }
  throw new Error("Voyage: rate limit / transient errors exhausted");
}

async function processSubbatch(batchId: string, subbatchIndex: number) {
  const supabase = admin();
  const apiKey = Deno.env.get("VOYAGE_API_KEY");
  if (!apiKey) {
    await logEvent(supabase, batchId, { stage: "error", message: "VOYAGE_API_KEY not configured" });
    await supabase.from("embedding_batches").update({ status: "error", error: "VOYAGE_API_KEY not configured" }).eq("id", batchId);
    return;
  }

  const { data: batch } = await supabase.from("embedding_batches").select("*").eq("id", batchId).single();
  if (!batch) return;
  if (!["pending", "processing"].includes(batch.status)) {
    await logEvent(supabase, batchId, { stage: "batch_skip_status", status: batch.status, subbatch_index: subbatchIndex });
    return;
  }

  const allIds: string[] = Array.isArray(batch.rubric_ids) ? batch.rubric_ids : [];
  if (!allIds.length) {
    await supabase.from("embedding_batches").update({ status: "error", error: "Список рубрик пуст" }).eq("id", batchId);
    return;
  }

  const subSize = Math.max(10, Math.min(500, batch.subbatch_size || 200));
  const subbatches: string[][] = [];
  for (let i = 0; i < allIds.length; i += subSize) subbatches.push(allIds.slice(i, i + subSize));

  if (subbatchIndex === 0) {
    await supabase.from("embedding_batches").update({
      status: "processing",
      total_rubrics: allIds.length,
      error: null,
    }).eq("id", batchId);
  }

  await logEvent(supabase, batchId, {
    stage: "subbatch_start", subbatch_index: subbatchIndex, total_subbatches: subbatches.length,
    rubrics_in_subbatch: subbatches[subbatchIndex]?.length ?? 0,
  });

  if (subbatchIndex >= subbatches.length) {
    const partial: any[] = Array.isArray(batch.partial_results) ? batch.partial_results : [];
    const ok = partial.filter((p: any) => !p?.error).reduce((a, p: any) => a + (p.ok_count || 0), 0);
    await supabase.from("embedding_batches").update({
      status: "done",
      processed_rubrics: ok,
    }).eq("id", batchId);
    await logEvent(supabase, batchId, { stage: "all_done", embedded: ok });
    return;
  }

  const existingPartial: any[] = Array.isArray(batch.partial_results) ? batch.partial_results : [];
  const alreadyDone = existingPartial.some((p: any) => p && p.subbatch_index === subbatchIndex && p.ok_count !== undefined);
  if (alreadyDone) {
    await logEvent(supabase, batchId, { stage: "subbatch_skip_idempotent", subbatch_index: subbatchIndex });
  } else {
    const partial: any[] = existingPartial.filter((p: any) => p?.subbatch_index !== subbatchIndex);
    const idsForThis = subbatches[subbatchIndex];

    try {
      // Load rubrics + chapter names; skip those already embedded.
      const { data: rows, error: rErr } = await supabase
        .from("repertory_rubrics")
        .select("id, name, name_ru, chapter_id, repertory_chapters!inner(name_ru,name_en)")
        .in("id", idsForThis)
        .not("name_ru", "is", null);
      if (rErr) throw new Error(`Load rubrics: ${rErr.message}`);

      const { data: existing } = await supabase
        .from("rubric_embeddings")
        .select("rubric_id")
        .in("rubric_id", idsForThis);
      const skipIds = new Set((existing || []).map((e: any) => e.rubric_id));

      const todo = (rows || []).filter((r: any) => !skipIds.has(r.id));

      let okCount = skipIds.size; // already embedded count towards "ok"
      if (todo.length > 0) {
        const sourceTexts = todo.map((r: any) => {
          const chapter = r.repertory_chapters?.name_ru || r.repertory_chapters?.name_en || "";
          return chapter ? `${chapter}: ${r.name_ru}` : r.name_ru;
        });
        const vectors = await voyageEmbed(apiKey, sourceTexts, "document");
        if (vectors.length !== todo.length) {
          throw new Error(`Voyage returned ${vectors.length} vectors for ${todo.length} inputs`);
        }

        const rowsToUpsert = todo.map((r: any, i: number) => ({
          rubric_id: r.id,
          embedding: vectors[i],
          source_text: sourceTexts[i],
          model: MODEL,
          embedded_at: new Date().toISOString(),
        }));

        // Upsert in small chunks: vector index updates can time out on large batches.
        for (let i = 0; i < rowsToUpsert.length; i += 25) {
          const chunk = rowsToUpsert.slice(i, i + 25);
          const { error: upErr } = await supabase.from("rubric_embeddings").upsert(chunk, { onConflict: "rubric_id" });
          if (upErr) throw new Error(`Upsert: ${upErr.message}`);
        }
        okCount += todo.length;
      }

      partial.push({ subbatch_index: subbatchIndex, ok_count: okCount });
      const totalOk = partial.filter((p: any) => !p?.error).reduce((a, p: any) => a + (p.ok_count || 0), 0);
      await supabase.from("embedding_batches").update({
        partial_results: partial,
        processed_rubrics: totalOk,
      }).eq("id", batchId);

      await logEvent(supabase, batchId, {
        stage: "subbatch_done", subbatch_index: subbatchIndex, ok_count: okCount, skipped_existing: skipIds.size,
      });
    } catch (e) {
      const msg = (e as Error).message;
      partial.push({ subbatch_index: subbatchIndex, error: msg });
      await supabase.from("embedding_batches").update({ partial_results: partial }).eq("id", batchId);
      await logEvent(supabase, batchId, { stage: "subbatch_error", subbatch_index: subbatchIndex, error: msg });
    }
  }

  // Chain next
  // @ts-ignore EdgeRuntime
  EdgeRuntime.waitUntil(selfInvoke({ batchId, subbatchIndex: subbatchIndex + 1 }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const batchId: string = body.batchId;
    const subbatchIndex: number = Number.isInteger(body.subbatchIndex) ? body.subbatchIndex : 0;
    if (!batchId) {
      return new Response(JSON.stringify({ error: "batchId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore EdgeRuntime
    EdgeRuntime.waitUntil(processSubbatch(batchId, subbatchIndex));

    return new Response(JSON.stringify({ ok: true, batchId, subbatchIndex }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
