// Извлечение текста из DOCX / PPTX (mammoth / JSZip) по одному файлу за раз.
// Вынесено из research-materials-analyze, чтобы не упираться в лимит 2000 мс CPU при массовом анализе.
// Клиент вызывает эту функцию сразу после загрузки файла в YC и сохраняет полученный текст в source_materials[i].text.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import mammoth from 'npm:mammoth@1.9.0';
import JSZip from 'npm:jszip@3.10.1';
import { downloadFromYc } from '../_shared/ycStorage.ts';

const MAX_TEXT = 200_000;

async function extractPptxText(bytes: Uint8Array): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    const slides: { name: string; text: string }[] = [];
    for (const name of Object.keys(zip.files)) {
      if (/^ppt\/slides\/slide\d+\.xml$/.test(name)) {
        const xml = await zip.files[name].async('string');
        const text = xml
          .replace(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g, (_m, t) => t + '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        slides.push({ name, text });
      }
    }
    slides.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return slides.map((s, i) => `--- Слайд ${i + 1} ---\n${s.text}`).join('\n\n');
  } catch (e) {
    return `(не удалось извлечь текст PPTX: ${(e as Error).message})`;
  }
}

function detectKind(mime: string, name: string): 'docx' | 'pptx' | 'unsupported' {
  const m = (mime || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (m.includes('wordprocessingml') || n.endsWith('.docx')) return 'docx';
  if (m.includes('presentationml') || n.endsWith('.pptx')) return 'pptx';
  return 'unsupported';
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
    const { objectKey, mime, name } = await req.json();
    if (!objectKey) {
      return new Response(JSON.stringify({ error: 'objectKey required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const kind = detectKind(String(mime || ''), String(name || ''));
    if (kind === 'unsupported') {
      return new Response(JSON.stringify({ ok: true, text: '', kind, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dl = await downloadFromYc(String(objectKey));
    let text = '';
    if (kind === 'docx') {
      const { value } = await mammoth.extractRawText({ buffer: dl.bytes });
      text = String(value || '');
    } else {
      text = await extractPptxText(dl.bytes);
    }
    return new Response(JSON.stringify({ ok: true, kind, text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('research-materials-extract error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
