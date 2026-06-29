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

ВЕРНИ СТРОГО JSON-объект без markdown-обрамления:
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
- Максимум 12 правок, только конкретные и применимые.
- "original" должно дословно встречаться в тексте (для последующего поиска).
- Не предлагай косметику, если есть содержательные проблемы.
- Не добавляй дисклеймеров «обратитесь к врачу» — это статья профессора.
- Если статья хороша — верни 1-3 минимальные правки и честный free_review.`;

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
- Если рецензии пустые/мусорные — верни edits:[] и summary с объяснением.`;

function callModel(
  openrouterKey: string,
  veniceKey: string | undefined,
  origin: string,
  model: string,
  messages: unknown[],
  temperature = 0.3,
): Promise<string> {
  const isVenice = model.startsWith("venice/");
  const url = isVenice
    ? "https://api.venice.ai/api/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";
  const realModel = isVenice ? model.slice("venice/".length) : model;
  const key = isVenice ? veniceKey : openrouterKey;
  if (!key) throw new Error(isVenice ? "VENICE_API_KEY missing" : "OPENROUTER_API_KEY missing");
  const payload: Record<string, unknown> = {
    model: realModel,
    messages,
    temperature,
  };
  if (!isVenice) {
    payload.reasoning = { effort: "low" };
    payload.provider = { sort: "throughput" };
    payload.response_format = { type: "json_object" };
  } else {
    payload.venice_parameters = { include_venice_system_prompt: false };
  }
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(isVenice ? {} : { "HTTP-Referer": origin, "X-Title": "Tarusin Article Orchestrator" }),
    },
    body: JSON.stringify(payload),
  }).then(async (r) => {
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status}: ${t.slice(0, 400)}`);
    }
    const j = await r.json();
    const content = j?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("empty content");
    return content;
  });
}

function tryParseJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    // try to extract first { ... } block
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch { /* ignore */ }
    }
    return null;
  }
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

    // --- Образцы авторского голоса: подгружаем опубликованные статьи как style reference ---
    const stripHtml = (s: string) => String(s || "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    async function loadStyleSamples(limit = 3, perSampleChars = 1800): Promise<string> {
      try {
        const { data } = await supabase
          .from("disease_articles")
          .select("title, article_content, updated_at")
          .eq("is_published", true)
          .order("updated_at", { ascending: false })
          .limit(limit);
        const items = (data || [])
          .map((r: any) => ({ title: r.title || "", text: stripHtml(r.article_content || "") }))
          .filter((r) => r.text.length > 400);
        if (!items.length) return "";
        return items.map((r, i) => (
          `--- ОБРАЗЕЦ #${i + 1}: «${r.title}» ---\n${r.text.slice(0, perSampleChars)}`
        )).join("\n\n");
      } catch (e) {
        console.warn("loadStyleSamples failed", e);
        return "";
      }
    }
    const styleSamples = (body.action === "review" || body.action === "rewrite")
      ? await loadStyleSamples()
      : "";
    const styleBlock = styleSamples
      ? `\n\nЭТАЛОННЫЕ ОБРАЗЦЫ АВТОРСКОГО ГОЛОСА (опубликованные статьи профессора — используй как референс лексики, ритма, оборотов; НЕ копируй содержание):\n${styleSamples}`
      : "";

    if (body.action === "review") {
      const text: string = String(body.text || "").trim();
      const title: string = String(body.title || "").trim();
      const models: string[] = Array.isArray(body.models) ? body.models.slice(0, 8) : [];
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

      const userMsg = [
        title ? `ЗАГОЛОВОК: ${title}` : "",
        "СТАТЬЯ (на ревью):",
        text,
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
            try {
              const raw = await callModel(openrouterKey, veniceKey, origin, model, messages, 0.3);
              const parsed = tryParseJson(raw);
              const payload = parsed && typeof parsed === "object"
                ? { model, free_review: String(parsed.free_review || ""), edits: Array.isArray(parsed.edits) ? parsed.edits : [], raw: undefined }
                : { model, free_review: raw.slice(0, 2000), edits: [], parse_error: true };
              console.log("[orchestrator] ok", JSON.stringify({ model, ms: Date.now() - t0, edits: payload.edits.length }));
              send(`event: model_done\ndata: ${JSON.stringify(payload)}\n\n`);
            } catch (e: any) {
              console.error("[orchestrator] fail", JSON.stringify({ model, err: e?.message || String(e) }));
              send(`event: model_done\ndata: ${JSON.stringify({ model, free_review: "", edits: [], error: e?.message || String(e) })}\n\n`);
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
      try {
        const raw = await callModel(openrouterKey, veniceKey, origin, arbiter, messages, 0.2);
        const parsed = tryParseJson(raw);
        if (!parsed) {
          return new Response(JSON.stringify({ error: "arbiter returned non-JSON", raw: raw.slice(0, 1000) }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ consolidated: parsed, arbiter }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message || String(e) }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
      ].join("\n");
      try {
        const raw = await callModel(openrouterKey, veniceKey, origin, rewriter, [
          { role: "system", content: REWRITE_SYSTEM },
          { role: "user", content: userMsg },
        ], 0.4);
        const parsed = tryParseJson(raw);
        const rewritten = parsed && typeof parsed.rewritten === "string" ? parsed.rewritten : null;
        if (!rewritten) {
          return new Response(JSON.stringify({ error: "rewriter returned non-JSON or empty", raw: raw.slice(0, 1000) }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ rewritten, rewriter, applied: editsAccepted.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message || String(e) }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
