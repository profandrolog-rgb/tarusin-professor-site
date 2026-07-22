// interpret-metabolic-indices
// Кратко интерпретирует интегральные индексы (омега-3, AA/EPA, Holman, карнитины, андрогены).
// Кэширует итог в metabolic_maps.indices_interpretation (по хешу входа).
import { createClient } from "npm:@supabase/supabase-js@2";
import { callWithFallback, extractCompletion } from "../_shared/aiCallWithFallback.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = Deno.env.get("METABOLIC_INDICES_MODEL") || "google/gemini-2.5-flash";

async function sha256Hex(s: string) {
  const buf = new TextEncoder().encode(s);
  const d = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { patient_id, indices, patient_sex, force } = await req.json();
    if (!patient_id || !Array.isArray(indices)) {
      return new Response(JSON.stringify({ error: "patient_id and indices[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Cache lookup
    const key = await sha256Hex(JSON.stringify({ indices, patient_sex }));
    const { data: mm } = await svc.from("metabolic_maps").select("id, indices_interpretation").eq("patient_id", patient_id).maybeSingle();
    if (!force && mm?.indices_interpretation?.hash === key) {
      return new Response(JSON.stringify({ cached: true, ...mm.indices_interpretation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const system = `Ты — клинический интерпретатор интегральных индексов метаболизма (омега-3 профиль, карнитины, андрогены).
Опирайся ТОЛЬКО на переданные значения; ничего не выдумывай. Отвечай СТРОГО валидным JSON:
{ "groups": [ { "title": string, "indices": string[], "assessment": string, "actions": string } ] }
Группы: "Омега-жирные кислоты", "Карнитины", "Андрогены". Тон — коллега-эксперту, кратко, без дисклеймеров.`;

    const user = `Пол пациента: ${patient_sex || "не указан"}
Индексы:
${indices.map((i: any) => `- ${i.label || i.id}: ${i.displayValue ?? i.value ?? "—"}${i.unit ? " " + i.unit : ""}${i.target ? ` (цель ${i.target})` : ""}`).join("\n")}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: `AI ${resp.status}: ${text.slice(0, 300)}` }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    let parsed: any = {};
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}"); } catch { parsed = {}; }

    const payload = { hash: key, model: MODEL, generated_at: new Date().toISOString(), ...parsed };
    if (mm?.id) {
      await svc.from("metabolic_maps").update({ indices_interpretation: payload }).eq("id", mm.id);
    }
    return new Response(JSON.stringify({ cached: false, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interpret-metabolic-indices error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
