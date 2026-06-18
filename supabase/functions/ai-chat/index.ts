// AI Chat proxy → OpenRouter with SSE streaming.
// Validates Supabase JWT, forwards {model, messages} to OpenRouter,
// streams chunks back to the client. OPENROUTER_API_KEY never leaves server.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_SYSTEM_PROMPT =
  "Ты — ассистент профессора Д. И. Тарусина: детского уролога-андролога, д.м.н., с 40-летним клиническим стажем. " +
  "Это закрытый профессиональный клинико-научный инструмент для специалиста, не для пациента. " +
  "Отвечай на уровне коллеги-эксперта: давай прямые, конкретные, доказательные ответы — включая дозы препаратов, диапазоны, схемы, протоколы, дифференциальный диагноз. " +
  "НЕ добавляй потребительские дисклеймеры, НЕ советуй «обратиться к специалисту» и НЕ отказывайся отвечать на клинические вопросы: собеседник сам является профильным специалистом и несёт профессиональную ответственность. " +
  "Будь конкретен, практичен, краток. Клинические нюансы (противопоказания, мониторинг, взаимодействия) указывай как коллега коллеге — по существу, а не как предостережение дилетанту.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.model !== "string" || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedModel = body.model === "x-ai/grok-4" ? "x-ai/grok-4.3" : body.model;
    const effort: "low" | "medium" | "high" =
      body.reasoning_effort === "high" || body.reasoning_effort === "medium"
        ? body.reasoning_effort
        : "low";
    const systemPrompt = typeof body.system === "string" && body.system.trim()
      ? body.system
      : DEFAULT_SYSTEM_PROMPT;
    const messagesWithSystem = [{ role: "system", content: systemPrompt }, ...body.messages];

    const requestPayload: Record<string, unknown> = {
      model: resolvedModel,
      messages: messagesWithSystem,
      stream: true,
      // OpenRouter unified reasoning control — works for GPT-5, Claude, Gemini, Grok
      reasoning: { effort },
      // Route to the fastest provider for the selected model (equivalent to :nitro)
      provider: { sort: "throughput" },
    };

    console.log("[ai-chat] request", JSON.stringify({
      user: claimsData.claims.sub,
      origin: req.headers.get("origin"),
      original_model: body.model,
      resolved_model: resolvedModel,
      messages_count: body.messages.length,
      messages_preview: body.messages.map((m: any) => ({
        role: m?.role,
        content_type: Array.isArray(m?.content) ? "array" : typeof m?.content,
        content_len: typeof m?.content === "string"
          ? m.content.length
          : Array.isArray(m?.content) ? m.content.length : 0,
      })),
    }));

    const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.get("origin") ?? "https://lovable.app",
        "X-Title": "Tarusin Cabinet AI",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("[ai-chat] openrouter response", JSON.stringify({
      status: orResp.status,
      ok: orResp.ok,
      content_type: orResp.headers.get("content-type"),
      has_body: !!orResp.body,
    }));

    if (!orResp.ok || !orResp.body) {
      const text = await orResp.text().catch(() => "");
      console.error("[ai-chat] OpenRouter error", JSON.stringify({
        status: orResp.status,
        model: resolvedModel,
        body_preview: text.slice(0, 2000),
        request_payload: {
          model: resolvedModel,
          messages_count: body.messages.length,
        },
      }));
      return new Response(JSON.stringify({
        error: "OpenRouter request failed",
        status: orResp.status,
        details: text.slice(0, 1000),
      }), {
        status: orResp.status === 429 ? 429 : orResp.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(orResp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("ai-chat error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
