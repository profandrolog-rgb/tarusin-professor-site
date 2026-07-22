import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callWithFallback, extractCompletion } from "../_shared/aiCallWithFallback.ts";


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

    const { complaints, medical_history, patient_name, patient_id, consultation_case_id } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    // Подтягиваем распознанные анализы, чтобы ИИ видел цифры, а не только текст жалоб.
    let labsBlock = "";
    try {
      const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      let q = svc.from("lab_results")
        .select("test_name, value, unit, reference_min, reference_max, test_date")
        .order("test_date", { ascending: false, nullsFirst: false })
        .limit(80);
      if (consultation_case_id) q = q.eq("consultation_case_id", consultation_case_id);
      else if (patient_id) q = q.eq("patient_id", patient_id);
      const { data: labs } = await q;
      if (labs && labs.length) {
        labsBlock = "\n\nЛабораторные данные:\n" + labs.map((l: any) => {
          const ref = (l.reference_min != null || l.reference_max != null)
            ? ` [норма ${l.reference_min ?? "?"}–${l.reference_max ?? "?"}]`
            : "";
          const date = l.test_date ? ` (${l.test_date})` : "";
          return `• ${l.test_name}: ${l.value ?? "—"} ${l.unit || ""}${ref}${date}`;
        }).join("\n");
      }
    } catch (e) {
      console.warn("analyze-consultation labs fetch failed:", e);
    }

    const systemPrompt = `Вы — опытный детский андролог-уролог, ассистент профессора Тарусина Дмитрия Игоревича. 
Ваша задача — проанализировать жалобы, анамнез и лабораторные данные пациента и предоставить предварительную оценку.

ВАЖНО:
- Это ПРЕДВАРИТЕЛЬНАЯ оценка, которая будет проверена врачом
- Не ставьте окончательный диагноз
- Опирайтесь на конкретные значения из лабораторных данных, если они переданы
- Отметьте что требует срочного внимания
- Используйте профессиональную но понятную терминологию
- Структурируйте ответ: 1) Анализ жалоб 2) Оценка лабораторных данных 3) Предварительная оценка 4) Рекомендуемые обследования 5) На что обратить внимание

Формат ответа — структурированный текст на русском языке.`;

    const userMessage = `Пациент: ${patient_name || "не указан"}

Жалобы:
${complaints || "не указаны"}

Анамнез / история обращений:
${medical_history || "не указан"}${labsBlock}`;

    const primaryModel = Deno.env.get("ANALYZE_CONSULTATION_MODEL") || "google/gemini-2.5-flash";
    const fallbackModel = Deno.env.get("ANALYZE_CONSULTATION_FALLBACK_MODEL") || "google/gemini-2.5-pro";

    let aiResult;
    try {
      aiResult = await callWithFallback({
        url: "https://ai.gateway.lovable.dev/v1/chat/completions",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
        primary: primaryModel,
        fallback: fallbackModel,
        timeoutMs: 120_000,
        label: "analyze-consultation",
        buildBody: (model) => ({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const m = msg.match(/HTTP (\d+)/);
      const status = m ? Number(m[1]) : 500;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Недостаточно средств для ИИ-анализа" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    const assessment = extractCompletion(aiResult.json) || "Не удалось получить оценку";


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
