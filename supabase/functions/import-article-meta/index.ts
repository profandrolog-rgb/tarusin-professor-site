import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin only");

    const { text, filename } = await req.json();
    if (!text) throw new Error("text required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const trimmed = String(text).slice(0, 16000);

    const systemPrompt = `Ты помощник редактора медицинского сайта детского уролога-андролога. По тексту статьи извлеки SEO-метаданные. Отвечай СТРОГО в JSON без markdown, без пояснений.

Поля:
- title: короткий заголовок (до 80 символов, на русском, без кавычек)
- slug: латиница, нижний регистр, дефисы, без диакритики, до 60 символов, транслитерируй с русского
- excerpt: краткая аннотация 1-2 предложения (до 200 символов)
- keywords: массив 6-10 SEO-ключей на русском (фразы 1-4 слова)
- category: одно из ["general","urology","andrology","surgery","endocrinology","psychology","sexology","genetics"]
- age_group: "children" или "adults"`;

    const userPrompt = `Имя файла: ${filename || "без имени"}\n\nТекст:\n${trimmed}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      if (resp.status === 429) throw new Error("AI занят, повторите позже");
      if (resp.status === 402) throw new Error("AI кредиты исчерпаны");
      throw new Error(`AI ошибка: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    // sanitize slug
    if (parsed.slug) {
      parsed.slug = String(parsed.slug)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    }
    if (!Array.isArray(parsed.keywords)) parsed.keywords = [];

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
