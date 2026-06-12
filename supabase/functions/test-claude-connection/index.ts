import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL_ID = 'claude-sonnet-4-6';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ ok: false, error: 'Unauthorized' });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return json({ ok: false, error: 'Unauthorized' });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', claims.claims.sub)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return json({ ok: false, error: 'Forbidden' });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return json({ ok: false, error: 'ANTHROPIC_API_KEY missing' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const start = Date.now();
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_ID,
          max_tokens: 16,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      const latencyMs = Date.now() - start;
      const bodyText = await resp.text().catch(() => '');
      if (resp.ok) return json({ ok: true, model: MODEL_ID, latencyMs });
      let errMsg = bodyText;
      try {
        const j = JSON.parse(bodyText);
        errMsg = j?.error?.message || j?.message || bodyText;
      } catch { /* keep */ }
      console.error(`test-claude-connection failed status=${resp.status} body=${bodyText.slice(0,500)}`);
      return json({ ok: false, status: resp.status, error: errMsg || `HTTP ${resp.status}`, latencyMs });
    } catch (netErr) {
      const aborted = (netErr as any)?.name === 'AbortError';
      if (aborted) {
        return json({ ok: false, error: 'timeout: no response in 15s' });
      }
      const msg = String((netErr as any)?.message || netErr);
      console.error('test-claude-connection network error:', msg);
      return json({ ok: false, error: msg });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    const msg = String((e as any)?.message || e);
    console.error('test-claude-connection error:', msg);
    return json({ ok: false, error: msg });
  }
});
