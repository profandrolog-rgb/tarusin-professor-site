// Batch document analyzer (chunked self-reinvocation).
// Input: { batchId: string, subbatchIndex?: number, phase?: "subbatch"|"final" }
//
// Pattern: each invocation processes exactly ONE subbatch (or the final
// synthesis) so a single edge-function lifetime never has to cover the
// whole pipeline. After finishing its slice, the function re-invokes
// itself for the next slice via fetch(...) inside EdgeRuntime.waitUntil.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "chat-attachments";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.6";
const SIGNED_URL_TTL = 60 * 60; // 1 hour
const MAX_FILES = 50;

type FileRef = { path: string; name: string; ext: string };

function mimeFor(ext: string): { kind: "image" | "pdf"; mime: string } | null {
  const e = ext.toLowerCase();
  if (e === "pdf") return { kind: "pdf", mime: "application/pdf" };
  if (["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(e)) {
    return { kind: "image", mime: e === "jpg" ? "image/jpeg" : `image/${e === "heic" ? "heic" : e}` };
  }
  return null;
}

function toBase64(bytes: Uint8Array): string {
  // chunked to avoid stack blow-up on large files
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function humanizeOpenRouterError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (status === 429 || lower.includes("rate limit")) return "Превышен лимит запросов к модели (429). Попробуйте через несколько минут.";
  if (status === 402 || lower.includes("insufficient") || lower.includes("credits")) return "Закончились кредиты у провайдера модели (402).";
  if (lower.includes("context_length") || lower.includes("maximum context")) return "Превышен контекст модели — слишком большой подпакет. Уменьшите subbatch_size.";
  if (lower.includes("unsupported") && (lower.includes("image") || lower.includes("file") || lower.includes("modality"))) return "Модель не поддерживает один из типов вложений.";
  return `Ошибка модели (${status}): ${body.slice(0, 400)}`;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function selfInvoke(body: Record<string, unknown>) {
  // Fire-and-forget call to ourselves with the service role so the next
  // subbatch (or final synthesis) runs in a fresh worker.
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-documents-batch`;
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

async function fetchSubbatchAnalysis(
  apiKey: string,
  supabase: ReturnType<typeof admin>,
  model: string,
  task: string,
  refs: FileRef[],
  subbatchIndex: number,
  totalSubbatches: number,
): Promise<{ content: string; per_file_errors: { file: string; error: string }[] }> {
  const contentBlocks: any[] = [
    {
      type: "text",
      text:
        `Подпакет ${subbatchIndex + 1} из ${totalSubbatches}. Файлы (${refs.length}):\n` +
        refs.map((r, i) => `[${i + 1}] ${r.name}`).join("\n") +
        `\n\nЗадача:\n${task}\n\n` +
        `Для КАЖДОГО файла верни структурированный блок:\n` +
        `### [номер] имя_файла\n- Тип документа: ...\n- Ключевые показатели/факты: ...\n- Отклонения от нормы (если есть): ...\n- Дата (если читается): ...\n\n` +
        `Если конкретный файл не удалось прочитать или он пустой/повреждён — явно напиши "НЕ УДАЛОСЬ ПРОЧИТАТЬ" и причину, не выдумывай данные.`,
    },
  ];
  const per_file_errors: { file: string; error: string }[] = [];
  for (const r of refs) {
    const info = mimeFor(r.ext);
    if (!info) { per_file_errors.push({ file: r.name, error: "неподдерживаемый формат" }); continue; }
    // Download bytes from storage and inline as base64 data URL.
    const { data: blob, error: dErr } = await supabase.storage.from(BUCKET).download(r.path);
    if (dErr || !blob) {
      per_file_errors.push({ file: r.name, error: `не удалось скачать: ${dErr?.message || "unknown"}` });
      continue;
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const dataUrl = `data:${info.mime};base64,${toBase64(bytes)}`;
    if (info.kind === "image") {
      contentBlocks.push({ type: "image_url", image_url: { url: dataUrl } });
    } else {
      contentBlocks.push({ type: "file", file: { filename: r.name, file_data: dataUrl } });
    }
  }

  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://tarusin.pro",
      "X-Title": "Cabinet batch analyzer",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Ты — клинический ассистент. Анализируешь медицинские документы (анализы, выписки, заключения). " +
            "Будь предметным, цифры приводи как есть, отмечай отклонения от референсных диапазонов. " +
            "Если в файле явно нет медицинской информации — напиши об этом одной строкой.",
        },
        { role: "user", content: contentBlocks },
      ],
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(humanizeOpenRouterError(resp.status, body));
  }
  const json = await resp.json();
  const content: string = json.choices?.[0]?.message?.content || "";
  // (per_file_errors was already declared above for download failures.)
  for (const r of refs) {
    const re = new RegExp(`###\\s*\\[\\d+\\][^\\n]*${r.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}([\\s\\S]*?)(?=\\n###|$)`, "i");
    const m = content.match(re);
    if (m && /не удалось прочитать|невозможно прочитать|пуст\w*\s+файл/i.test(m[1])) {
      per_file_errors.push({ file: r.name, error: "Модель не смогла извлечь содержимое" });
    }
  }
  return { content, per_file_errors };
}

async function processSubbatch(batchId: string, subbatchIndex: number) {
  const supabase = admin();
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    await supabase.from("analysis_batches").update({ status: "error", error: "OPENROUTER_API_KEY not configured" }).eq("id", batchId);
    return;
  }

  const { data: batch } = await supabase.from("analysis_batches").select("*").eq("id", batchId).single();
  if (!batch) return;

  const files: string[] = Array.isArray(batch.file_paths) ? batch.file_paths : [];
  if (!files.length) {
    await supabase.from("analysis_batches").update({ status: "error", error: "Список файлов пуст" }).eq("id", batchId);
    return;
  }
  if (files.length > MAX_FILES) {
    await supabase.from("analysis_batches").update({ status: "error", error: `Слишком много файлов (макс ${MAX_FILES})` }).eq("id", batchId);
    return;
  }

  const subSize = Math.max(1, Math.min(15, batch.subbatch_size || 7));
  const model = batch.model || DEFAULT_MODEL;
  const task = (batch.task || "").trim();
  const subbatches: string[][] = [];
  for (let i = 0; i < files.length; i += subSize) subbatches.push(files.slice(i, i + subSize));

  // First subbatch — ensure status = processing.
  // IMPORTANT: don't blindly wipe partial_results here, because the
  // cron-recovery path may invoke us at subbatchIndex=0 for a batch that
  // already has partial results. Only reset when nothing was recorded yet.
  if (subbatchIndex === 0) {
    const initPartial: any[] = Array.isArray(batch.partial_results) ? batch.partial_results : [];
    await supabase.from("analysis_batches").update({
      status: "processing",
      processed_files: initPartial.length ? batch.processed_files : 0,
      partial_results: initPartial.length ? initPartial : [],
      error: null,
      total_files: files.length,
    }).eq("id", batchId);
  }

  if (subbatchIndex >= subbatches.length) {
    // @ts-ignore EdgeRuntime in Supabase
    EdgeRuntime.waitUntil(selfInvoke({ batchId, phase: "final" }));
    return;
  }

  // Idempotency: skip OpenRouter if this subbatch index was already
  // processed in a prior invocation (cron retry / duplicated chain).
  const existingPartial: any[] = Array.isArray(batch.partial_results) ? batch.partial_results : [];
  const alreadyDone = existingPartial.some((p: any) => p && p.subbatch_index === subbatchIndex && (p.content || p.error));
  if (alreadyDone) {
    console.log(`[batch ${batchId}] subbatch ${subbatchIndex + 1} already in partial_results — skipping work, chaining`);
  } else {
    const partial: any[] = existingPartial.filter((p: any) => p?.subbatch_index !== subbatchIndex);
    const group = subbatches[subbatchIndex];
    const refs: FileRef[] = group.map((path) => {
      const name = path.split("/").pop() || path;
      const ext = (name.split(".").pop() || "").toLowerCase();
      return { path, name, ext };
    });
    try {
      console.log(`[batch ${batchId}] subbatch ${subbatchIndex + 1}/${subbatches.length}: downloading ${refs.length} files + calling OpenRouter`);
      const { content, per_file_errors } = await fetchSubbatchAnalysis(apiKey, supabase, model, task, refs, subbatchIndex, subbatches.length);
      console.log(`[batch ${batchId}] subbatch ${subbatchIndex + 1} done, ${content.length} chars, ${per_file_errors.length} per-file errors`);
      partial.push({ subbatch_index: subbatchIndex, files: refs.map(r => r.name), content, per_file_errors });
    } catch (e) {
      console.log(`[batch ${batchId}] subbatch ${subbatchIndex + 1} failed:`, (e as Error).message);
      partial.push({ subbatch_index: subbatchIndex, files: refs.map(r => r.name), error: (e as Error).message });
    }
    // Sort by subbatch_index for deterministic final synthesis order.
    partial.sort((a, b) => (a.subbatch_index ?? 0) - (b.subbatch_index ?? 0));
    const processedIndices = new Set(partial.filter(p => p?.content || p?.error).map(p => p.subbatch_index));
    const processedFiles = Array.from(processedIndices).reduce((acc, idx) => acc + (subbatches[idx]?.length || 0), 0);
    await supabase.from("analysis_batches").update({
      partial_results: partial,
      processed_files: Math.min(files.length, processedFiles),
    }).eq("id", batchId);
  }

  const next = subbatchIndex + 1;
  const nextBody = next < subbatches.length
    ? { batchId, subbatchIndex: next, phase: "subbatch" as const }
    : { batchId, phase: "final" as const };
  // Fire-and-forget: kick off the next step in a fresh worker. waitUntil
  // only needs to keep us alive long enough for the outbound HTTP to be
  // delivered (~1s), not for the next subbatch's compute.
  // @ts-ignore EdgeRuntime in Supabase
  EdgeRuntime.waitUntil(selfInvoke(nextBody));
}

async function processFinal(batchId: string) {
  const supabase = admin();
  const apiKey = Deno.env.get("OPENROUTER_API_KEY")!;
  const { data: batch } = await supabase.from("analysis_batches").select("*").eq("id", batchId).single();
  if (!batch) return;
  const partial: any[] = Array.isArray(batch.partial_results) ? batch.partial_results : [];
  const model = batch.model || DEFAULT_MODEL;
  const task = (batch.task || "").trim();
  try {
    const combined = partial.map((p, i) => {
      if (p.error) return `## Подпакет ${i + 1} (${p.files?.length || 0} файлов): ОШИБКА\n${p.error}`;
      return `## Подпакет ${i + 1} (${p.files?.length || 0} файлов)\n${p.content}`;
    }).join("\n\n---\n\n");

    const finalResp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tarusin.pro",
        "X-Title": "Cabinet batch analyzer (synthesis)",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Ты — клинический ассистент. На входе — структурированные разборы документов по подпакетам. " +
              "Собери ОДИН связный итоговый ответ для врача: " +
              "(1) сводная таблица ключевых показателей с динамикой по датам, " +
              "(2) явные отклонения и их клиническая значимость, " +
              "(3) противоречия между документами/заключениями (если есть), " +
              "(4) рекомендации по дообследованию (если показано). " +
              "Не выдумывай данные, опирайся только на присланные разборы.",
          },
          { role: "user", content: `Задача от врача:\n${task}\n\nРазборы по подпакетам:\n\n${combined}` },
        ],
        max_tokens: 6000,
      }),
    });
    if (!finalResp.ok) {
      const body = await finalResp.text().catch(() => "");
      throw new Error(humanizeOpenRouterError(finalResp.status, body));
    }
    const fj = await finalResp.json();
    const finalText: string = fj.choices?.[0]?.message?.content || "";
    await supabase.from("analysis_batches").update({
      status: "done", final_result: finalText, partial_results: partial,
    }).eq("id", batchId);
  } catch (e) {
    await supabase.from("analysis_batches").update({
      status: "error", error: `Финальный синтез: ${(e as Error).message}`, partial_results: partial,
    }).eq("id", batchId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const batchId: string | undefined = body.batchId;
    const phase: "subbatch" | "final" = body.phase || "subbatch";
    const subbatchIndex: number = typeof body.subbatchIndex === "number" ? body.subbatchIndex : 0;
    const isInternal = req.headers.get("x-internal-chain") === "1";

    if (typeof batchId !== "string") {
      return new Response(JSON.stringify({ error: "batchId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // External callers (client) must be the row owner.
    if (!isInternal) {
      const authHeader = req.headers.get("Authorization") || "";
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: row } = await admin().from("analysis_batches").select("id, user_id").eq("id", batchId).maybeSingle();
      if (!row || row.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (isInternal) {
      // Internal chained step: do the work in this invocation so the
      // worker stays alive until it's finished, then return.
      if (phase === "final") await processFinal(batchId);
      else await processSubbatch(batchId, subbatchIndex);
      return new Response(JSON.stringify({ ok: true, batchId, phase, subbatchIndex }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // External (client) call: kick off the first subbatch in a fresh
    // worker via self-invoke, return immediately so the client can
    // subscribe to Realtime updates.
    selfInvoke({ batchId, phase: "subbatch", subbatchIndex: 0 });
    return new Response(JSON.stringify({ ok: true, batchId, started: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
