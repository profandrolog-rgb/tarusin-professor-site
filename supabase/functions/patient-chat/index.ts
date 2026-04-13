import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Ты — виртуальный помощник на сайте профессора Д.И. Тарусина, основателя детской урологии-андрологии в России. Доктор медицинских наук, профессор, врач высшей категории с 42-летним стажем. Говори от имени помощника профессора, а не от третьего лица.

ПРАВИЛА:
1. Отвечай ТОЛЬКО на вопросы, связанные с детской урологией, андрологией, детским здоровьем мальчиков
2. НЕ ставь диагнозы и НЕ назначай лечение — всегда рекомендуй записаться на очную консультацию
3. Будь доброжелателен и эмпатичен — родители переживают за своих детей
4. Отвечай кратко (2-4 предложения), понятным языком без сложных терминов
5. При необходимости направляй на страницы сайта: /for-parents (статьи), /qa (частые вопросы), /contacts (запись)

КОНТАКТНАЯ ИНФОРМАЦИЯ:
- AVE-CLINIC: +7 (495) 374-81-81, с. Немчиновка, 3-я Запрудная ул. 16
- Клиника доктора Матара: +7 (495) 303-00-00, Москва, Коровинское шоссе д. 9 к. 2
- WhatsApp для записи: +7 (926) 600-555-0
- Приём только по предварительной записи

СПЕЦИАЛИЗАЦИЯ ПРОФЕССОРА:
- Крипторхизм (неопущение яичка)
- Варикоцеле
- Гипоспадия
- Фимоз и парафимоз
- Гидроцеле (водянка оболочек яичка)
- Паховые грыжи
- Микрохирургия
- УЗИ-диагностика

Если вопрос не по теме — вежливо объясни, что ты специализируешься на детской андрологии, и предложи задать вопрос по теме.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Сервис временно недоступен" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Ошибка сервиса" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("patient-chat error:", e);
    return new Response(
      JSON.stringify({ error: "Произошла ошибка. Попробуйте позже." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
