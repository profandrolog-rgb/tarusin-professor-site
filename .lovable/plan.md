## Задача 1 — SEO-поля без обрезания

**`supabase/functions/research-review-orchestrate/index.ts`**
- Убрать все `.slice(0, 60)` / `.slice(0, 160)` на SEO title и meta description при сохранении в `research_reviews`.
- В промпте генерации SEO-полей добавить явное требование: «уложиться в ≤60 символов для title и ≤160 для description законченной фразой; если не помещается — переформулировать короче, не обрывать». Указать, что обрезание запрещено.

**`supabase/functions/import-article-meta/index.ts`**
- Аналогично: убрать жёсткое обрезание, обновить промпт теми же правилами (для консистентности с обзорами).

**`src/pages/AdminResearchReviewEditor.tsx`**
- Рядом с полями SEO Title и Meta Description показать счётчик `N / 60` и `N / 160`.
- При превышении — подсветка счётчика классом `text-destructive` (поле не блокируем, сохранение разрешено).
- Никакого клиентского `slice` при сохранении.

---

## Задача 2 — Оркестратор обзоров с видимыми этапами

Логика бэкенда (`research-review-orchestrate`, `EdgeRuntime.waitUntil`, `orchestrator_status`) не меняется. Меняем только клиент и небольшое расширение payload'а статусов.

### Новые компоненты (по образцу `AdminArticleOrchestrator.tsx`)

**`src/components/admin/research/OrchestratorProgress.tsx`**
- Тип `StageProgress = { id: 'search' | 'draft' | 'factcheck'; label: string; status: 'queued'|'running'|'done'|'error'; startedAt?: number; finishedAt?: number; error?: string }`.
- Три строки-этапа: «Поиск литературы» → «Написание обзора» → «Проверка источников».
- Для каждого: статус-бейдж (В очереди / Анализирует / Готово / Ошибка), живой таймер (`useEffect` + `setInterval` 1 с, считает `Date.now() - startedAt` пока `running`, фиксирует при `done`).
- Кнопка повтора этапа с иконкой `RotateCw` (callback `onRetryStage(stageId)`).
- Общая полоса прогресса внизу (`<Progress value={doneCount/3*100} />`).

**`src/components/admin/research/OrchestratorArtifacts.tsx`**
- `Tabs` с тремя вкладками:
  - «Найденная литература» — сырой ответ Perplexity (markdown/список источников).
  - «Черновик обзора» — текст с маркерами `[M#]` (readonly preview).
  - «Проверка источников» — структурированный `fact_check_report`, сгруппированный: «Подтверждено» / «Не найдено в источнике» / «Без маркера».
- Пропсы: `search`, `draft`, `factCheck`.

**`src/components/admin/research/FactCheckFixList.tsx`**
- Список правок из `fact_check_report.fixes: { id, quote, suggestion, reason, marker? }[]`.
- Каждая карточка: диф «− До» (классы `border-red-500/30 bg-red-500/5`) и «+ После» (`border-emerald-500/30 bg-emerald-500/5`), чекбокс «Принять», кнопка `Pencil` для ручной правки предложенного текста (inline `Textarea`).
- Итоговая кнопка «Применить принятые правки» → callback `onApply(acceptedFixes)`, который в редакторе делает `content.replaceAll(quote, suggestion)` и записывает в `content_with_markers`.

### Изменения в бэкенде (минимальные, чтобы вкладки было чем наполнять)

**`supabase/functions/research-review-orchestrate/index.ts`**
- В `orchestrator_status` (jsonb) писать структуру:
  ```
  {
    stages: { search: {...}, draft: {...}, factcheck: {...} },
    artifacts: { search_raw, draft_markdown, fact_check_report },
    updated_at
  }
  ```
- На старте каждого этапа — `status: 'running'`, `startedAt`. По завершении — `done`/`error` + `finishedAt` + сохранение артефакта.
- `fact_check_report` расширить до `{ summary, fixes: [{id, quote, suggestion, reason, marker?, verdict}] }`.
- Добавить необязательный параметр `stage` во входе: если указан, гоняется только этот этап (для кнопки «повторить этап»).

### Интеграция в `src/pages/AdminResearchReviewEditor.tsx`

- Ключ `RESEARCH_ORCH_KEY = 'research-orchestrator-state:<reviewId>'`, TTL 7 дней (по образцу `DRAFT_KEY`).
- На маунте: если в БД `orchestrator_status.status ∈ {queued, running}` — поднять состояние из БД + localStorage, запустить polling. Иначе — гидратировать из localStorage только для показа последнего результата.
- Polling каждые 2–3 с через `supabase.from('research_reviews').select('orchestrator_status')`; на каждом апдейте — сохранять в localStorage.
- По окончании (`status = done`) — `playCompletionChime()` из `@/lib/notifySound` (один раз, флаг в state).
- Определение «застряло» (7 минут) — уже есть, оставляем.
- Показ:
  - `<OrchestratorProgress stages={...} onRetryStage={...} />`
  - `<OrchestratorArtifacts search draft factCheck />`
  - `<FactCheckFixList fixes onApply={applyFixesToContent} />`
- Кнопка «Повторить этап» → вызов той же функции `research-review-orchestrate` с `{ reviewId, stage }`.
- Кнопка «Применить принятые правки» модифицирует поле `content` в форме редактора (пользователь потом сохраняет).

### Что НЕ трогаем
- Три фоновых вызова через `EdgeRuntime.waitUntil`.
- `beforeunload → interrupted`.
- Механику `research-materials-extract`, `MaterialsPanel`, `RefinementChat`.
- Дизайн-токены и шрифты.

---

Жду подтверждения — начну с задачи 1 и параллельно создам три новых компонента для задачи 2.