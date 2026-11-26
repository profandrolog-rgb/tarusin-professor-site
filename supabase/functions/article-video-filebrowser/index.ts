// Второй диск для видео статей: File Browser на сервере Honest Lacerta
// (https://video.tarusin.pro). Загрузка, список и удаление — только admin/editor.
// raw — отдача файла читателю с поддержкой Range (для перемотки <video>).
// Логин и пароль хранятся в секретах FILEBROWSER_USERNAME / FILEBROWSER_PASSWORD.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE = 'https://video.tarusin.pro';
const DIR = 'article-videos';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function cfg(): { user: string; pass: string } {
  const user = Deno.env.get('FILEBROWSER_USERNAME');
  const pass = Deno.env.get('FILEBROWSER_PASSWORD');
  if (!user || !pass) throw new Error('filebrowser_config_missing');
  return { user, pass };
}

async function login(): Promise<string> {
  const { user, pass } = cfg();
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass }),
  });
  if (!res.ok) throw new Error(`filebrowser login ${res.status}`);
  const token = (await res.text()).trim();
  if (!token || token.startsWith('<')) throw new Error('filebrowser login refused');
  return token;
}

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

/** Путь внутри папки видео: без «..», без ведущего слэша. */
function safePath(raw: string): string {
  const p = String(raw || '').trim().replace(/^\/+/, '');
  if (!p) throw new Error('path required');
  if (p.includes('..')) throw new Error('invalid path');
  return p;
}

function resourceUrl(path: string, query = ''): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${BASE}/api/resources/${encoded}${query}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const operation = String(url.searchParams.get('operation') || '').toLowerCase();

    // raw — потоковая отдача файла читателю (анонимно), с пробросом Range.
    if (operation === 'raw') {
      const path = safePath(url.searchParams.get('path') || '');
      const headers: Record<string, string> = {};
      const range = req.headers.get('Range');
      if (range) headers.Range = range;
      const upstream = await fetch(`${BASE}/api/raw/${path.split('/').map(encodeURIComponent).join('/')}`, {
        headers,
        redirect: 'follow',
      });
      if (!upstream.ok && upstream.status !== 206) {
        return json({ error: `file unavailable ${upstream.status}` }, upstream.status === 404 ? 404 : 502);
      }
      const out = new Headers(corsHeaders);
      for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control']) {
        const v = upstream.headers.get(h);
        if (v) out.set(h, v);
      }
      return new Response(upstream.body, { status: upstream.status, headers: out });
    }

    const body = await req.json().catch(() => ({}));
    if (operation === 'probe') {
      const denied = await requireEditor(req);
      if (denied) return json({ error: denied }, denied === 'forbidden' ? 403 : 401);
      const token = await login();
      const res = await fetch(resourceUrl(DIR, '?content=1'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      return json({ ok: true, status: res.status, body: text.slice(0, 4000) });
    }

    const denied = await requireEditor(req);
    if (denied) return json({ error: denied }, denied === 'forbidden' ? 403 : 401);
    const token = await login();

    if (operation === 'list') {
      const dir = safePath(String(body.dir || DIR));
      const res = await fetch(resourceUrl(dir, '?content=1'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return json({ error: `list ${res.status}` }, res.status === 404 ? 404 : 502);
      const data = await res.json().catch(() => ({}));
      const items = Array.isArray(data?.items) ? data.items : [];
      return json({
        ok: true,
        dir,
        items: items.map((i: any) => ({
          name: i.name,
          path: `${dir}/${i.name}`,
          size: i.size ?? 0,
          isDir: !!i.is_dir,
          modified: i.modified ?? null,
        })),
      });
    }

    if (operation === 'put') {
      const filename = String(body.filename || 'video.mp4').trim().replace(/[^\w.\-]+/g, '_').slice(0, 200);
      const path = `${DIR}/${Date.now()}-${filename}`;
      const contentType = String(body.contentType || 'video/mp4');
      const bytes = new Uint8Array(await req.arrayBuffer());
      const res = await fetch(resourceUrl(path, '?override=true&size=' + bytes.length), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType },
        body: bytes,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error('filebrowser put failed', res.status, detail.slice(0, 200));
        return json({ error: `upload failed ${res.status}` }, 502);
      }
      return json({ ok: true, path, size: bytes.length });
    }

    if (operation === 'delete') {
      const path = safePath(String(body.path || ''));
      const res = await fetch(resourceUrl(path), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return json({ error: `delete ${res.status}` }, res.status === 404 ? 404 : 502);
      return json({ ok: true, path });
    }

    return json({ error: 'invalid operation' }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'internal error';
    console.error('article-video-filebrowser error:', msg);
    const status = msg.includes('required') || msg.includes('invalid') ? 400 : 500;
    return json({ error: msg }, status);
  }
});
