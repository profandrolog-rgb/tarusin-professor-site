// clean-dictation: первичная редактура надиктованного текста через Claude Opus 4.8.
// Удаляет повторы, оговорки, лексические ошибки, сохраняет голос/интонации профессора.
// Никакого додумывания фактов. Возвращает { cleaned: string, model: string }.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Ты — литературный редактор профессора Тарусина. Тебе дана сырая голосовая диктовка статьи.
Задача — аккуратно «причесать» текст:
— убрать слова-паразиты, повторы, оговорки, фальстарты («э-э», «ну вот», «как бы», «то есть в общем», двойные начала фраз);
— исправить очевидные оговорки и лексические/грамматические ошибки распознавания речи (опечатки STT);
— восстановить пунктуацию и разбить на абзацы по смыслу;
— объединить разорванные фразы в связные предложения.

СТРОГИЕ ЗАПРЕТЫ:
— НИЧЕГО НЕ ДОБАВЛЯТЬ от себя: ни фактов, ни выводов, ни рекомендаций, ни вступлений «В данной статье…», ни заголовков, которых не было.
— НЕ ПЕРЕФРАЗИРОВАТЬ ради «литературности» — сохрани авторский голос, интонацию, профессиональные обороты, личные местоимения и стиль профессора.
— НЕ СОКРАЩАТЬ смысловые блоки.
— Не выдумывать дозировки, цифры, названия препаратов, фамилии, ссылки.
— Триггерные фразы вроде «собери статью», «заверши», «готово, собирай», «причеши текст» — это команды редактору, удали их из текста.

Верни ТОЛЬКО причесанный текст статьи, без преамбул, комментариев и markdown-обрамления.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { raw, dictationId } = await req.json();
    if (!raw || typeof raw !== "string" || raw.trim().length < 5) {
      return new Response(JSON.stringify({ error: "raw text is empty" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const model = "anthropic/claude-opus-4-8";
    const origin = req.headers.get("origin") || "https://tarusin.pro";

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "Tarusin.pro Dictation Cleanup",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Сырая диктовка:\n\n${raw}` },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `Cleaner HTTP ${resp.status}`, detail: errText.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await resp.json();
    const cleaned = String(json?.choices?.[0]?.message?.content ?? "").trim();
    if (!cleaned) {
      return new Response(JSON.stringify({ error: "empty cleaner response" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Сохраняем в БД, если передан dictationId (RLS отдаст только владельцу/админу)
    if (dictationId) {
      await supabase
        .from("article_dictations")
        .update({ cleaned_dictation: cleaned, cleaning_model: model, status: "cleaned" })
        .eq("id", dictationId);
    }

    return new Response(JSON.stringify({ cleaned, model }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
