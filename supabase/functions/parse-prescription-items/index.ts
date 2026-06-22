// Parses a free-text fragment into structured Rx items (form 107-1/у — one drug per blank).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const systemPrompt = `Ты — медицинский парсер для выписки рецептов формы 107-1/у. Извлеки из текста ВСЕ лекарственные препараты (только Rx — рецептурные ЛС и БАДы; исключи процедуры, физиотерапию, диету, образ жизни) и верни их по одному на бланк.

Отвечай СТРОГО валидным JSON без markdown, в формате:
{
  "items": [
    {
      "medication_ru_name": "название по-русски",
      "medication_latin_name": "Латинское название в Acc. Sg. (Tabulettae Paracetamoli / Solutionis ...) — для строки Rp:",
      "dosage_form": "tabletas | capsulas | solutio | unguentum | suppositoria | siropus | gtt.",
      "dose": "500 мг | 5 мл | 1% — дозировка единичной лекарственной формы",
      "quantity": <число — D.t.d. N, общее количество доз/упаковок>,
      "frequency": "по 1 таблетке 3 раза в день | по 5 мл 2 р/сут",
      "duration": "7 дней | 10 дней | 1 месяц",
      "signa": "дополнительные указания для S. (натощак, после еды, перед сном), null если нет"
    }
  ]
}

Правила:
- Один препарат = один объект в items.
- Если в тексте упомянуты БАДы и витамины — включай их (выписываются на том же бланке).
- НЕ включай: физиопроцедуры, массаж, ЛФК, диету, режим, операции, гомеопатию.
- medication_latin_name формулируй грамотно: "Tabulettae <Препарата> 0,5", "Solutionis <Препарата> 1% — 5 ml", "Capsulas <Препарата> 0,25" и т.д. Если не уверен — оставь русское название.
- quantity = разумное количество на курс (например 30 таб на 10 дней по 3 р/сут).
- Если данных нет — поле пустая строка "" (НЕ null), кроме signa.
- Если препаратов нет — верни {"items": []}.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Извлеки препараты из фрагмента:\n\n${text}` },
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

    const items = Array.isArray(parsed.items)
      ? parsed.items
          .filter((it: any) => it && (it.medication_latin_name || it.medication_ru_name))
          .map((it: any) => ({
            medication_ru_name: String(it.medication_ru_name || "").trim() || null,
            medication_latin_name: String(it.medication_latin_name || it.medication_ru_name || "").trim(),
            dosage_form: String(it.dosage_form || "").trim(),
            dose: String(it.dose || "").trim(),
            quantity: typeof it.quantity === "number" ? it.quantity : (parseInt(String(it.quantity)) || 1),
            frequency: String(it.frequency || "").trim(),
            duration: String(it.duration || "").trim(),
            signa: it.signa ? String(it.signa).trim() : null,
          }))
      : [];

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-prescription-items error:", e);
    return new Response(
      JSON.stringify({ error: "Не удалось распознать препараты" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
