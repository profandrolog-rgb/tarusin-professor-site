// Проверка орфографии, пунктуации, согласования и опечаток в научно-медицинском тексте.
// Не считает ошибкой специализированную терминологию (анатомия, эмбриология, эндокринология, лат./англ.).
// Модель: SPELLCHECK_MODEL → RESEARCH_AI_MODEL → default.

import { corsHeaders } from "../_shared/cors.ts";
import { callWithFallback, extractCompletion } from "../_shared/aiCallWithFallback.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const PRIMARY_MODEL =
  Deno.env.get("SPELLCHECK_MODEL") ||
  Deno.env.get("RESEARCH_AI_MODEL") ||
  "anthropic/claude-sonnet-4.8";
const FALLBACK_MODEL = Deno.env.get("RESEARCH_AI_MODEL") || "google/gemini-3.1-pro-preview";

function stripHtml(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { text, html } = await req.json();
    const raw = String(text || (html ? stripHtml(html) : "") || "").trim();
    if (!raw) {
      return new Response(JSON.stringify({ issues: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lovKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovKey) throw new Error("LOVABLE_API_KEY missing");

    const system = `Ты — корректор научно-медицинского текста на русском языке.
Проверяй только: орфографию, пунктуацию, согласование слов и опечатки.
НЕ считай ошибкой:
- медицинскую, анатомическую, эмбриологическую, эндокринологическую и урологическую терминологию;
- латинские и англоязычные термины, аббревиатуры, названия генов, гормонов, синдромов;
- стилистику, порядок слов, длину предложений;
- маркеры вида [M1], [M2], [1], [2] и HTML-теги.

Верни СТРОГО валидный JSON без пояснений и без markdown:
{"issues":[{"fragment":"как в тексте","correction":"как правильно","type":"орфография|пунктуация|согласование|опечатка","explanation":"кратко"}]}
- fragment — точная подстрока из текста (короткая, с минимальным контекстом, уникально идентифицируемая).
- Если ошибок нет — верни {"issues":[]}.`;

    const buildBody = (model: string) => ({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: raw.slice(0, 40000) },
      ],
    });

    const { json, modelUsed } = await callWithFallback({
      url: GATEWAY_URL,
      headers: { Authorization: `Bearer ${lovKey}` },
      buildBody,
      primary: PRIMARY_MODEL,
      fallback: FALLBACK_MODEL,
      timeoutMs: 90_000,
      label: "text-spellcheck",
    });

    const content = extractCompletion(json);
    let parsed: any = {};
    try {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : content);
    } catch {
      parsed = { issues: [] };
    }
    const issues = Array.isArray(parsed.issues) ? parsed.issues.filter((i: any) => i?.fragment && i?.correction) : [];

    return new Response(JSON.stringify({ issues, model: modelUsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "spellcheck failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
