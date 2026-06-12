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

const MODEL_ID = 'claude-sonnet-4-6';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles').select('role')
      .eq('user_id', claims.claims.sub).eq('role', 'admin').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (text.length > 80000) {
      return new Response(JSON.stringify({ error: 'text too long (max 80000 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const enq = (s: string) => { if (!closed) { try { controller.enqueue(encoder.encode(s)); } catch { /* ignore */ } } };
        const sendEvent = (obj: unknown) => enq(`event: message\ndata: ${JSON.stringify(obj)}\n\n`);
        const heartbeat = setInterval(() => enq(':keepalive\n\n'), 10000);
        enq(':keepalive\n\n');

        const fetchCtrl = new AbortController();
        const fetchTimeout = setTimeout(() => fetchCtrl.abort(), 300000);

        let raw = '';
        let stopReason: string | null = null;
        let apiErrorMessage: string | null = null;

        try {
          const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: fetchCtrl.signal,
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: MODEL_ID,
              max_tokens: 16000,
              stream: true,
              system: SYSTEM_PROMPT,
              messages: [{ role: 'user', content: text }],
            }),
          });

          if (!aiResp.ok || !aiResp.body) {
            const errText = await aiResp.text().catch(() => '');
            const status = aiResp.status;
            const userMsg = status === 529 || status === 503
              ? 'Сервис ИИ временно перегружен. Попробуйте ещё раз через минуту.'
              : status === 429
              ? 'Превышен лимит запросов к ИИ. Попробуйте позже.'
              : `Ошибка ИИ (${status}): ${errText.slice(0, 300)}`;
            console.error(`Anthropic HTTP ${status}: ${errText.slice(0, 500)}`);
            sendEvent({ type: 'error', error: userMsg });
            return;
          }

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
                  if (piece) raw += piece;
                } else if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
                  stopReason = evt.delta.stop_reason;
                } else if (evt.type === 'error') {
                  apiErrorMessage = evt.error?.message || JSON.stringify(evt.error);
                  console.error('Anthropic stream error event:', apiErrorMessage);
                  break;
                }
              } catch (parseErr) {
                console.error('SSE parse error', String((parseErr as any)?.message || parseErr));
              }
            }
            if (apiErrorMessage) break;
          }

          const formatted = raw.replace(/===КОНЕЦ===\s*$/i, '').trim();
          if (apiErrorMessage) {
            sendEvent({ type: 'error', error: `Anthropic: ${apiErrorMessage}`, stop_reason: stopReason });
          } else if (!formatted) {
            const reason = stopReason
              ? `Модель остановилась без текста (stop_reason=${stopReason})`
              : 'Модель не вернула текст';
            console.error(`format-disease-article EMPTY: ${reason}`);
            sendEvent({ type: 'error', error: reason, stop_reason: stopReason });
          } else {
            console.log(`format-disease-article ok: stop_reason=${stopReason} chars=${formatted.length}`);
            sendEvent({ type: 'result', formatted, stop_reason: stopReason });
          }
        } catch (e) {
          const msg = String((e as any)?.message || e);
          console.error('format-disease-article stream error:', msg);
          sendEvent({ type: 'error', error: msg });
        } finally {
          clearTimeout(fetchTimeout);
          clearInterval(heartbeat);
          closed = true;
          try { controller.close(); } catch { /* ignore */ }
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('format-disease-article error:', e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
