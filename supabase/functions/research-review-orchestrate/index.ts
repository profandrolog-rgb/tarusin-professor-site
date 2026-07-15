// Стратегия B — «Полный поиск и написание».
// Принимает {topic}, запускает поиск (Perplexity Sonar с реальным поиском)
// -> написание по научному промпту -> сохранение черновика.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RESEARCH_MODE_SYSTEM_PROMPT } from '../_shared/researchModePrompt.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SEARCH_MODEL = 'perplexity/sonar-pro';
const WRITE_PRIMARY = 'anthropic/claude-sonnet-4.5';
const WRITE_FALLBACKS = ['anthropic/claude-sonnet-4.6', 'openai/gpt-5.5'];

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { topic } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: 'topic required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY missing');

    // Шаг 1: поиск литературы через Perplexity (real-time web + PubMed).
    const searchPrompt = `Найди свежие систематические обзоры, мета-анализы и клинические руководства по теме: "${topic}".
Приоритет: PubMed/PMC, Cochrane, профильные журналы (последние 5 лет).
Верни: (1) краткий синтез данных (300-600 слов, на русском), (2) 10-20 источников в формате Vancouver с DOI/PMID где возможно.`;

    let searchResult = '';
    try {
      searchResult = await callOpenRouter(SEARCH_MODEL, [{ role: 'user', content: searchPrompt }], apiKey, 0.1, 6000);
    } catch (e) {
      console.warn('research-review-orchestrate: perplexity search failed, continuing without:', (e as any)?.message);
      searchResult = '(поиск литературы не выполнен — модель поиска недоступна; используй только известные данные)';
    }

    // Шаг 2: написание обзора по научному промпту.
    const writePrompt = `Тема обзора: ${topic}\n\nРезультаты поиска литературы:\n\n${searchResult}\n\nНапиши полный научный обзор по правилам, приведённым в системной инструкции. Верни строгий JSON.`;

    let parsed: any = null;
    let lastErr: any = null;
    for (const model of [WRITE_PRIMARY, ...WRITE_FALLBACKS]) {
      try {
        const raw = await callOpenRouter(model, [
          { role: 'system', content: RESEARCH_MODE_SYSTEM_PROMPT },
          { role: 'user', content: writePrompt },
        ], apiKey, 0.2, 14000);
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('no JSON in response');
        parsed = JSON.parse(m[0]);
        break;
      } catch (e) {
        lastErr = e;
        console.warn(`research-review-orchestrate: ${model} failed:`, (e as any)?.message);
      }
    }
    if (!parsed) throw lastErr ?? new Error('all writer models failed');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const userRes = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();
    const authorId = userRes.data?.user?.id ?? null;

    const title = String(parsed.title || topic).slice(0, 300);
    const baseSlug = slugify(title);
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const { data: dup } = await supabase.from('research_reviews').select('id').eq('slug', slug).maybeSingle();
      if (!dup) break;
      slug = `${baseSlug}-${i}`;
    }

    const { data: inserted, error } = await supabase.from('research_reviews').insert({
      slug,
      title,
      annotation: String(parsed.annotation || '').slice(0, 2000),
      content: String(parsed.content || ''),
      topic,
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
