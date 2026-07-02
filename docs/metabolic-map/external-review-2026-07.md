# Метаболическая карта пациента — отчёт для внешнего ревью

**Дата:** 2 июля 2026
**Модуль:** `metabolic-map` (клинический)
**Стек:** React 18 + Vite + TypeScript, Supabase (Postgres + Edge Functions Deno), Excalidraw, OpenRouter (Gemini 2.5 Pro).
**Роли пользователей:** `admin`, `editor`, `surgeon`, `parent`.

---

## 1. Резюме

Модуль строит по каждому пациенту «метаболическую карту» — набор из 16 биохимических/эндокринных путей (ось HPA, щитовидная железа, инсулин-глюкоза, липиды, воспаление, кишечная проницаемость, детоксикация I–II фазы, окислительный стресс, тучные клетки/гистамин, нейротрансмиттеры, костно-минеральный обмен и ещё 5 путей-плейсхолдеров), оценивает каждый путь по тяжести (`norm / mild / moderate / severe / insufficient_data / no_data`), рисует граф зависимостей и предлагает точки приложения терапии **строго из существующего каталога лечения**, не выходя за него.

Модуль состоит из трёх слоёв, разделённых по ответственности:

1. **Детерминированный слой.** Правила пути (`pathways.rules`) применяются к лабам, антропометрии и диагнозам пациента; выдают черновой статус пути и подсвечивают конкретные узлы. Ничего не выдумывает и не «интерпретирует».
2. **ИИ-слой.** Edge-функция `metabolic-map-build` вызывает Gemini 2.5 Pro через OpenRouter в режиме строгого JSON, получает на вход весь клинический контекст пациента (в т.ч. жалобы, анамнез, лекарства, диагнозы) и уточняет статусы, находит связи между путями, генерирует профессиональный и «родительский» тексты, а также рекомендации-категории.
3. **Каталог лечения.** Отдельным детерминированным шагом (`treatmentMatch.ts`) для каждого затронутого узла подбираются строки из `treatment_catalog`, где `targets` пересекается с кодами пути/узла/маркера. Ранжирование по `catalog_priority DESC`, затем `evidence_level DESC`. Ничего вне каталога не предлагается.

Все три слоя пишут в отдельные таблицы, не затирая друг друга, и полностью пересчитываются по кнопке.

Врач видит: обзорную «метро»-карту всех путей, детальные Excalidraw-схемы затронутых путей с редактором, ℞-блок с чекбоксом «включить в печать», лист A4 на каждый затронутый путь. Родитель (через отдельную роль `parent`) видит только упрощённые тексты без сырых цифр, если врач так настроил. Для науки есть страница когортной аналитики с депер­сонализированным CSV-экспортом.

---

## 2. Архитектура

```
        ┌─────────────────────────────────────────────────────┐
        │  Источники сырых данных                             │
        │  ─ patient_visits.protocol_data (жалобы, анамнез)   │
        │  ─ lab_results (значения + референсы)               │
        │  ─ anthropometry_measurements (BMI, Z, Tanner)      │
        │  ─ patient_diagnosis_timeline (из PDF через Gemini) │
        │  ─ prescriptions / prescription_items               │
        └───────────────────────┬─────────────────────────────┘
                                │
              ┌─────────────────┴───────────────────┐
              │  Детерминированный агрегатор        │
              │  src/lib/metabolic/aggregator.ts    │
              │  правила из pathways.rules          │
              └─────────────────┬───────────────────┘
                                │  write
                                ▼
                metabolic_maps.aggregate_summary
                map_findings (source_ref.ai != true)
                                │
                                │  read draft + весь контекст
                                ▼
              ┌─────────────────────────────────────┐
              │  Edge Function metabolic-map-build  │
              │  OpenRouter → google/gemini-2.5-pro │
              │  response_format: json_object       │
              └─────────────────┬───────────────────┘
                                │  write
                                ▼
                metabolic_maps.meta.ai
                map_findings (source_ref.ai = true)
                                │
                                │  targets ∩ codes
                                ▼
              ┌─────────────────────────────────────┐
              │  Каталог лечения                    │
              │  src/lib/metabolic/treatmentMatch.ts│
              └─────────────────┬───────────────────┘
                                │  write
                                ▼
                        map_recommendations
                                │
        ┌───────────────────────┼──────────────────────────────┐
        ▼                       ▼                              ▼
  AdminPatientMetabolicMap  ParentMetabolicMap    AdminMetabolicCohort
  (врач: полный контроль)   (родитель: упрощённо)  (научная аналитика)
  + AdminPatientMetabolicMapPrint (A4)
  + MetabolicMapMiniCard (плашка в кабинете)
```

---

## 3. Модель данных

Все таблицы созданы в 9 миграциях `20260702*` (см. `supabase/migrations/`). RLS включён везде, `GRANT`-ы прописаны в тех же миграциях.

| Таблица | Назначение | Ключевое |
|---|---|---|
| `pathways` | Справочник 16 путей | `slug`, `name`, `nodes` (JSONB c id/label/kind), `edges`, `rules`, `svg_scene`, `is_active` |
| `pathway_texts` | Шаблоны текстов регистров | `pathway_id`, `severity`, `text_pro`, `text_plain`, `recommendations` |
| `metabolic_maps` | Карта пациента (1:1) | `patient_id`, `source_visit_id`, `aggregate_summary` (JSONB), `meta` (в т.ч. `meta.ai`) |
| `map_findings` | Атомарные находки | `map_id`, `pathway_id`, `node_id`, `severity` (`info/warn/critical`), `source_ref` (JSONB, `ai: true` для ИИ-строк) |
| `map_recommendations` | Точки приложения из каталога | `pathway_id`, `finding_ids[]`, `catalog_id`, `evidence_level`, `age_warning`, `contra_warning`, `include_in_print` |
| `metabolic_map_snapshots` | История для «динамики» | `patient_id`, `visit_id`, `snapshot` (JSONB), `taken_at` |
| `patient_guardians` | Связь пациент ↔ родитель | `patient_id`, `guardian_user_id`, `share_simple_only` |
| `patient_diagnosis_timeline` | Хронология диагнозов из PDF | `patient_id`, `source_date`, `icd10`, `source_type` |
| `treatment_catalog` (расширен) | Точки приложения | `targets` (text[]), `catalog_priority`, `evidence_level`, `age_min_years`, `age_max_years`, `contraindications` |

Роль `parent` добавлена в `app_role` enum. Доступ проверяется через security-definer функцию `has_role` (никаких ролей в `profiles`).

---

## 4. Детерминированный слой (правила)

Файл: `src/lib/metabolic/aggregator.ts` (306 строк).

Правило пути описывается декларативно в `pathways.rules` (JSONB), пример:

```json
{
  "code": "tsh_high",
  "when": { "test_code": "TSH", "op": ">", "value_from_ref": "high" },
  "raises_to": "mild",
  "highlight_nodes": ["thyroid_pituitary_axis"],
  "requires_age_years": { "min": 0, "max": 18 }
}
```

Агрегатор:

1. Для каждого активного пути собирает актуальные значения показателей пациента (последнее измерение до `source_visit_id.visit_date` включительно).
2. Прогоняет правила, повышает `severity` до максимума из сработавших (`norm → mild → moderate → severe`), собирает `matched_markers` и `affected_nodes`.
3. Если ни одного показателя из требуемого списка нет — статус `no_data`; если часть есть, но их не хватает для устойчивого вывода — `insufficient_data`.
4. Пишет сводку в `metabolic_maps.aggregate_summary` и построчно — в `map_findings` (без `source_ref.ai`).

**Наполненность правил.** Из 16 путей 11 имеют реальные пороги и подсветки: `hpa`, `thyroid`, `insulin_glucose`, `lipids`, `inflammation`, `gut_permeability`, `detox_p12`, `oxidative_stress`, `mast_cell_histamine`, `neurotransmitters`, `bone_mineral`. Оставшиеся 5 путей — placeholder-узлы и пустые `rules[]`, ждут клинического наполнения.

**Матчинг каталога** — `src/lib/metabolic/treatmentMatch.ts` (275 строк):

1. Собирает коды для матчинга: `pathway.slug`, `node_id` каждого затронутого узла, `test_code`/`test_name.slug` каждого сработавшего маркера.
2. Ищет строки `treatment_catalog`, у которых `targets && codes` (пересечение массивов).
3. Фильтрует по возрасту пациента (`age_min_years`/`age_max_years`).
4. Сканирует `contraindications`: **не скрывает**, а помечает `contra_warning=true` — врач решает сам.
5. Ранжирует `ORDER BY catalog_priority DESC, evidence_level DESC`.
6. Апсертит в `map_recommendations`; ручные корректировки врача (`include_in_print`) сохраняются между пересчётами по ключу `(pathway_id, catalog_id)`.

---

## 5. ИИ-слой

Edge Function: `supabase/functions/metabolic-map-build/index.ts` (366 строк).

- **Модель по умолчанию:** `google/gemini-2.5-pro` через OpenRouter (можно переопределить в теле запроса).
- **Режим:** `response_format: { type: "json_object" }`, `temperature: 0.2`.
- **Аутентификация:** проверяется JWT из `Authorization: Bearer`, чтения БД — от имени пользователя (RLS активен).
- **Вход модели:**
  - деперсонализированный блок пациента (`sex_hint`, `age_years`) — режим по умолчанию; полное имя добавляется только если врач выключил тумблер;
  - `draft_pathways` из детерминированного слоя;
  - `pathways_catalog` (slug, name, description, `node_ids`) — единственный источник допустимых кодов путей и узлов для модели;
  - все лабы (до 200) с датой/референсами, антропометрия (последние 3), жалобы и анамнез из последних 10 визитов, хронология диагнозов, действующие лекарства.
- **Выход** — единый JSON:

```json
{
  "overall_confidence": 0.0,
  "cross_links": [ { "from": "...", "to": "...", "why": "..." } ],
  "pathways": [{
    "pathway_code": "insulin_glucose",
    "status": "moderate",
    "confidence": 0.7,
    "markers": [{ "code": "HOMA-IR", "value": 3.4, "unit": "", "flag": "high" }],
    "highlights": [{ "node": "insulin_receptor", "state": "moderate" }],
    "links": ["inflammation"],
    "text_pro": "...", "text_plain": "...",
    "recommendations": [{ "kind": "test|nutrition|lifestyle|medication_category|referral", "text": "..." }]
  }]
}
```

- **Гардрейлы (в системном промпте):**
  - не выдумывать значения, каждый вывод обязан ссылаться на конкретный показатель из входа;
  - при нехватке данных — `status: "insufficient_data"`, `confidence ≤ 0.4`;
  - без конкретных доз препаратов вне контекста; только категории;
  - потолок `severity = severe`, не менять пол/возраст/диагнозы.
- **Куда сохраняется.** Полный ответ → `metabolic_maps.meta.ai` (аудит). Из `highlights` формируются AI-`map_findings` с `source_ref.ai = true`; перед вставкой старые AI-строки удаляются, детерминированные (`ai != true`) не трогаются. Это позволяет всегда сравнить «что сказали правила» vs «что сказал ИИ».

---

## 6. Графический слой

- **Хранение:** `pathways.svg_scene` — сцена Excalidraw (JSON). У ключевых элементов проставлен `customData.nodeId` — стабильный id узла, к которому цепляются подсветки и ℞-маркеры.
- **Авто-layout:** `src/lib/metabolic/autoLayout.ts` строит простую сцену из `nodes/edges` пути, если врач ещё не нарисовал свою. Используется как fallback, чтобы карта всегда рендерилась.
- **Рендер:** `src/components/metabolic/PathwaySceneSVG.tsx` через `@excalidraw/excalidraw`.`exportToSvg`:
  - клонирует элементы, для элементов с `customData.nodeId` из `highlights: Map<nodeId, severity>` перекрашивает `strokeColor`/`backgroundColor` по палитре `severityColors.ts`;
  - для стрелок/линий с `startBinding`/`endBinding` берёт worst severity концов и повышает `strokeWidth`;
  - поверх наносит зелёный маркер `℞` для узлов из `rxNodes: Set<nodeId>` с подписью из `rxLabelByNode`.
- **Обзорная «метро»-карта** — `MetroOverview.tsx`: узел = путь, цвет = текущий статус пути, линии между связанными путями (из `cross_links` ИИ и статических связей справочника).
- **Редактор** — `PathwayEditor.tsx`: открывает встроенный Excalidraw, сохраняет обратно в `pathways.svg_scene`.
- **Единая легенда** — `SeverityLegend.tsx`. Все цвета — семантические токены в `index.css`, никаких хардкодов в компонентах.

Всё — вектор, печатается чётко в любом размере.

---

## 7. UI и печать

- **Врач** — `src/pages/AdminPatientMetabolicMap.tsx`:
  - запуск черновика (детерминированный), запуск ИИ (тумблер «деперсонализированно» по умолчанию **ON**);
  - обзорная карта, список путей с фильтром «только затронутые», детальные сцены с редактором;
  - `RxBlock.tsx` — сгруппированные по узлу точки приложения из каталога с чекбоксом «Включить в печать»; если узел не покрыт каталогом — явно пишем «в каталоге нет средства для этой точки»;
  - `DynamicsPanel.tsx` — сравнение статусов путей по визитам, ↑/→/↓, таймлайн диагнозов;
  - `GuardianManager.tsx` — привязка родителя по e-mail, тумблер `share_simple_only`.
- **Печать A4** — `src/pages/AdminPatientMetabolicMapPrint.tsx`: обложка + лист на каждый затронутый путь (схема + текст `text_pro` + ℞-блок только с `include_in_print = true`).
- **Родитель** — `src/pages/ParentMetabolicMap.tsx`: только `text_plain`, обзорная карта без цифр, никакого доступа к сырым лабам, если `share_simple_only = true`. Роль `parent` изолирована через `patient_guardians` и `has_role`.
- **Плашка в кабинете** — `MetabolicMapMiniCard.tsx` — сводный статус для быстрого перехода.
- **Когортная аналитика** — `src/pages/AdminMetabolicCohort.tsx`: фильтры (пол, возрастные группы), распределения статусов по путям, топ-показатели, CSV-экспорт **депер­сонализированных агрегатов** (без имён и дат рождения).

---

## 8. Динамика во времени

- `metabolic_map_snapshots` пишется при каждом пересчёте (детерминированном и ИИ), ключ — `(patient_id, visit_id, taken_at)`.
- `DynamicsPanel` строит матрицу «визит × путь», показывает переходы статусов, помечает ухудшения красным, улучшения зелёным.
- Хронология диагнозов берётся из `patient_diagnosis_timeline`, которая наполняется парсером PDF (`parse-medical-pdf`, Gemini Vision), поэтому даты диагнозов приходят из первичных документов.

---

## 9. Безопасность и приватность

- RLS включён на всех новых таблицах; политики опираются на `has_role(auth.uid(), 'admin' | 'editor' | 'surgeon' | 'parent')` и на `patient_guardians` для родителя.
- В ИИ-запрос по умолчанию не уходит ФИО и дата рождения — только `sex_hint` и `age_years`. Тумблер «отправлять деперсонализированно» видим врачу, состояние логируется в `metabolic_maps.meta.ai.deidentified`.
- Родитель с флагом `share_simple_only = true` не видит числовых значений и профессиональных формулировок — только `text_plain` и цветные статусы.
- CSV когорты содержит только агрегаты (число пациентов по статусу × путь), без индивидуальных строк.

---

## 10. Что не хватает / открытые вопросы (главный раздел для ревью)

### 10.1 Клинические

1. **5 из 16 путей — placeholder.** Есть узлы и сцены, но `rules[]` пустые. Нужен клинический эксперт, чтобы дописать пороги и подсветки для оставшихся путей (кандидаты: половые гормоны, метилирование, желчь/ЖКТ-транзит, митохондрии, костный ремоделлинг — точный список согласовать).
2. **Возрастные референсы.** Пороги сейчас в основном «взрослые» или из наиболее частой возрастной группы; для педиатрии (0–18) нужен нормальный слой референсов по возрасту/полу — сейчас частично покрыт `lab_tests_catalog`, но `pathways.rules` этим слоем не пользуется.
3. **Валидация ИИ-вывода.** Нет автотестов на эталонных кейсах, нет метрик качества по путям, нет audit-панели «правила vs ИИ» — расхождения видны только в `map_findings.source_ref.ai`, но не сведены в отчёт. Это одна из первых вещей, которую попросил бы у ревьюера приоритизировать.
4. **Excalidraw-сцены.** Пока для большинства путей — авто-layout: функционально, но визуально бедно. Нужны нарисованные врачом сцены для ключевых путей (HPA, инсулин-глюкоза, детоксикация).
5. **Каталог лечения.** Покрытие `targets` неравномерное — часть узлов остаётся без ℞. Нужен аудит соответствия `targets ↔ node_id` силами клиники (можно построить checklist-страницу «непокрытые узлы»).

### 10.2 Инженерные

6. **Тесты.** Ни unit-тестов агрегатора и `treatmentMatch`, ни интеграционных тестов Edge-функции, ни snapshot-тестов рендера SVG. При изменении правил регрессии ловятся только глазами.
7. **Единицы и синонимы лабов.** Правила читают `test_code`, но лабораторные отчёты приходят с разными названиями; нормализация зависит от `lab_synonyms_queue`, требует ручной модерации. Ошибки нормализации молча уводят путь в `no_data`.
8. **Версионирование правил и сцен.** Изменение `pathways.rules` или `svg_scene` меняет исторические снапшоты постфактум. Нет `rules_version` / `scene_version` в `metabolic_map_snapshots` и `map_findings`.
9. **Логи ИИ-запусков.** Сохраняется только последний ответ (`metabolic_maps.meta.ai`). Нет отдельной `metabolic_ai_runs` со стоимостью, latency, моделью, версией промпта — сложно посчитать OPEX и сравнить модели.
10. **Производительность когорты.** Агрегаты считаются на клиенте по всем `metabolic_maps`. Для >1–2k пациентов нужен серверный rollup (материализованное представление или nightly cron).
11. **i18n.** Все тексты путей, ℞-блоков и печатных листов — только на русском. Инфраструктура i18n в проекте есть (`i18next`), но `pathway_texts` не переведены.
12. **Формализация согласия родителей.** Сейчас врач сам вводит e-mail родителя. Нет flow «приглашение → согласие → доступ» с аудитом, нет отзыва доступа по кнопке.

### 10.3 Продуктовые/юридические

13. **Отказ от ответственности.** На печатном листе и в родительском виде не выведен явный дисклеймер «не медицинская рекомендация, а информационная сводка».
14. **Ретеншен ИИ-ответов.** Не задан срок хранения `meta.ai`; для соответствия локальному регулированию нужно определить политику.

---

## 11. Что просим у ревьюера

1. Валидацию клинических порогов и списка 16 путей (в т.ч. подтвердить последние 5).
2. Оценку системного промпта и гардрейлов ИИ; предложения по метрикам качества.
3. Замечания по модели данных — особенно по разделению `map_findings` (детерминированные vs ИИ) и по `treatment_catalog.targets`.
4. Приоритезацию пунктов раздела 10 — что закрываем в ближайшую итерацию, что можно отложить.

---

## Приложение A. Ключевые файлы

```
src/lib/metabolic/aggregator.ts          — детерминированные правила
src/lib/metabolic/treatmentMatch.ts      — матчинг каталога
src/lib/metabolic/autoLayout.ts          — авто-layout Excalidraw
src/lib/metabolic/severityColors.ts      — палитра тяжести
src/lib/metabolic/texts.ts               — шаблоны текстов

src/components/metabolic/PathwaySceneSVG.tsx  — рендер сцены с подсветками и ℞
src/components/metabolic/PathwayEditor.tsx    — встроенный Excalidraw
src/components/metabolic/MetroOverview.tsx    — обзорная «метро»-карта
src/components/metabolic/RxBlock.tsx          — ℞-блок с чекбоксом печати
src/components/metabolic/DynamicsPanel.tsx    — динамика по визитам
src/components/metabolic/GuardianManager.tsx  — привязка родителя
src/components/metabolic/SeverityLegend.tsx   — легенда
src/components/metabolic/MetabolicMapMiniCard.tsx — плашка в кабинете

src/pages/AdminPatientMetabolicMap.tsx        — главный экран врача
src/pages/AdminPatientMetabolicMapPrint.tsx   — печать A4
src/pages/ParentMetabolicMap.tsx              — упрощённый вид для родителя
src/pages/AdminMetabolicCohort.tsx            — когортная аналитика

supabase/functions/metabolic-map-build/index.ts — ИИ-построение карты
supabase/migrations/20260702*.sql               — 9 миграций модуля
```

## Приложение B. Быстрые ссылки на риски

| Риск | Где проявляется | Митигация |
|---|---|---|
| Модель «додумывает» значения | ИИ-слой | Гардрейлы в промпте + сравнение с детерминированным слоем в БД |
| Правило меняется, история едет | `pathways.rules` | Ввести `rules_version` в снапшоты (см. п. 10.2.8) |
| Родитель видит лишнее | `ParentMetabolicMap` | Флаг `share_simple_only` + RLS по `patient_guardians` |
| Каталог предложил противопоказанное | `treatmentMatch.ts` | `contra_warning=true`, не скрываем — врач видит и решает |
| Утечка ФИО в ИИ | Edge Function | `deidentified` по умолчанию true, логируется в `meta.ai` |
