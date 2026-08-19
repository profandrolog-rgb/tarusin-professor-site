// Умный импорт протокола старого формата (Word / PDF / скан / текст)
// → структурированный protocol_data для patient_visits.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Байты файла → base64 (по частям, чтобы не переполнить стек). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

const MODELS = (
  Deno.env.get('PROTOCOL_IMPORT_MODELS') ||
  'google/gemini-3-flash-preview,google/gemini-3.1-pro-preview,google/gemini-2.5-pro,openai/gpt-5-mini'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

/** Разрешённые ключи protocol_data по типам протоколов. */
const SCHEMA = {
  ultrashort: ['complaints', 'anamnesis', 'consultation_notes', 'somatic', 'sexual_formula', 'sexual_formula_text', 'local_status', 'conclusion', 'recommendations'],
  primary_short: ['complaints', 'anamnesis', 'somatic', 'sexual_formula', 'sexual_formula_text', 'local_status', 'ortho_status', 'neuro_status', 'psych_status', 'working_diagnosis', 'diagnosis', 'conclusion', 'exam_plan', 'recommendations'],
  repeat_with_labs: ['complaints', 'dynamics', 'cbc', 'urinalysis', 'biochem', 'hormones', 'other_labs', 'local_status', 'conclusion', 'recommendations'],
  repeat_with_uzi: ['complaints', 'local_status', 'ortho_status', 'uzi', 'conclusion', 'recommendations'],
  dynamic_with_uzi: ['complaints', 'anamnesis', 'dynamics', 'lab_results', 'local_status', 'ortho_status', 'uzi', 'conclusion', 'recommendations'],
  uzi_reproductive: ['indications', 'uzi', 'recommendations'],
  uzi_urinary: ['indications', 'uzi_urinary', 'recommendations'],
  uzi_bladder: ['indications', 'device', 'bladder_volume', 'bladder_walls', 'bladder_contents', 'residual_urine', 'residual_urine_percent', 'micturition_urge', 'conclusion', 'recommendations'],
  postop_day3: ['operation_name', 'operation_date', 'general_status', 'wound_status', 'dressing', 'pain', 'temperature', 'complaints', 'uzi_express', 'recommendations'],
  postop_day7: ['operation_name', 'operation_date', 'general_status', 'wound_status', 'sutures_removed', 'healing', 'complaints', 'uzi_express', 'recommendations'],
  online_consult: ['reason', 'complaints', 'anamnesis', 'current_state', 'external_genitalia', 'interpretation', 'conclusion', 'recommendations', 'exam_plan'],
} as const;

const NESTED = `
Вложенные объекты (все значения — строки, только реально указанные в документе):
somatic: { full_text, general, skin, lymph_nodes, respiratory, cardiovascular, abdomen, kidneys, physiological, height_cm, weight_kg, bp, pulse }
sexual_formula: { P, Ax, F, L, G, formula_note }  // цифры стадий, напр. P2Ax1F0L1G2
local_status: { external_genitalia, penis, perineum, scrotum, right_testis, left_testis, right_testis_volume, left_testis_volume, epididymis, spermatic_cord, inguinal_rings, notes }
uzi (репродуктивная система): { device, right_testis_size, right_testis_volume, right_testis_structure, left_testis_size, left_testis_volume, left_testis_structure, right_epididymis, right_epididymis_volume, left_epididymis, left_epididymis_volume, vessels, doppler, free_fluid, conclusion,
  arterial_flow: { right: { vmax, vmin, vmed, ri, pi, acc }, left: {...} },
  venous_flow: { right: { v_dir, v_red, v_rev, t_ref, acc_ref, diameter }, left: {...} },
  prostate: { position, prostate_volume, parenchyma, capsule, bladder_volume, residual_urine_volume, residual_urine_percent, conclusion } }
uzi_urinary: { device, right_kidney_size, right_kidney_parenchyma, right_kidney_pelvis, right_kidney_structure, left_kidney_size, left_kidney_parenchyma, left_kidney_pelvis, left_kidney_structure, ureters, bladder_volume, bladder_walls, bladder_contents, residual_urine, conclusion }
`;

const SYSTEM = `Ты — медицинский ассистент профессора-андролога. Тебе дают протокол осмотра, написанный в старом («ручном») формате: свободный текст, иногда таблицы.
Твоя задача — распознать смысл и разложить содержимое по полям электронного протокола.

СТРОГИЕ ПРАВИЛА:
1. НИЧЕГО НЕ ВЫДУМЫВАЙ. Переноси только то, что реально написано в документе. Если поля нет — не включай его в ответ.
2. НЕ ПЕРЕФРАЗИРУЙ медицинский текст. Сохраняй формулировки врача дословно (можно исправить очевидные опечатки и убрать переносы строк внутри предложения).
3. Числа и единицы измерения переноси точно как в документе (запятая как десятичный разделитель допустима).
4. Даты — в формате YYYY-MM-DD.
5. Определи тип протокола по содержанию. Допустимые значения protocol_type: ${Object.keys(SCHEMA).join(', ')}.
   Ориентиры: первичный приём с анамнезом и полным статусом → primary_short; повторный осмотр + УЗИ → repeat_with_uzi; повторный + анализы → repeat_with_labs; только УЗИ мошонки/органов репродуктивной системы → uzi_reproductive; только УЗИ почек/мочевого → uzi_urinary; УЗИ мочевого пузыря с остаточной мочой → uzi_bladder; осмотр на 3/7 сутки после операции → postop_day3 / postop_day7; онлайн-консультация → online_consult; очень краткий осмотр → ultrashort.
6. Используй ТОЛЬКО ключи, разрешённые для выбранного типа протокола.
7. Всё, что не удалось разложить по полям, дословно перенеси в строку "unmapped".

Разрешённые ключи protocol_data по типам:
${Object.entries(SCHEMA).map(([k, v]) => `${k}: ${(v as readonly string[]).join(', ')}`).join('\n')}
${NESTED}

Ответ — ТОЛЬКО JSON:
{
  "protocol_type": "...",
  "confidence": 0.0-1.0,
  "patient": { "full_name": "", "birth_date": "YYYY-MM-DD", "sex": "M|F", "history_number": "", "age_text": "" },
  "visit_date": "YYYY-MM-DD",
  "diagnosis": "",
  "icd_code": "",
  "next_visit_date": "YYYY-MM-DD",
  "protocol_data": { ... },
  "unmapped": "",
  "notes": "краткий комментарий о качестве распознавания, что вызвало сомнения"
}`;

async function callModel(model: string, parts: unknown[]) {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: parts },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`${model}: ${resp.status} ${t.slice(0, 300)}`);
  }
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${model}: пустой ответ`);
  return JSON.parse(content);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'Не авторизовано' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) {
      return new Response(JSON.stringify({ error: 'Не авторизовано' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin, error: roleError } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (roleError) {
      console.error('[parse-visit-protocol] role check failed', roleError.message);
      return new Response(JSON.stringify({ error: 'Не удалось проверить права' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Недостаточно прав' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));

    // Быстрая самопроверка готовности («система готова / не готова»):
    // авторизация и роль уже проверены выше, здесь — хранилище и ИИ-шлюз.
    if (body?.ping === true) {
      const checks: Array<{ name: string; ok: boolean; detail?: string; ms?: number }> = [
        { name: 'Авторизация и права администратора', ok: true },
      ];

      let t = Date.now();
      const { error: storageError } = await admin.storage
        .from('patient-lab-docs')
        .list('protocol-import', { limit: 1 });
      checks.push({
        name: 'Приватное хранилище документов',
        ok: !storageError,
        detail: storageError?.message,
        ms: Date.now() - t,
      });

      t = Date.now();
      let aiOk = false;
      let aiDetail: string | undefined;
      try {
        const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: MODELS[0],
            messages: [{ role: 'user', content: 'Ответь одним словом: ок' }],
            max_tokens: 5,
          }),
        });
        aiOk = resp.ok;
        if (!resp.ok) aiDetail = `${resp.status}: ${(await resp.text()).slice(0, 160)}`;
      } catch (e) {
        aiDetail = (e as Error).message;
      }
      checks.push({ name: `ИИ-модель распознавания (${MODELS[0]})`, ok: aiOk, detail: aiDetail, ms: Date.now() - t });

      return new Response(JSON.stringify({ ok: checks.every((c) => c.ok), checks }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const text: string = typeof body.text === 'string' ? body.text : '';
    let fileData: string = typeof body.file_data === 'string' ? body.file_data : '';
    const storageBucket: string = typeof body.storage_bucket === 'string' ? body.storage_bucket : '';
    const storagePath: string = typeof body.storage_path === 'string' ? body.storage_path : '';
    const fileName: string = typeof body.file_name === 'string' ? body.file_name : 'document';

    // Большой PDF/скан приходит не в теле запроса, а ссылкой в приватном хранилище.
    if (!fileData && storagePath) {
      const bucket = storageBucket || 'patient-lab-docs';
      if (bucket !== 'patient-lab-docs') {
        return new Response(JSON.stringify({ error: 'Недопустимое хранилище файла' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: stored, error: downloadError } = await admin.storage.from(bucket).download(storagePath);
      if (downloadError || !stored) {
        return new Response(JSON.stringify({ error: 'Не удалось получить загруженный файл' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (stored.size > 25 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'Файл больше 25 МБ' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const bytes = new Uint8Array(await stored.arrayBuffer());
      fileData = `data:${stored.type || 'application/pdf'};base64,${bytesToBase64(bytes)}`;
    }

    if (!text.trim() && !fileData) {
      return new Response(JSON.stringify({ error: 'Нужен текст или файл протокола' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (text.length > 200_000) {
      return new Response(JSON.stringify({ error: 'Документ слишком большой' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const parts: unknown[] = [];
    if (text.trim()) {
      parts.push({ type: 'text', text: `Протокол (${fileName}):\n\n${text.trim()}` });
    }
    if (fileData) {
      const mime = fileData.slice(5, fileData.indexOf(';'));
      if (mime.startsWith('image/')) {
        if (!text.trim()) parts.push({ type: 'text', text: `Скан протокола: ${fileName}. Распознай и разложи по полям.` });
        parts.push({ type: 'image_url', image_url: { url: fileData } });
      } else {
        if (!text.trim()) parts.push({ type: 'text', text: `Файл протокола: ${fileName}. Распознай и разложи по полям.` });
        parts.push({ type: 'file', file: { filename: fileName, file_data: fileData } });
      }
    }

    let result: any = null;
    const errors: string[] = [];
    // Для сканов и PDF первым берём более сильную модель: распознавание
    // рукописных/отсканированных протоколов у flash заметно хуже.
    const modelOrder = fileData
      ? [...MODELS].sort((a, b) => Number(a.includes('flash')) - Number(b.includes('flash')))
      : MODELS;
    for (const model of modelOrder) {
      try {
        result = await callModel(model, parts);
        result._model = model;
        break;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    if (!result) {
      console.error('[parse-visit-protocol] all models failed', errors);
      return new Response(JSON.stringify({
        error: 'Не удалось распознать документ. Попробуйте ещё раз.',
        details: errors.slice(0, 3).map((m) => m.slice(0, 200)),
      }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Отфильтровать ключи, не разрешённые для типа протокола
    const type = String(result.protocol_type || '');
    const allowed = (SCHEMA as Record<string, readonly string[]>)[type];
    if (allowed && result.protocol_data && typeof result.protocol_data === 'object') {
      const extras: string[] = [];
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(result.protocol_data)) {
        if (v === null || v === '' || v === undefined) continue;
        if (allowed.includes(k)) clean[k] = v;
        else extras.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
      }
      result.protocol_data = clean;
      if (extras.length) {
        result.unmapped = [result.unmapped, ...extras].filter(Boolean).join('\n');
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[parse-visit-protocol]', e);
    return new Response(JSON.stringify({ error: 'Внутренняя ошибка' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
