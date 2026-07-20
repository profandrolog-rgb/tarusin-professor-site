// Итеративные правки контента обзора через AI-чат.
// Модель — из RESEARCH_AI_MODEL. Маркеры источников [M#] сохраняются.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = Deno.env.get('RESEARCH_AI_MODEL') || 'google/gemini-3.1-pro-preview';

const ACTION_PROMPTS: Record<string, string> = {
  shorten: 'Сократи текст обзора в 1.5–2 раза, сохрани все ключевые тезисы и маркеры источников [M#].',
  deepen: 'Углуби текст: добавь патофизиологические детали, механизмы, нюансы клинической картины. Сохрани существующие маркеры [M#]; новые утверждения бери только из контекста материалов и помечай их соответствующим [M#].',
  expand: 'Расширь и дополни обзор новыми разделами из контекста материалов. Каждое новое утверждение помечай маркером [M#] источника из материалов. Не выдумывай источники.',
  merge: 'Объедини текущий текст обзора с дополнительным контекстом ниже, устрани дубли, сохрани логику и маркеры [M#].',
  rewrite_scientific: 'Перепиши текст в строго научном стиле медицинского журнала: убери разговорные обороты, добавь точность формулировок. Все маркеры [M#] сохрани в тех же местах.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { current_content, action, custom_prompt, materials_context, title } = await req.json();
    if (!current_content && !custom_prompt) {
      return new Response(JSON.stringify({ error: 'nothing to refine' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const lovKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovKey) throw new Error('LOVABLE_API_KEY missing');

    const actionInstr = ACTION_PROMPTS[action] || '';
    const instruction = [actionInstr, custom_prompt].filter(Boolean).join('\n\n');
    if (!instruction) {
      return new Response(JSON.stringify({ error: 'no action or prompt' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = `Ты — научный редактор медицинского журнала. Возвращаешь строго JSON:
{"new_content":"обновлённый HTML/markdown текст обзора","diff_summary":"1–3 предложения о том, что изменил"}

Жёсткие правила:
- Маркеры источников вида [M1], [M2] — обязательны после каждого фактического утверждения, взятого из материалов.
- Новые ссылки/источники из общих знаний модели ДОБАВЛЯТЬ ЗАПРЕЩЕНО.
- Если утверждение не опирается на материал — маркер не ставь.
- Никогда не переписывай маркер на другой без явной причины из контекста материалов.`;

    const userText = [
      title ? `Название обзора: ${title}` : '',
      materials_context ? `Контекст материалов (с их маркерами):\n${materials_context}` : '',
      `Текущий текст обзора:\n${current_content || '(пусто)'}`,
      `Инструкция:\n${instruction}`,
    ].filter(Boolean).join('\n\n---\n\n');

    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': lovKey },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'gateway_error', status: res.status, details: t.slice(0, 500) }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const j = await res.json();
    const raw = String(j?.choices?.[0]?.message?.content ?? '{}');
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { new_content: raw, diff_summary: '' };
    }

    return new Response(JSON.stringify({ ok: true, ...parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('research-materials-refine error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
