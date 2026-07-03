// metabolic-map-build: ИИ-интерпретация детерминированной карты.
// Вход: patient_id, visit_id?, deidentified?, model?
// 1) читает draft summary из metabolic_maps.aggregate_summary + справочник путей
// 2) собирает контекст пациента (пол/возраст, лабы, антропометрия, жалобы,
//    лекарства, диагнозы, анамнез из visits)
// 3) вызывает OpenRouter в режиме строгого JSON. Модель уточняет статусы,
//    находит связи между путями и по каждому затронутому пути возвращает
//    { pathway_code, status, confidence, markers, highlights, links,
//      text_pro, text_plain, recommendations }
// 4) сохраняет ai в metabolic_maps.meta.ai и апсертит AI-findings
//    (source_ref.ai=true), сохраняя детерминированные findings нетронутыми.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Flash — быстрый дефолт (обычно ≤ 20 с). Про можно передать явно из клиента.
const DEFAULT_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Ты — клинический интерпретатор метаболической карты.
Тебе передают ДЕТЕРМИНИРОВАННЫЙ черновик (статусы путей по правилам) и полный контекст
пациента: пол/возраст, лаб-результаты со значениями и референсами, антропометрия,
жалобы, лекарства, диагнозы. Твоя задача — уточнить статусы с учётом контекста,
найти связи между путями и вернуть СТРОГО валидный JSON.

ГАРДРЕЙЛЫ (обязательные):
- Значения не выдумывать. Каждый вывод обязан ссылаться на конкретные показатели
  из входа (test_name/code, value, unit) или на другие переданные данные.
- Если данных по пути недостаточно — status="insufficient_data", confidence<=0.4,
  markers=[], в text_plain и text_pro честно скажи «недостаточно данных».
- Никаких доз препаратов, не входящих в контекст. Рекомендации — общие категории
  (например: «B12 в дозе по возрасту», «повторить ферритин через 8 недель»).
- Не менять пол, возраст, диагнозы.
- Не поднимать severity выше «severe».

Формат ответа — единый JSON-объект:
{
  "overall_confidence": 0..1,
  "cross_links": [ { "from": "pathway_code", "to": "pathway_code", "why": "..." } ],
  "pathways": [
    {
      "pathway_code": "<slug из справочника>",
      "status": "norm"|"mild"|"moderate"|"severe"|"insufficient_data",
      "confidence": 0..1,
      "markers": [ { "code": "...", "value": <num|string>, "unit": "...", "flag": "low"|"high"|"normal" } ],
      "highlights": [ { "node": "<node_id из pathway>", "state": "norm"|"mild"|"moderate"|"severe" } ],
      "links": [ "<pathway_code>" ],
      "text_pro": "проф. текст: что нарушено, какими маркерами это видно, риски, связи, что делать",
      "text_plain": "простое объяснение для родителя тем же смыслом",
      "recommendations": [ { "kind": "test"|"nutrition"|"lifestyle"|"medication_category"|"referral", "text": "..." } ]
    }
  ]
}

Только JSON, без markdown-обёрток и без комментариев.`;

function calcAgeYears(birth?: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (isNaN(+b)) return null;
  const now = new Date();
  let y = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) y--;
  return y;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null) as {
      patient_id?: string;
      visit_id?: string | null;
      deidentified?: boolean;
      model?: string;
    } | null;
    if (!body?.patient_id) {
      return new Response(JSON.stringify({ error: "patient_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const patientId = body.patient_id;
    const visitId = body.visit_id || null;
    const deidentified = body.deidentified !== false; // по умолчанию ON
    const model = body.model || DEFAULT_MODEL;

    // --- контекст пациента
    const [{ data: patient }, { data: map }, { data: pwRows }] = await Promise.all([
      supabase.from("patients").select("id, full_name, birth_date, first_name, last_name").eq("id", patientId).maybeSingle(),
      (supabase as any).from("metabolic_maps").select("id, meta, aggregate_summary, source_visit_id").eq("patient_id", patientId).maybeSingle(),
      (supabase as any).from("pathways").select("slug, name, description, nodes, rules").eq("is_active", true),
    ]);
    if (!patient) {
      return new Response(JSON.stringify({ error: "patient not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!map?.id || !map?.aggregate_summary?.pathways?.length) {
      return new Response(JSON.stringify({ error: "run deterministic aggregation first" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mapId = map.id as string;

    // визит-источник (для отсечки данных)
    let visitDate: string | null = null;
    if (visitId) {
      const { data: v } = await supabase.from("patient_visits").select("visit_date").eq("id", visitId).maybeSingle();
      visitDate = (v?.visit_date as string | undefined) || null;
    }

    // лабы
    let labsQ = supabase.from("lab_results")
      .select("test_date, test_code, test_name, value, unit, reference_min, reference_max")
      .eq("patient_id", patientId)
      .order("test_date", { ascending: false })
      .limit(200);
    if (visitDate) labsQ = labsQ.lte("test_date", visitDate);
    const { data: labs } = await labsQ;

    // антропометрия — последнее измерение
    const { data: anthro } = await supabase.from("anthropometry_measurements")
      .select("measurement_date, age_months, sex, weight_kg, height_cm, bmi, bmi_z_score, height_z_score, weight_z_score, tanner_stage, physical_development, harmony")
      .eq("patient_id", patientId)
      .order("measurement_date", { ascending: false })
      .limit(3);

    // визиты — жалобы и диагнозы за последние
    let visitsQ = supabase.from("patient_visits")
      .select("visit_date, protocol_type, protocol_data, diagnosis, icd_code")
      .eq("patient_id", patientId)
      .order("visit_date", { ascending: false })
      .limit(10);
    if (visitDate) visitsQ = visitsQ.lte("visit_date", visitDate);
    const { data: visits } = await visitsQ;

    // диагнозы (хронология)
    const { data: dxTimeline } = await (supabase as any).from("patient_diagnosis_timeline")
      .select("source_date, diagnosis_text, icd10, source_type")
      .eq("patient_id", patientId)
      .order("source_date", { ascending: false })
      .limit(30);

    // лекарства (свежие рецепты)
    const { data: rx } = await supabase.from("prescriptions")
      .select("id, prescription_date, prescription_items(medication_latin_name, dose, quantity, frequency, duration)")
      .eq("patient_id", patientId)
      .order("prescription_date", { ascending: false })
      .limit(5);

    const ageYears = calcAgeYears(patient.birth_date as any);

    // --- собираем компактный вход для модели
    const draft = (map.aggregate_summary?.pathways || []).map((p: any) => ({
      pathway_code: p.slug,
      name: p.name,
      status: p.status,
      matched_markers: p.matched_markers,
      affected_nodes: p.affected_nodes || [],
    }));

    const pathwaysCatalog = (pwRows as any[] || []).map((p) => ({
      code: p.slug,
      name: p.name,
      description: p.description,
      node_ids: (p.nodes || []).map((n: any) => n.id),
    }));

    const patientBlock = deidentified
      ? { sex_hint: anthro?.[0]?.sex ?? null, age_years: ageYears }
      : {
          name: patient.full_name,
          sex_hint: anthro?.[0]?.sex ?? null,
          age_years: ageYears,
          birth_date: patient.birth_date,
        };

    const complaints = (visits || [])
      .map((v: any) => v?.protocol_data?.complaints || v?.protocol_data?.chief_complaint)
      .filter(Boolean)
      .slice(0, 5);
    const anamnesisNotes = (visits || [])
      .map((v: any) => v?.protocol_data?.anamnesis || v?.protocol_data?.history)
      .filter(Boolean)
      .slice(0, 5);

    const contextInput = {
      patient: patientBlock,
      draft_pathways: draft,
      pathways_catalog: pathwaysCatalog,
      lab_results: (labs || []).map((l: any) => ({
        date: l.test_date, code: l.test_code, name: l.test_name,
        value: l.value, unit: l.unit,
        ref_low: l.reference_min, ref_high: l.reference_max,
      })),
      anthropometry: (anthro || []).map((a: any) => ({
        date: a.measurement_date, age_months: a.age_months,
        weight_kg: a.weight_kg, height_cm: a.height_cm, bmi: a.bmi,
        bmi_z: a.bmi_z_score, height_z: a.height_z_score, weight_z: a.weight_z_score,
        tanner: a.tanner_stage, physical_development: a.physical_development, harmony: a.harmony,
      })),
      complaints,
      anamnesis: anamnesisNotes,
      diagnoses: (dxTimeline || []).map((d: any) => ({ date: d.source_date, text: d.diagnosis_text, icd10: d.icd10, source: d.source_type })),
      current_medications: (rx || []).flatMap((p: any) =>
        (p?.prescription_items || []).map((it: any) => ({
          drug: it.medication_latin_name, dose: it.dose, freq: it.frequency, duration: it.duration,
          prescribed_at: p.prescription_date,
        }))
      ),
      visit_context: { visit_id: visitId, visit_date: visitDate },
      deidentified,
    };

    // --- вызов модели
    const origin = req.headers.get("origin") ?? "https://lovable.app";
    const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "Metabolic Map Build",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Верни JSON строго по схеме. Вход:\n\n" + JSON.stringify(contextInput) },
        ],
      }),
    });
    if (!orResp.ok) {
      const t = await orResp.text().catch(() => "");
      return new Response(JSON.stringify({ error: `openrouter ${orResp.status}: ${t.slice(0, 500)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orJson = await orResp.json();
    const content: string | undefined = orJson?.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "empty ai content" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ai: any;
    try {
      ai = JSON.parse(content);
    } catch {
      // модель обернула в markdown — попытаемся вытащить {...}
      const m = content.match(/\{[\s\S]*\}$/);
      if (!m) {
        return new Response(JSON.stringify({ error: "ai returned non-json", raw: content.slice(0, 500) }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      ai = JSON.parse(m[0]);
    }
    if (!ai || !Array.isArray(ai.pathways)) {
      return new Response(JSON.stringify({ error: "ai json shape invalid" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // сопоставим slug -> pathway_id
    const slugToId = new Map<string, string>();
    for (const p of (pwRows as any[] || [])) slugToId.set(p.slug, p.id);

    const computedAt = new Date().toISOString();
    const aiSummary = {
      computed_at: computedAt,
      model,
      deidentified,
      visit_id: visitId,
      visit_date: visitDate,
      overall_confidence: ai.overall_confidence ?? null,
      cross_links: Array.isArray(ai.cross_links) ? ai.cross_links : [],
      pathways: ai.pathways,
    };

    // сохранить в metabolic_maps.meta.ai (не трогаем detailed aggregate_summary)
    const nextMeta = { ...(map.meta || {}), ai: aiSummary };
    await (supabase as any).from("metabolic_maps").update({ meta: nextMeta }).eq("id", mapId);

    // обновить AI-findings: удалить старые (source_ref->ai = true) и вставить новые
    await (supabase as any)
      .from("map_findings")
      .delete()
      .eq("map_id", mapId)
      .eq("source_ref->>ai", "true");

    const sevToStored: Record<string, string> = {
      mild: "info", moderate: "warn", severe: "critical",
    };
    const rows: any[] = [];
    for (const p of ai.pathways as any[]) {
      const pid = slugToId.get(p.pathway_code);
      if (!pid) continue;
      const hs = Array.isArray(p.highlights) ? p.highlights : [];
      for (const h of hs) {
        const state = String(h.state || "").toLowerCase();
        const stored = sevToStored[state];
        if (!stored) continue;
        rows.push({
          map_id: mapId,
          pathway_id: pid,
          node_id: String(h.node || ""),
          severity: stored,
          label: `ИИ: ${p.pathway_code} — узел ${h.node}`,
          detail: (p.text_pro || "").slice(0, 500),
          source_ref: {
            ai: true,
            pathway_code: p.pathway_code,
            confidence: p.confidence ?? null,
            ai_state: state,
          },
        });
      }
    }
    if (rows.length) {
      await (supabase as any).from("map_findings").insert(rows);
    }

    return new Response(JSON.stringify({ ok: true, ai: aiSummary, findings_inserted: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("metabolic-map-build error", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
