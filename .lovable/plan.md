
## Задача 1 — SEO-поля без обрезания

### Что поменяю

**`supabase/functions/research-review-orchestrate/index.ts`** (строки 210–211, 228–229)
- Убрать `.slice(0, 60)` / `.slice(0, 160)` — записывать `seo_title` и `seo_meta_description` целиком.
- Значения брать из `parsed.seo_title` / `parsed.seo_meta_description`, если модель их вернула; иначе fallback на `title` / `annotation` целиком (без обрезания).

**Промпт написания** (строки 168–174 того же файла)
- В требования к JSON добавить обязательные поля `seo_title` (≤60 символов, законченная фраза) и `seo_meta_description` (≤160 символов, законченная фраза).
- Явное правило: «Если не помещается — переформулируй короче. Не обрывай на полуслове, не ставь многоточие вместо окончания.»

**`supabase/functions/import-article-meta/index.ts`** — там аналогичный промпт извлечения SEO. Обновить формулировку про «уложиться» законченной фразой (сейчас просто «до 80/200 символов»).

**`src/pages/AdminResearchReviewEditor.tsx`** (строки 437–438)
- Убрать `maxLength={70}` и `maxLength={200}`.
- Под каждым полем добавить счётчик `X / 60` (title) и `X / 160` (description). Подсветка `text-destructive`, если превышено, иначе `text-muted-foreground`. Никаких блокировок сохранения.

---

## Задача 2 — Оркестратор обзоров с видимой работой

Логику edge-функции не трогаю (уже пишет `orchestrator_status`, `last_step`, `error` в `fact_check_report`). Изменения только в UI редактора обзоров.

### Новый компонент

**`src/components/admin/research/OrchestratorProgress.tsx`** — карточка «Прогресс обзора» по образцу блока «Прогресс ревью» из `AdminArticleOrchestrator.tsx`.

Три этапа (маппятся на `last_step`):
```text
Поиск литературы  →  Написание обзора  →  Проверка источников
```

Для каждого этапа:
- Статус-бейдж по цветовой схеме оригинала: `queued` → «В очереди» (outline), `active` → «Анализирует» (амбер, с `Loader2 animate-spin`), `done` → «Готово» (emerald), `error`/`interrupted` → «Ошибка» (red).
- Живой таймер в секундах (`useEffect` + `setInterval(1000)` пока этап `active`, замораживается по завершении).
- Кнопка `RotateCw` — повтор только этого этапа (пока в MVP она перезапускает весь оркестратор, т.к. edge-функция не умеет частично; кнопка отображается, но с тултипом «пока перезапускает целиком». Если позже разделим — трогать нужно только эту кнопку).
- Общая полоса прогресса внизу (`Progress` из shadcn): `done_steps / 3 * 100`.

Пропсы: `{ status, lastStep, error, elapsedByStep, onRetryAll, onRetryStep }`.

### Новый компонент

**`src/components/admin/research/OrchestratorArtifacts.tsx`** — блок «Результаты этапов» по образцу «Мнения моделей» с `Tabs`:

- **Вкладка «Найденная литература»** — вывод `fact_check_report.search_result` (сырой текст от Perplexity, `<pre className="whitespace-pre-wrap text-sm">`). Требует, чтобы edge-функция дополнительно сохранила это поле (см. ниже).
- **Вкладка «Черновик обзора»** — `row.content_with_markers` c подсветкой маркеров через существующий `highlightMarkers` из `@/lib/research/markers`. Только просмотр (readonly HTML preview с `dangerouslySetInnerHTML`).
- **Вкладка «Проверка источников»** — структурированный вывод `fact_check_report`: три подсекции с иконками — «✓ Подтверждено» (verified, emerald), «⚠ Не найдено в источнике» (not_found_in_source, red), «○ Без маркера» (unmarked_claims, amber). Каждый пункт в мини-карточке.

Пропсы: `{ searchResult, content, factCheck }`.

### Новый компонент

**`src/components/admin/research/FactCheckFixList.tsx`** — «Список правок» по образцу «Консолидированное мнение арбитра» (строки 1414+ в AdminArticleOrchestrator).

Для каждого элемента `not_found_in_source`:
```text
┌ Карточка правки ─────────────────────────┐
│  Маркер: [M5]   Причина: не найдено в M5 │
│  ┌ − До ──────────────────────────┐      │
│  │ border-red-500/30 bg-red-500/5 │      │
│  │ <исходное утверждение>         │      │
│  └────────────────────────────────┘      │
│  ┌ + После ───────────────────────┐      │
│  │ border-emerald-500/30 bg-...   │      │
│  │ <Textarea для правки>          │      │
│  └────────────────────────────────┘      │
│  [x] Принять   [✎ Правка вручную]       │
└──────────────────────────────────────────┘
[Применить принятые правки (N)]
```

Действие «Применить»: находит утверждение в `row.content_with_markers` (по подстроке), заменяет на исправленный вариант, вызывает `applyRefinement(newContent, entry)` с `entry.type = "fact_check_fix"`.

Пропсы: `{ content, factCheck, onApply }`.

### Правки в `src/pages/AdminResearchReviewEditor.tsx`

1. Добавить `import { playCompletionChime } from "@/lib/notifySound"` и вызывать в `poll()`, когда статус переходит в `done`.
2. Опрос в `orchestrate()` заменить на постоянный, живущий пока страница открыта: вынести в `useEffect`, который слушает `row.fact_check_report.orchestrator_status`. Пока `status ∈ {searching, writing, fact_checking}` — polling 5 сек. Так прогресс восстановится после F5.
3. LocalStorage-сохранение состояния прогона:
   - Ключ: `research_orchestrator:draft:v1:${id}`, TTL 7 дней.
   - Сохраняем: `topic`, `analysis`, `instructions`, отметку времени старта, отметки времени начала каждого этапа (для таймеров).
   - Восстанавливаем при монтировании.
4. Вставить `<OrchestratorProgress />` над `<PublishBar />` (виден всегда, когда `fact_check_report?.orchestrator_status` не пустой либо `orchestrating`).
5. Вставить `<OrchestratorArtifacts />` под прогрессом (появляется, как только есть первый артефакт).
6. Вставить `<FactCheckFixList />` под артефактами (появляется, когда `fact_check_report.not_found_in_source.length > 0` и статус `done`).
7. `onRetryAll` = `orchestrate()`; `onRetryStep` = `orchestrate()` пока (см. выше).

### Мелкая правка в edge-функции

Только одна: сохранить сырой результат поиска в отчёт, чтобы вкладка «Найденная литература» имела что показывать.

В `runPipeline` после `searchResult = await callOpenRouter(...)` добавить:
```ts
await markStatus('writing', { search_result: searchResult.slice(0, 20000) });
```
Больше в оркестраторе ничего не меняется — фоновая логика, `EdgeRuntime.waitUntil`, три вызова, статусы остаются как есть.

---

## Технические детали

- Все три новых компонента — обычные React + shadcn, без стейт-менеджера. Стили — те же классы, что в `AdminArticleOrchestrator` (`border-red-500/30 bg-red-500/5`, `border-emerald-500/30 bg-emerald-500/5`, `bg-amber-500/15 …`), чтобы визуально совпадало.
- Таймеры этапов: массив `{ searching?: number; writing?: number; fact_checking?: number }` в `useState`. При смене `last_step` фиксируется `startedAt` текущего шага; таймер — `Date.now() - startedAt`.
- Persist таймеров: те же `startedAt` кладутся в тот же LocalStorage-объект, чтобы после F5 продолжить отсчёт.
- Звук: `playCompletionChime()` только при переходе `active → done` (не при монтировании страницы с уже готовым обзором); флаг «уже сыграли» в `useRef`.
- Никаких изменений в схеме БД. Всё живёт внутри JSONB-поля `fact_check_report`.

## Файлы

Новые:
- `src/components/admin/research/OrchestratorProgress.tsx`
- `src/components/admin/research/OrchestratorArtifacts.tsx`
- `src/components/admin/research/FactCheckFixList.tsx`

Изменённые:
- `supabase/functions/research-review-orchestrate/index.ts` (SEO без обрезания + сохранить search_result)
- `supabase/functions/import-article-meta/index.ts` (уточнить промпт)
- `src/pages/AdminResearchReviewEditor.tsx` (счётчики SEO, интеграция трёх компонентов, чайм, persist)
