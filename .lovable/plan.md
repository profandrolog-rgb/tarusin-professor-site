# План Фазы 3

Разбиваю на **3A** (стоимость + лабконтроль) и **3B** (DOCX + памятка пациенту). Согласовываем — затем реализация 3A, потом 3B.

---

## Фаза 3A — Стоимость курса + Лабораторный контроль

### Шаг 1. Миграция БД (одна миграция)

`treatment_catalog` — добавить недостающие (проверю существующие перед миграцией):
- `price_override numeric`, `price_currency text default 'RUB'`
- `price_updated_at timestamptz`, `price_source_note text`

`treatment_plans`:
- `total_cost_estimate numeric`
- `total_cost_breakdown jsonb`
- `show_cost_in_print boolean default false`
- `show_cost_in_memo boolean default false` (на будущее для 3B)
- `lab_control_enabled boolean default false`

`treatment_plan_items`:
- `prn_estimated_doses integer default 10`

Новые таблицы:
- `lab_tests_catalog` (id, name, short_name, unit, ref_range_male, category, notes, price_avg, is_active)
- `treatment_plan_lab_control` (id, plan_id FK cascade, control_point, at_day, test_ids uuid[], custom_tests text[], notes, order_index)

RLS: admin ALL на обе таблицы (паттерн остальных treatment_*).

### Шаг 2. Seed lab_tests_catalog (27 тестов)

Через `supabase--insert` после миграции — INSERT 27 строк по таблице из промта.

### Шаг 3. Утилиты расчёта стоимости

`src/lib/treatment/cost.ts`:
- `parseFrequency(text: string): number` — словарная таблица из 1.2
- `countActiveDays(day_pattern: string | null, duration_days: number): number` — переиспользовать существующий `expandPattern` из `TreatmentPlanPrint`, вынести в общий модуль `src/lib/treatment/dayPattern.ts`
- `calculateItemCost(item, plan): { cost, packs, totalUnits, hasPrice }`
- `calculatePlanCost(items, plan): { total, breakdown: Record<section, number>, missingPrices: Item[] }`
- Включаемые категории: iv_drip, iv_bolus, im, sc, oral_rx, oral_supplement, rectal, topical, nasal, sublingual, peptide
- Исключаемые: procedure, lifestyle

### Шаг 4. UI каталога (`/admin/treatment-catalog`)

Drawer-форма позиции — секция «💰 Стоимость»:
- Поле «Цена за упаковку, ₽» + подсказка «{units_per_pack_label} = X ₽; за единицу = Y ₽»
- Поле «Источник цены / заметка»
- На сохранение с изменением цены — `price_updated_at = now()`

Таблица каталога:
- Колонка «Цена ₽» с цветовой меткой (🟢≤30д / 🟡 30-90 / 🔴 >90 или нет)
- Фильтр «Только без цены»

### Шаг 5. UI редактора листа (`TreatmentPlanEditor`)

Сворачиваемый блок **«💰 Ориентировочная стоимость курса»** перед подвалом:
- Разбивка по группам секций с эмодзи (агрегация: iv_drip+iv_bolus → 💧, im+sc+peptide → 💉, oral_rx → 💊, oral_supplement → 🌿, topical → 🖐, rectal → 🔻, nasal → 👃, sublingual → 👅)
- Итог
- Предупреждение «N позиций без цены ▼» с раскрытием → клик ведёт в каталог
- Дисклеймер про процедуры/расходники
- Чекбокс «Печатать стоимость в листе назначений» → `show_cost_in_print`
- Кэш в `total_cost_estimate`/`total_cost_breakdown` обновляется при каждом save

В `PlanItemRow` для позиций `frequency === 'по требованию'` — поле «Расчётный запас, приёмов» (`prn_estimated_doses`).

### Шаг 6. Печать стоимости (`TreatmentPlanPrint`)

Если `show_cost_in_print` — блок перед подписью с дисклеймером (±15–20%, без процедур/расходников).

### Шаг 7. UI лабконтроля

Новый компонент `LabControlSection.tsx` между секцией lifestyle и подвалом, видна когда `lab_control_enabled = true` (чекбокс в шапке).

Внутри:
- Кнопка «+ Добавить точку контроля»
- Карточки с полями: Срок (combobox + свободный ввод), at_day, мульти-селект из `lab_tests_catalog`, произвольные тесты, заметка
- Drag-handle сортировки (dnd-kit, как в существующих секциях)
- Кнопки-пресеты: «Базовый андрологический», «Расширенный», «Гепатопротекторный», «На фоне TRT», «На фоне SERM» — с зашитыми наборами test short_name → lookup по каталогу при добавлении

### Шаг 8. Печать лабконтроля

В `TreatmentPlanPrint` после блока назначений, перед стоимостью — таблица «КОНТРОЛЬ НА ФОНЕ ТЕРАПИИ» (Срок | Анализы).

### Шаг 9. CSV-export / round-trip

Добавить новые поля каталога (`price_override`, `price_currency`, `price_updated_at`, `price_source_note`) в существующий CSV-экспорт/импорт каталога — отдельные колонки, чтобы сохранить round-trip.

---

## Фаза 3B — DOCX-экспорт + Памятка пациенту

### Шаг 10. DOCX-экспорт

Установить `docx` (npm). Создать `src/lib/treatment/docxExport.ts`:
- Функция `generatePlanDocx(plan, items, labControl, costBreakdown): Blob`
- Структура: Header МАЦ (изображение из существующего бланка) → Title «ЛИСТ НАЗНАЧЕНИЙ № X» → шапка пациента → клиническое обоснование → таблицы секций (№, Препарат, Доза, Способ, Кратность, Дни, Примечание) → календарь курса (для scheduled) → блок лабконтроля → блок lifestyle → блок стоимости (опционально) → подпись
- Page size A4, landscape если `duration_days > 21`
- Кнопка «📄 DOCX» в `TreatmentPlanEditor` рядом с «Печать», «PDF»
- Имя файла: `Лист_назначений_№{course_number}_{Фамилия_Имя}_{ДД-ММ-ГГГГ}.docx`

### Шаг 11. Памятка пациенту

Маршрут `/admin/treatment-plans/:id/memo` — страница `PatientMemoPage.tsx`:
- Использует поля `patient_friendly_name`, `patient_purpose`, `patient_instruction_simple`, `patient_caution`, `patient_visibility`, `patient_group_label` из `treatment_catalog`
- `patient_visibility = 'hidden'` → не попадает
- `patient_visibility = 'grouped'` → объединяются под `patient_group_label`
- Группировка по упрощённым категориям с эмодзи (💧/💉/💊/🔻/🖐/👃); пептиды по фактическому route
- Структура: шапка → вступление (clinical_summary или шаблон) → «Что принимать и как» → «Процедуры» → «Образ жизни» → «Когда сдать анализы» → «Стоимость» (если `show_cost_in_memo`) → «Связь с врачом» → сноска
- Кнопки на странице: «Печать», «Скачать PDF» (window.print → PDF), «Скачать DOCX» (через тот же docx-модуль с упрощённым шаблоном)
- Чекбокс «Включить стоимость в памятку» в форме листа → `show_cost_in_memo`

### Шаг 12. Индикатор готовности памятки

В редакторе листа перед кнопкой «Памятка»:
- 🟢 все позиции с `patient_friendly_name` И `patient_instruction_simple`
- 🟡 часть позиций без полей (замена «Принимать по схеме врача»)
- 🔴 > 50% позиций без полей (но разрешено)
- Клик → диалог со списком позиций без полей + inline-заполнение (PATCH прямо в `treatment_catalog`)

### Шаг 13. Кнопка «📋 Памятка пациенту»

В `TreatmentPlanEditor` рядом с «Печать», «PDF», «DOCX» → переход на `/admin/treatment-plans/:id/memo`.

---

## Технические детали

- Все цены — `numeric` в РФ-рублях, форматирование через `Intl.NumberFormat('ru-RU')`.
- `parseFrequency` — pure function с unit-friendly словарём + регексами.
- Кэш `total_cost_*` пересчитывается клиентом перед save (не БД-функцией — нужно знать каталожные цены, цена в позиции через join).
- Drag-сортировка лабконтроля — `@dnd-kit/sortable` (уже в проекте).
- DOCX — клиентская генерация через `docx`. Шапка МАЦ — png из существующего бланка печати, эмбеддится как `ImageRun`.
- Памятка PDF — печать через `window.print` (отдельный print-CSS), без отдельного PDF-движка.

## Acceptance criteria — все 14 пунктов из промта.

---

**Прошу подтверждения плана.** После «3A — да» начну с миграции и реализации 3A. После «3B — да» — реализация 3B.