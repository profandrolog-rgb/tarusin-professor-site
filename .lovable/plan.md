# /admin/analytics — дашборд статистики

## 1. БД-миграция

**Таблица `analytics_cache`:**
- `cache_key text primary key` — формат `{section}:{md5(filters)}`
- `payload jsonb not null`
- `computed_at timestamptz default now()`
- RLS: только admin SELECT/INSERT/UPDATE/DELETE
- TTL проверяется в коде: `now() - computed_at < interval '1 hour'`

**SECURITY DEFINER RPC-функции** (все принимают `_from date, _to date, _status text, _doctor text`):

| Функция | Возвращает |
|---|---|
| `analytics_top_catalog(_from,_to,_status,_doctor,_limit int default 20)` | jsonb: `[{rank,name,section,usage_count,pct_of_plans}]` |
| `analytics_top_templates(_from,_to,_status,_doctor,_limit int default 10)` | jsonb: `[{rank,name,usage_count,avg_duration_days,avg_cost}]` |
| `analytics_avg_cost_by_tag(_from,_to,_status,_doctor)` | jsonb: `[{tag,avg_cost,plans_count}]` |
| `analytics_plans_per_month(_from,_to,_status,_doctor)` | jsonb: `[{month: 'YYYY-MM', count}]` за последние 12 мес |
| `analytics_duration_histogram(_from,_to,_status,_doctor)` | jsonb: `[{bucket,count}]` корзины 1-5/6-10/11-14/15-21/22-30/30+ |
| `analytics_section_usage(_from,_to,_status,_doctor)` | jsonb: `[{section,count,pct}]` по 12 категориям |
| `analytics_doctors_list()` | jsonb: список уникальных `created_by` с email из profiles |

Все читают `treatment_plans` + `treatment_plan_items` + `treatment_catalog` + `protocol_templates`. Фильтры:
- период: `issued_at between _from and _to` (для draft — `created_at`)
- статус: `_status in ('issued','all')`
- врач: `_doctor::uuid = created_by` или `_doctor='all'`

Стоимость берётся как сумма `qty * price_avg` из items (та же логика, что в `src/lib/treatment/cost.ts`, но в SQL).

## 2. Frontend

**`src/pages/AdminAnalytics.tsx`** (роут `/admin/analytics` в App.tsx, ссылка с Admin.tsx).

Layout:
```
[ Фильтры: период (Select 30/90/365/all/custom) | статус | врач | Экспорт CSV ]
[ Раздел 1: ТОП-20 каталога ── таблица ]
[ Раздел 2: ТОП-10 шаблонов ── таблица ]
[ Раздел 3: bar — стоимость по тегам ] [ Раздел 6: pie — секции ]
[ Раздел 4: line — динамика 12 мес ] [ Раздел 5: histogram (bar) ]
```

**Хук `useAnalyticsSection(section, filters)`** — react-query:
1. Считает `filters_hash` (sha256 кратко через `btoa(JSON.stringify)`)
2. Читает `analytics_cache` по ключу
3. Если свежий (<1ч) — отдаёт `payload`
4. Иначе вызывает RPC, апсертит в `analytics_cache`, отдаёт

**Графики:** Recharts (уже в package.json): `BarChart`, `LineChart`, `PieChart` через обёртки из `components/ui/chart.tsx`.

**CSV-экспорт:** объединяет данные всех 6 разделов в один многосекционный CSV (заголовок `=== ТОП-20 каталога ===` и т.д.), `Blob` + `saveAs` через существующий file-saver.

## 3. Файлы

**Новые:**
- `supabase/migrations/...sql` — таблица + 7 RPC
- `src/pages/AdminAnalytics.tsx`
- `src/lib/analytics/useAnalyticsSection.ts`
- `src/lib/analytics/csvExport.ts`
- `src/components/analytics/FiltersBar.tsx`
- `src/components/analytics/TopCatalogTable.tsx`
- `src/components/analytics/TopTemplatesTable.tsx`
- `src/components/analytics/CostByTagChart.tsx`
- `src/components/analytics/PlansPerMonthChart.tsx`
- `src/components/analytics/DurationHistogram.tsx`
- `src/components/analytics/SectionUsagePie.tsx`

**Правки:**
- `src/App.tsx` — добавить роут
- `src/pages/Admin.tsx` — карточка-ссылка «📊 Аналитика»

## Acceptance
- Все 6 разделов рендерятся с реальными данными за 90 дней по умолчанию
- Смена фильтров пересчитывает (новый cache-key) и перерисовывает графики
- Кнопка «Экспорт CSV» скачивает корректный многосекционный CSV
- Повторное открытие в течение часа берёт данные из `analytics_cache`
