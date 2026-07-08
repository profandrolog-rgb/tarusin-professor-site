// Article Orchestrator: fan-out review of an article to multiple AI models,
// then consolidate via voting + an arbiter model.
//
// POST body (action="review"):
//   { action:"review", text:string, title?:string, models:string[] }
//   -> SSE stream:
//        event: model_done   data: { model, free_review, edits[], error? }
//        event: done         data: { ok:true }
//
// POST body (action="consolidate"):
//   { action:"consolidate", text:string, reviews:[{model,free_review,edits[]}], arbiter?:string }
//   -> JSON: { consolidated:{summary, edits:[{id,category,original,suggested,rationale,supporting_models[],status,severity}]} }
//
// Models prefixed with "venice/" go to Venice API; everything else through OpenRouter.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REVIEW_SYSTEM = `Ты — рецензент медицинских/научно-популярных статей профессора Д.И. Тарусина (детская урология-андрология, эндокринология, психиатрия в объёме сексологии). 
Прочитай статью и дай ПРЕДМЕТНОЕ ревью.

ВЕРНИ СТРОГО JSON-объект без markdown-обрамления. НЕ описывай ход анализа, планы, размышления и промежуточные шаги — только итоговый JSON:
{
  "free_review": "общая оценка статьи на 3-8 предложений: сильные стороны, слабые места, главные риски (фактические ошибки, устаревшие данные, стилистика, структура, SEO).",
  "edits": [
    {
      "category": "fact" | "style" | "structure" | "seo" | "terminology" | "safety",
      "original": "точная цитата из статьи (короткий фрагмент 5-40 слов) или '' если правка относится ко всей статье",
      "suggested": "предлагаемая замена / добавление / удаление",
      "rationale": "почему именно так",
      "severity": "low" | "medium" | "high"
    }
  ]
}

Правила:
- Для полноразмерной статьи верни 8-15 конкретных правок; для короткого текста — минимум 3, если в статье есть что улучшать.
- Не ограничивайся общей оценкой: каждая замеченная фактическая, терминологическая, структурная или редакторская проблема должна попасть в edits.
- Только конкретные и применимые правки; без абстрактных советов.
- "original" должно дословно встречаться в тексте (для последующего поиска).
- Не предлагай косметику, если есть содержательные проблемы.
- Не добавляй дисклеймеров «обратитесь к врачу» — это статья профессора.
- Если статья хороша — всё равно проверь терминологию, структуру, ясность для родителей, SEO и безопасность формулировок; не возвращай пустой edits без явного объяснения в free_review.`;

const REWRITE_SYSTEM = `Ты — литературный редактор, который переписывает медицинскую статью профессора Д.И. Тарусина с учётом одобренных правок. ТВОЯ ГЛАВНАЯ ЗАДАЧА — сохранить АВТОРСКИЙ ГОЛОС профессора.

Голос профессора Тарусина:
- 1-е лицо ("я", "мой опыт", "в моей практике"), уверенный тон руководителя клиники.
- Сдержанный академический стиль, без популизма и инфостиля, без эмодзи, без восклицательных знаков.
- Точная медицинская терминология (русская + латинская в скобках при первом упоминании).
- Спокойные авторские обороты: "по моим наблюдениям", "на собственном материале", "представляется целесообразным", "следует подчеркнуть", "в практике детского уролога-андролога".
- Никаких дисклеймеров «обратитесь к врачу», никаких "важно понимать", "давайте разберёмся", "в этой статье мы рассмотрим".
- Короткие плотные абзацы 3-6 предложений, иногда нумерованные перечисления; заголовки H2/H3 разрешены.

Что делать:
1. Возьми ИСХОДНУЮ статью как основу — это голос автора, его сохраняем.
2. Применяй ТОЛЬКО одобренные правки (список ниже). Не вноси других изменений.
3. Если правка точечная (есть original) — замени фрагмент аккуратно, переплавив формулировку в авторский голос, а не вставляя её механически.
4. Если правка глобальная (original пуст) — внеси изменение в подходящем месте, сохранив стиль.
5. Сохраняй структуру и порядок изложения автора; не переставляй разделы без явной правки на это.
6. Не сокращай и не «упрощай для читателя» — пиши как профессор.

ВЕРНИ СТРОГО JSON без markdown:
{ "rewritten": "полный текст переписанной статьи с сохранёнными абзацами через \\n\\n" }`;

const ARBITER_SYSTEM = `Ты — главный редактор-арбитр. Получи исходную статью и несколько рецензий разных моделей с предлагаемыми правками. 
Сведи всё в КОНСОЛИДИРОВАННЫЙ список правок.

ВЕРНИ СТРОГО JSON:
{
  "summary": "1-3 абзаца итогового мнения консилиума: что хорошо, что критично, общая рекомендация.",
  "edits": [
    {
      "id": "e1",
      "category": "fact|style|structure|seo|terminology|safety",
      "original": "цитата из статьи или ''",
      "suggested": "финальная формулировка замены",
      "rationale": "почему",
      "supporting_models": ["модель1", "модель2"],
      "status": "consensus" | "majority" | "single" | "disputed",
      "severity": "low|medium|high"
    }
  ]
}

Правила консолидации:
- Объедини правки, говорящие об одном и том же фрагменте/проблеме (разные формулировки → одна, лучшая).
- "consensus" — все или почти все согласны; "majority" — ≥2 модели; "single" — только одна; "disputed" — модели предлагают противоречащие варианты (опиши свой выбор в rationale).
- Сортируй по severity (high → low), затем по статусу.
- НЕ выдумывай правок, которых не было ни в одной рецензии.
- Не теряй одиночные, но важные правки: терминологические и фактические замечания со статусом single тоже включай.
- Если рецензии пустые/мусорные — верни edits:[] и summary с объяснением.`;

type CallPurpose = "review" | "consolidate" | "rewrite";

function maxTokensForPurpose(purpose: CallPurpose): number {
  if (purpose === "rewrite") return 24_000;
  if (purpose === "consolidate") return 16_000;
  return 16_000;
}

function callModelOnce(
  openrouterKey: string,
  veniceKey: string | undefined,
  origin: string,
  model: string,
  messages: unknown[],
  temperature: number,
  opts: { useReasoning: boolean; useJsonObject: boolean; useThroughput: boolean; maxTokens?: number },
): Promise<string> {
  const isVenice = model.startsWith("venice/");
  const url = isVenice
    ? "https://api.venice.ai/api/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";
  const realModel = isVenice ? model.slice("venice/".length) : model;
  const key = isVenice ? veniceKey : openrouterKey;
  if (!key) throw new Error(isVenice ? "VENICE_API_KEY missing" : "OPENROUTER_API_KEY missing");
  const payload: Record<string, unknown> = { model: realModel, messages, temperature };
  if (opts.maxTokens) payload.max_tokens = opts.maxTokens;
  if (!isVenice) {
    // Многие reasoning-модели при effort=low уводят ответ в reasoning tokens
    // и отдают пустой content. Для известных проблемных семейств не форсируем.
    const skipReasoning = /^(google\/gemini-.*-pro|deepseek\/|xiaomi\/|x-ai\/grok-4)/.test(realModel);
    if (opts.useReasoning && !skipReasoning) {
      payload.reasoning = { effort: "low" };
    }
    if (opts.useThroughput) payload.provider = { sort: "throughput" };
    const supportsJsonObject =
      !/^(perplexity|moonshotai|deepseek|x-ai|z-ai|xiaomi)\//.test(realModel);
    if (opts.useJsonObject && supportsJsonObject) {
      payload.response_format = { type: "json_object" };
    }
  } else {
    payload.venice_parameters = { include_venice_system_prompt: false };
  }
  // Per-request timeout: без него провайдер (например, xiaomi/mimo) может
  // висеть бесконечно и вешать весь Promise.all — функцию потом убивает runtime,
  // и в UI это выглядит как «анализ застрял».
  const ac = new AbortController();
  const timeoutMs = 170_000;

  const timer = setTimeout(() => ac.abort(), timeoutMs);
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(isVenice ? {} : { "HTTP-Referer": origin, "X-Title": "Tarusin Article Orchestrator" }),
    },
    body: JSON.stringify(payload),
    signal: ac.signal,
  }).then(async (r) => {
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status}: ${t.slice(0, 400)}`);
    }
    const j = await r.json();
    const msg = j?.choices?.[0]?.message ?? {};
    const finish = String(j?.choices?.[0]?.finish_reason ?? "unknown");
    let content: unknown = msg.content;
    if (Array.isArray(content)) {
      content = content.map((p: any) => p?.text ?? "").join("").trim();
    }
    if ((typeof content !== "string" || !content.trim()) && typeof msg.reasoning === "string") {
      content = msg.reasoning;
    }
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`empty content (finish_reason=${finish})`);
    }
    if (/length|max[_-]?tokens/i.test(finish)) {
      console.warn(`[orchestrator] model hit output limit`, JSON.stringify({ model, finish, max_tokens: opts.maxTokens ?? null }));
    }
    return content;
  }).catch((e: any) => {
    if (e?.name === "AbortError") throw new Error(`timeout after ${timeoutMs / 1000}s`);
    throw e;
  }).finally(() => clearTimeout(timer));

}

async function callModel(
  openrouterKey: string,
  veniceKey: string | undefined,
  origin: string,
  model: string,
  messages: unknown[],
  temperature = 0.3,
  purpose: CallPurpose = "review",
): Promise<string> {
  // Постепенно ослабляем параметры — особенно для DeepSeek/MiMo/Grok,
  // которые часто падают на reasoning / json_object / throughput-роутинге.
  const maxTokens = maxTokensForPurpose(purpose);
  const attempts: Array<{ useReasoning: boolean; useJsonObject: boolean; useThroughput: boolean; maxTokens?: number }> = [
    { useReasoning: true,  useJsonObject: true,  useThroughput: true,  maxTokens },
    { useReasoning: false, useJsonObject: true,  useThroughput: false, maxTokens: Math.min(maxTokens, 12_000) },
    { useReasoning: false, useJsonObject: false, useThroughput: false, maxTokens: Math.min(maxTokens, 8_000) },
  ];
  let lastErr: any = null;
  for (let i = 0; i < attempts.length; i++) {
    try {
      return await callModelOnce(openrouterKey, veniceKey, origin, model, messages, temperature, attempts[i]);
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      // Ретраим только «мягкие» ошибки формата запроса или пустой контент.
      // Таймауты, 5xx и сетевые обрывы — терминальные: нет смысла тратить ещё 2×240с.
      const retryable = /empty content|HTTP 4\d\d|INVALID_REQUEST_BODY/i.test(msg)
        && !/timeout after/i.test(msg);
      if (!retryable) break;
      console.warn(`[orchestrator] retry ${i + 1} for ${model}: ${msg.slice(0, 160)}`);
    }
  }
  throw lastErr ?? new Error("callModel failed");
}


function tryParseJson(s: string): any {
  const cleaned = s
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    if (start >= 0) {
      let depth = 0;
      let inString = false;
      let escape = false;
      for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        if (depth === 0) {
          const candidate = cleaned.slice(start, i + 1).replace(/,\s*([}\]])/g, "$1");
          try { return JSON.parse(candidate); } catch { break; }
        }
      }
    }
    return null;
  }
}

function normalizeReview(parsed: any): { free_review: string; edits: any[] } | null {
  if (!parsed || typeof parsed !== "object") return null;
  const edits = Array.isArray(parsed.edits)
    ? parsed.edits
        .filter((e: any) => e && typeof e === "object")
        .map((e: any) => ({
          category: String(e.category || "style"),
          original: String(e.original || ""),
          suggested: String(e.suggested || ""),
          rationale: String(e.rationale || ""),
          severity: ["low", "medium", "high"].includes(String(e.severity)) ? String(e.severity) : "medium",
        }))
        .filter((e: any) => e.suggested || e.rationale)
        .slice(0, 20)
    : [];
  return { free_review: String(parsed.free_review || parsed.summary || ""), edits };
}

function jsonKeepaliveResponse(
  task: () => Promise<unknown>,
  opts?: { successStatus?: number; errorStatus?: number },
): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (s: string) => {
        if (!closed) {
          try { controller.enqueue(enc.encode(s)); } catch { /* closed */ }
        }
      };
      send("\n");
      const keepalive = setInterval(() => send(" \n"), 5000);
      try {
        const payload = await task();
        send(JSON.stringify(payload));
      } catch (e: any) {
        console.error("orchestrate-article streamed json error", e?.message || String(e));
        send(JSON.stringify({ error: e?.message || String(e) }));
      } finally {
        clearInterval(keepalive);
        closed = true;
        try { controller.close(); } catch { /* ignore */ }
      }
    },
  });

  return new Response(stream, {
    status: opts?.successStatus ?? 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function callReviewModel(
  openrouterKey: string,
  veniceKey: string | undefined,
  origin: string,
  model: string,
  messages: unknown[],
  text: string,
): Promise<{ raw: string; review: { free_review: string; edits: any[] } | null; repaired: boolean }> {
  const raw = await callModel(openrouterKey, veniceKey, origin, model, messages, 0.2, "review");
  const first = normalizeReview(tryParseJson(raw));
  if (first && first.edits.length > 0) return { raw, review: first, repaired: false };

  const repairMessages = [
    { role: "system", content: REVIEW_SYSTEM },
    {
      role: "user",
      content: [
        "Предыдущий ответ не дал полноценный JSON со списком правок. Сделай финальный редакторский вывод заново.",
        "Верни только JSON. Обязательно заполни edits: 8-15 конкретных правок, если текст не идеален.",
        "Сфокусируйся на терминологии, фактах, структуре, ясности для родителей, SEO и безопасности формулировок.",
        "СТАТЬЯ:",
        text,
      ].join("\n\n"),
    },
  ];
  const repairedRaw = await callModel(openrouterKey, veniceKey, origin, model, repairMessages, 0.1, "review");
  return { raw: repairedRaw, review: normalizeReview(tryParseJson(repairedRaw)), repaired: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // admin only
    const { data: role } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", claims.claims.sub).eq("role", "admin").maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const veniceKey = Deno.env.get("VENICE_API_KEY");
    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.action !== "string") {
      return new Response(JSON.stringify({ error: "action required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const origin = req.headers.get("origin") ?? "https://tarusin.pro";

    // Работаем ТОЛЬКО с актуальной (загруженной) статьёй. Никаких внешних образцов стиля не подгружаем.
    const styleBlock = "";


    if (body.action === "review") {
      const text: string = String(body.text || "").trim();
      const title: string = String(body.title || "").trim();
      const models: string[] = Array.isArray(body.models)
        ? body.models
            .map((m: unknown) => String(m || "").trim())
            .filter(Boolean)
            .slice(0, 12)
        : [];
      if (!text || text.length < 50) {
        return new Response(JSON.stringify({ error: "text too short" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!models.length) {
        return new Response(JSON.stringify({ error: "models required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const appliedEdits: any[] = Array.isArray(body.applied_edits) ? body.applied_edits.slice(0, 50) : [];
      const appliedBlock = appliedEdits.length
        ? "УЖЕ ПРИНЯТЫЕ И ВНЕСЁННЫЕ В СТАТЬЮ ПРАВКИ (НЕ ПРЕДЛАГАЙ ИХ ПОВТОРНО, не критикуй их формулировки):\n" +
          appliedEdits.map((e: any, i: number) =>
            `${i + 1}. [${e.category || "edit"}] ${e.original ? `«${String(e.original).slice(0,120)}» → ` : ""}${String(e.suggested || "").slice(0,200)}`
          ).join("\n")
        : "";

      const userMsg = [
        title ? `ЗАГОЛОВОК: ${title}` : "",
        "СТАТЬЯ (на ревью):",
        text,
        appliedBlock,
        styleBlock,
      ].filter(Boolean).join("\n\n");

      const messages = [
        { role: "system", content: REVIEW_SYSTEM },
        { role: "user", content: userMsg },
      ];

      const stream = new ReadableStream({
        async start(controller) {
          const enc = new TextEncoder();
          const send = (line: string) => { try { controller.enqueue(enc.encode(line)); } catch { /* closed */ } };
          send(`: orchestrator-start\n\n`);
          const keepalive = setInterval(() => send(`: ping\n\n`), 5000);

          await Promise.all(models.map(async (model) => {
            const t0 = Date.now();
            send(`event: model_start\ndata: ${JSON.stringify({ model, started_at: t0 })}\n\n`);
            try {
              const { raw, review, repaired } = await callReviewModel(openrouterKey, veniceKey, origin, model, messages, text);
              const ms = Date.now() - t0;
              const payload = review
                ? { model, free_review: review.free_review, edits: review.edits, ms, repaired }
                : { model, free_review: raw.slice(0, 2000), edits: [], parse_error: true, ms };
              console.log("[orchestrator] ok", JSON.stringify({ model, ms, edits: payload.edits.length }));
              send(`event: model_done\ndata: ${JSON.stringify(payload)}\n\n`);
            } catch (e: any) {
              const ms = Date.now() - t0;
              console.error("[orchestrator] fail", JSON.stringify({ model, err: e?.message || String(e) }));
              send(`event: model_done\ndata: ${JSON.stringify({ model, free_review: "", edits: [], error: e?.message || String(e), ms })}\n\n`);
            }
          }));

          clearInterval(keepalive);
          send(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`);
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    if (body.action === "consolidate") {
      const text: string = String(body.text || "").trim();
      const reviews = Array.isArray(body.reviews) ? body.reviews : [];
      const arbiter: string = String(body.arbiter || "anthropic/claude-opus-4-8");
      if (!text || !reviews.length) {
        return new Response(JSON.stringify({ error: "text and reviews required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const reviewsBlock = reviews.map((r: any, i: number) => (
        `--- РЕВЬЮ #${i + 1} [${r.model}] ---\n` +
        `FREE_REVIEW: ${r.free_review || ""}\n` +
        `EDITS: ${JSON.stringify(r.edits || [], null, 0)}`
      )).join("\n\n");

      const userMsg = [
        "ИСХОДНАЯ СТАТЬЯ:",
        text,
        "",
        "РЕЦЕНЗИИ МОДЕЛЕЙ:",
        reviewsBlock,
      ].join("\n");

      const messages = [
        { role: "system", content: ARBITER_SYSTEM },
        { role: "user", content: userMsg },
      ];
      return jsonKeepaliveResponse(async () => {
        const raw = await callModel(openrouterKey, veniceKey, origin, arbiter, messages, 0.2, "consolidate");
        const parsed = tryParseJson(raw);
        if (!parsed) {
          return { error: "arbiter returned non-JSON", raw: raw.slice(0, 1000) };
        }
        return { consolidated: parsed, arbiter };
      });
    }

    if (body.action === "rewrite") {
      const text: string = String(body.text || "").trim();
      const editsAccepted = Array.isArray(body.edits) ? body.edits : [];
      const rewriter: string = String(body.rewriter || "anthropic/claude-opus-4-8");
      if (!text || !editsAccepted.length) {
        return new Response(JSON.stringify({ error: "text and accepted edits required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const editsBlock = editsAccepted.map((e: any, i: number) => (
        `[${i + 1}] (${e.category || "edit"}${e.severity ? ", " + e.severity : ""})\n` +
        (e.original ? `   ORIGINAL: «${e.original}»\n` : `   (глобальная правка)\n`) +
        `   ПРАВКА: ${e.suggested || ""}\n` +
        (e.rationale ? `   ОБОСНОВАНИЕ: ${e.rationale}` : "")
      )).join("\n\n");
      const userMsg = [
        "ИСХОДНАЯ СТАТЬЯ (сохраняем голос автора):",
        text,
        "",
        "ОДОБРЕННЫЕ ПРАВКИ (применить и переплавить в авторский стиль):",
        editsBlock,
        styleBlock,
      ].filter(Boolean).join("\n");
      return jsonKeepaliveResponse(async () => {
        const raw = await callModel(openrouterKey, veniceKey, origin, rewriter, [
          { role: "system", content: REWRITE_SYSTEM },
          { role: "user", content: userMsg },
        ], 0.4, "rewrite");
        const parsed = tryParseJson(raw);
        const rewritten = parsed && typeof parsed.rewritten === "string" ? parsed.rewritten : null;
        if (!rewritten) {
          return { error: "rewriter returned non-JSON or empty", raw: raw.slice(0, 1000) };
        }
        return { rewritten, rewriter, applied: editsAccepted.length };
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("orchestrate-article error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
