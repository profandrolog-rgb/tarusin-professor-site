// Общий помощник вызова AI-шлюза с таймаутом и автоматическим переключением на fallback-модель.
// Если основной вызов возвращает 404 / model_not_found / provider_not_available — один повтор на fallback.
// Если fallback не задан или совпадает с основной моделью — повтора нет.

export interface AiCallOptions {
  url: string;                    // endpoint (gateway или openrouter)
  headers: Record<string, string>;
  buildBody: (model: string) => any; // билдер тела под конкретную модель
  primary: string;
  fallback?: string;
  timeoutMs?: number;             // по умолчанию 120000
  label?: string;                 // для логов
}

export interface AiCallResult {
  json: any;
  modelUsed: string;
  wasFallback: boolean;
}

const RETRIABLE_STATUS = new Set([404, 400, 502, 503]);

function isRetriablePayload(status: number, bodyText: string): boolean {
  if (RETRIABLE_STATUS.has(status)) {
    // 400 повторяем только если это точно про модель
    if (status === 400) return /model|not_found|unsupported|unavailable|invalid_model/i.test(bodyText);
    return true;
  }
  return false;
}

async function once(url: string, headers: Record<string, string>, body: any, timeoutMs: number) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error(`Модель ${body?.model || '?'} не ответила за ${Math.round(timeoutMs / 1000)} с (таймаут).`);
    }
    throw e;
  } finally {
    clearTimeout(to);
  }
}

export async function callWithFallback(opts: AiCallOptions): Promise<AiCallResult> {
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const label = opts.label || 'ai-call';

  // основной вызов
  const primaryBody = opts.buildBody(opts.primary);
  const first = await once(opts.url, opts.headers, primaryBody, timeoutMs);
  if (first.ok) {
    try { return { json: JSON.parse(first.text), modelUsed: opts.primary, wasFallback: false }; }
    catch (e) { throw new Error(`${label}: не удалось распарсить ответ (${(e as Error).message})`); }
  }

  const shouldRetry = !!opts.fallback && opts.fallback !== opts.primary && isRetriablePayload(first.status, first.text);
  if (!shouldRetry) {
    throw new Error(`${label} ${opts.primary} → HTTP ${first.status}: ${first.text.slice(0, 300)}`);
  }

  console.warn(`[${label}] primary ${opts.primary} failed (${first.status}), retrying on fallback ${opts.fallback}`);
  const fbBody = opts.buildBody(opts.fallback!);
  const second = await once(opts.url, opts.headers, fbBody, timeoutMs);
  if (!second.ok) {
    throw new Error(`${label} fallback ${opts.fallback} → HTTP ${second.status}: ${second.text.slice(0, 300)} (primary ${opts.primary} was ${first.status})`);
  }
  try { return { json: JSON.parse(second.text), modelUsed: opts.fallback!, wasFallback: true }; }
  catch (e) { throw new Error(`${label}: fallback ответил невалидным JSON (${(e as Error).message})`); }
}

// Достать текст-ответ chat-completions
export function extractCompletion(json: any): string {
  return String(json?.choices?.[0]?.message?.content ?? '');
}
