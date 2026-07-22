// Первичный мультимодальный анализ материалов научного обзора.
// Модель: RESEARCH_ANALYZE_MODEL → RESEARCH_AI_MODEL → default.
// Только мультимодальный Gemini умеет одновременно аудио/изображения/PDF/видео.
// Материалы: файлы в YC Object Storage (PDF/image/audio/docx/pptx), YouTube, PubMed, URL, свободный текст.

import { corsHeaders } from '../_shared/cors.ts';
import mammoth from 'npm:mammoth@1.9.0';
import JSZip from 'npm:jszip@3.10.1';
import { downloadFromYc } from '../_shared/ycStorage.ts';
import { callWithFallback, extractCompletion } from '../_shared/aiCallWithFallback.ts';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const PRIMARY_MODEL =
  Deno.env.get('RESEARCH_ANALYZE_MODEL') ||
  Deno.env.get('RESEARCH_AI_MODEL') ||
  'google/gemini-3-flash-preview';
const FALLBACK_MODEL = Deno.env.get('RESEARCH_AI_MODEL') || 'google/gemini-2.5-flash';

interface ExtractedTable {
  html?: string;
  markdown?: string;
  sourceFile?: string;
  pageOrSlide?: number;
  index?: number;
  caption?: string;
}

interface Material {
  id: string;
  marker?: string;
  kind: 'file' | 'youtube' | 'pubmed' | 'url' | 'text';
  name?: string;
  mime?: string;
  objectKey?: string;   // ключ в YC
  url?: string;
  text?: string;
  extractedTables?: ExtractedTable[];
}

const SYSTEM_PROMPT = `Ты — научный редактор медицинского журнала. Тебе даны разнородные материалы (статьи, презентации, видео, изображения, ссылки), каждый помечен стабильным идентификатором [M1], [M2], [M3]…

Задачи:
1. Извлечь суть каждого материала (2–4 предложения). В поле per_material.marker верни ровно тот идентификатор [M#], который стоит на материале.
2. Собрать единый черновой план обзора (Введение → Разделы → Выводы). В плане после каждого тезиса, взятого из материала, ставь его маркер, например: «— повышение уровня X ассоциировано с Y [M2]».
3. Ключевые тезисы (5–15 буллетов) — тоже с маркерами источников.
4. Собрать библиографию по РЕАЛЬНО присутствующим в материалах источникам (авторы, название, журнал, год, DOI/PMID). Не добавлять источники из общих знаний — только из материалов. В каждом элементе — поле marker.

ВАЖНО про таблицы:
- В материалах могут присутствовать таблицы, переданные тебе в виде HTML-фрагментов <table>…</table> (из DOCX) либо уже готового markdown. Не пересказывай их прозой, а сохраняй как таблицы.
- Все таблицы в ответе (в draft_outline, per_material.summary и др.) возвращай ТОЛЬКО в markdown-разметке (| ... | ... | со строкой-разделителем ниже заголовка). Не используй HTML.
- После каждой таблицы обязательно ставь маркер источника, например: «*Таблица 2. Сравнение методик [M3]*».

Верни СТРОГИЙ JSON:
{
  "summary": "общее содержание материалов, 200-400 слов, с маркерами",
  "per_material": [{"marker":"[M1]", "summary":"..."}],
  "draft_outline": "план обзора в markdown, с маркерами (таблицы — только в markdown)",
  "key_points": ["тезис [M2]", "..."],
  "detected_sources": [{"marker":"[M3]","authors":"...","title":"...","journal":"...","year":"...","doi_or_pmid":"..."}]
}`;

async function toBase64(bytes: Uint8Array): Promise<string> {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function extractPptxText(bytes: Uint8Array): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    const slides: { name: string; text: string }[] = [];
    for (const name of Object.keys(zip.files)) {
      if (/^ppt\/slides\/slide\d+\.xml$/.test(name)) {
        const xml = await zip.files[name].async('string');
        const text = xml.replace(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g, (_m, t) => t + '\n')
          .replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        slides.push({ name, text });
      }
    }
    slides.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return slides.map((s, i) => `--- Слайд ${i + 1} ---\n${s.text}`).join('\n\n');
  } catch (e) {
    return `(не удалось извлечь текст PPTX: ${(e as Error).message})`;
  }
}

async function buildBlockForMaterial(m: Material): Promise<any[]> {
  const label = `[Материал ${m.marker || m.id}${m.name ? `: ${m.name}` : ''}]`;

  if (m.kind === 'text' && m.text) {
    return [{ type: 'text', text: `${label}\n${m.text}` }];
  }

  if (m.kind === 'youtube' && m.url) {
    return [{ type: 'text', text: `${label}\nYouTube-ссылка (проанализируй по URL, если доступно): ${m.url}` }];
  }

  if ((m.kind === 'url' || m.kind === 'pubmed') && m.url) {
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
    return [{ type: 'text', text: `${label}\nURL: ${m.url}` }];
  }

  if (m.kind === 'file' && m.objectKey) {
    let bytes: Uint8Array; let ctype: string;
    try {
      const dl = await downloadFromYc(m.objectKey);
      bytes = dl.bytes; ctype = dl.contentType;
    } catch (e) {
      return [{ type: 'text', text: `${label}\nФайл не удалось скачать: ${(e as Error).message}` }];
    }
    const mime = m.mime || ctype || 'application/octet-stream';

    if (mime.startsWith('image/')) {
      return [
        { type: 'text', text: label },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${await toBase64(bytes)}` } },
      ];
    }
    if (mime === 'application/pdf') {
      return [
        { type: 'text', text: label },
        { type: 'file', file: { filename: m.name || 'document.pdf', file_data: `data:${mime};base64,${await toBase64(bytes)}` } },
      ];
    }
    if (mime.startsWith('audio/')) {
      const format = mime.includes('mp3') ? 'mp3' : mime.includes('wav') ? 'wav' : mime.includes('m4a') ? 'm4a' : 'webm';
      return [
        { type: 'text', text: label },
        { type: 'input_audio', input_audio: { data: await toBase64(bytes), format } },
      ];
    }
    // Таблицы (HTML из mammoth или markdown из PDF) передаём в контекст как есть —
    // модели просим сохранять как markdown-таблицы (см. SYSTEM_PROMPT).
    const tablesBlock = (() => {
      const t = m.extractedTables || [];
      if (!t.length) return '';
      const parts = t.slice(0, 20).map((tb, i) => {
        const cap = tb.caption ? ` — ${tb.caption}` : '';
        const src = tb.pageOrSlide ? ` (стр./слайд ${tb.pageOrSlide})` : '';
        const body = (tb.html && tb.html.trim()) || (tb.markdown && tb.markdown.trim()) || '';
        if (!body) return '';
        return `\n\n[Таблица ${i + 1}${src}${cap}]\n${body.slice(0, 8000)}`;
      }).filter(Boolean).join('\n');
      return parts ? `\n\n--- Извлечённые таблицы ---${parts}` : '';
    })();

    if (mime.includes('wordprocessingml') || (m.name || '').toLowerCase().endsWith('.docx')) {
      // Предпочитаем текст, извлечённый через research-materials-extract при загрузке — экономим CPU.
      if (m.text && m.text.trim().length > 0) {
        return [{ type: 'text', text: `${label}\n(DOCX)\n\n${m.text.slice(0, 40000)}${tablesBlock}` }];
      }
      try {
        const { value } = await mammoth.extractRawText({ buffer: bytes });
        return [{ type: 'text', text: `${label}\n(DOCX, извлечённый текст)\n\n${String(value || '').slice(0, 40000)}${tablesBlock}` }];
      } catch (e) {
        return [{ type: 'text', text: `${label}\nDOCX не удалось разобрать: ${(e as Error).message}${tablesBlock}` }];
      }
    }
    if (mime.includes('presentationml') || (m.name || '').toLowerCase().endsWith('.pptx')) {
      if (m.text && m.text.trim().length > 0) {
        return [{ type: 'text', text: `${label}\n(PPTX)\n\n${m.text.slice(0, 40000)}${tablesBlock}` }];
      }
      const txt = await extractPptxText(bytes);
      return [{ type: 'text', text: `${label}\n(PPTX, извлечённый текст)\n\n${txt.slice(0, 40000)}${tablesBlock}` }];
    }
    return [{ type: 'text', text: `${label}\n(файл типа ${mime} — тип не поддерживается для извлечения)` }];
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

    // Присваиваем/сохраняем маркеры [M1], [M2], … по порядку в списке.
    const enriched: Material[] = (materials as Material[]).map((m, i) => ({
      ...m, marker: m.marker || `[M${i + 1}]`,
    }));

    const userContent: any[] = [];
    if (topic) userContent.push({ type: 'text', text: `Тема обзора: ${topic}` });
    if (instructions) userContent.push({ type: 'text', text: `Дополнительные указания: ${instructions}` });
    userContent.push({ type: 'text', text: `Список маркеров:\n${enriched.map(m => `${m.marker} — ${m.name || m.url || (m.text?.slice(0, 60)) || m.kind}`).join('\n')}` });

    for (const m of enriched) {
      const blocks = await buildBlockForMaterial(m);
      userContent.push(...blocks);
    }

    let result;
    try {
      result = await callWithFallback({
        url: GATEWAY_URL,
        headers: { 'Lovable-API-Key': lovKey },
        primary: PRIMARY_MODEL,
        fallback: FALLBACK_MODEL,
        timeoutMs: 120_000,
        label: 'analyze',
        buildBody: (model) => ({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent },
          ],
          response_format: { type: 'json_object' },
        }),
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: 'gateway_error', details: String(e?.message || e).slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const raw = extractCompletion(result.json) || '{}';
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { summary: raw };
    }
    console.log(`analyze done: model=${result.modelUsed} fallback=${result.wasFallback}`);

    return new Response(JSON.stringify({
      ok: true,
      analysis: parsed,
      materials_with_markers: enriched,
      model_used: result.modelUsed,
      was_fallback: result.wasFallback,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('research-materials-analyze error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
