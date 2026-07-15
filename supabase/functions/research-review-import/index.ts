// Стратегия A — «Причесать готовый текст».
// Принимает {topic, raw_text}, прогоняет через Claude Sonnet по научному
// промпту, сохраняет черновик в research_reviews (status='draft').

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RESEARCH_MODE_SYSTEM_PROMPT } from '../_shared/researchModePrompt.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'anthropic/claude-sonnet-4.5';
const FALLBACK_MODELS = ['anthropic/claude-sonnet-4.6', 'openai/gpt-5.5'];

function slugify(s: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return s.toLowerCase()
    .split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `review-${Date.now()}`;
}

async function callModel(model: string, topic: string, rawText: string, apiKey: string) {
  const userPrompt = `Тема обзора: ${topic}\n\nИсходный текст (нужно причесать по правилам научного обзора):\n\n${rawText}`;
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: RESEARCH_MODE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 12000,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 400)}`);
  }
  const j = await res.json();
  const raw = j?.choices?.[0]?.message?.content ?? '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('no JSON in model response');
  return JSON.parse(jsonMatch[0]);
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

    const { topic, raw_text } = await req.json();
    if (!topic || !raw_text) {
      return new Response(JSON.stringify({ error: 'topic and raw_text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY missing');

    let parsed: any = null;
    let lastErr: any = null;
    for (const model of [PRIMARY_MODEL, ...FALLBACK_MODELS]) {
      try {
        parsed = await callModel(model, topic, raw_text, apiKey);
        break;
      } catch (e) {
        lastErr = e;
        console.warn(`research-review-import: model ${model} failed:`, (e as any)?.message);
      }
    }
    if (!parsed) throw lastErr ?? new Error('all models failed');

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
      source_type: 'manual_import',
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
    console.error('research-review-import error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
