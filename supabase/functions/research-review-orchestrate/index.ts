// Стратегия B — «Полный поиск и написание».
// Три звонка: (1) поиск литературы Perplexity, (2) написание обзора с обязательными маркерами [M#],
// (3) механический факт-чек соответствия маркеров содержимому материалов.
//
// Работает в фоне через EdgeRuntime.waitUntil, чтобы обойти 150-секундный idle-timeout.
// Клиент получает мгновенный ответ { queued: true } и опрашивает research_reviews по review_id.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RESEARCH_MODE_SYSTEM_PROMPT } from '../_shared/researchModePrompt.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const SEARCH_MODEL = 'perplexity/sonar-pro';
const WRITE_PRIMARY = 'anthropic/claude-sonnet-4.5';
const WRITE_FALLBACKS = ['anthropic/claude-sonnet-4.6', 'openai/gpt-5.5'];
const FACTCHECK_MODEL = Deno.env.get('RESEARCH_AI_MODEL') || 'google/gemini-3.1-pro-preview';

const MARKER_RULES = `
ЖЁСТКИЕ ПРАВИЛА ПРОВЕНАНСА ИСТОЧНИКОВ:
- После КАЖДОГО фактического утверждения, взятого из материалов пользователя, ставь маркер вида [M1], [M2] (номер материала).
- Утверждения без опоры на материалы — БЕЗ маркера (или общеизвестный факт).
- ЗАПРЕЩЕНО добавлять источники, отсутствующие в списке материалов пользователя. Список литературы references_list формируется только из этих источников.
- Внутри одного предложения допустимо несколько маркеров: [M1][M3].
`;

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

async function runPipeline(params: {
  topic: string;
  materials_context: string;
  materials_list: any[];
  review_id: string | null;
  authorId: string | null;
  orKey: string;
  lovKey: string;
  admin: any;
}) {
  const { topic, materials_context, materials_list, review_id, authorId, orKey, lovKey, admin } = params;

  let currentStep: 'queued' | 'searching' | 'writing' | 'fact_checking' | 'done' | 'error' = 'queued';

  const markStatus = async (status: string, extra?: any) => {
    if (!review_id) return;
    await admin.from('research_reviews').update({
      fact_check_report: { orchestrator_status: status, last_step: currentStep, updated_at: new Date().toISOString(), ...(extra || {}) },
    }).eq('id', review_id);
  };

  // При завершении воркера (shutdown / beforeunload) фиксируем прерывание с указанием последнего шага.
  const onUnload = () => {
    if (!review_id) return;
    if (currentStep === 'done' || currentStep === 'error') return;
    try {
      admin.from('research_reviews').update({
        fact_check_report: {
          orchestrator_status: 'interrupted',
          last_step: currentStep,
          updated_at: new Date().toISOString(),
        },
      }).eq('id', review_id).then(() => {}, (e: any) => console.warn('unload mark failed:', e?.message));
    } catch (e) {
      console.warn('unload handler error:', (e as any)?.message);
    }
  };
  // @ts-ignore addEventListener доступен в глобальном скоупе Deno / EdgeRuntime
  addEventListener('beforeunload', onUnload);

  try {
    currentStep = 'searching';
    await markStatus('searching');

    const searchPrompt = `Найди свежие систематические обзоры, мета-анализы и клинические руководства по теме: "${topic}".
${materials_context ? `Учитывай контекст уже загруженных материалов:\n${String(materials_context).slice(0, 4000)}\n` : ''}
Приоритет: PubMed/PMC, Cochrane, профильные журналы (последние 5 лет).
Верни: (1) краткий синтез данных (300-600 слов, на русском), (2) 10-20 источников в формате Vancouver с DOI/PMID.`;

    let searchResult = '';
    try {
      searchResult = await callOpenRouter(SEARCH_MODEL, [{ role: 'user', content: searchPrompt }], orKey, 0.1, 6000);
    } catch (e) {
      console.warn('perplexity search failed:', (e as any)?.message);
      searchResult = '(поиск литературы не выполнен — использовать только материалы пользователя)';
    }

    currentStep = 'writing';
    await markStatus('writing', { search_result: String(searchResult || '').slice(0, 20000) });

    const markersList = Array.isArray(materials_list) && materials_list.length
      ? `Маркеры доступных материалов:\n${materials_list.map((m: any) => `${m.marker} — ${m.name || m.url || m.kind}`).join('\n')}\n\n`
      : '';
    const writePrompt = `Тема обзора: ${topic}\n\n${markersList}${materials_context ? `Контекст загруженных материалов:\n${materials_context}\n\n` : ''}Результаты поиска литературы (Perplexity):\n${searchResult}\n\n${MARKER_RULES}\n\nНапиши полный научный обзор по правилам системной инструкции. Верни СТРОГИЙ JSON: {"title","annotation","content","references_list":[{"marker":"[M1]","authors":"...","title":"...","journal":"...","year":"...","doi_or_pmid":"..."}],"seo_title":"...","seo_meta_description":"..."}. В content обязательны маркеры [M#] по правилам выше.

Требования к SEO-полям:
- seo_title: до 60 символов, ЗАКОНЧЕННАЯ фраза на русском, без обрыва на полуслове и без многоточия. Если не помещается — переформулируй короче, а не отрезай.
- seo_meta_description: до 160 символов, ЗАКОНЧЕННОЕ предложение (или два), без обрыва и многоточия. Если не помещается — переформулируй короче.`;

    let parsed: any = null;
    let lastErr: any = null;
    for (const model of [WRITE_PRIMARY, ...WRITE_FALLBACKS]) {
      try {
        const raw = await callOpenRouter(model, [
          { role: 'system', content: RESEARCH_MODE_SYSTEM_PROMPT + '\n\n' + MARKER_RULES },
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

    currentStep = 'fact_checking';
    await markStatus('fact_checking');

    const content = String(parsed.content || '');
    const markerHits = Array.from(content.matchAll(/\[M(\d+)\]/g));
    const markersInContent = new Set(markerHits.map(m => `[M${m[1]}]`));

    let factCheck: any = { verified: [], not_found_in_source: [], unmarked_claims: [], missing_markers: [] };
    try {
      const fcPrompt = `Ты — механический факт-чекер. Даны: контекст материалов пользователя (с маркерами [M#]) и текст обзора с маркерами. Для КАЖДОГО маркера в тексте обзора найди утверждение (одно-два предложения вокруг маркера) и проверь, содержится ли оно (по смыслу) в соответствующем материале.
Также найди утверждения БЕЗ маркеров, которые выглядят как факт из материалов.

Верни СТРОГИЙ JSON:
{
  "verified": [{"claim":"...", "marker":"[M2]"}],
  "not_found_in_source": [{"claim":"...", "marker":"[M5]", "reason":"..."}],
  "unmarked_claims": ["утверждение без маркера, похоже на факт"]
}

Материалы пользователя:
${materials_context ? String(materials_context).slice(0, 8000) : '(не приложены)'}

Текст обзора:
${content.slice(0, 20000)}`;

      const fcRaw = await callGateway(FACTCHECK_MODEL, [{ role: 'user', content: fcPrompt }], lovKey, 6000);
      const fcJson = JSON.parse(fcRaw.match(/\{[\s\S]*\}/)?.[0] || '{}');
      factCheck = {
        verified: Array.isArray(fcJson.verified) ? fcJson.verified : [],
        not_found_in_source: Array.isArray(fcJson.not_found_in_source) ? fcJson.not_found_in_source : [],
        unmarked_claims: Array.isArray(fcJson.unmarked_claims) ? fcJson.unmarked_claims : [],
        missing_markers: [],
      };
    } catch (e) {
      console.warn('fact-check step failed:', (e as any)?.message);
    }

    if (Array.isArray(materials_list)) {
      for (const m of materials_list) {
        if (m?.marker && !markersInContent.has(m.marker)) {
          factCheck.missing_markers.push({ marker: m.marker, name: m.name || m.url || m.kind });
        }
      }
    }
    factCheck.orchestrator_status = 'done';
    factCheck.updated_at = new Date().toISOString();

    const title = String(parsed.title || topic || 'Обзор').slice(0, 300);
    const annotation = String(parsed.annotation || '').slice(0, 2000);
    const refs = Array.isArray(parsed.references_list) ? parsed.references_list : [];

    if (review_id) {
      await admin.from('research_reviews').update({
        title, annotation, content,
        content_with_markers: content,
        topic: topic || null,
        references_list: refs,
        fact_check_report: factCheck,
        source_type: 'orchestrator_generated',
        seo_title: title.slice(0, 60),
        seo_meta_description: annotation.slice(0, 160),
      }).eq('id', review_id);
    } else {
      const baseSlug = slugify(title);
      let slug = baseSlug;
      for (let i = 2; i < 50; i++) {
        const { data: dup } = await admin.from('research_reviews').select('id').eq('slug', slug).maybeSingle();
        if (!dup) break;
        slug = `${baseSlug}-${i}`;
      }
      await admin.from('research_reviews').insert({
        slug, title, annotation, content,
        content_with_markers: content,
        topic: topic || null,
        references_list: refs,
        fact_check_report: factCheck,
        source_type: 'orchestrator_generated',
        seo_title: title.slice(0, 60),
        seo_meta_description: annotation.slice(0, 160),
        status: 'draft',
        author_id: authorId,
      });
    }
    currentStep = 'done';
  } catch (e: any) {
    currentStep = 'error';
    console.error('orchestrator pipeline failed:', e);
    await markStatus('error', { error: String(e?.message || e).slice(0, 500) });
  } finally {
    try {
      // @ts-ignore
      removeEventListener('beforeunload', onUnload);
    } catch { /* noop */ }
  }
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

    const { topic, materials_context, materials_list, review_id } = await req.json();
    if (!topic && !materials_context) {
      return new Response(JSON.stringify({ error: 'topic or materials_context required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orKey = Deno.env.get('OPENROUTER_API_KEY');
    const lovKey = Deno.env.get('LOVABLE_API_KEY');
    if (!orKey) throw new Error('OPENROUTER_API_KEY missing');
    if (!lovKey) throw new Error('LOVABLE_API_KEY missing');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const userRes = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();
    const authorId = userRes.data?.user?.id ?? null;

    // Отметим статус сразу, чтобы клиент увидел «запущено»
    if (review_id) {
      await admin.from('research_reviews').update({
        fact_check_report: { orchestrator_status: 'queued', updated_at: new Date().toISOString() },
      }).eq('id', review_id);
    }

    const task = runPipeline({
      topic: topic || '',
      materials_context: materials_context || '',
      materials_list: materials_list || [],
      review_id: review_id || null,
      authorId,
      orKey, lovKey, admin,
    });

    // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(task);
    } else {
      // Fallback: не блокируем ответ
      task.catch((e) => console.error(e));
    }

    return new Response(JSON.stringify({ ok: true, queued: true, review_id: review_id || null }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('research-review-orchestrate error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
