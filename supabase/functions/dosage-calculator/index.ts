import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { medication_name, age_years, age_months, weight_kg, height_cm } = await req.json();

    if (!medication_name) throw new Error("medication_name is required");
    if (!weight_kg && !age_years) throw new Error("weight_kg or age_years is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Calculate BSA if height and weight provided (Mosteller formula)
    let bsa: number | null = null;
    if (weight_kg && height_cm) {
      bsa = Math.round(Math.sqrt((height_cm * weight_kg) / 3600) * 100) / 100;
    }

    const childInfo = [
      age_years !== undefined ? `Возраст: ${age_years} лет${age_months ? ` ${age_months} мес` : ""}` : null,
      weight_kg ? `Вес: ${weight_kg} кг` : null,
      height_cm ? `Рост: ${height_cm} см` : null,
      bsa ? `ППТ (BSA): ${bsa} м²` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Ты — педиатрический фармаколог. Рассчитай дозу препарата для ребёнка.
Отвечай СТРОГО в JSON без markdown. Язык — русский.

Формат:
{
  "is_contraindicated": false,
  "contraindication_warning": "текст предупреждения, если противопоказан детям или данному возрасту",
  "min_age_allowed": "минимальный возраст применения (например '3 года', '6 месяцев', 'нет ограничений')",
  "single_dose": "разовая доза (мг или мл)",
  "daily_dose": "суточная доза",
  "frequency": "кратность приёма",
  "max_daily_dose": "максимальная суточная доза",
  "route": "путь введения",
  "duration": "рекомендуемая длительность курса",
  "calculation_method": "по весу (мг/кг) или по ППТ (мг/м²) или по возрасту",
  "formula_used": "формула расчёта, например '15 мг/кг × 20 кг = 300 мг'",
  "available_forms": "доступные лекарственные формы для детей (суспензия, сироп, таблетки и т.д.)",
  "notes": "важные примечания (взаимодействия, особенности приёма у детей)"
}

ВАЖНО:
- Если препарат противопоказан детям — установи is_contraindicated=true и объясни почему
- Если есть возрастные ограничения — укажи min_age_allowed и предупреди
- Используй актуальные данные фармакопеи РФ
- Если есть расчёт по ППТ — используй его для соответствующих препаратов
- Будь точен в дозировках, это медицинский расчёт`,
          },
          {
            role: "user",
            content: `Рассчитай детскую дозу препарата: ${medication_name}\nДанные ребёнка: ${childInfo}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Не удалось разобрать ответ AI");
    }

    // Add BSA to result
    if (bsa) parsed.bsa_calculated = bsa;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dosage-calculator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
