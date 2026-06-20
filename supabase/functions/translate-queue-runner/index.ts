// Orchestrator: picks the next chapter with untranslated rubrics, creates a
// translation_batches row, and kicks off translate-rubrics-batch. Designed to
// be safe to invoke repeatedly: it is a no-op when a batch is already
// queued/processing.
//
// Input: { force?: boolean }  — force=true bypasses the "already running" guard.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBBATCH_SIZE = 150;
const MODEL = "claude-sonnet-4-6";
// Hard cap to avoid one batch dominating; very large chapters are split.
const MAX_RUBRICS_PER_BATCH = 2000;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function pickNextChapter(sb: ReturnType<typeof admin>) {
  // Smallest chapter with untranslated rubrics first (faster validation,
  // forward progress visible). Excludes chapters where 0 untranslated remain.
  const { data, error } = await sb.rpc("exec_sql_select" as any, {}).catch(() => ({ data: null, error: null } as any));
  if (data) return data; // not used
  // Fall back to plain queries.
  const { data: chapters } = await sb
    .from("repertory_chapters")
    .select("id, name_en");
  if (!chapters) return null;
  let best: { id: string; name_en: string; untranslated: number } | null = null;
  for (const c of chapters) {
    const { count } = await sb
      .from("repertory_rubrics")
      .select("id", { count: "exact", head: true })
      .eq("chapter_id", c.id)
      .is("name_ru", null);
    const n = count || 0;
    if (n === 0) continue;
    if (!best || n < best.untranslated) best = { id: c.id, name_en: c.name_en, untranslated: n };
  }
  return best;
}

async function triggerBatch(batchId: string) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-rubrics-batch`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "x-internal-chain": "1",
    },
    body: JSON.stringify({ batchId, subbatchIndex: 0 }),
  }).catch(() => undefined);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = admin();
  try {
    const body = await req.json().catch(() => ({} as any));
    const force = !!body.force;

    // Guard: if a batch is already active, do nothing (chaining will resume).
    if (!force) {
      const { data: active } = await sb
        .from("translation_batches")
        .select("id, status")
        .in("status", ["queued", "processing"])
        .limit(1);
      if (active && active.length > 0) {
        return new Response(
          JSON.stringify({ ok: true, skipped: "batch_active", activeId: active[0].id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const chapter = await pickNextChapter(sb);
    if (!chapter) {
      return new Response(
        JSON.stringify({ ok: true, done: true, message: "All chapters translated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Pull rubric ids for this chapter (cap to MAX_RUBRICS_PER_BATCH).
    const { data: rubrics, error: rErr } = await sb
      .from("repertory_rubrics")
      .select("id")
      .eq("chapter_id", chapter.id)
      .is("name_ru", null)
      .order("id", { ascending: true })
      .limit(MAX_RUBRICS_PER_BATCH);
    if (rErr) throw new Error(`load rubrics: ${rErr.message}`);
    const ids = (rubrics || []).map((r: any) => r.id);
    if (!ids.length) {
      return new Response(
        JSON.stringify({ ok: true, skipped: "no_rubrics", chapter: chapter.name_en }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: batch, error: bErr } = await sb
      .from("translation_batches")
      .insert({
        chapter_id: chapter.id,
        scope: "chapter",
        model: MODEL,
        status: "queued",
        total_rubrics: ids.length,
        subbatch_size: SUBBATCH_SIZE,
        rubric_ids: ids,
      })
      .select("id")
      .single();
    if (bErr || !batch) throw new Error(`create batch: ${bErr?.message || "unknown"}`);

    // @ts-ignore
    EdgeRuntime.waitUntil(triggerBatch(batch.id));

    return new Response(
      JSON.stringify({
        ok: true,
        started: true,
        chapter: chapter.name_en,
        chapterId: chapter.id,
        batchId: batch.id,
        rubrics: ids.length,
        remaining_in_chapter: chapter.untranslated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
