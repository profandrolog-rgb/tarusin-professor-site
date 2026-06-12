import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are a medical article formatter. Convert the input text into clean markdown. Rules:
- ## for main sections, ### for subsections
- **bold** for key terms, numbers, percentages
- > 💡 **Важно знать:** for key facts
- > ⚠️ **Когда срочно к врачу:** for warning signs
- > 📊 **Цифры:** for statistics

=== ПЛЕЙСХОЛДЕРЫ — НЕ ТРОГАЙ ===
В тексте могут встречаться маркеры вида [[TABLE_PROTECTED_0]], [[TABLE_PROTECTED_1]] и т.д.
Это защищённые таблицы. Скопируй их в ответ ДОСЛОВНО, на том же месте, в той же строке абзаца.
НЕ удаляй, НЕ переименовывай, НЕ оборачивай в кавычки, НЕ добавляй вокруг них пояснения.
=== КОНЕЦ ===

=== АБСОЛЮТНЫЙ ЗАПРЕТ — ТАБЛИЦЫ ===
1. НИКОГДА не превращай таблицу в сплошной текст
2. НИКОГДА не склеивай ячейки в один абзац
3. НИКОГДА не удаляй колонки/строки
4. НИКОГДА не заменяй таблицу списком
Формат строго GFM: | Колонка | Колонка | с разделителем | --- | --- |
Пустая строка до и после таблицы.
=== КОНЕЦ ===

=== АБСОЛЮТНЫЙ ЗАПРЕТ — ГАЛЕРЕИ ===
Маркеры [[GALLERY: caption="..."]]:
1. НИКОГДА не удаляй
2. НИКОГДА не изменяй текст внутри caption
3. НИКОГДА не перемещай
4. НИКОГДА не заменяй чем-либо
5. Копируй дословно символ в символ включая [[ и ]]
=== КОНЕЦ ===

- Preserve the author's voice
- Do not add or remove content
- Это ЧАСТЬ длинной статьи. Не добавляй вступление/заключение — только форматируй фрагмент.

Return only the formatted markdown.`;

// ---------- TABLE & GALLERY PROTECTION ----------
// Tables (GFM pipe tables) and gallery markers are extracted BEFORE sending to AI
// and restored AFTER. This guarantees the model can never touch them.
const TABLE_PLACEHOLDER_RE = /\[\[TABLE_PROTECTED_(\d+)\]\]/g;
const GALLERY_PLACEHOLDER_RE = /\[\[GALLERY_PROTECTED_(\d+)\]\]/g;
const GALLERY_MARKER_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”][^"'“”]*["'“”]\s*(?:\|[^\]]*)?\]\]/g;

function isTableLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.length > 2;
}
function isSeparatorLine(line: string): boolean {
  const t = line.trim();
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(t);
}

function extractTables(text: string): { stripped: string; tables: string[] } {
  const lines = text.split('\n');
  const out: string[] = [];
  const tables: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isTableLine(lines[i]) && i + 1 < lines.length && isSeparatorLine(lines[i + 1])) {
      const buf: string[] = [lines[i], lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && isTableLine(lines[j])) {
        buf.push(lines[j]);
        j++;
      }
      const idx = tables.length;
      tables.push(buf.join('\n'));
      out.push(`[[TABLE_PROTECTED_${idx}]]`);
      i = j;
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return { stripped: out.join('\n'), tables };
}

function extractGalleries(text: string): { stripped: string; galleries: string[] } {
  const galleries: string[] = [];
  const stripped = text.replace(GALLERY_MARKER_RE, (m) => {
    const idx = galleries.length;
    galleries.push(m);
    return `[[GALLERY_PROTECTED_${idx}]]`;
  });
  return { stripped, galleries };
}

function restoreTables(text: string, tables: string[]): string {
  if (tables.length === 0) return text;
  const used = new Set<number>();
  let restored = text.replace(TABLE_PLACEHOLDER_RE, (_m, n) => {
    const idx = Number(n);
    if (Number.isInteger(idx) && idx >= 0 && idx < tables.length) {
      used.add(idx);
      return `\n\n${tables[idx]}\n\n`;
    }
    return _m;
  });
  for (let i = 0; i < tables.length; i++) {
    if (!used.has(i)) restored += `\n\n${tables[i]}\n\n`;
  }
  return restored;
}

function restoreGalleries(text: string, galleries: string[]): string {
  if (galleries.length === 0) return text;
  const used = new Set<number>();
  let restored = text.replace(GALLERY_PLACEHOLDER_RE, (_m, n) => {
    const idx = Number(n);
    if (Number.isInteger(idx) && idx >= 0 && idx < galleries.length) {
      used.add(idx);
      return `\n\n${galleries[idx]}\n\n`;
    }
    return _m;
  });
  for (let i = 0; i < galleries.length; i++) {
    if (!used.has(i)) restored += `\n\n${galleries[i]}\n\n`;
  }
  return restored;
}

const MODEL_ID = 'claude-haiku-4-5';
const TIMEOUT_MS = 120000; // 2 min per single chunk — well under 150s edge limit

async function callAnthropic(apiKey: string, text: string): Promise<{ formatted: string; stop_reason: string | null; error?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: 16000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    });
    if (!resp.ok || !resp.body) {
      const errText = await resp.text().catch(() => '');
      return { formatted: '', stop_reason: null, error: `Anthropic HTTP ${resp.status}: ${errText.slice(0, 300)}` };
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let raw = '';
    let stopReason: string | null = null;
    let apiErr: string | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            raw += evt.delta.text || '';
          } else if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
            stopReason = evt.delta.stop_reason;
          } else if (evt.type === 'error') {
            apiErr = evt.error?.message || JSON.stringify(evt.error);
            break;
          }
        } catch { /* ignore */ }
      }
      if (apiErr) break;
    }
    return { formatted: raw.trim(), stop_reason: stopReason, error: apiErr || undefined };
  } catch (e) {
    return { formatted: '', stop_reason: null, error: String((e as any)?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const { data: roleData } = await userClient
      .from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const draftId = typeof body?.draft_id === 'string' ? body.draft_id : '';
    const chunkIndex = Number.isInteger(body?.chunk_index) ? body.chunk_index : -1;
    if (!draftId || chunkIndex < 0) {
      return new Response(JSON.stringify({ error: 'draft_id and chunk_index required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client to read & update the draft atomically
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: draft, error: dErr } = await admin
      .from('disease_article_drafts')
      .select('id, user_id, chunks, total_chunks, last_chunk_done, formatted_content, format_status')
      .eq('id', draftId)
      .maybeSingle();
    if (dErr || !draft) {
      return new Response(JSON.stringify({ error: 'draft not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (draft.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const chunks: string[] = Array.isArray(draft.chunks) ? draft.chunks as string[] : [];
    if (chunkIndex >= chunks.length) {
      return new Response(JSON.stringify({ error: 'chunk_index out of range' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      await admin.from('disease_article_drafts').update({
        format_status: 'error',
        error_message: 'ANTHROPIC_API_KEY is not configured',
      }).eq('id', draftId);
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // mark processing
    await admin.from('disease_article_drafts').update({
      format_status: 'processing',
      format_progress: `${chunkIndex + 1}/${chunks.length}`,
      error_message: null,
    }).eq('id', draftId);

    // ---- Protect tables: strip BEFORE sending to AI, restore AFTER ----
    const { stripped, tables } = extractTables(chunks[chunkIndex]);
    const r = await callAnthropic(apiKey, stripped);
    if (r.error || !r.formatted) {
      const reason = r.error || (r.stop_reason ? `stop_reason=${r.stop_reason}` : 'empty response');
      await admin.from('disease_article_drafts').update({
        format_status: 'error',
        error_message: `Часть ${chunkIndex + 1}/${chunks.length}: ${reason}`,
      }).eq('id', draftId);
      return new Response(JSON.stringify({ error: reason, stop_reason: r.stop_reason }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // append formatted chunk
    const prev = draft.formatted_content || '';
    const sep = prev ? '\n\n' : '';
    // Restore tables (guarantees no table data is ever lost, even if AI dropped the placeholder)
    const restored = restoreTables(r.formatted, tables);
    const newFormatted = prev + sep + restored;
    const newLastDone = chunkIndex + 1;
    const isDone = newLastDone >= chunks.length;

    const { error: uErr } = await admin.from('disease_article_drafts').update({
      formatted_content: newFormatted,
      last_chunk_done: newLastDone,
      format_progress: `${newLastDone}/${chunks.length}`,
      format_status: isDone ? 'done' : 'processing',
      error_message: null,
    }).eq('id', draftId);
    if (uErr) {
      return new Response(JSON.stringify({ error: 'failed to save chunk: ' + uErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      chunk_index: chunkIndex,
      last_chunk_done: newLastDone,
      total_chunks: chunks.length,
      done: isDone,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('format-disease-article-chunk error:', e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
