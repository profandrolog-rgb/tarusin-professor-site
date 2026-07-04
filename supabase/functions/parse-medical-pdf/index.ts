import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const EXTRACTION_MODELS = [
  'google/gemini-3-flash-preview',
  'google/gemini-3.1-pro-preview',
  'openai/gpt-5-mini',
];

const EXTRACTION_SYSTEM = `Ты — медицинский парсер PDF (бланки Инвитро/Гемотест/CMD/Хеликс/Lab4U/BION). Извлекай ТОЛЬКО то, что явно есть в тексте. Никогда не выдумывай значения. Если значение нечитаемое или сомнительное — ставь needs_review=true. Верни строго JSON-объект по схеме:
{
  "document_type": "lab" | "ultrasound" | "consultation" | "other",
  "document_date": "YYYY-MM-DD" | null,
  "lab_results": [
    { "analyte": string, "value": number, "unit": string | null,
      "ref_low": number | null, "ref_high": number | null,
      "ref_text": string | null,
      "comment": string | null,
      "confidence": number, "needs_review": boolean }
  ],
  "diagnoses": [
    { "text": string, "icd10": string | null, "date": "YYYY-MM-DD" | null,
      "confidence": number, "needs_review": boolean }
  ],
  "conclusion_text": string | null
}
ПРАВИЛА ПО РЕФЕРЕНСУ (колонка «Референсные значения»):
- «A - B», «A – B», «A..B», «A—B» → ref_low=A, ref_high=B (десятичный разделитель — точка или запятая, приведи к точке).
- «< B», «≤ B», «до B», «менее B» → ref_low=null, ref_high=B.
- «> A», «≥ A», «более A», «от A» → ref_low=A, ref_high=null.
- «см. комм.», «см. комментарий» → ref_low=null, ref_high=null, но положи текст референса в ref_text и текст комментария в comment (если есть — с порогами по возрасту/полу).
- Если референс в бланке отсутствует → ref_low=null, ref_high=null, ref_text=null.
- Единицы бери из колонки «Ед. изм.» / «Units».
- ref_text — сырой текст референса ровно как в бланке (для отладки), даже если ref_low/ref_high заполнены.
Никогда не путай колонку значения с колонкой референса. Никаких пояснений вне JSON.`;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '').trim();
}

function toNum(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/\s+/g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Parse reference text of forms: "A - B", "< B", "до B", "> A", "более A", "от A до B"
function parseRefText(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  const s = String(raw).trim().replace(/\u00a0/g, ' ');
  const norm = s.toLowerCase();

  // "< B" / "≤ B" / "до B" / "менее B" / "не более B"
  let m = s.match(/^\s*[<≤]\s*([\d.,]+)/) ||
          norm.match(/^\s*(?:до|менее|не более)\s+([\d.,]+)/);
  if (m) return { min: null, max: toNum(m[1]) };

  // "> A" / "≥ A" / "более A" / "от A" / "не менее A"
  m = s.match(/^\s*[>≥]\s*([\d.,]+)/) ||
      norm.match(/^\s*(?:более|не менее|свыше)\s+([\d.,]+)/) ||
      norm.match(/^\s*от\s+([\d.,]+)\s*$/);
  if (m) return { min: toNum(m[1]), max: null };

  // "от A до B"
  m = norm.match(/от\s+([\d.,]+)\s+до\s+([\d.,]+)/);
  if (m) return { min: toNum(m[1]), max: toNum(m[2]) };

  // "A - B" / "A – B" / "A — B" / "A..B" / "A/B"
  m = s.match(/([\d.,]+)\s*(?:-|–|—|\.\.|to|—|~)\s*([\d.,]+)/i);
  if (m) return { min: toNum(m[1]), max: toNum(m[2]) };

  return { min: null, max: null };
}

async function callExtractionModel(model: string, fileDataUrl: string, fileName: string) {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Файл: ${fileName}. Извлеки данные согласно схеме.` },
            { type: 'file', file: { filename: fileName, file_data: fileDataUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) throw new Error(`AI gateway ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  const j = await resp.json();
  const content = j.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Failed to parse AI JSON');
  }
}

async function extractWithFallback(fileDataUrl: string, fileName: string) {
  let last = 'unknown error';
  for (const model of EXTRACTION_MODELS) {
    try {
      const parsed = await callExtractionModel(model, fileDataUrl, fileName);
      console.log('parse-medical-pdf model ok', JSON.stringify({ model, fileName }));
      return parsed;
    } catch (e: any) {
      last = e?.message || String(e);
      console.error('parse-medical-pdf model fail', JSON.stringify({ model, fileName, error: last.slice(0, 500) }));
    }
  }
  throw new Error(`Не удалось разобрать PDF ни одной моделью: ${last}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      file_data,
      file_name,
      patient_id,
      consultation_case_id,
    }: {
      file_data: string;
      file_name: string;
      patient_id?: string;
      consultation_case_id?: string;
    } = body;

    if (!file_data || !file_name) {
      return new Response(JSON.stringify({ error: 'file_data and file_name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!patient_id && !consultation_case_id) {
      return new Response(JSON.stringify({ error: 'patient_id or consultation_case_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // AI extraction
    const parsed = await extractWithFallback(file_data, file_name);
    const docDate: string | null = parsed.document_date || null;
    const testDate = docDate || new Date().toISOString().slice(0, 10);

    // Load catalog for synonym matching
    const { data: catalog } = await supabase
      .from('lab_tests_catalog')
      .select('id, name, short_name, unit')
      .eq('is_active', true);

    const cat = (catalog || []).map((c: any) => ({
      ...c,
      _norm: [normalize(c.name), normalize(c.short_name || '')].filter(Boolean),
    }));

    const inserted_labs: any[] = [];
    const queued_unknown: any[] = [];

    for (const lr of parsed.lab_results || []) {
      if (typeof lr.value !== 'number' || !lr.analyte) continue;
      const target = normalize(lr.analyte);
      const match = cat.find((c: any) => c._norm.some((n: string) => n && (n === target || (n.length > 3 && target.includes(n)) || (target.length > 3 && n.includes(target)))));

      const row: any = {
        patient_id: patient_id || null,
        consultation_case_id: consultation_case_id || null,
        test_group: match?.name?.split(' ')[0] || 'Загружено',
        test_name: match?.name || lr.analyte,
        test_code: null,
        value: lr.value,
        unit: lr.unit || match?.unit || '',
        reference_min: lr.ref_low ?? null,
        reference_max: lr.ref_high ?? null,
        test_date: testDate,
        source_document: file_name,
        confidence: lr.confidence ?? null,
        needs_review: !!lr.needs_review || !match,
      };
      const { data: ins, error } = await supabase.from('lab_results').insert(row).select().single();
      if (!error) inserted_labs.push(ins);

      if (!match) {
        const { data: q } = await supabase
          .from('lab_synonyms_queue')
          .insert({
            raw_name: lr.analyte,
            raw_unit: lr.unit || null,
            suggested_test_id: null,
            suggested_test_name: null,
            source_document: file_name,
            patient_id: patient_id || null,
            consultation_case_id: consultation_case_id || null,
            status: 'pending',
          })
          .select()
          .single();
        if (q) queued_unknown.push(q);
      }
    }

    const inserted_diagnoses: any[] = [];
    for (const d of parsed.diagnoses || []) {
      if (!d.text) continue;
      const { data: ins } = await supabase
        .from('patient_diagnosis_timeline')
        .insert({
          patient_id: patient_id || null,
          consultation_case_id: consultation_case_id || null,
          diagnosis_text: d.text,
          icd10: d.icd10 || null,
          source_date: d.date || docDate || null,
          source_document: file_name,
          source_type: parsed.document_type || null,
          confidence: d.confidence ?? null,
          needs_review: !!d.needs_review,
        })
        .select()
        .single();
      if (ins) inserted_diagnoses.push(ins);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        file_name,
        document_type: parsed.document_type,
        document_date: docDate,
        conclusion_text: parsed.conclusion_text || null,
        inserted_labs_count: inserted_labs.length,
        inserted_diagnoses_count: inserted_diagnoses.length,
        queued_unknown_count: queued_unknown.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('parse-medical-pdf error', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
