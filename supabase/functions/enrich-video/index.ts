// Черновик описаний/SEO для видео. Пишет ТОЛЬКО в videos.ai_draft.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { callWithFallback } from "../_shared/aiCallWithFallback.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PRIMARY = "google/gemini-3-flash-preview";
const FALLBACK = "google/gemini-2.5-flash";

const SYSTEM = `Ты — медицинский редактор сайта детского уролога-андролога, профессора Тарусина Д.И.
Ты готовишь ЧЕРНОВИК карточки видео на русском языке.

Правила:
- Обращайся к родителю или взрослому пациенту без медицинского образования. Просто, спокойно, без запугивания.
- КАТЕГОРИЧЕСКИ запрещено: назначения, дозировки, схемы лечения, названия конкретных препаратов как рекомендация.
- suggested_title — короткое цепкое название по СОДЕРЖАНИЮ расшифровки. Имя файла может быть бессмысленным (IMG_4471.mp4) — не опирайся на него.
- suggested_slug — транслитерация названия латиницей, строчными, слова через дефис, без лишних символов.
- summary_short — 1–2 предложения для карточки.
- summary_plain — 3–4 предложения простым языком.
- seo_title — до 60 символов включительно.
- seo_description — строго 150–160 символов.
- faq_questions — 3–6 вопросов ровно в той форме, как их задал бы пациент.
- symptom_phrases — 5–10 разговорных формулировок жалобы.
- confidence — число от 0 до 1.

Возвращай ТОЛЬКО JSON без markdown-обёртки.`;

const RUBRICS = [
  "ostraya-bol", "razvitie-malchika", "yaichki", "gigiena", "gorshok", "polovoy-chlen",
  "erektsiya-seks", "muzhskoe-zdorovie", "zachatie", "obsledovaniya", "operatsiya-narkoz", "professor",
];
const AUDIENCE = ["roditelyam", "podrostki", "vzroslym", "vracham", "zhenshchinam"];
const AGES = ["0-3", "4-6", "7-11", "12-17", "18-45", "45+"];

function extractJson(text: string): any {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Модель вернула не-JSON");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { video_id } = await req.json().catch(() => ({}));
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SVC);
    const { data: video, error } = await sb
      .from("videos")
      .select("id, title, transcript, video_url")
      .eq("id", video_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!video) throw new Error("Видео не найдено");

    const transcript = (video.transcript || "").slice(0, 24000);
    const basis = transcript
      ? `Расшифровка видео:\n${transcript}`
      : `Расшифровки нет. Опирайся только на рабочее название: «${video.title}».`;

    const prompt = `${basis}

Доступные рубрики (выбери одну slug): ${RUBRICS.join(", ")}
Доступная аудитория: ${AUDIENCE.join(", ")}
Возрастные группы: ${AGES.join(", ")}

Верни JSON строго такой формы:
{"suggested_title":"","suggested_slug":"","summary_short":"","summary_plain":"","seo_title":"","seo_description":"","faq_questions":[],"symptom_phrases":[],"suggested_rubric":"","suggested_subrubric":"","suggested_tags":[],"suggested_audience":[],"suggested_age_groups":[],"confidence":0.0}`;

    const { json, modelUsed } = await callWithFallback({
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY },
      primary: PRIMARY,
      fallback: FALLBACK,
      label: "enrich-video",
      buildBody: (model) => ({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    const content = json?.choices?.[0]?.message?.content ?? "";
    const draft = extractJson(String(content));
    draft.generated_at = new Date().toISOString();
    draft.model = modelUsed;
    draft.based_on = transcript ? "transcript" : "title";

    const { error: upErr } = await sb.from("videos").update({ ai_draft: draft }).eq("id", video_id);
    if (upErr) throw new Error(upErr.message);

    return new Response(JSON.stringify({ ai_draft: draft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enrich-video", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ошибка" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
