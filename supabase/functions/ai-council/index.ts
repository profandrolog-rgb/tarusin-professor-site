// AI Council: fan out the user's question to multiple strong models in parallel,
// then stream a synthesized summary from a summarizer model.
// Response: SSE.
//   event: answers   data: [{model,content,error}, ...]
//   data: {"delta":"..."}   (repeated, summary tokens)
//   data: [DONE]
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_PANEL = [
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-5",
  "google/gemini-2.5-pro",
  "x-ai/grok-4.3",
];
const DEFAULT_SUMMARIZER = "anthropic/claude-sonnet-4.5";

async function callOpenRouter(apiKey: string, origin: string, model: string, messages: unknown[]) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "Tarusin Council",
    },
    body: JSON.stringify({ model, messages, reasoning: { effort: "low" } }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}: ${t.slice(0, 500)}`);
  }
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("empty content");
  return content;
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
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const panel: string[] = Array.isArray(body.models) && body.models.length
      ? body.models.slice(0, 6)
      : DEFAULT_PANEL;
    const summarizerModel: string = typeof body.summarizer === "string" ? body.summarizer : DEFAULT_SUMMARIZER;
    const messages = body.messages;
    const origin = req.headers.get("origin") ?? "https://lovable.app";

    const userQuestion =
      [...messages].reverse().find((m: any) => m?.role === "user")?.content ?? "";
    const userQuestionText = typeof userQuestion === "string"
      ? userQuestion
      : Array.isArray(userQuestion)
        ? userQuestion.filter((p: any) => p?.type === "text").map((p: any) => p.text).join("\n")
        : "";

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        const send = (line: string) => controller.enqueue(enc.encode(line));

        // 1. Fan out in parallel
        const results = await Promise.all(panel.map(async (model) => {
          try {
            const content = await callOpenRouter(apiKey, origin, model, messages);
            return { model, content, error: null as string | null };
          } catch (e: any) {
            return { model, content: "", error: e?.message || String(e) };
          }
        }));

        send(`event: answers\ndata: ${JSON.stringify(results)}\n\n`);

        // 2. Summarize via SSE streaming
        const successful = results.filter((r) => !r.error && r.content);
        if (!successful.length) {
          send(`data: ${JSON.stringify({ delta: "⚠️ Все модели вернули ошибку." })}\n\n`);
          send(`data: [DONE]\n\n`);
          controller.close();
          return;
        }

        const synthPrompt = [
          "Ты — модератор консилиума. Получи исходный вопрос пользователя и ответы нескольких сильных моделей. " +
          "Сделай ОДИН итоговый ответ на русском: \n" +
          "1) Сначала дай согласованный, наиболее полный и точный ответ, объединяя сильные стороны.\n" +
          "2) Затем раздел «⚖️ Где модели расходятся» — кратко перечисли существенные расхождения (если их нет — напиши «расхождений нет»).\n" +
          "Не упоминай имена моделей в самом ответе, только в разделе расхождений.",
          "",
          "ИСХОДНЫЙ ВОПРОС:",
          userQuestionText,
          "",
          "ОТВЕТЫ МОДЕЛЕЙ:",
          ...successful.map((r) => `\n---\n[${r.model}]\n${r.content}`),
        ].join("\n");

        const synthResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": origin,
            "X-Title": "Tarusin Council Synth",
          },
          body: JSON.stringify({
            model: summarizerModel,
            messages: [{ role: "user", content: synthPrompt }],
            stream: true,
            reasoning: { effort: "low" },
          }),
        });

        if (!synthResp.ok || !synthResp.body) {
          const t = await synthResp.text().catch(() => "");
          send(`data: ${JSON.stringify({ delta: `⚠️ Ошибка суммаризатора: ${t.slice(0, 300)}` })}\n\n`);
          send(`data: [DONE]\n\n`);
          controller.close();
          return;
        }

        const reader = synthResp.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) send(`data: ${JSON.stringify({ delta })}\n\n`);
            } catch { /* partial */ }
          }
        }
        send(`data: [DONE]\n\n`);
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
  } catch (err) {
    console.error("ai-council error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
