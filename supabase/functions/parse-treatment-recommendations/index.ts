// Parses a free-text fragment with treatment recommendations into structured items
// distributed into TreatmentPlanEditor sections.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SECTION_KEYS = [
  "iv_drip", "iv_bolus", "im", "sc",
  "oral_rx", "oral_supplement", "rectal", "topical",
  "nasal", "sublingual", "peptide", "procedure",
  "lifestyle", "homeopathy", "physiotherapy",
  "examination", "referral",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
    const { data: isAdmin } = await supabaseUser.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string") throw new Error("text is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Ты — медицинский парсер. Извлеки из текста ВСЕ конкретные назначения (медикаменты, БАД, процедуры, физиотерапия, диета/образ жизни, гомеопатия, пептиды) и распредели их по секциям листа назначений.

Отвечай СТРОГО валидным JSON без markdown, в формате:
{
  "items": [
    {
      "section_category": "<одно из: ${SECTION_KEYS.join(", ")}>",
      "name": "название препарата/процедуры/рекомендации",
      "dose": <число или null>,
      "dose_unit": "мг|мкг|мл|МЕ|капли|таб|null",
      "frequency": "1 р/сут | 2 р/сут | 3 р/сут | по требованию | null",
      "duration_days": <число дней или null>,
      "time_of_day": ["утро","обед","вечер","перед сном","натощак","после еды"],
      "route_hint": "перорально|в/в|в/м|п/к|накожно|... |null",
      "notes": "дополнительные указания: схема, особенности, off-label, null если нет"
    }
  ]
}

Правила распределения:
- Капельницы (в/в капельно, инфузия) → iv_drip
- Внутривенно струйно → iv_bolus
- В/м инъекции → im
- П/к инъекции → sc
- Таблетки/капсулы/сиропы Rx → oral_rx
- БАД, витамины, нутрицевтики → oral_supplement
- Свечи → rectal
- Мази, кремы, гели → topical
- Спреи в нос, капли в нос → nasal
- Под язык → sublingual
- Пептидные препараты (любой путь) → peptide
- Массаж, мануальная, ЛФК, операции, манипуляции → procedure
- Диета, режим, сон, физ.активность → lifestyle
- Гомеопатические препараты (с потенцией C, D, M, LM) → homeopathy
- Магнит, лазер, УВЧ, электрофорез, УЗТ, амплипульс → physiotherapy
- Лабораторные анализы (кровь, моча, гормоны, биохимия), инструментальная диагностика (УЗИ, КТ, МРТ, рентген, ЭКГ, допплер, эхо) → examination
- Направление к специалисту (эндокринолог, кардиолог, невролог и т.п.), консультация врача → referral

Если препарат упомянут вскользь без конкретики — всё равно извлеки его с null-полями.
Если ничего не извлекается — верни {"items": []}.
Сохраняй точное название из текста.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Извлеки назначения из фрагмента:\n\n${text}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов" }), {
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

    let parsed: any;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Не удалось разобрать ответ AI");
    }

    // Validate items: drop unknown sections, coerce types
    const items = Array.isArray(parsed.items) ? parsed.items.filter((it: any) =>
      it && typeof it.name === "string" && it.name.trim() && SECTION_KEYS.includes(it.section_category)
    ).map((it: any) => ({
      section_category: it.section_category,
      name: String(it.name).trim(),
      dose: typeof it.dose === "number" ? it.dose : (it.dose ? parseFloat(String(it.dose).replace(",", ".")) || null : null),
      dose_unit: it.dose_unit || null,
      frequency: it.frequency || null,
      duration_days: typeof it.duration_days === "number" ? it.duration_days : (it.duration_days ? parseInt(String(it.duration_days)) || null : null),
      time_of_day: Array.isArray(it.time_of_day) ? it.time_of_day : [],
      route_hint: it.route_hint || null,
      notes: it.notes || null,
    })) : [];

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-treatment-recommendations error:", e);
    return new Response(
      JSON.stringify({ error: "Не удалось распознать назначения" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
