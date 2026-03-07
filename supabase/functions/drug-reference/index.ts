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
    const { medication_name } = await req.json();
    if (!medication_name) throw new Error("medication_name is required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const { data: cached } = await supabase
      .from("medication_digests")
      .select("*")
      .eq("medication_name", medication_name.toLowerCase().trim())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate via AI
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
            content: `Ты — фармацевтический справочник для врача-уролога/андролога. 
Отвечай СТРОГО в формате JSON без markdown. Язык — русский.
Формат ответа:
{
  "synonyms": "торговые названия через запятую",
  "pharmacological_group": "фармакологическая группа",
  "indications": "основные показания, кратко, через точку с запятой",
  "contraindications": "основные противопоказания, кратко, через точку с запятой",
  "dosage_info": "стандартные дозировки для взрослых и детей, кратко"
}
Давай только проверенную медицинскую информацию. Будь кратким — это дайджест.`,
          },
          {
            role: "user",
            content: `Дай краткую справку по препарату: ${medication_name}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (strip markdown code blocks if present)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Не удалось разобрать ответ AI");
    }

    // Cache in DB
    const digestRow = {
      medication_name: medication_name.toLowerCase().trim(),
      synonyms: parsed.synonyms || null,
      pharmacological_group: parsed.pharmacological_group || null,
      indications: parsed.indications || null,
      contraindications: parsed.contraindications || null,
      dosage_info: parsed.dosage_info || null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("medication_digests")
      .upsert(digestRow, { onConflict: "medication_name" })
      .select()
      .single();

    if (insertError) {
      console.error("Cache insert error:", insertError);
    }

    return new Response(JSON.stringify(inserted || digestRow), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("drug-reference error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
