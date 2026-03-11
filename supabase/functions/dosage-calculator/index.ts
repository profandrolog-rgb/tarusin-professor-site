import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Admin role check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabaseUser.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
  "practical_dosing": [
    {
      "form": "название формы (например 'Суспензия 125 мг/5 мл')",
      "single_dose_practical": "практическая разовая доза (например '8 мл')",
      "calculation_detail": "пояснение расчёта (например '200 мг ÷ 125 мг × 5 мл = 8 мл')"
    },
    {
      "form": "Таблетки 500 мг",
      "single_dose_practical": "1/2 таблетки",
      "calculation_detail": "200 мг ÷ 500 мг = 0.4 → округление вверх = 1/2 таблетки"
    },
    {
      "form": "Раствор для инъекций 250 мг/мл (ампула 2 мл)",
      "single_dose_practical": "0.8 мл",
      "calculation_detail": "200 мг ÷ 250 мг/мл = 0.8 мл"
    }
  ],
  "notes": "важные примечания (взаимодействия, особенности приёма у детей)"
}

ВАЖНО:
- ВСЕГДА рассчитывай дозу, даже если препарат противопоказан (off-label назначение). Установи is_contraindicated=true и объясни почему, но проведи полный расчёт.
- Если есть возрастные ограничения — укажи min_age_allowed и предупреди
- В practical_dosing перечисли ВСЕ доступные лекарственные формы препарата с конкретным пересчётом разовой дозы:
  - Для таблеток: укажи долю таблетки (1/4, 1/2, 1 и т.д.), округляя ВВЕРХ до ближайшей удобной доли
  - Для растворов/суспензий/сиропов: укажи объём в мл с точностью до 0.1 мл
  - Для ампул: укажи объём в мл для набора в шприц
  - Для каждой формы покажи формулу пересчёта
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
