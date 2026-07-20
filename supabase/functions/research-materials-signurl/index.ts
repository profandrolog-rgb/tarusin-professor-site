// Presigned URL для Яндекс Object Storage (S3, region ru-central1).
// Принимает {review_id, filename, contentType, operation: 'put'|'get'|'delete'} → {url, objectKey}.
// Роль: admin/editor. Ключи YC_* только в этой функции, в клиент не попадают.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const HOST = 'storage.yandexcloud.net';
const REGION = 'ru-central1';
const SERVICE = 's3';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(msg: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return toHex(new Uint8Array(buf));
}

async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key instanceof Uint8Array ? key : new Uint8Array(key),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(msg));
  return new Uint8Array(sig);
}

async function signingKey(secret: string, date: string, region: string, service: string): Promise<Uint8Array> {
  const kDate = await hmac(new TextEncoder().encode('AWS4' + secret), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return await hmac(kService, 'aws4_request');
}

// RFC3986 encoding for URL query values (S3 requires %20 for spaces, unreserved chars unencoded).
function rfc3986(v: string): string {
  return encodeURIComponent(v).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function encodeKey(k: string): string {
  // Keep slashes, encode each segment.
  return k.split('/').map(rfc3986).join('/');
}

async function presign(
  method: 'GET' | 'PUT' | 'DELETE',
  bucket: string,
  key: string,
  accessKey: string,
  secretKey: string,
  ttlSeconds: number,
): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const credential = `${accessKey}/${dateStamp}/${REGION}/${SERVICE}/aws4_request`;

  const canonicalUri = `/${encodeURIComponent(bucket)}/${encodeKey(key)}`;
  const signedHeaders = 'host';
  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(ttlSeconds),
    'X-Amz-SignedHeaders': signedHeaders,
  };
  const canonicalQuery = Object.keys(params).sort()
    .map(k => `${rfc3986(k)}=${rfc3986(params[k])}`).join('&');
  const canonicalHeaders = `host:${HOST}\n`;
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalRequest = [
    method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    `${dateStamp}/${REGION}/${SERVICE}/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const key0 = await signingKey(secretKey, dateStamp, REGION, SERVICE);
  const sig = toHex(await hmac(key0, stringToSign));

  return `https://${HOST}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${sig}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessKey = Deno.env.get('YC_ACCESS_KEY_ID');
    const secretKey = Deno.env.get('YC_SECRET_ACCESS_KEY');
    const bucket = Deno.env.get('YC_BUCKET_NAME');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    if (!accessKey || !secretKey || !bucket) {
      return new Response(JSON.stringify({ error: 'yc_config_missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Проверка роли: admin/editor
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
      const uuid = crypto.randomUUID();
      objectKey = `${reviewId}/${uuid}-${sanitized}`;
    }
    if (!objectKey) {
      return new Response(JSON.stringify({ error: 'objectKey required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ttl = operation === 'get' ? 3600 : 900;
    const method = operation === 'put' ? 'PUT' : operation === 'delete' ? 'DELETE' : 'GET';
    const url = await presign(method as any, bucket, objectKey, accessKey, secretKey, ttl);

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
