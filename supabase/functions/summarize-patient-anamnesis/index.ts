// summarize-patient-anamnesis
// Собирает предыдущие протоколы визитов пациента и через LLM формирует
// краткий связный анамнез для вставки в текущий протокол.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Ты — медицинский ассистент профессора Тарусина.
На основании предыдущих осмотров, УЗИ, анализов и планов лечения пациента составь КРАТКИЙ СВЯЗНЫЙ АНАМНЕЗ на русском для вставки в поле "Анамнез" нового протокола.

Правила:
— 4–10 предложений, литературный медицинский стиль, от третьего лица.
— Хронологически: давность заболевания, первое обращение, ключевые находки (УЗИ, лаборатория), проведённое лечение и его эффект, значимая динамика.
— Только факты из переданных данных. НИЧЕГО НЕ ВЫДУМЫВАЙ. Если данных нет — верни пустую строку.
— Без вводных «на основании анализа…», без markdown, без списков — сплошной текст.
— Не дублируй жалобы, не пиши рекомендации.`;

function fmtDate(v: unknown): string {
  if (!v) return "—";
  try { return new Date(String(v)).toISOString().slice(0, 10); } catch { return String(v); }
}

function trimStr(s: unknown, max = 400): string {
  const t = String(s ?? "").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authed = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsErr } = await authed.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const patientId: string | undefined = body?.patient_id;
    const excludeVisitId: string | undefined = body?.exclude_visit_id;
    const priorAnamnesis: string = String(body?.prior_anamnesis ?? "");
    if (!patientId) {
      return new Response(JSON.stringify({ error: "patient_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(url, service);

    const [patientRes, visitsRes, uzRes, labsRes, plansRes, diagRes] = await Promise.all([
      admin.from("patients").select("full_name, birth_date").eq("id", patientId).maybeSingle(),
      admin.from("patient_visits").select("id, visit_date, protocol_type, protocol_data").eq("patient_id", patientId).order("visit_date", { ascending: true }),
      admin.from("ultrasound_results").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
      admin.from("lab_results").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
      admin.from("treatment_plans").select("issued_at, created_at, diagnosis_short, mode, duration_days, status").eq("patient_id", patientId).order("created_at", { ascending: true }),
      admin.from("patient_diagnosis_timeline").select("*").eq("patient_id", patientId).order("created_at", { ascending: true }),
    ]);

    const patient: any = patientRes.data;
    const visits = (visitsRes.data || []).filter((v: any) => !excludeVisitId || v.id !== excludeVisitId);
    const uz = uzRes.data || [];
    const labs = labsRes.data || [];
    const plans = plansRes.data || [];
    const diagnoses = diagRes.data || [];

    if (!visits.length && !uz.length && !labs.length && !plans.length && !diagnoses.length) {
      return new Response(JSON.stringify({ summary: "", reason: "no_history" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parts: string[] = [];
    parts.push(`Пациент: ${patient?.full_name || "—"}${patient?.birth_date ? `, д.р. ${patient.birth_date}` : ""}`);

    if (diagnoses.length) {
      parts.push("Диагнозы:\n" + diagnoses.map((d: any) => `- ${fmtDate(d.diagnosis_date ?? d.created_at)}: ${d.icd10 || ""} ${trimStr(d.diagnosis_text || d.notes, 200)}`).join("\n"));
    }
    if (visits.length) {
      parts.push("Визиты:\n" + visits.map((v: any) => {
        const d = v.protocol_data || {};
        const bits = [
          d.complaints && `жалобы: ${trimStr(d.complaints, 300)}`,
          d.anamnesis && `анамнез: ${trimStr(d.anamnesis, 400)}`,
          d.dynamics && `динамика: ${trimStr(d.dynamics, 300)}`,
          d.diagnosis && `диагноз: ${trimStr(d.diagnosis, 200)}`,
          d.conclusion && `заключение: ${trimStr(d.conclusion, 300)}`,
        ].filter(Boolean).join("; ");
        return `- ${fmtDate(v.visit_date)} [${v.protocol_type || "?"}]: ${bits || "(нет структурированных данных)"}`;
      }).join("\n"));
    }
    if (uz.length) {
      parts.push("УЗИ:\n" + uz.map((r: any) => `- ${fmtDate(r.created_at)}: ${trimStr(r.conclusion || r.notes || JSON.stringify(r), 400)}`).join("\n"));
    }
    if (labs.length) {
      parts.push("Лабораторные:\n" + labs.slice(-30).map((r: any) => `- ${fmtDate(r.test_date ?? r.created_at)}: ${trimStr(r.test_name || r.name, 80)} = ${trimStr(r.value ?? r.result, 80)} ${r.units || ""}`).join("\n"));
    }
    if (plans.length) {
      parts.push("Планы лечения:\n" + plans.map((p: any) => `- ${fmtDate(p.issued_at ?? p.created_at)}: ${trimStr(p.diagnosis_short, 200)} (${p.mode || "?"}, ${p.duration_days || "?"} дн, ${p.status || "?"})`).join("\n"));
    }
    if (priorAnamnesis.trim()) {
      parts.push(`Текущий черновик анамнеза (можно опереться):\n${trimStr(priorAnamnesis, 1000)}`);
    }

    const context = parts.join("\n\n");

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const origin = req.headers.get("origin") || "https://tarusin.pro";
    const models = ["google/gemini-2.5-flash", "openai/gpt-4o-mini", "anthropic/claude-3.5-haiku"];
    let summary = "";
    let usedModel = "";
    let lastErr = "";

    for (const model of models) {
      try {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": origin,
            "X-Title": "Tarusin.pro Anamnesis Summarizer",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 900,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Данные пациента:\n\n${context}\n\nСоставь краткий связный анамнез.` },
            ],
          }),
        });
        if (!resp.ok) {
          lastErr = `HTTP ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
          continue;
        }
        const json = await resp.json();
        summary = String(json?.choices?.[0]?.message?.content ?? "").trim();
        if (summary) { usedModel = model; break; }
      } catch (e) {
        lastErr = String((e as Error).message ?? e);
      }
    }

    if (!summary) {
      return new Response(JSON.stringify({ error: "AI summarizer failed", detail: lastErr }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ summary, model: usedModel }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
