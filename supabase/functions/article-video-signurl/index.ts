// Presigned URL для видео статей в Яндекс Object Storage.
// Чтение (get) доступно всем: опубликованные видео — публичный контент.
// Запись и удаление — только admin/editor. Ключи YC_* остаются на сервере.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { presignYcUrl, ycConfig } from '../_shared/ycStorage.ts';

const PREFIX = 'article-videos';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function requireEditor(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return 'unauthorized';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await sb.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return 'unauthorized';
  const sbAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: roles } = await sbAdmin.from('user_roles').select('role').eq('user_id', uid);
  const ok = (roles || []).some((r: { role?: string }) => r.role === 'admin' || r.role === 'editor');
  return ok ? null : 'forbidden';
}

/** Ключ объекта должен лежать в папке видео статей и не содержать «..». */
function normalizeKey(raw: string): string {
  const key = String(raw || '').trim().replace(/^\/+/, '');
  if (!key) throw new Error('objectKey required');
  if (key.includes('..')) throw new Error('invalid objectKey');
  if (!key.startsWith(`${PREFIX}/`)) throw new Error(`objectKey must start with ${PREFIX}/`);
  return key;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const operation = String(body.operation || '').toLowerCase();
    if (!['put', 'get', 'delete'].includes(operation)) {
      return json({ error: 'invalid operation' }, 400);
    }

    let objectKey = '';
    if (operation === 'put') {
      const denied = await requireEditor(req);
      if (denied) return json({ error: denied }, denied === 'forbidden' ? 403 : 401);
      const filename = String(body.filename || 'video').trim();
      const sanitized = filename.replace(/[^\w.\-]+/g, '_').slice(0, 200);
      objectKey = `${PREFIX}/${crypto.randomUUID()}-${sanitized}`;
    } else {
      objectKey = normalizeKey(String(body.objectKey || ''));
      // get доступен без входа (видео открыты читателям), delete — только редактору.
      if (operation === 'delete') {
        const denied = await requireEditor(req);
        if (denied) return json({ error: denied }, denied === 'forbidden' ? 403 : 401);
      }
    }

    const { bucket, accessKey, secretKey } = ycConfig();
    const ttl = operation === 'get' ? 3600 : 900;
    const method = operation === 'put' ? 'PUT' : operation === 'delete' ? 'DELETE' : 'GET';
    const url = await presignYcUrl(method, bucket, objectKey, accessKey, secretKey, ttl);

    return json({ ok: true, url, objectKey, bucket, method, expiresIn: ttl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'internal error';
    console.error('article-video-signurl error:', msg);
    const status = msg.includes('required') || msg.includes('invalid') || msg.includes('must start') ? 400 : 500;
    return json({ error: msg }, status);
  }
});
