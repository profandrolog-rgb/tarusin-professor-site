// Копирует изображение из приватного бакета Яндекса в публичный Supabase Storage
// (disease-media/article-images/<slug>-<kind>-<uuid>.<ext>).
// Возвращает filename, готовый для маркера [[GALLERY: ...]].
//
// Роль: admin/editor.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { downloadFromYc } from '../_shared/ycStorage.ts';

const KIND_SUFFIX: Record<string, string> = {
  normal: 'normal',
  infographic: 'infographic',
  'patient-full': 'patient-full',
};

function extFromName(name: string, mime: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  if (m) return m[1].toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

function safeSlug(raw: string): string {
  return (raw || 'review')
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'review';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return json(401, { error: 'unauthorized' });

    const sbAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roles } = await sbAdmin.from('user_roles').select('role').eq('user_id', uid);
    const allowed = (roles || []).some((r: any) => r.role === 'admin' || r.role === 'editor');
    if (!allowed) return json(403, { error: 'forbidden' });

    const body = await req.json().catch(() => ({}));
    const objectKey = String(body.objectKey || '').trim();
    const slug = safeSlug(String(body.slug || ''));
    const kind = KIND_SUFFIX[String(body.kind || 'normal')] || 'normal';
    const originalName = String(body.name || '');
    const mimeHint = String(body.mime || '');

    if (!objectKey) return json(400, { error: 'objectKey required' });

    const { bytes, contentType } = await downloadFromYc(objectKey);
    if (!contentType.startsWith('image/')) return json(400, { error: 'not an image' });

    const ext = extFromName(originalName, contentType || mimeHint);
    const uuid = crypto.randomUUID().slice(0, 8);
    const filename = `${slug}-research-${kind}-${uuid}.${ext}`;
    const targetPath = `article-images/${filename}`;

    const { error: upErr } = await sbAdmin.storage
      .from('disease-media')
      .upload(targetPath, bytes, { contentType, upsert: false });
    if (upErr) return json(500, { error: `upload failed: ${upErr.message}` });

    return json(200, { ok: true, filename });
  } catch (e: any) {
    console.error('research-image-publish error:', e?.message);
    return json(500, { error: e?.message || 'internal error' });
  }
});
