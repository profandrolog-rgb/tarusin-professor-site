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

Если таблица пришла слипшейся — ВОССТАНОВИ её структуру по смыслу и выведи как полноценную GFM-таблицу.
=== КОНЕЦ ПРАВИЛ ПО ТАБЛИЦАМ ===

- Keep [[GALLERY: caption="..."]] markers exactly as they appear in the text
- Preserve the author's voice and personal stories
- Do not add or remove content (кроме восстановления структуры таблиц)

Return only the formatted markdown, nothing else.`;

const MODEL_ID = 'claude-haiku-4-5';
const CHUNK_TARGET = 6000; // chars per chunk (client also enforces this)
const PER_CHUNK_TIMEOUT_MS = 240000; // 4 min per chunk — must be >= client timeout


// Split text into chunks at paragraph boundaries (preferring blank lines),
// each <= CHUNK_TARGET chars. Never splits inside a paragraph if possible.
function splitIntoChunks(text: string, target = CHUNK_TARGET): string[] {
  if (text.length <= target) return [text];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let cur = '';
  for (const p of paragraphs) {
    if (!cur) {
      cur = p;
    } else if (cur.length + p.length + 2 <= target) {
      cur += '\n\n' + p;
    } else {
      chunks.push(cur);
      cur = p;
    }
    // hard-split a single oversized paragraph
    while (cur.length > target * 1.5) {
      const cut = cur.lastIndexOf('\n', target);
      const at = cut > target / 2 ? cut : target;
      chunks.push(cur.slice(0, at));
      cur = cur.slice(at);
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function formatOneChunk(
  apiKey: string,
  text: string,
  isPart: boolean,
): Promise<{ formatted: string; stop_reason: string | null; error?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PER_CHUNK_TIMEOUT_MS);
  try {
    const system = isPart
      ? SYSTEM_PROMPT + '\n\nЭто ЧАСТЬ длинной статьи. Не добавляй вступление/заключение, только форматируй полученный фрагмент.'
      : SYSTEM_PROMPT;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: 16000,
        stream: true,
        system,
        messages: [{ role: 'user', content: text }],
      }),
    });
    if (!resp.ok || !resp.body) {
      const errText = await resp.text().catch(() => '');
      return {
        formatted: '',
        stop_reason: null,
        error: `Anthropic HTTP ${resp.status}: ${errText.slice(0, 300)}`,
      };
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let raw = '';
    let stopReason: string | null = null;
    let apiErr: string | null = null;
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
          } else if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
            stopReason = evt.delta.stop_reason;
          } else if (evt.type === 'error') {
            apiErr = evt.error?.message || JSON.stringify(evt.error);
            break;
          }
        } catch { /* ignore */ }
      }
      if (apiErr) break;
    }
    return { formatted: raw.trim(), stop_reason: stopReason, error: apiErr || undefined };
  } catch (e) {
    return {
      formatted: '',
      stop_reason: null,
      error: String((e as any)?.message || e),
    };
  } finally {
    clearTimeout(t);
  }
}

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
    if (text.length > 200000) {
      return new Response(JSON.stringify({ error: 'text too long (max 200000 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const chunks = splitIntoChunks(text);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const enq = (s: string) => { if (!closed) { try { controller.enqueue(encoder.encode(s)); } catch { /* ignore */ } } };
        const sendEvent = (obj: unknown) => enq(`event: message\ndata: ${JSON.stringify(obj)}\n\n`);
        const heartbeat = setInterval(() => enq(':keepalive\n\n'), 10000);
        enq(':keepalive\n\n');

        try {
          sendEvent({ type: 'progress', stage: 'start', chunks: chunks.length });
          const parts: string[] = [];
          const isPart = chunks.length > 1;
          for (let i = 0; i < chunks.length; i++) {
            sendEvent({ type: 'progress', stage: 'chunk', index: i + 1, total: chunks.length });
            const r = await formatOneChunk(apiKey, chunks[i], isPart);
            if (r.error) {
              console.error(`chunk ${i + 1}/${chunks.length} error: ${r.error}`);
              sendEvent({
                type: 'error',
                error: `Часть ${i + 1}/${chunks.length}: ${r.error}`,
                stop_reason: r.stop_reason,
              });
              return;
            }
            if (!r.formatted) {
              const reason = r.stop_reason
                ? `Модель остановилась без текста (stop_reason=${r.stop_reason})`
                : 'Модель не вернула текст';
              console.error(`chunk ${i + 1}/${chunks.length} EMPTY: ${reason}`);
              sendEvent({
                type: 'error',
                error: `Часть ${i + 1}/${chunks.length}: ${reason}`,
                stop_reason: r.stop_reason,
              });
              return;
            }
            parts.push(r.formatted);
          }
          const formatted = parts.join('\n\n').replace(/===КОНЕЦ===\s*$/i, '').trim();
          console.log(`format-disease-article ok: chunks=${chunks.length} chars=${formatted.length}`);
          sendEvent({ type: 'result', formatted, chunks: chunks.length });
        } catch (e) {
          const msg = String((e as any)?.message || e);
          console.error('format-disease-article stream error:', msg);
          sendEvent({ type: 'error', error: msg });
        } finally {
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
