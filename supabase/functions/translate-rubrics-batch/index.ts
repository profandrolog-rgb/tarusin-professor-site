// Batch translator for repertory rubrics (EN -> RU).
// Same chained-self-invoke pattern as analyze-documents-batch:
// each invocation processes one subbatch of ~150 rubrics, persists results,
// then re-invokes itself for the next slice. Cron recovery hits the same
// internal endpoint if a chain step is lost.
//
// Input: { batchId: string, subbatchIndex?: number }
// Uses Anthropic API directly (claude-sonnet-4-6, fallback claude-sonnet-4-5).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const PRIMARY_MODEL = "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-sonnet-4-5-20250929";

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
    console.log(`[trans-batch ${batchId}]`, JSON.stringify(entry));
    await supabase.rpc("append_translation_batch_log", { _batch_id: batchId, _entry: entry });
  } catch (e) {
    console.log(`[trans-batch ${batchId}] log failed:`, (e as Error).message);
  }
}

function selfInvoke(body: Record<string, unknown>) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-rubrics-batch`;
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

async function loadGlossary(supabase: ReturnType<typeof admin>): Promise<string> {
  const { data } = await supabase
    .from("repertory_rubrics")
    .select("name, name_ru")
    .eq("name_ru_reviewed", true)
    .not("name_ru", "is", null)
    .limit(200);
  if (!data || !data.length) return "";
  return data
    .map((r: any) => `  ${JSON.stringify(r.name)} → ${JSON.stringify(r.name_ru)}`)
    .join("\n");
}

type RubricInput = { id: string; name: string };

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ text: string; usedModel: string }> {
  const tryOnce = async (m: string) => {
    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: m,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    return resp;
  };

  let resp = await tryOnce(model);
  let usedModel = model;
  if (!resp.ok && resp.status === 404 && model === PRIMARY_MODEL) {
    // Model not in catalog yet — fall back to 4.5.
    resp = await tryOnce(FALLBACK_MODEL);
    usedModel = FALLBACK_MODEL;
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${body.slice(0, 500)}`);
  }
  const j = await resp.json();
  const text: string = j?.content?.[0]?.text || "";
  return { text, usedModel };
}

function buildPrompt(rubrics: RubricInput[], glossary: string, chapterName: string): { system: string; user: string } {
  const system = [
    "Ты — медицинский переводчик с английского на русский, специализирующийся на классической гомеопатической репертuризации (Кент, Бённингхаузен, Богер).",
    `Переводишь короткие рубрики репертория из главы '${chapterName}'.`,
    "",
    "ПРАВИЛА:",
    "1. Сохраняй структуру с тире-разделителем: 'Section — modifier, sub' → 'Раздел — модификатор, под'.",
    "2. Используй устоявшуюся русскую гомеопатическую/андрологическую терминологию (не буквальный перевод).",
    "3. Anatomy и медицинские термины — точно (induration → уплотнение, не индурация; sleeplessness → бессонница).",
    "4. 'agg.' (aggravation) → 'ухуд.'; 'amel.' (amelioration) → 'улуч.'; 'morning' → 'утром'; 'night' → 'ночью'.",
    "5. Не добавляй слов, которых нет в оригинале (thoughts ≠ навязчивые мысли, anxiety about sexual life ≠ о сексуальном характере).",
    "6. Регистр: первая буква заглавная, дальше — как в оригинале (после тире — строчная, если в оригинале строчная).",
    "",
    "ГЛОССАРИЙ (проверенные человеком переводы, используй эту терминологию):",
    glossary || "  (пусто)",
    "",
    "ФОРМАТ ОТВЕТА: строго JSON-массив объектов {\"id\":\"...\",\"ru\":\"...\"}, без markdown-обёрток, без пояснений. Только массив.",
  ].join("\n");

  const user = [
    `Переведи ${rubrics.length} рубрик. Верни JSON-массив той же длины с теми же id:`,
    "",
    JSON.stringify(rubrics, null, 0),
  ].join("\n");

  return { system, user };
}

function parseTranslations(text: string): { id: string; ru: string }[] {
  // Strip possible ```json fences.
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  // Find first '[' and last ']'.
  const a = t.indexOf("[");
  const b = t.lastIndexOf("]");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  const arr = JSON.parse(t);
  if (!Array.isArray(arr)) throw new Error("Model returned non-array JSON");
  return arr.filter((x) => x && typeof x.id === "string" && typeof x.ru === "string");
}

async function processSubbatch(batchId: string, subbatchIndex: number) {
  const supabase = admin();
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    await logEvent(supabase, batchId, { stage: "error", message: "ANTHROPIC_API_KEY not configured" });
    await supabase.from("translation_batches").update({ status: "error", error: "ANTHROPIC_API_KEY not configured" }).eq("id", batchId);
    return;
  }

  const { data: batch } = await supabase.from("translation_batches").select("*").eq("id", batchId).single();
  if (!batch) return;

  const allIds: string[] = Array.isArray(batch.rubric_ids) ? batch.rubric_ids : [];
  if (!allIds.length) {
    await supabase.from("translation_batches").update({ status: "error", error: "Список рубрик пуст" }).eq("id", batchId);
    return;
  }

  const subSize = Math.max(10, Math.min(200, batch.subbatch_size || 150));
  const model = batch.model || PRIMARY_MODEL;
  const subbatches: string[][] = [];
  for (let i = 0; i < allIds.length; i += subSize) subbatches.push(allIds.slice(i, i + subSize));

  if (subbatchIndex === 0) {
    await supabase.from("translation_batches").update({
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
    // All done — mark as finished.
    const partial: any[] = Array.isArray(batch.partial_results) ? batch.partial_results : [];
    const ok = partial.filter((p: any) => !p?.error).reduce((a, p: any) => a + (p.translated_count || 0), 0);
    await supabase.from("translation_batches").update({
      status: "done",
      processed_rubrics: ok,
    }).eq("id", batchId);
    await logEvent(supabase, batchId, { stage: "all_done", translated: ok });
    return;
  }

  const existingPartial: any[] = Array.isArray(batch.partial_results) ? batch.partial_results : [];
  const alreadyDone = existingPartial.some((p: any) => p && p.subbatch_index === subbatchIndex && (p.translated_count !== undefined || p.error));
  if (alreadyDone) {
    await logEvent(supabase, batchId, { stage: "subbatch_skip_idempotent", subbatch_index: subbatchIndex });
  } else {
    const partial: any[] = existingPartial.filter((p: any) => p?.subbatch_index !== subbatchIndex);
    const idsForThis = subbatches[subbatchIndex];

    try {
      // Fetch the rubric texts from DB (only those still untranslated to be idempotent).
      const { data: rows, error: rErr } = await supabase
        .from("repertory_rubrics")
        .select("id, name, name_ru")
        .in("id", idsForThis);
      if (rErr) throw new Error(`Load rubrics: ${rErr.message}`);

      const todo: RubricInput[] = (rows || [])
        .filter((r: any) => !r.name_ru)
        .map((r: any) => ({ id: r.id, name: r.name }));

      let translated = 0;
      let usedModel = model;
      if (todo.length > 0) {
        const glossary = await loadGlossary(supabase);
        const { system, user } = buildPrompt(todo, glossary);
        await logEvent(supabase, batchId, { stage: "anthropic_call", subbatch_index: subbatchIndex, rubrics: todo.length, model });
        const { text, usedModel: um } = await callAnthropic(apiKey, model, system, user);
        usedModel = um;
        const parsed = parseTranslations(text);

        // Persist translations one statement (bulk via RPC not available — do per-row updates).
        const byId = new Map(parsed.map((p) => [p.id, p.ru]));
        for (const r of todo) {
          const ru = byId.get(r.id);
          if (!ru) continue;
          const { error: uErr } = await supabase
            .from("repertory_rubrics")
            .update({ name_ru: ru, name_ru_reviewed: false, name_ru_source: "ai-claude" })
            .eq("id", r.id);
          if (!uErr) translated++;
        }
      }

      await logEvent(supabase, batchId, {
        stage: "subbatch_done", subbatch_index: subbatchIndex,
        translated, requested: idsForThis.length, used_model: usedModel,
      });
      partial.push({ subbatch_index: subbatchIndex, requested: idsForThis.length, translated_count: translated, used_model: usedModel });
    } catch (e) {
      await logEvent(supabase, batchId, { stage: "subbatch_error", subbatch_index: subbatchIndex, message: (e as Error).message });
      partial.push({ subbatch_index: subbatchIndex, requested: idsForThis.length, error: (e as Error).message });
    }
    partial.sort((a, b) => (a.subbatch_index ?? 0) - (b.subbatch_index ?? 0));
    const processedRubrics = partial.reduce((a, p: any) => a + (p?.translated_count || 0), 0);
    await supabase.from("translation_batches").update({
      partial_results: partial,
      processed_rubrics: processedRubrics,
    }).eq("id", batchId);
  }

  const next = subbatchIndex + 1;
  await logEvent(supabase, batchId, { stage: "chain_next", next });
  // @ts-ignore EdgeRuntime in Supabase
  EdgeRuntime.waitUntil(selfInvoke({ batchId, subbatchIndex: next }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const batchId: string | undefined = body.batchId;
    const subbatchIndex: number = typeof body.subbatchIndex === "number" ? body.subbatchIndex : 0;
    const authHeader = req.headers.get("Authorization") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const isInternal = req.headers.get("x-internal-chain") === "1"
      && serviceKey.length > 0
      && authHeader === `Bearer ${serviceKey}`;

    if (typeof batchId !== "string") {
      return new Response(JSON.stringify({ error: "batchId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!isInternal) {
      // External caller: accept either an admin JWT, OR an unauthenticated
      // kickoff that simply re-triggers an existing queued/processing batch.
      // Justification: creating new translation_batches rows is admin-gated
      // by RLS; this endpoint only kicks the internal chain for an existing
      // UUID-identified row, and every processed subbatch is idempotent
      // (already-translated rubrics are skipped). Worst case: someone with
      // the UUID re-triggers work the system would do anyway.
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser().catch(() => ({ data: { user: null } } as any));
      let isAdmin = false;
      if (user) {
        const { data } = await admin().rpc("has_role", { _user_id: user.id, _role: "admin" });
        isAdmin = !!data;
      }
      if (!isAdmin) {
        // Verify the batch exists before kicking the chain.
        const { data: row } = await admin().from("translation_batches").select("id").eq("id", batchId).maybeSingle();
        if (!row) {
          return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    await logEvent(admin(), batchId, {
      stage: "invoke", origin: isInternal ? "internal" : "external", subbatch_index: subbatchIndex,
    });

    if (isInternal) {
      await processSubbatch(batchId, subbatchIndex);
      return new Response(JSON.stringify({ ok: true, batchId, subbatchIndex }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore EdgeRuntime in Supabase
    EdgeRuntime.waitUntil(selfInvoke({ batchId, subbatchIndex }));
    return new Response(JSON.stringify({ ok: true, batchId, started: true, subbatchIndex }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
