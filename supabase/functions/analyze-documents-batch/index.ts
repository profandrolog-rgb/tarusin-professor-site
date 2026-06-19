// Batch document analyzer.
// Input: { batchId: string }
// Reads analysis_batches row, processes file_paths in subbatches,
// updates progress + partial_results, finally synthesizes one summary
// into final_result. Uses a fixed vision-capable model (Claude Sonnet 4.5)
// via OpenRouter, regardless of the model picked in the general chat.
//
// Runs the heavy work via EdgeRuntime.waitUntil so the HTTP response
// returns immediately and the client can subscribe to Realtime updates.

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

type FileRef = { path: string; name: string; signedUrl: string; ext: string };

function mimeFor(ext: string): { kind: "image" | "pdf"; mime: string } | null {
  const e = ext.toLowerCase();
  if (e === "pdf") return { kind: "pdf", mime: "application/pdf" };
  if (["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(e)) {
    return { kind: "image", mime: e === "jpg" ? "image/jpeg" : `image/${e === "heic" ? "heic" : e}` };
  }
  return null;
}

function humanizeOpenRouterError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (status === 429 || lower.includes("rate limit")) return "Превышен лимит запросов к модели (429). Попробуйте через несколько минут.";
  if (status === 402 || lower.includes("insufficient") || lower.includes("credits")) return "Закончились кредиты у провайдера модели (402).";
  if (lower.includes("context_length") || lower.includes("maximum context")) return "Превышен контекст модели — слишком большой подпакет. Уменьшите subbatch_size.";
  if (lower.includes("unsupported") && (lower.includes("image") || lower.includes("file") || lower.includes("modality"))) return "Модель не поддерживает один из типов вложений.";
  return `Ошибка модели (${status}): ${body.slice(0, 400)}`;
}

async function fetchSubbatchAnalysis(
  apiKey: string,
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
  for (const r of refs) {
    const info = mimeFor(r.ext);
    if (!info) continue;
    if (info.kind === "image") {
      contentBlocks.push({ type: "image_url", image_url: { url: r.signedUrl } });
    } else {
      contentBlocks.push({ type: "file", file: { filename: r.name, file_data: r.signedUrl } });
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
  // Detect per-file failures by simple regex on the structured headers.
  const per_file_errors: { file: string; error: string }[] = [];
  for (const r of refs) {
    const re = new RegExp(`###\\s*\\[\\d+\\][^\\n]*${r.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}([\\s\\S]*?)(?=\\n###|$)`, "i");
    const m = content.match(re);
    if (m && /не удалось прочитать|невозможно прочитать|пуст\w*\s+файл/i.test(m[1])) {
      per_file_errors.push({ file: r.name, error: "Модель не смогла извлечь содержимое" });
    }
  }
  return { content, per_file_errors };
}

async function processBatch(batchId: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    await supabase.from("analysis_batches").update({ status: "error", error: "OPENROUTER_API_KEY not configured" }).eq("id", batchId);
    return;
  }

  const { data: batch, error: bErr } = await supabase
    .from("analysis_batches")
    .select("*")
    .eq("id", batchId)
    .single();
  if (bErr || !batch) return;

  const files: string[] = Array.isArray(batch.file_paths) ? batch.file_paths : [];
  if (files.length === 0) {
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

  await supabase.from("analysis_batches").update({
    status: "processing", processed_files: 0, partial_results: [], error: null, total_files: files.length,
  }).eq("id", batchId);

  const partial: any[] = [];
  const subbatches: string[][] = [];
  for (let i = 0; i < files.length; i += subSize) subbatches.push(files.slice(i, i + subSize));

  for (let i = 0; i < subbatches.length; i++) {
    const group = subbatches[i];

    // Sign URLs for this group
    const signed = await supabase.storage.from(BUCKET).createSignedUrls(group, SIGNED_URL_TTL);
    if (signed.error || !signed.data) {
      partial.push({ subbatch_index: i, files: group, error: signed.error?.message || "не удалось получить ссылки" });
      await supabase.from("analysis_batches").update({
        partial_results: partial,
        processed_files: Math.min(files.length, (i + 1) * subSize),
      }).eq("id", batchId);
      continue;
    }
    const refs: FileRef[] = signed.data.map((s: any, idx: number) => {
      const path = group[idx];
      const name = path.split("/").pop() || path;
      const ext = (name.split(".").pop() || "").toLowerCase();
      return { path, name, signedUrl: s.signedUrl, ext };
    });

    try {
      const { content, per_file_errors } = await fetchSubbatchAnalysis(apiKey, model, task, refs, i, subbatches.length);
      partial.push({
        subbatch_index: i,
        files: refs.map(r => r.name),
        content,
        per_file_errors,
      });
    } catch (e) {
      partial.push({
        subbatch_index: i,
        files: refs.map(r => r.name),
        error: (e as Error).message,
      });
    }

    await supabase.from("analysis_batches").update({
      partial_results: partial,
      processed_files: Math.min(files.length, (i + 1) * subSize),
    }).eq("id", batchId);
  }

  // Final synthesis: pass partial results as plain text (no files)
  try {
    const combined = partial.map((p, i) => {
      if (p.error) return `## Подпакет ${i + 1} (${p.files.length} файлов): ОШИБКА\n${p.error}`;
      return `## Подпакет ${i + 1} (${p.files.length} файлов)\n${p.content}`;
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
          {
            role: "user",
            content: `Задача от врача:\n${task}\n\nРазборы по подпакетам:\n\n${combined}`,
          },
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
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { batchId } = await req.json();
    if (typeof batchId !== "string") {
      return new Response(JSON.stringify({ error: "batchId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: row } = await supabase.from("analysis_batches").select("id, user_id, status").eq("id", batchId).maybeSingle();
    if (!row || row.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (row.status === "processing") {
      return new Response(JSON.stringify({ ok: true, already: "processing" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // @ts-ignore EdgeRuntime is available in Supabase Edge runtime
    EdgeRuntime.waitUntil(processBatch(batchId));

    return new Response(JSON.stringify({ ok: true, batchId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
