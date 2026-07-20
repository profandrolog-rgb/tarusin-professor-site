// Первичный мультимодальный анализ материалов научного обзора.
// Использует Lovable AI Gateway (google/gemini-3.1-pro-preview).
// Материалы: файлы (PDF/image/audio), YouTube-ссылки, PubMed, произвольные URL.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3.1-pro-preview';

interface Material {
  id: string;
  kind: 'file' | 'youtube' | 'pubmed' | 'url' | 'text';
  name?: string;
  mime?: string;
  storage_path?: string; // for kind=file
  url?: string;          // for kind=youtube|pubmed|url
  text?: string;         // for kind=text or extracted content
}

const SYSTEM_PROMPT = `Ты — научный редактор медицинского журнала. Тебе даны разнородные материалы (статьи, презентации, видео, изображения, ссылки).
Твоя задача:
1. Извлечь суть каждого материала (2–4 предложения).
2. Свести всё в единый черновой план обзора (структура: Введение → Разделы → Выводы).
3. Выделить ключевые тезисы (5–15 буллетов).
4. Собрать список источников с максимально полными библиографическими данными (авторы, название, журнал, год, DOI/PMID).

Верни строгий JSON:
{
  "summary": "коротко общее содержание всех материалов, 200-400 слов",
  "per_material": [{"id":"...", "summary":"..."}],
  "draft_outline": "план обзора в markdown",
  "key_points": ["..."],
  "detected_sources": [{"authors":"...","title":"...","journal":"...","year":"...","doi_or_pmid":"..."}]
}`;

async function toBase64(bytes: Uint8Array): Promise<string> {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function buildBlockForMaterial(
  m: Material,
  supabase: ReturnType<typeof createClient>,
): Promise<any[]> {
  const label = `[Материал ${m.id}${m.name ? `: ${m.name}` : ''}]`;

  if (m.kind === 'text' && m.text) {
    return [{ type: 'text', text: `${label}\n${m.text}` }];
  }

  if (m.kind === 'youtube' && m.url) {
    // Gemini через OpenRouter принимает youtube URL как image_url c пометкой (best effort);
    // если модель не поймёт — оставим текстовое упоминание.
    return [{ type: 'text', text: `${label}\nYouTube-ссылка (проанализируй по URL, если доступно): ${m.url}` }];
  }

  if ((m.kind === 'url' || m.kind === 'pubmed') && m.url) {
    // Пытаемся вытащить контент через Firecrawl (если ключ есть); иначе просто URL.
    const fcKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovKey = Deno.env.get('LOVABLE_API_KEY');
    try {
      if (fcKey?.startsWith('lovc_') && lovKey) {
        const r = await fetch('https://connector-gateway.lovable.dev/firecrawl/v2/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${lovKey}`,
            'X-Connection-Api-Key': fcKey,
          },
          body: JSON.stringify({ url: m.url, formats: ['markdown'], onlyMainContent: true }),
        });
        if (r.ok) {
          const j = await r.json();
          const md = j?.data?.markdown || j?.markdown || '';
          if (md) return [{ type: 'text', text: `${label}\nИсточник: ${m.url}\n\n${String(md).slice(0, 20000)}` }];
        }
      } else if (fcKey?.startsWith('fc-')) {
        const r = await fetch('https://api.firecrawl.dev/v2/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fcKey}` },
          body: JSON.stringify({ url: m.url, formats: ['markdown'], onlyMainContent: true }),
        });
        if (r.ok) {
          const j = await r.json();
          const md = j?.data?.markdown || j?.markdown || '';
          if (md) return [{ type: 'text', text: `${label}\nИсточник: ${m.url}\n\n${String(md).slice(0, 20000)}` }];
        }
      }
    } catch (e) {
      console.warn(`Firecrawl fetch failed for ${m.url}:`, (e as Error).message);
    }
    return [{ type: 'text', text: `${label}\nURL (скачать не удалось): ${m.url}` }];
  }

  if (m.kind === 'file' && m.storage_path) {
    // Скачиваем из приватного бакета
    const { data, error } = await supabase.storage.from('research-materials').download(m.storage_path);
    if (error || !data) {
      return [{ type: 'text', text: `${label}\nФайл не удалось скачать: ${m.storage_path}` }];
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    const mime = m.mime || 'application/octet-stream';
    const b64 = await toBase64(bytes);

    if (mime.startsWith('image/')) {
      return [
        { type: 'text', text: label },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
      ];
    }
    if (mime === 'application/pdf') {
      return [
        { type: 'text', text: label },
        { type: 'file', file: { filename: m.name || 'document.pdf', file_data: `data:${mime};base64,${b64}` } },
      ];
    }
    if (mime.startsWith('audio/')) {
      const format = mime.includes('mp3') ? 'mp3' : mime.includes('wav') ? 'wav' : mime.includes('m4a') ? 'm4a' : 'webm';
      return [
        { type: 'text', text: label },
        { type: 'input_audio', input_audio: { data: b64, format } },
      ];
    }
    // DOCX/PPTX/прочее — просим клиента предварительно извлечь текст.
    return [{ type: 'text', text: `${label}\n(файл типа ${mime} — извлечённый текст должен передаваться отдельным материалом kind=text)` }];
  }

  return [{ type: 'text', text: `${label}\n(пустой материал)` }];
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
    const { materials, instructions, topic } = await req.json();
    if (!Array.isArray(materials) || materials.length === 0) {
      return new Response(JSON.stringify({ error: 'no materials' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovKey) throw new Error('LOVABLE_API_KEY missing');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const userContent: any[] = [];
    if (topic) userContent.push({ type: 'text', text: `Тема обзора: ${topic}` });
    if (instructions) userContent.push({ type: 'text', text: `Дополнительные указания: ${instructions}` });

    for (const m of materials as Material[]) {
      const blocks = await buildBlockForMaterial(m, supabase);
      userContent.push(...blocks);
    }

    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': lovKey,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'gateway_error', status: res.status, details: t.slice(0, 500) }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const j = await res.json();
    const raw = String(j?.choices?.[0]?.message?.content ?? '{}');
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { summary: raw };
    }

    return new Response(JSON.stringify({ ok: true, analysis: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('research-materials-analyze error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
