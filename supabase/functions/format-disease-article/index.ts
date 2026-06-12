import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SYSTEM_PROMPT = `You are a medical article formatter. Convert the input text into clean markdown. Rules:
- ## for main sections, ### for subsections
- **bold** for key terms, numbers, percentages
- > 💡 **Важно знать:** for key facts
- > ⚠️ **Когда срочно к врачу:** for warning signs
- > 📊 **Цифры:** for statistics
- Keep [[GALLERY: caption="..."]] markers exactly as they appear in the text
- Preserve the author's voice and personal stories
- Do not add or remove content

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

    // Stream the result back to the client as SSE so the gateway's 150s idle
    // timeout never triggers (bytes flow continuously while Claude generates).
    const encoder = new TextEncoder();
    const upstream = aiResp.body;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        let raw = '';
        let stopReason: string | null = null;
        let apiErrorMessage: string | null = null;
        let streamError: string | null = null;
        try {
          if (!upstream) throw new Error('Anthropic response has no body');
          const reader = upstream.getReader();
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
                  raw += piece;
                  send({ delta: piece });
                } else if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
                  stopReason = evt.delta.stop_reason;
                } else if (evt.type === 'error') {
                  apiErrorMessage = evt.error?.message || JSON.stringify(evt.error);
                }
              } catch (parseErr) {
                console.error('SSE parse error', String((parseErr as any)?.message || parseErr), 'payload:', payload.slice(0, 200));
              }
            }
          }
        } catch (streamErr) {
          streamError = String((streamErr as any)?.message || streamErr);
          console.error('Stream read error:', streamError, 'partial length:', raw.length);
        }

        if (apiErrorMessage) {
          send({ error: `Anthropic stream error: ${apiErrorMessage}`, partial: raw });
        } else if (streamError && !raw) {
          send({ error: `Stream failed: ${streamError}` });
        } else {
          const formatted = raw.replace(/===КОНЕЦ===\s*$/i, '').trim();
          console.log(`format-disease-article ok: stop_reason=${stopReason} output_chars=${formatted.length}`);
          send({ done: true, formatted, stop_reason: stopReason, stream_error: streamError });
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
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
