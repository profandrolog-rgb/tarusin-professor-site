import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are a medical article formatter. Convert the input text into clean markdown. Rules:
- ## for main sections, ### for subsections
- **bold** for key terms, numbers, percentages
- > 💡 **Важно знать:** for key facts
- > ⚠️ **Когда срочно к врачу:** for warning signs
- > 📊 **Цифры:** for statistics

=== АБСОЛЮТНЫЙ ЗАПРЕТ — ТАБЛИЦЫ (САМОЕ ВАЖНОЕ ПРАВИЛО) ===
Таблицы в тексте — священны. Эти правила нарушать НЕЛЬЗЯ НИКОГДА:
1. НИКОГДА не превращай таблицу в сплошной текст или абзац.
2. НИКОГДА не склеивай ячейки таблицы в один абзац или строку.
3. НИКОГДА не удаляй колонки или строки из таблицы.
4. НИКОГДА не упрощай таблицу — все колонки и все строки должны остаться.
5. НИКОГДА не заменяй таблицу маркированным или нумерованным списком.

Любые табличные данные (классификации, сравнения, дозировки, расписания, степени/стадии, протоколы) ОБЯЗАТЕЛЬНО сохраняй строго в GFM-формате:

| Колонка 1 | Колонка 2 | Колонка 3 |
| --- | --- | --- |
| Ячейка | Ячейка | Ячейка |

Жёсткие требования к таблице:
- Строка-разделитель \`| --- | --- | --- |\` ОБЯЗАТЕЛЬНА сразу после строки заголовка.
- Каждая строка начинается и заканчивается символом \`|\`.
- Между таблицей и соседними абзацами — пустая строка сверху и пустая строка снизу.
- Каждая ячейка сохраняется ДОСЛОВНО, без сокращений и перефразирования.

Если таблица пришла слипшейся (например: «СтепеньОписаниеХарактеристика...» или вся таблица в одном абзаце) — ВОССТАНОВИ её структуру по смыслу: определи названия колонок по повторяющимся меткам (Степень, Стадия, I/II/III, римские/арабские номера, ключевые термины), разбей слипшийся текст на правильные колонки и строки и выведи как полноценную GFM-таблицу. Никогда не оставляй слипшийся табличный текст как абзац.
=== КОНЕЦ ПРАВИЛ ПО ТАБЛИЦАМ ===

- Keep [[GALLERY: caption="..."]] markers exactly as they appear in the text
- Preserve the author's voice and personal stories
- Do not add or remove content (кроме восстановления структуры таблиц, описанного выше)

Return only the formatted markdown, nothing else.`;

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

    const MODEL_ID = 'claude-sonnet-4-6';

    const callAnthropic = (maxTokens: number, stream: boolean) => {
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
          model: MODEL_ID,
          max_tokens: maxTokens,
          stream,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: text }],
        }),
      }).finally(() => clearTimeout(timeoutId));
    };

    // First attempt with 16000 tokens; one retry with 8000 tokens on failure
    let aiResp: Response | null = null;
    let lastErrText = '';
    const tokenBudgets = [16000, 8000];
    let usedTokenBudget = tokenBudgets[0];
    let httpAttempts = 0;
    for (let attempt = 0; attempt < tokenBudgets.length; attempt++) {
      httpAttempts++;
      usedTokenBudget = tokenBudgets[attempt];
      try {
        aiResp = await callAnthropic(usedTokenBudget, true);
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

    // Buffer the Anthropic SSE stream fully on the server, then return a single JSON
    // response. Streaming the Response from this edge function was unreliable
    // (downstream consumer closed the stream before bytes could be enqueued).
    if (!aiResp.body) {
      return new Response(JSON.stringify({ error: 'Пустой ответ от ИИ' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let raw = '';
    let stopReason: string | null = null;
    let apiErrorMessage: string | null = null;
    let textDeltaCount = 0;
    try {
      const reader = aiResp.body.getReader();
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
              const piece = evt.delta.text || '';
              if (piece) {
                raw += piece;
                textDeltaCount++;
              }
            } else if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
              stopReason = evt.delta.stop_reason;
            } else if (evt.type === 'error') {
              apiErrorMessage = evt.error?.message || JSON.stringify(evt.error);
              console.error('Anthropic stream error event:', apiErrorMessage);
            }
          } catch (parseErr) {
            console.error('Anthropic SSE parse error', String((parseErr as any)?.message || parseErr), 'payload:', payload.slice(0, 200));
          }
        }
      }
    } catch (streamErr) {
      const msg = String((streamErr as any)?.message || streamErr);
      console.error('Upstream stream error:', msg, 'partial chars:', raw.length);
      if (!raw) {
        return new Response(JSON.stringify({ error: `Ошибка чтения ответа ИИ: ${msg}` }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`format-disease-article stream done: stop_reason=${stopReason} text_deltas=${textDeltaCount} chars=${raw.length} api_error=${apiErrorMessage ?? 'none'}`);

    // Fallback: if stream produced no text and there's no explicit API error,
    // try ONE non-streaming request with the same model/max_tokens.
    let fallbackUsed = false;
    if (!raw.trim() && !apiErrorMessage) {
      try {
        httpAttempts++;
        fallbackUsed = true;
        console.log(`format-disease-article fallback (non-stream) max_tokens=${usedTokenBudget}`);
        const fbResp = await callAnthropic(usedTokenBudget, false);
        if (fbResp.ok) {
          const fbJson = await fbResp.json();
          const fbText = Array.isArray(fbJson?.content)
            ? fbJson.content.map((b: any) => b?.text || '').join('')
            : '';
          if (typeof fbJson?.stop_reason === 'string') stopReason = fbJson.stop_reason;
          raw = fbText || '';
          console.log(`format-disease-article fallback ok: stop_reason=${stopReason} chars=${raw.length}`);
        } else {
          const errBody = await fbResp.text();
          apiErrorMessage = `HTTP ${fbResp.status}: ${errBody.slice(0, 500)}`;
          console.error('Anthropic fallback failed:', apiErrorMessage);
        }
      } catch (fbErr) {
        apiErrorMessage = String((fbErr as any)?.message || fbErr);
        console.error('Anthropic fallback threw:', apiErrorMessage);
      }
    }

    const formatted = raw.replace(/===КОНЕЦ===\s*$/i, '').trim();

    if (!formatted) {
      const reason = apiErrorMessage
        ? `Anthropic: ${apiErrorMessage}`
        : stopReason
        ? `Модель остановилась без текста (stop_reason=${stopReason})`
        : 'Модель не вернула текст';
      console.error(`format-disease-article EMPTY: ${reason} attempts=${httpAttempts} fallback=${fallbackUsed}`);
      return new Response(JSON.stringify({
        error: reason,
        stop_reason: stopReason,
        attempts: httpAttempts,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`format-disease-article ok: stop_reason=${stopReason} output_chars=${formatted.length} attempts=${httpAttempts} fallback=${fallbackUsed}`);

    return new Response(JSON.stringify({ formatted, stop_reason: stopReason, attempts: httpAttempts }), {
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
