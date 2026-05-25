# Фаза 4 — Автопарсинг цен

Firecrawl уже подключён (`FIRECRAWL_API_KEY` в secrets). Используем его для парсинга цен препаратов и лабораторных тестов.

## Шаг 1. Миграция БД

`treatment_catalog` — добавить:
- `price_auto numeric` — последняя автоцена (медиана по источникам)
- `price_auto_updated_at timestamptz`
- `price_auto_sources jsonb` — `[{source, url, price, fetched_at}]`
- `price_source_preference text default 'auto'` — `auto` | `manual` (если `manual` — `price_override` приоритетнее)
- `parse_query text` — переопределение поискового запроса (по умолчанию = name)

`lab_tests_catalog` — добавить:
- `price_auto numeric`, `price_auto_updated_at timestamptz`, `price_auto_sources jsonb`
- `kdl_slug text` — slug страницы на kdlmed.ru (если известен)

Новая таблица `price_parse_log`:
- `id`, `entity_type` (`drug`|`lab`), `entity_id uuid`, `status` (`ok`|`partial`|`fail`), `sources_count int`, `error text`, `created_at`

RLS: admin ALL.

## Шаг 2. Edge Function `parse-drug-prices`

`supabase/functions/parse-drug-prices/index.ts`:
- Вход: `{ catalog_id: uuid }` или `{ batch: true, limit?: number }` (берёт позиции с самой старой `price_auto_updated_at` или без неё)
- Источники: `apteka.ru`, `eapteka.ru`, `megapteka.ru`
- Через Firecrawl `search` — `{name} цена аптека site:apteka.ru` и т.п., с `scrapeOptions.formats=['markdown']`
- Парсинг цены регексом `/(\d[\d\s]*[.,]?\d*)\s*(?:₽|руб)/` из первого валидного результата каждого источника
- Сохранение: медиана 3 цен → `price_auto`, массив источников → `price_auto_sources`, `price_auto_updated_at = now()`
- Лог в `price_parse_log`
- Admin-only (проверка `has_role`)

## Шаг 3. Edge Function `parse-lab-prices`

Аналогично, но источник — `kdlmed.ru`:
- Если `kdl_slug` есть — скрейп прямой URL; иначе `search` по названию
- Парсинг цены из markdown

## Шаг 4. Cron — раз в 7 дней

`supabase--insert` (не migration, т.к. содержит anon key) с `cron.schedule` — вызывает `parse-drug-prices?batch=true&limit=20` и `parse-lab-prices?batch=true&limit=20` раз в неделю в 04:00 МСК (= 01:00 UTC, день недели — воскресенье).

Включить `pg_cron` и `pg_net` через миграцию (шаг 1).

## Шаг 5. UI каталога препаратов

В `TreatmentCatalog.tsx`:
- В drawer-форме секция «💰 Стоимость»: добавить
  - радио `price_source_preference`: «Авто (парсинг)» / «Ручная цена»
  - поле `parse_query` (опционально)
  - блок «Автоцена»: значение `price_auto`, дата, список источников (свернуто), кнопка «🔄 Обновить сейчас» → вызов edge function
- В таблице:
  - Столбец «Цена» показывает эффективную (manual если preference=manual, иначе auto || manual fallback)
  - Индикатор источника: 🤖 (auto) / ✋ (manual)
  - Свежесть по `price_auto_updated_at` если auto
- Кнопка в шапке «🔄 Обновить все цены» → batch вызов (с прогресс-тостом)

## Шаг 6. UI каталога анализов

Новая страница/секция для `lab_tests_catalog` (если ещё нет редактора — добавить простой drawer прямо в `LabControlSection` админки или новый маршрут `/admin/lab-tests-catalog`). Аналогичные поля и кнопка обновления.

## Шаг 7. Использование auto в расчёте

`src/lib/treatment/cost.ts`:
- Помощник `effectivePrice(catalog)` — возвращает `price_override` если `price_source_preference==='manual'`, иначе `price_auto ?? price_override`
- `calculateItemCost` использует `effectivePrice` вместо прямого `price_override`

Передавать `price_auto`, `price_auto_updated_at`, `price_source_preference` в `CostCatalog` (расширить тип).

## Шаг 8. Печать и памятка

В `TreatmentPlanPrint`/`TreatmentPlanMemo` — индикация источника цены не нужна, но дисклеймер расширить: «Цены актуальны на {макс_дата_из_позиций}, могут отличаться ±15-20%».

## Acceptance

- [ ] Кнопка «Обновить» на одной позиции возвращает цену из ≥1 источника
- [ ] Batch обновляет до N позиций без таймаута
- [ ] Cron создаёт записи в `price_parse_log` раз в 7 дней
- [ ] Manual override работает (если выбран — игнорирует auto)
- [ ] Цвет свежести учитывает `price_auto_updated_at`
- [ ] Регрессия: Фазы 1–3 работают

---

Разбиение: **4A** — миграция + edge functions + ручная кнопка обновления (шаги 1-3, 5 кнопки). **4B** — UI каталога анализов, cron, интеграция в расчёт/печать (шаги 4, 6-8).

Подтвердите план — начну с 4A.