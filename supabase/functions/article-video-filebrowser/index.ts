// Второй диск для видео статей: File Browser на сервере Honest Lacerta
// (https://video.tarusin.pro). Загрузка, список и удаление — только admin/editor.
// raw — отдача файла читателю с поддержкой Range (для перемотки <video>).
// Логин и пароль — секреты VIDEO_UPLOADER_USERNAME / VIDEO_UPLOADER_PASSWORD.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE = 'https://video.tarusin.pro';
// Учётная запись lovable-uploader ограничена папкой /v: её корень и есть /v.
// Поэтому пути API — относительно корня учётной записи, без «/v» и без подпапок.
// Старые ключи вида «article-videos/...» по-прежнему читаются как есть.
const DIR = '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function cfg(): { user: string; pass: string } {
  // Отдельная служебная учётная запись lovable-uploader (корень — /v).
  const user = (Deno.env.get('VIDEO_UPLOADER_USERNAME') || 'lovable-uploader').trim();
  const pass = (Deno.env.get('VIDEO_UPLOADER_PASSWORD') || '').replace(/[\r\n]+$/, '');
  if (!pass) throw new Error('timeweb_password_missing');
  return { user, pass };
}

let cachedToken: { value: string; until: number } | null = null;

async function login(): Promise<string> {
  if (cachedToken && cachedToken.until > Date.now()) return cachedToken.value;
  const { user, pass } = cfg();
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass }),
  });
  if (!res.ok) throw new Error(res.status === 403 ? 'timeweb_auth_failed' : `filebrowser login ${res.status}`);
  const token = (await res.text()).trim();
  if (!token || token.startsWith('<')) throw new Error('timeweb_auth_failed');
  // Токен живёт только в памяти функции и никогда не уходит клиенту.
  cachedToken = { value: token, until: Date.now() + 60 * 60 * 1000 };
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
      // /api/raw требует входа: читаем от имени служебной учётной записи на сервере.
      // File Browser принимает токен только в заголовке X-Auth.
      headers['X-Auth'] = await login();
      const upstream = await fetch(`${BASE}/api/raw/${path.split('/').map(encodeURIComponent).join('/')}`, {
        headers,
        redirect: 'follow',
      });
      // 202 «Accepted» с текстом вместо файла — у учётной записи нет права скачивания.
      if (upstream.status === 202) {
        await upstream.body?.cancel();
        return json({ error: 'timeweb_download_forbidden' }, 403);
      }
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

    // put: тело запроса — сами байты видео, имя и тип в query-параметрах.
    const body = operation === 'put' ? {} : await req.json().catch(() => ({}));
    if (operation === 'probe') {
      const denied = await requireEditor(req);
      if (denied) return json({ error: denied }, denied === 'forbidden' ? 403 : 401);
      const token = await login();
      const res = await fetch(resourceUrl(DIR, '?content=1'), {
        headers: { 'X-Auth': token },
      });
      return json({ ok: true, login: 'ok', listStatus: res.status });
    }

    const denied = await requireEditor(req);
    if (denied) return json({ error: denied }, denied === 'forbidden' ? 403 : 401);
    const token = await login();

    if (operation === 'list') {
      const dir = body.dir ? safePath(String(body.dir)) : DIR;
      const res = await fetch(resourceUrl(dir, '?content=1'), {
        headers: { 'X-Auth': token },
      });
      if (!res.ok) return json({ error: `list ${res.status}` }, res.status === 404 ? 404 : 502);
      const data = await res.json().catch(() => ({}));
      const items = Array.isArray(data?.items) ? data.items : [];
      return json({
        ok: true,
        dir,
        items: items.map((i: any) => ({
          name: i.name,
          path: dir ? `${dir}/${i.name}` : i.name,
          size: i.size ?? 0,
          isDir: !!i.is_dir,
          modified: i.modified ?? null,
        })),
      });
    }

    if (operation === 'put') {
      const filename = String(url.searchParams.get('filename') || 'video.mp4').trim().replace(/[^\w.\-]+/g, '_').slice(0, 200) || 'video.mp4';
      if (!/\.(mp4|m4v|mov|webm|ogv|ogg)$/i.test(filename)) return json({ error: 'invalid file type' }, 400);
      const path = `${Date.now()}-${filename}`;
      const contentType = String(url.searchParams.get('contentType') || 'video/mp4');
      if (!contentType.startsWith('video/') && contentType !== 'application/octet-stream') return json({ error: 'invalid content type' }, 400);
      const bytes = new Uint8Array(await req.arrayBuffer());
      const res = await fetch(resourceUrl(path, '?override=false'), {
        method: 'POST',
        headers: { 'X-Auth': token, 'Content-Type': contentType },
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
        headers: { 'X-Auth': token },
      });
      if (!res.ok) return json({ error: `delete ${res.status}` }, res.status === 404 ? 404 : 502);
      return json({ ok: true, path });
    }

    return json({ error: 'invalid operation' }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'internal error';
    console.error('article-video-filebrowser error:', msg);
    if (msg === 'timeweb_auth_failed' || msg === 'timeweb_password_missing') return json({ error: msg }, 502);
    const status = msg.includes('required') || msg.includes('invalid') ? 400 : 500;
    return json({ error: msg }, status);
  }
});
