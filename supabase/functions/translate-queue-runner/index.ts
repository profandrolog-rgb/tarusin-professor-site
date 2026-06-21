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
// Default parallelism — how many chapters may translate concurrently.
const DEFAULT_PARALLELISM = 3;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function pickNextChapters(
  sb: ReturnType<typeof admin>,
  n: number,
  excludeIds: string[],
) {
  // Smallest chapters with untranslated rubrics first, excluding ones already running.
  const { data: chapters } = await sb
    .from("repertory_chapters")
    .select("id, name_en");
  if (!chapters) return [];
  const exclude = new Set(excludeIds);
  const candidates: { id: string; name_en: string; untranslated: number }[] = [];
  for (const c of chapters) {
    if (exclude.has(c.id)) continue;
    const { count } = await sb
      .from("repertory_rubrics")
      .select("id", { count: "exact", head: true })
      .eq("chapter_id", c.id)
      .is("name_ru", null);
    const k = count || 0;
    if (k === 0) continue;
    candidates.push({ id: c.id, name_en: c.name_en, untranslated: k });
  }
  candidates.sort((a, b) => a.untranslated - b.untranslated);
  return candidates.slice(0, n);
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

async function startChapter(
  sb: ReturnType<typeof admin>,
  chapter: { id: string; name_en: string; untranslated: number },
) {
  const { data: rubrics, error: rErr } = await sb
    .from("repertory_rubrics")
    .select("id")
    .eq("chapter_id", chapter.id)
    .is("name_ru", null)
    .order("id", { ascending: true })
    .limit(MAX_RUBRICS_PER_BATCH);
  if (rErr) throw new Error(`load rubrics: ${rErr.message}`);
  const ids = (rubrics || []).map((r: any) => r.id);
  if (!ids.length) return null;

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
  return {
    chapter: chapter.name_en,
    chapterId: chapter.id,
    batchId: batch.id,
    rubrics: ids.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = admin();
  try {
    const body = await req.json().catch(() => ({} as any));
    const force = !!body.force;
    const parallelism = Math.max(
      1,
      Math.min(10, Number(body.parallelism) || DEFAULT_PARALLELISM),
    );

    // Count active batches; only top up to `parallelism`.
    const { data: active } = await sb
      .from("translation_batches")
      .select("id, chapter_id")
      .in("status", ["queued", "processing"]);
    const activeCount = (active || []).length;
    const activeChapterIds = (active || [])
      .map((b: any) => b.chapter_id)
      .filter(Boolean) as string[];

    const slotsFree = force ? parallelism : Math.max(0, parallelism - activeCount);
    if (slotsFree === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: "parallelism_reached",
          activeCount,
          parallelism,
          activeIds: (active || []).map((b: any) => b.id),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const chapters = await pickNextChapters(sb, slotsFree, activeChapterIds);
    if (!chapters.length) {
      return new Response(
        JSON.stringify({
          ok: true,
          done: activeCount === 0,
          message: activeCount === 0
            ? "All chapters translated"
            : "No more chapters to queue (others still running)",
          activeCount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const started: any[] = [];
    for (const ch of chapters) {
      try {
        const r = await startChapter(sb, ch);
        if (r) started.push(r);
      } catch (e) {
        started.push({ chapter: ch.name_en, error: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        started: started.length,
        parallelism,
        previously_active: activeCount,
        batches: started,
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
