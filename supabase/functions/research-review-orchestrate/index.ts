// Стратегия B — «Полный поиск и написание».
// Три звонка: (1) поиск литературы Perplexity, (2) написание обзора с обязательными маркерами [M#],
// (3) механический факт-чек соответствия маркеров содержимому материалов.
//
// Работает в фоне через EdgeRuntime.waitUntil, чтобы обойти 150-секундный idle-timeout.
// Клиент получает мгновенный ответ { queued: true } и опрашивает research_reviews по review_id.

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RESEARCH_MODE_SYSTEM_PROMPT } from '../_shared/researchModePrompt.ts';
import { callWithFallback, extractCompletion } from '../_shared/aiCallWithFallback.ts';
import { voicePromptBlock, type VoiceMode } from '../_shared/voicePrompts.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// По задаче: разные этапы — разные модели. Общий fallback — RESEARCH_AI_MODEL.
const GLOBAL_FALLBACK = Deno.env.get('RESEARCH_AI_MODEL') || 'google/gemini-3.1-pro-preview';
const SEARCH_MODEL =
  Deno.env.get('RESEARCH_SEARCH_MODEL') || Deno.env.get('RESEARCH_AI_MODEL') || 'perplexity/sonar-pro';
const WRITE_MODEL =
  Deno.env.get('RESEARCH_WRITE_MODEL') || Deno.env.get('RESEARCH_AI_MODEL') || 'anthropic/claude-opus-4-8';
const FACTCHECK_MODEL =
  Deno.env.get('RESEARCH_FACTCHECK_MODEL') || Deno.env.get('RESEARCH_AI_MODEL') || 'tencent/hy3';

const MARKER_RULES = `
ЖЁСТКИЕ ПРАВИЛА ПРОВЕНАНСА И БИБЛИОГРАФИИ:

Маркеры [M#] — это ВНУТРЕННЯЯ метка провенанса (откуда взято утверждение из материалов пользователя). Они НЕ являются библиографическими ссылками и НЕ выводятся читателю как сноски.
- После КАЖДОГО фактического утверждения, взятого из материалов пользователя, ставь маркер вида [M1], [M2] (номер материала).
- Утверждения без опоры на материалы пользователя — БЕЗ маркера (если это общеизвестный факт или данные из результатов поиска Perplexity).
- ДЕДУПЛИКАЦИЯ: если несколько подряд идущих предложений опираются на один и тот же материал, ставь маркер один раз в конце этого фрагмента, а не после каждого предложения. Маркер обязателен при смене источника и в конце абзаца. Не ставь один и тот же [M#] три раза подряд.

references_list — это РЕАЛЬНАЯ библиография для читателя (реальные научные публикации).
- Включай сюда ТОЛЬКО настоящие публикации: (а) источники, найденные Perplexity на этапе поиска литературы (с DOI/PMID/журналом), (б) реальные научные публикации, если они действительно присутствуют в материалах пользователя как цитируемые работы.
- НЕ включай в references_list загруженные пользователем файлы, заметки, диктовки, презентации, собственные материалы — они уже отражены маркерами [M#] и не являются публикациями.
- НЕ выдумывай источники. Не пиши заглушек типа «Автор материала», «Не применимо», «н/д». Если поле неизвестно — оставь его пустой строкой "".
- Каждому источнику проставляй поле "verified": false (автор проверит вручную).
- Формат: {"authors":"...","title":"...","journal":"...","year":"...","volume_issue":"...","pages":"...","doi_or_pmid":"...","verified":false}.
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


async function runPipeline(params: {
  topic: string;
  materials_context: string;
  materials_list: any[];
  review_id: string | null;
  authorId: string | null;
  voiceMode: VoiceMode;
  orKey: string;
  lovKey: string;
  admin: any;
}) {
  const { topic, materials_context, materials_list, review_id, authorId, voiceMode, orKey, lovKey, admin } = params;

  let currentStep: 'queued' | 'searching' | 'writing' | 'fact_checking' | 'done' | 'error' = 'queued';
  // Локальный аккумулятор операционного состояния — попадает целиком в orchestrator_state.
  const state: Record<string, any> = {};

  const markStatus = async (status: string, extra?: any) => {
    if (!review_id) return;
    Object.assign(state, extra || {});
    state.orchestrator_status = status;
    state.last_step = currentStep;
    state.updated_at = new Date().toISOString();
    await admin.from('research_reviews').update({
      orchestrator_state: { ...state },
    }).eq('id', review_id);
  };

  // При завершении воркера (shutdown / beforeunload) фиксируем прерывание с указанием последнего шага.
  const onUnload = () => {
    if (!review_id) return;
    if (currentStep === 'done' || currentStep === 'error') return;
    try {
      admin.from('research_reviews').update({
        orchestrator_state: {
          ...state,
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

    const modelsUsed: Record<string, string> = {};

    let searchResult = '';
    try {
      const r = await callWithFallback({
        url: OPENROUTER_URL,
        headers: { Authorization: `Bearer ${orKey}` },
        primary: SEARCH_MODEL,
        fallback: GLOBAL_FALLBACK,
        timeoutMs: 120_000,
        label: 'search',
        buildBody: (model) => ({
          model,
          messages: [{ role: 'user', content: searchPrompt }],
          temperature: 0.1,
          max_tokens: 6000,
        }),
      });
      searchResult = extractCompletion(r.json);
      modelsUsed.searching = r.modelUsed;
      console.log(`search done: model=${r.modelUsed} fallback=${r.wasFallback}`);
    } catch (e) {
      console.warn('search failed:', (e as any)?.message);
      searchResult = '(поиск литературы не выполнен — использовать только материалы пользователя)';
      modelsUsed.searching = `${SEARCH_MODEL} (не выполнено)`;
    }

    currentStep = 'writing';
    await markStatus('writing', { search_result: String(searchResult || '').slice(0, 20000), models_used: { ...modelsUsed } });

    const markersList = Array.isArray(materials_list) && materials_list.length
      ? `Маркеры доступных материалов:\n${materials_list.map((m: any) => `${m.marker} — ${m.name || m.url || m.kind}`).join('\n')}\n\n`
      : '';
    const writePrompt = `Тема обзора: ${topic}\n\n${markersList}${materials_context ? `Контекст загруженных материалов:\n${materials_context}\n\n` : ''}Результаты поиска литературы (Perplexity):\n${searchResult}\n\n${MARKER_RULES}\n${voicePromptBlock(voiceMode)}\n\nНапиши полный научный обзор по правилам системной инструкции. Верни СТРОГИЙ JSON: {"title","annotation","content","references_list":[{"marker":"[M1]","authors":"...","title":"...","journal":"...","year":"...","doi_or_pmid":"..."}],"seo_title":"...","seo_meta_description":"..."}. В content обязательны маркеры [M#] по правилам выше.

Требования к SEO-полям:
- seo_title: до 60 символов, ЗАКОНЧЕННАЯ фраза на русском, без обрыва на полуслове и без многоточия. Если не помещается — переформулируй короче, а не отрезай.
- seo_meta_description: до 160 символов, ЗАКОНЧЕННОЕ предложение (или два), без обрыва и многоточия. Если не помещается — переформулируй короче.`;

    let parsed: any = null;
    try {
      const wr = await callWithFallback({
        url: OPENROUTER_URL,
        headers: { Authorization: `Bearer ${orKey}` },
        primary: WRITE_MODEL,
        fallback: GLOBAL_FALLBACK,
        timeoutMs: 120_000,
        label: 'write',
        buildBody: (model) => ({
          model,
          messages: [
            { role: 'system', content: RESEARCH_MODE_SYSTEM_PROMPT + '\n\n' + MARKER_RULES },
            { role: 'user', content: writePrompt },
          ],
          temperature: 0.2,
          max_tokens: 14000,
        }),
      });
      const raw = extractCompletion(wr.json);
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('no JSON in writer response');
      parsed = JSON.parse(m[0]);
      modelsUsed.writing = wr.modelUsed;
      console.log(`write done: model=${wr.modelUsed} fallback=${wr.wasFallback}`);
    } catch (e) {
      throw new Error(`writer failed: ${(e as any)?.message}`);
    }

    currentStep = 'fact_checking';
    await markStatus('fact_checking', { models_used: { ...modelsUsed } });

    const content = String(parsed.content || '');
    const markerHits = Array.from(content.matchAll(/\[M(\d+)\]/g));
    const markersInContent = new Set(markerHits.map(m => `[M${m[1]}]`));

    let factCheck: any = { verified: [], not_found_in_source: [], unmarked_claims: [], missing_markers: [] };
    try {
      const fcPrompt = `Ты — механический факт-чекер. Даны: контекст материалов пользователя (с маркерами [M#]) и текст обзора с маркерами. Для КАЖДОГО маркера в тексте обзора найди утверждение (одно-два предложения вокруг маркера) и проверь, содержится ли оно (по смыслу) в соответствующем материале.
Также найди утверждения БЕЗ маркеров, которые выглядят как факт из материалов. Если утверждение не найдено в материалах — так и напиши, НЕ придумывай подтверждение.

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

      const fc = await callWithFallback({
        url: GATEWAY_URL,
        headers: { 'Lovable-API-Key': lovKey },
        primary: FACTCHECK_MODEL,
        fallback: GLOBAL_FALLBACK,
        timeoutMs: 120_000,
        label: 'factcheck',
        buildBody: (model) => ({
          model,
          messages: [{ role: 'user', content: fcPrompt }],
          max_tokens: 6000,
          response_format: { type: 'json_object' },
        }),
      });
      const fcRaw = extractCompletion(fc.json);
      const fcJson = JSON.parse(fcRaw.match(/\{[\s\S]*\}/)?.[0] || '{}');
      factCheck = {
        verified: Array.isArray(fcJson.verified) ? fcJson.verified : [],
        not_found_in_source: Array.isArray(fcJson.not_found_in_source) ? fcJson.not_found_in_source : [],
        unmarked_claims: Array.isArray(fcJson.unmarked_claims) ? fcJson.unmarked_claims : [],
        missing_markers: [],
      };
      modelsUsed.fact_checking = fc.modelUsed;
      console.log(`factcheck done: model=${fc.modelUsed} fallback=${fc.wasFallback}`);
    } catch (e) {
      console.warn('fact-check step failed:', (e as any)?.message);
      modelsUsed.fact_checking = `${FACTCHECK_MODEL} (не выполнено)`;
    }


    if (Array.isArray(materials_list)) {
      for (const m of materials_list) {
        if (m?.marker && !markersInContent.has(m.marker)) {
          factCheck.missing_markers.push({ marker: m.marker, name: m.name || m.url || m.kind });
        }
      }
    }
    factCheck.updated_at = new Date().toISOString();

    const title = String(parsed.title || topic || 'Обзор').slice(0, 300);
    const annotation = String(parsed.annotation || '').slice(0, 2000);
    const rawRefs = Array.isArray(parsed.references_list) ? parsed.references_list : [];
    const isPlaceholder = (s: any) => typeof s === "string" && /^(не\s*применимо|автор\s*материала|н\/д|n\/a|—|-)$/i.test(s.trim());
    const cleanField = (s: any) => {
      if (typeof s !== "string") return "";
      const t = s.trim();
      return isPlaceholder(t) ? "" : t;
    };
    const refs = rawRefs
      .map((r: any, i: number) => ({
        number: typeof r?.number === "number" ? r.number : i + 1,
        authors: cleanField(r?.authors),
        title: cleanField(r?.title),
        journal: cleanField(r?.journal),
        year: cleanField(r?.year),
        volume_issue: cleanField(r?.volume_issue),
        pages: cleanField(r?.pages),
        doi_or_pmid: cleanField(r?.doi_or_pmid),
        verified: r?.verified === true,
      }))
      .filter((r: any) => r.authors || r.title || r.journal || r.doi_or_pmid);
    const seoTitle = String(parsed.seo_title || title || '').trim();
    const seoDesc = String(parsed.seo_meta_description || annotation || '').trim();

    if (review_id) {
      await admin.from('research_reviews').update({
        title, annotation, content,
        content_with_markers: content,
        topic: topic || null,
        references_list: refs,
        fact_check_report: factCheck,
        source_type: 'orchestrator_generated',
        seo_title: seoTitle,
        seo_meta_description: seoDesc,
        // Автопереход жизненного цикла: писать → редактировать
        workflow_state: 'editing',
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
        seo_title: seoTitle,
        seo_meta_description: seoDesc,
        status: 'draft',
        workflow_state: 'editing',
        voice_mode: voiceMode,
        author_id: authorId,
      });
    }
    currentStep = 'done';
    await markStatus('done', { models_used: { ...modelsUsed } });
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

    const { topic, materials_context, materials_list, review_id, voice_mode: voiceModeIn } = await req.json();
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

    // Разрешённые значения режима голоса; по умолчанию — impersonal (научный обзор).
    let voiceMode: VoiceMode = (['impersonal','own_data','authorial'] as const).includes(voiceModeIn)
      ? voiceModeIn as VoiceMode
      : 'impersonal';

    // Отметим статус сразу, чтобы клиент увидел «запущено»
    if (review_id) {
      // Подхватываем voice_mode из БД, если не передан явно.
      if (!voiceModeIn) {
        const { data: row } = await admin.from('research_reviews').select('voice_mode').eq('id', review_id).maybeSingle();
        const dbMode = (row as any)?.voice_mode;
        if (dbMode && (['impersonal','own_data','authorial'] as const).includes(dbMode)) voiceMode = dbMode;
      }
      await admin.from('research_reviews').update({
        orchestrator_state: { orchestrator_status: 'queued', last_step: 'queued', updated_at: new Date().toISOString() },
        workflow_state: 'writing',
      }).eq('id', review_id);
    }

    const task = runPipeline({
      topic: topic || '',
      materials_context: materials_context || '',
      materials_list: materials_list || [],
      review_id: review_id || null,
      authorId,
      voiceMode,
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
