// Extracts structured lab_results rows from the free-text lab fields inside
// patient_visits.protocol_data (AI protocol). Deduplicates against existing
// lab_results and inserts only what is new. Returns a per-visit report.
//
// Trigger: called from client (metabolic map recalc) or admin UI.
// Auth: verify_jwt=false; we validate the caller's JWT explicitly.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Field names inside protocol_data that are expected to contain lab free-text.
const LAB_FIELDS = new Set([
  'cbc', 'urinalysis', 'biochem', 'hormones', 'other_labs', 'lab_results',
  'labs', 'analyses', 'analiz', 'analizes',
]);

const EXTRACTION_MODELS = [
  'google/gemini-3-flash-preview',
  'google/gemini-3.1-pro-preview',
  'openai/gpt-5-mini',
];

const SYSTEM = `Ты — медицинский парсер лабораторных данных из свободного текста визита.
Извлекай ТОЛЬКО значения, явно присутствующие в тексте. Не выдумывай.
Если значение сомнительное — needs_review=true.
Верни строго JSON:
{ "lab_results": [
  { "analyte": string, "value": number, "unit": string|null,
    "ref_low": number|null, "ref_high": number|null,
    "confidence": number, "needs_review": boolean }
]}
Без пояснений вне JSON.`;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '').trim();
}

// Walk protocol_data recursively and collect { field, text } for lab-like fields.
function collectLabTexts(node: any, out: Array<{ field: string; text: string }>) {
  if (!node) return;
  if (typeof node === 'string') return;
  if (Array.isArray(node)) { node.forEach((n) => collectLabTexts(n, out)); return; }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (LAB_FIELDS.has(k) && typeof v === 'string' && v.trim().length > 3) {
        out.push({ field: k, text: v.trim() });
      } else {
        collectLabTexts(v, out);
      }
    }
  }
}

async function callModel(model: string, text: string, field: string) {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Раздел протокола: ${field}\n\n${text}` },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) throw new Error(`AI ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  const j = await resp.json();
  const content = j.choices?.[0]?.message?.content;
  if (!content) throw new Error('empty AI response');
  try { return JSON.parse(content); }
  catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('bad JSON');
  }
}

async function extract(text: string, field: string) {
  let last = 'unknown';
  for (const m of EXTRACTION_MODELS) {
    try { return await callModel(m, text, field); }
    catch (e: any) { last = e?.message || String(e); console.error('extract-visit-labs model fail', m, last.slice(0, 200)); }
  }
  throw new Error(`не удалось разобрать текст: ${last}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const patient_id: string | undefined = body.patient_id;
    const visit_id: string | undefined = body.visit_id;
    const only_new: boolean = body.only_new !== false; // default true
    if (!patient_id) {
      return new Response(JSON.stringify({ error: 'patient_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    let vq = supabase
      .from('patient_visits')
      .select('id, visit_date, protocol_type, protocol_data')
      .eq('patient_id', patient_id)
      .order('visit_date', { ascending: false });
    if (visit_id) vq = vq.eq('id', visit_id);
    const { data: visits, error: vErr } = await vq;
    if (vErr) throw vErr;

    // Existing labs for dedupe.
    const { data: existing } = await supabase
      .from('lab_results')
      .select('test_name, test_date, value, source_document')
      .eq('patient_id', patient_id);
    const existingKey = new Set(
      (existing || []).map((r: any) => `${normalize(r.test_name)}|${r.test_date}|${Number(r.value)}`),
    );
    const existingVisitTags = new Set(
      (existing || [])
        .map((r: any) => r.source_document as string | null)
        .filter((s: string | null): s is string => !!s && s.startsWith('visit:'))
        .map((s: string) => s.split(':')[1]),
    );

    const { data: catalog } = await supabase
      .from('lab_tests_catalog')
      .select('id, name, short_name, unit')
      .eq('is_active', true);
    const cat = (catalog || []).map((c: any) => ({
      ...c,
      _norm: [normalize(c.name), normalize(c.short_name || '')].filter(Boolean),
    }));

    const report: any[] = [];
    let insertedTotal = 0;

    for (const v of visits || []) {
      if (only_new && existingVisitTags.has(v.id)) {
        report.push({ visit_id: v.id, skipped: 'already_extracted' });
        continue;
      }
      const texts: Array<{ field: string; text: string }> = [];
      collectLabTexts(v.protocol_data, texts);
      if (!texts.length) { report.push({ visit_id: v.id, skipped: 'no_lab_text' }); continue; }

      const testDate = v.visit_date;
      let insertedForVisit = 0;
      const parsedAnalytes: string[] = [];

      for (const t of texts) {
        try {
          const parsed = await extract(t.text, t.field);
          for (const lr of parsed.lab_results || []) {
            if (typeof lr.value !== 'number' || !lr.analyte) continue;
            const target = normalize(lr.analyte);
            const match = cat.find((c: any) =>
              c._norm.some((n: string) =>
                n && (n === target || (n.length > 3 && target.includes(n)) || (target.length > 3 && n.includes(target))),
              ),
            );
            const testName = match?.name || lr.analyte;
            const key = `${normalize(testName)}|${testDate}|${Number(lr.value)}`;
            if (existingKey.has(key)) continue;
            existingKey.add(key);

            const row: any = {
              patient_id,
              test_group: match?.name?.split(' ')[0] || 'AI-протокол',
              test_name: testName,
              test_code: null,
              value: lr.value,
              unit: lr.unit || match?.unit || '',
              reference_min: lr.ref_low ?? null,
              reference_max: lr.ref_high ?? null,
              test_date: testDate,
              source_document: `visit:${v.id}`,
              confidence: lr.confidence ?? null,
              needs_review: !!lr.needs_review || !match,
            };
            const { error: insErr } = await supabase.from('lab_results').insert(row);
            if (!insErr) { insertedForVisit++; parsedAnalytes.push(testName); }
            else console.error('insert lab err', insErr.message);
          }
        } catch (e: any) {
          console.error('extract fail', v.id, t.field, e?.message);
          report.push({ visit_id: v.id, field: t.field, error: (e?.message || String(e)).slice(0, 200) });
        }
      }
      insertedTotal += insertedForVisit;
      report.push({ visit_id: v.id, visit_date: v.visit_date, inserted: insertedForVisit, analytes: parsedAnalytes });
    }

    return new Response(
      JSON.stringify({ ok: true, patient_id, visits_scanned: visits?.length || 0, inserted: insertedTotal, report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('extract-visit-labs fatal', e?.message);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
