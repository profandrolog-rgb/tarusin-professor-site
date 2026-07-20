// Стратегия B — «Полный поиск и написание».
// Три звонка: (1) поиск литературы Perplexity, (2) написание обзора Gemini/Claude,
// (3) факт-чек и правки Gemini. Принимает опциональный materials_context — текст первичного
// анализа мультимодальных материалов (см. research-materials-analyze).

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RESEARCH_MODE_SYSTEM_PROMPT } from '../_shared/researchModePrompt.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const SEARCH_MODEL = 'perplexity/sonar-pro';
const WRITE_PRIMARY = 'anthropic/claude-sonnet-4.5';
const WRITE_FALLBACKS = ['anthropic/claude-sonnet-4.6', 'openai/gpt-5.5'];
const FACTCHECK_MODEL = 'google/gemini-3.1-pro-preview';

function slugify(s: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return s.toLowerCase().split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 80) || `review-${Date.now()}`;
}

async function callOpenRouter(model: string, messages: any[], apiKey: string, temperature = 0.2, maxTokens = 12000) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`${model} ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  return String(j?.choices?.[0]?.message?.content ?? '');
}

async function callGateway(model: string, messages: any[], key: string, maxTokens = 8000) {
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, response_format: { type: 'json_object' } }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`${model} gateway ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  return String(j?.choices?.[0]?.message?.content ?? '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { topic, materials_context, review_id } = await req.json();
    if (!topic && !materials_context) {
      return new Response(JSON.stringify({ error: 'topic or materials_context required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orKey = Deno.env.get('OPENROUTER_API_KEY');
    const lovKey = Deno.env.get('LOVABLE_API_KEY');
    if (!orKey) throw new Error('OPENROUTER_API_KEY missing');
    if (!lovKey) throw new Error('LOVABLE_API_KEY missing');

    // Шаг 1: поиск литературы через Perplexity.
    const searchPrompt = `Найди свежие систематические обзоры, мета-анализы и клинические руководства по теме: "${topic}".
${materials_context ? `Учитывай контекст уже загруженных материалов:\n${String(materials_context).slice(0, 4000)}\n` : ''}
Приоритет: PubMed/PMC, Cochrane, профильные журналы (последние 5 лет).
Верни: (1) краткий синтез данных (300-600 слов, на русском), (2) 10-20 источников в формате Vancouver с DOI/PMID.`;

    let searchResult = '';
    try {
      searchResult = await callOpenRouter(SEARCH_MODEL, [{ role: 'user', content: searchPrompt }], orKey, 0.1, 6000);
    } catch (e) {
      console.warn('perplexity search failed:', (e as any)?.message);
      searchResult = '(поиск литературы не выполнен — использовать только известные данные и контекст материалов)';
    }

    // Шаг 2: написание обзора.
    const writePrompt = `Тема обзора: ${topic}\n\n${materials_context ? `Контекст загруженных пользователем материалов:\n${materials_context}\n\n` : ''}Результаты поиска литературы:\n\n${searchResult}\n\nНапиши полный научный обзор по правилам системной инструкции. Верни строгий JSON.`;

    let parsed: any = null;
    let lastErr: any = null;
    for (const model of [WRITE_PRIMARY, ...WRITE_FALLBACKS]) {
      try {
        const raw = await callOpenRouter(model, [
          { role: 'system', content: RESEARCH_MODE_SYSTEM_PROMPT },
          { role: 'user', content: writePrompt },
        ], orKey, 0.2, 14000);
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('no JSON in response');
        parsed = JSON.parse(m[0]);
        break;
      } catch (e) {
        lastErr = e;
        console.warn(`writer ${model} failed:`, (e as any)?.message);
      }
    }
    if (!parsed) throw lastErr ?? new Error('all writer models failed');

    // Шаг 3: факт-чек через Gemini (сверка с материалами и источниками).
    try {
      const fcPrompt = `Проверь текст научного обзора на:
- фактические неточности,
- расхождения с приведёнными источниками,
- расхождения с контекстом материалов пользователя.

Верни JSON вида {"fact_check_report": [{"quote":"...","issue":"...","suggested_fix":"...","confidence":"high|medium|low"}]}. Если проблем нет — верни {"fact_check_report": []}.

Материалы пользователя:
${materials_context ? String(materials_context).slice(0, 6000) : '(не приложены)'}

Найденные источники:
${String(searchResult).slice(0, 6000)}

Текст обзора:
${String(parsed.content || '').slice(0, 20000)}`;

      const fcRaw = await callGateway(FACTCHECK_MODEL, [{ role: 'user', content: fcPrompt }], lovKey, 6000);
      const fcJson = JSON.parse(fcRaw.match(/\{[\s\S]*\}/)?.[0] || '{}');
      if (Array.isArray(fcJson.fact_check_report)) {
        parsed.fact_check_report = [...(parsed.fact_check_report || []), ...fcJson.fact_check_report];
      }
    } catch (e) {
      console.warn('fact-check step failed:', (e as any)?.message);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const userRes = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();
    const authorId = userRes.data?.user?.id ?? null;

    const title = String(parsed.title || topic || 'Обзор').slice(0, 300);

    // Если передан review_id — обновляем существующий; иначе создаём новый.
    if (review_id) {
      const { data: updated, error } = await supabase.from('research_reviews').update({
        title,
        annotation: String(parsed.annotation || '').slice(0, 2000),
        content: String(parsed.content || ''),
        topic: topic || null,
        references_list: Array.isArray(parsed.references_list) ? parsed.references_list : [],
        fact_check_report: Array.isArray(parsed.fact_check_report) ? parsed.fact_check_report : [],
        source_type: 'orchestrator_generated',
        seo_title: title.slice(0, 60),
        seo_meta_description: String(parsed.annotation || '').slice(0, 160),
      }).eq('id', review_id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, review: updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const { data: dup } = await supabase.from('research_reviews').select('id').eq('slug', slug).maybeSingle();
      if (!dup) break;
      slug = `${baseSlug}-${i}`;
    }

    const { data: inserted, error } = await supabase.from('research_reviews').insert({
      slug, title,
      annotation: String(parsed.annotation || '').slice(0, 2000),
      content: String(parsed.content || ''),
      topic: topic || null,
      references_list: Array.isArray(parsed.references_list) ? parsed.references_list : [],
      fact_check_report: Array.isArray(parsed.fact_check_report) ? parsed.fact_check_report : [],
      source_type: 'orchestrator_generated',
      seo_title: title.slice(0, 60),
      seo_meta_description: String(parsed.annotation || '').slice(0, 160),
      status: 'draft',
      author_id: authorId,
    }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, review: inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('research-review-orchestrate error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
