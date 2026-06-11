import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SYSTEM_PROMPT = `Ты — редактор медицинского сайта tarusin.pro. Твоя задача — взять сырой медицинский текст и превратить его в готовый markdown для публикации на сайте.

АУДИТОРИЯ: родители детей (основная), подростки, врачи-коллеги.
СТИЛЬ: написано от первого лица профессором — сохрани этот голос.
ЯЗЫК: русский, медицинский, но понятный неспециалисту.

ПРАВИЛА ФОРМАТИРОВАНИЯ:

1. ЗАГОЛОВКИ
## Раздел — для крупных тем (Этиология, Патогенез, Клиника, Диагностика, Лечение, Операция, Прогноз, FAQ)
### Подраздел — для подтем внутри крупных разделов
Заголовки пиши конкретно и понятно — не «Введение», а «Что такое гинекомастия»

2. АБЗАЦЫ И ТЕКСТ
- Каждая мысль = отдельный абзац с пустой строкой между абзацами
- Ключевые термины, цифры, важные факты — **жирным**
- Не более 4–5 предложений в абзаце
- Сохраняй авторский голос: «я вижу», «в моей практике», «скажу честно»

3. СПИСКИ
- Маркированные списки для перечислений (симптомы, причины, признаки)
- Нумерованные для последовательных действий и шагов
- Каждый пункт — минимум одно полное предложение

4. ВРЕЗКИ
> 💡 **Важно знать:** для ключевых фактов которые родитель должен запомнить
> ⚠️ **Когда срочно к врачу:** для тревожных симптомов
> 📊 **Цифры:** для статистики и эпидемиологии

5. РАЗДЕЛИТЕЛИ
После каждого крупного раздела (## заголовок) ставь: ---

6. МАРКЕРЫ ГАЛЕРЕЙ
После каждого --- ставь маркер галереи с описанием:
[[GALLERY: caption="описание что здесь нужно проиллюстрировать"]]

7. ТАБЛИЦЫ
Если в тексте есть сравнение — оформляй как markdown-таблицу.

8. ОСОБЫЕ УКАЗАНИЯ
- Сохраняй авторские истории и личные примеры из практики
- Не удаляй юмор и живой язык автора
- Числа и проценты всегда жирным: **62%**, **4–6 часов**
- Латинские термины после русского названия в скобках
- В конце не добавляй призыв «запишитесь на приём»

Начало ответа: сразу с markdown без предисловий. Конец ответа: строка ===КОНЕЦ===`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', claims.claims.sub)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (text.length > 80000) {
      return new Response(JSON.stringify({ error: 'text too long (max 80000 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callAnthropic = (maxTokens: number) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: text }],
        }),
      }).finally(() => clearTimeout(timeoutId));
    };

    // First attempt with 16000 tokens; one retry with 8000 tokens on failure
    let aiResp: Response | null = null;
    let lastErrText = '';
    const tokenBudgets = [16000, 8000];
    for (let attempt = 0; attempt < tokenBudgets.length; attempt++) {
      try {
        aiResp = await callAnthropic(tokenBudgets[attempt]);
        if (aiResp.ok) break;
        lastErrText = await aiResp.text();
        const retriable = [429, 500, 502, 503, 529].includes(aiResp.status);
        console.error(`Anthropic attempt ${attempt + 1} status ${aiResp.status}`, lastErrText);
        if (!retriable || attempt === tokenBudgets.length - 1) break;
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        lastErrText = String((err as any)?.message || err);
        console.error(`Anthropic attempt ${attempt + 1} threw`, lastErrText);
        if (attempt === tokenBudgets.length - 1) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }


    if (!aiResp || !aiResp.ok) {
      const status = aiResp?.status ?? 500;
      const userMsg = status === 529 || status === 503
        ? 'Сервис ИИ временно перегружен. Попробуйте ещё раз через минуту.'
        : status === 429
        ? 'Превышен лимит запросов к ИИ. Попробуйте позже.'
        : `Ошибка ИИ (${status}). Попробуйте ещё раз.`;
      return new Response(JSON.stringify({ error: userMsg, details: lastErrText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse SSE stream from Anthropic to accumulate text deltas
    let raw = '';
    const reader = aiResp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            raw += evt.delta.text || '';
          }
        } catch { /* ignore parse errors */ }
      }
    }
    const formatted = raw.replace(/===КОНЕЦ===\s*$/i, '').trim();


    return new Response(JSON.stringify({ formatted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('format-disease-article error:', e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
