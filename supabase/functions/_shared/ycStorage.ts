// AWS SigV4 presigning для Яндекс Object Storage (S3, ru-central1).
// Используется в edge-функциях, не отправлять в клиент.

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
async function signingKey(secret: string, date: string): Promise<Uint8Array> {
  const kDate = await hmac(new TextEncoder().encode('AWS4' + secret), date);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  return await hmac(kService, 'aws4_request');
}
function rfc3986(v: string): string {
  return encodeURIComponent(v).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
function encodeKey(k: string): string {
  return k.split('/').map(rfc3986).join('/');
}

export async function presignYcUrl(
  method: 'GET' | 'PUT' | 'DELETE',
  bucket: string,
  objectKey: string,
  accessKey: string,
  secretKey: string,
  ttlSeconds: number,
): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const credential = `${accessKey}/${dateStamp}/${REGION}/${SERVICE}/aws4_request`;

  const canonicalUri = `/${encodeURIComponent(bucket)}/${encodeKey(objectKey)}`;
  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(ttlSeconds),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(params).sort()
    .map(k => `${rfc3986(k)}=${rfc3986(params[k])}`).join('&');
  const canonicalRequest = [
    method, canonicalUri, canonicalQuery, `host:${HOST}\n`, 'host', 'UNSIGNED-PAYLOAD',
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate,
    `${dateStamp}/${REGION}/${SERVICE}/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const key = await signingKey(secretKey, dateStamp);
  const sig = toHex(await hmac(key, stringToSign));
  return `https://${HOST}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${sig}`;
}

export function ycConfig(): { bucket: string; accessKey: string; secretKey: string } {
  const bucket = Deno.env.get('YC_BUCKET_NAME');
  const accessKey = Deno.env.get('YC_ACCESS_KEY_ID');
  const secretKey = Deno.env.get('YC_SECRET_ACCESS_KEY');
  if (!bucket || !accessKey || !secretKey) throw new Error('yc_config_missing');
  return { bucket, accessKey, secretKey };
}

export async function downloadFromYc(objectKey: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const { bucket, accessKey, secretKey } = ycConfig();
  const url = await presignYcUrl('GET', bucket, objectKey, accessKey, secretKey, 900);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`yc download ${objectKey}: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  return { bytes, contentType };
}

// SigV4 header-signed request (для операций с body: PUT ?cors и т.п.).
async function sigV4Fetch(
  method: 'GET' | 'PUT' | 'POST' | 'DELETE',
  bucketAndPath: string,      // например "/bucket"
  query: Record<string, string>,
  body: string,
  accessKey: string,
  secretKey: string,
  contentType: string,
): Promise<Response> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body || '');

  const headers: Record<string, string> = {
    'content-type': contentType,
    'host': HOST,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
  const signedHeaders = sortedHeaderKeys.join(';');
  const canonicalQuery = Object.keys(query).sort()
    .map(k => `${rfc3986(k)}=${rfc3986(query[k])}`).join('&');

  const canonicalRequest = [method, bucketAndPath, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate,
    `${dateStamp}/${REGION}/${SERVICE}/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const key = await signingKey(secretKey, dateStamp);
  const sig = toHex(await hmac(key, stringToSign));
  const auth = `AWS4-HMAC-SHA256 Credential=${accessKey}/${dateStamp}/${REGION}/${SERVICE}/aws4_request, SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const url = `https://${HOST}${bucketAndPath}${canonicalQuery ? '?' + canonicalQuery : ''}`;
  return await fetch(url, {
    method,
    headers: { ...headers, Authorization: auth },
    body: method === 'GET' || method === 'DELETE' ? undefined : body,
  });
}

export async function setBucketCors(
  bucket: string, accessKey: string, secretKey: string, allowedOrigins: string[],
): Promise<{ ok: boolean; status: number; body: string }> {
  const rules = allowedOrigins.map(o => `<CORSRule><AllowedOrigin>${o}</AllowedOrigin><AllowedMethod>GET</AllowedMethod><AllowedMethod>PUT</AllowedMethod><AllowedMethod>POST</AllowedMethod><AllowedMethod>DELETE</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>*</AllowedHeader><ExposeHeader>ETag</ExposeHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><CORSConfiguration>${rules}</CORSConfiguration>`;
  const res = await sigV4Fetch('PUT', `/${bucket}`, { cors: '' }, xml, accessKey, secretKey, 'application/xml');
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

