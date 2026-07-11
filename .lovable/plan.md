# Где в проекте живёт логика qwen-max

Изменений не предлагаю — только карта кода по запросу.

## Единственное место обработки вызова модели

**`supabase/functions/orchestrate-article/index.ts`** — весь rewrite/review/consolidate идёт через `callModel` → `callModelOnce` (провайдер OpenRouter, endpoint `https://openrouter.ai/api/v1/chat/completions`). Alibaba DashScope напрямую не вызывается — только через OpenRouter.

### 1. Определение модели (строки 117–119)
```ts
function isQwenMax(model: string): boolean {
  return /^qwen\/qwen[-.]?3?\.?7?-?max/i.test(model) || /^qwen\/qwen[^/]*max/i.test(model) || model === "qwen-max";
}
```

### 2. Публичное сообщение об ошибке (строки 121–133)
Специально маппит `HTTP 429` и `timeout after …s` в user-friendly текст для qwen-max.

### 3. Спецпайплайн попыток для qwen-max в `callModel` (строки 300–312)
```ts
const heavyReasoning = /(gpt-5|claude-.*-opus|gemini-.*-pro|deepseek-r1|qwen.*max|grok-4)/i.test(model);
const baseTimeout = purpose === "rewrite" ? 320_000 : purpose === "consolidate" ? 280_000 : 200_000;
const timeoutMs = baseTimeout + (heavyReasoning ? 60_000 : 0);
const fastTimeout = Math.min(timeoutMs, 180_000);

const attempts = isQwenMax(model) ? [
  // один быстрый проход, без reasoning, без backend-ретраев
  { useReasoning: false, useJsonObject: true, useThroughput: true,
    maxTokens: Math.min(maxTokens, 10_000), timeoutMs: 75_000 },
] : [
  { useReasoning: true,  useJsonObject: true,  useThroughput: true,  maxTokens, timeoutMs },
  { useReasoning: false, useJsonObject: true,  useThroughput: true,  maxTokens: Math.min(maxTokens, 12_000), timeoutMs: fastTimeout },
  { useReasoning: false, useJsonObject: false, useThroughput: true,  maxTokens: Math.min(maxTokens, 8_000),  timeoutMs: fastTimeout },
];
```

### 4. Блокировка ретраев для qwen-max (строка 327)
```ts
const retryable = !isQwenMax(model) && /empty content|empty response body|invalid JSON response|Unexpected end of JSON input|terminated|fetch failed|HTTP 5\d\d|INVALID_REQUEST_BODY|timeout after/i.test(msg);
if (!retryable) break;
```
То есть для qwen-max backend всегда делает **ровно одну** попытку — независимо от типа ошибки.

### 5. Спецсборка payload для qwen/* (строка 190, в `callModelOnce`)
```ts
const skipReasoning = /^(google\/gemini-.*-pro|deepseek\/|xiaomi\/|x-ai\/grok-4|sakana\/|qwen\/)/.test(realModel);
```
Для всех `qwen/*` `reasoning` не отправляется даже если запрошен.

### 6. Классификация 429 для метрик (строки 268–277)
```ts
if (/HTTP 429|rate-?limit|temporarily rate-limited/i.test(msg)) return "rate_limit";
```
Пишется в таблицу `public.orchestrator_call_metrics` через service-role клиент (fire-and-forget, строки 278–288).

### 7. HTTP 429 как таковой
Специальной обработки 429 (например, чтения `Retry-After` или экспоненциального backoff) нет. 429 попадает в общий блок `if (!r.ok) throw new Error(`HTTP ${r.status}: …`)` (строки 221–224). Для qwen-max он немедленно завершает вызов (см. п.4); для остальных моделей 429 **не** попадает в regex `retryable` — тоже без ретрая.

## Смежные точки (без своей логики retry/timeout по qwen-max)

- `src/config/aiModels.ts:154–163` — определение ключа `qwen-max`, кандидатов OpenRouter (`qwen/qwen3.7-max`, `qwen/qwen-3.7-max`, `qwen/qwen3-max`, `qwen/qwen-max`) и `familyRegex`.
- `src/pages/AdminArticleOrchestrator.tsx:64` — `{ key: "qwen-max", default: false }` (выключен по умолчанию в UI из-за 429 upstream).
- `src/pages/Cabinet.tsx:57` — просто в списке доступных моделей кабинета.
- `supabase/functions/ai-council/index.ts` и `ai-chat/index.ts` — упоминается только `qwen/qwen3.6-flash`; qwen-max там **не** обрабатывается.

## Итог

Вся retry/timeout/429-логика для qwen-max сосредоточена в одном файле — `supabase/functions/orchestrate-article/index.ts`, функции `isQwenMax`, `publicModelError`, `callModel`, `callModelOnce`, `classifyError`. Текущее поведение: 1 попытка, 75 s таймаут, без reasoning, без backend-ретраев, 429 → мгновенный fail с русскоязычным сообщением.
