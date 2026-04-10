import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin only");

    const { complaints, medical_history, patient_name } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const systemPrompt = `Вы — опытный детский андролог-уролог, ассистент профессора Тарусина Дмитрия Игоревича. 
Ваша задача — проанализировать жалобы и анамнез пациента и предоставить предварительную оценку.

ВАЖНО:
- Это ПРЕДВАРИТЕЛЬНАЯ оценка, которая будет проверена врачом
- Не ставьте окончательный диагноз
- Укажите возможные направления обследования
- Отметьте что требует срочного внимания
- Используйте профессиональную но понятную терминологию
- Структурируйте ответ: 1) Анализ жалоб 2) Предварительная оценка 3) Рекомендуемые обследования 4) На что обратить внимание

Формат ответа — структурированный текст на русском языке.`;

    const userMessage = `Пациент: ${patient_name || "не указан"}

Жалобы:
${complaints || "не указаны"}

Анамнез / история обращений:
${medical_history || "не указан"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Недостаточно средств для ИИ-анализа" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const assessment = data.choices?.[0]?.message?.content || "Не удалось получить оценку";

    return new Response(JSON.stringify({ assessment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-consultation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Внутренняя ошибка" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
