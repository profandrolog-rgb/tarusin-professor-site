import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL_ID = 'claude-sonnet-4-6';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Admin-only access (same gate as format-disease-article)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, status: 401, error: 'Unauthorized' }), {
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
      return new Response(JSON.stringify({ ok: false, status: 401, error: 'Unauthorized' }), {
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
      return new Response(JSON.stringify({ ok: false, status: 403, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, status: 500, error: 'ANTHROPIC_API_KEY is not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const start = Date.now();
    let resp: Response;
    try {
      resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
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
    } catch (netErr) {
      const msg = String((netErr as any)?.message || netErr);
      console.error('test-claude-connection network error:', msg);
      return new Response(JSON.stringify({ ok: false, status: 0, error: msg }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const latencyMs = Date.now() - start;

    if (resp.ok) {
      // drain body to avoid resource leak
      await resp.text().catch(() => '');
      return new Response(JSON.stringify({ ok: true, model: MODEL_ID, latencyMs }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bodyText = await resp.text().catch(() => '');
    let errMsg = bodyText;
    try {
      const j = JSON.parse(bodyText);
      errMsg = j?.error?.message || j?.message || bodyText;
    } catch {
      /* keep raw text */
    }
    console.error(`test-claude-connection failed status=${resp.status} body=${bodyText.slice(0, 500)}`);
    return new Response(JSON.stringify({
      ok: false,
      status: resp.status,
      error: errMsg || `HTTP ${resp.status}`,
      latencyMs,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = String((e as any)?.message || e);
    console.error('test-claude-connection error:', msg);
    return new Response(JSON.stringify({ ok: false, status: 500, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
