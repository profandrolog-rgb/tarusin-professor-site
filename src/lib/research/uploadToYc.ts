// Загрузка файла в Яндекс Object Storage через presigned PUT.
// XHR используется вместо fetch ради прогресса (fetch upload progress пока нестабилен).

import { supabase } from '@/integrations/supabase/client';

export interface SignUrlResult {
  url: string;
  objectKey: string;
  expiresIn: number;
  method: 'GET' | 'PUT' | 'DELETE';
}

export async function requestSignedUrl(params: {
  operation: 'put' | 'get' | 'delete';
  review_id?: string;
  filename?: string;
  objectKey?: string;
}): Promise<SignUrlResult> {
  const { data, error } = await supabase.functions.invoke('research-materials-signurl', { body: params });
  if (error) throw new Error(error.message || 'signurl invoke failed');
  if (!data?.url) throw new Error(data?.error || 'no url in signurl response');
  return data as SignUrlResult;
}

export function uploadWithProgress(
  url: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload failed: ${xhr.status} ${xhr.responseText?.slice(0, 200) || ''}`));
    };
    xhr.onerror = () => reject(new Error(
      'CORS/network: браузер не смог загрузить в Yandex Object Storage. Нажмите «Настроить CORS хранилища» и повторите.'
    ));
    xhr.send(file);
  });
}

/** Загрузка + (для DOCX/PPTX) вызов research-materials-extract для получения текста.
 *  Возвращает objectKey и извлечённый текст (если поддерживается тип). */
export async function uploadResearchFile(
  reviewId: string,
  f: File,
  onProgress?: (pct: number) => void,
): Promise<{ objectKey: string; text?: string }> {
  const sig = await requestSignedUrl({ operation: 'put', review_id: reviewId, filename: f.name });
  await uploadWithProgress(sig.url, f, onProgress);
  const n = f.name.toLowerCase();
  const isDocx = f.type.includes('wordprocessingml') || n.endsWith('.docx');
  const isPptx = f.type.includes('presentationml') || n.endsWith('.pptx');
  let text: string | undefined;
  if (isDocx || isPptx) {
    try {
      const { data } = await supabase.functions.invoke('research-materials-extract', {
        body: { objectKey: sig.objectKey, mime: f.type, name: f.name },
      });
      if (data?.text) text = String(data.text);
    } catch (e: any) {
      console.warn('research-materials-extract failed:', e?.message);
    }
  }
  return { objectKey: sig.objectKey, text };
}

export async function initYcBucketCors(): Promise<{ ok: boolean; status: number; body: string }> {
  const { data, error } = await supabase.functions.invoke('research-materials-signurl', {
    body: { operation: 'init_cors' },
  });
  if (error) throw new Error(error.message || 'init_cors failed');
  return data;
}


export async function deleteObject(objectKey: string): Promise<void> {
  const { url } = await requestSignedUrl({ operation: 'delete', objectKey });
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    throw new Error(`delete failed: ${res.status}`);
  }
}

export async function getDownloadUrl(objectKey: string): Promise<string> {
  const { url } = await requestSignedUrl({ operation: 'get', objectKey });
  return url;
}
