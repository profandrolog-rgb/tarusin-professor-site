// Presigned URL для Яндекс Object Storage (SigV4 в _shared/ycStorage.ts).
// Роль: admin/editor. Ключи YC_* только на сервере.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { presignYcUrl, ycConfig, setBucketCors } from '../_shared/ycStorage.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const sbAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roles } = await sbAdmin.from('user_roles').select('role').eq('user_id', uid);
    const isAllowed = (roles || []).some((r: any) => r.role === 'admin' || r.role === 'editor');
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const operation = String(body.operation || '').toLowerCase();

    // Разовая настройка CORS на бакете (доступна admin/editor).
    if (operation === 'init_cors') {
      const { bucket, accessKey, secretKey } = ycConfig();
      const origins: string[] = Array.isArray(body.origins) && body.origins.length
        ? body.origins.map((o: any) => String(o))
        : [
            'https://tarusin.pro',
            'https://www.tarusin.pro',
            'https://tarusin-professor-site.lovable.app',
            'https://id-preview--916ade1a-4d84-4ea3-9e8f-55c484246550.lovable.app',
            'https://916ade1a-4d84-4ea3-9e8f-55c484246550.lovableproject.com',
            'http://localhost:8080',
          ];
      const r = await setBucketCors(bucket, accessKey, secretKey, origins);
      return new Response(JSON.stringify({ ok: r.ok, status: r.status, body: r.body, origins }), {
        status: r.ok ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['put', 'get', 'delete'].includes(operation)) {
      return new Response(JSON.stringify({ error: 'invalid operation' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    let objectKey: string = String(body.objectKey || '').trim();
    if (operation === 'put') {
      const reviewId = String(body.review_id || '').trim();
      const filename = String(body.filename || 'file').trim();
      if (!reviewId) {
        return new Response(JSON.stringify({ error: 'review_id required for put' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const sanitized = filename.replace(/[^\w.\-]+/g, '_').slice(0, 200);
      objectKey = `${reviewId}/${crypto.randomUUID()}-${sanitized}`;
    }
    if (!objectKey) {
      return new Response(JSON.stringify({ error: 'objectKey required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bucket, accessKey, secretKey } = ycConfig();
    const ttl = operation === 'get' ? 3600 : 900;
    const method = operation === 'put' ? 'PUT' : operation === 'delete' ? 'DELETE' : 'GET';
    const url = await presignYcUrl(method as any, bucket, objectKey, accessKey, secretKey, ttl);

    return new Response(JSON.stringify({ ok: true, url, objectKey, expiresIn: ttl, method }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('research-materials-signurl error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
