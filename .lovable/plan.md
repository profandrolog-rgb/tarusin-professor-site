# Система протоколов пациентов — план интеграции

В проекте уже есть `patients`, `patient_cards`, `prescriptions`, `operations_journal`, `consultation_rounds`. Не создаём дубликат «новой системы», а добавляем **модуль визитов с 9 типами протоколов** поверх существующих таблиц.

## Решения по архитектуре

- Используем существующую таблицу `patients`. Добавим в неё недостающие поля из ТЗ: `history_number` (уникальный, auto-increment), `last_name`, `first_name`, `patronymic`, `parent_name`. Старое поле `full_name` оставляем (заполняем триггером из частей ФИО для совместимости).
- Создаём **одну новую таблицу** `patient_visits` с `protocol_type` + `protocol_data JSONB` — это покрывает все 9 типов без 9 отдельных таблиц.
- Создаём справочник `icd10_codes` (минимальный, с автодополнением по Q53, N45, N43, N40, N35, I86.1, Q54).
- Доступ: только `admin` и `surgeon` (как в `operations_journal`). RLS PERMISSIVE.
- Маршруты в админке: `/admin/visits`, `/admin/visits/new`, `/admin/visits/:id`, `/admin/visits/:id/print`. Список пациентов — переиспользуем `/admin/patient-cards` (расширим карточку историей визитов).
- PDF/печать: `window.print()` + print-CSS (как сделано для рецептов). Шапка/подпись профессора — как в `PrescriptionPrint`.
- Шаблоны умных дефолтов (соматический статус, локальный статус, послеоп-блоки) храним в TS-константах, не в БД.

## Этапы (предлагаю реализовать по одному, с подтверждением после каждого)

**Этап 1 — Фундамент (этот PR):**
1. Миграция: расширить `patients` (части ФИО, `history_number`, `parent_name`), создать `patient_visits`, `icd10_codes` + GRANTs + RLS (admin/surgeon).
2. Сидинг МКБ-10 (15-20 кодов из ТЗ).
3. Маршруты-каркасы и пункт «Журнал визитов» в `Admin.tsx` и `AppSidebar`.
4. Страница `/admin/visits` — список визитов с фильтрами по пациенту/типу/дате.
5. Страница `/admin/visits/new` — селектор пациента (тот же `PatientSelect`) + сетка из 9 карточек типов протоколов (без самих форм).

**Этап 2 — Базовые протоколы (3 простейших):**
- `ultrashort`, `postop_day3`, `postop_day7` — короткие формы, общие компоненты `PatientHeader`, `Recommendations`, `Diagnosis`, `PostOpStatus`. Печатная версия + сохранение.

**Этап 3 — Соматика + локальный статус:**
- Компоненты `SomaticStatus`, `LocalStatusAndrology`, `SexualFormula`. Протоколы `primary_short`, `repeat_with_labs`.

**Этап 4 — УЗИ-блоки:**
- `UZI_Reproductive`, `UZI_Urinary`. Протоколы `uzi_reproductive`, `uzi_urinary`, `dynamic_with_uzi`, `repeat_with_uzi`.

**Этап 5 — Доводка:**
- Авто-сохранение черновиков (localStorage, 30 сек), `LabResults` с автодополнением, дашборд-виджеты на `/admin`, autocomplete МКБ-10.

## Что сделаем прямо сейчас

Только **Этап 1**. После твоего «ок» по каркасу пойдём по этапам 2-5 по очереди — иначе один ответ выйдет на тысячи строк и риск ошибок резко вырастёт.

## Технические детали

- Таблица `patient_visits`: `id`, `patient_id` (FK→patients), `visit_date date default current_date`, `protocol_type text`, `protocol_data jsonb default '{}'`, `diagnosis text`, `icd_code text`, `next_visit_date date`, `created_by uuid`, timestamps. Индексы по `patient_id`, `visit_date desc`, `protocol_type`.
- `history_number` в `patients`: `text unique`, генерация — RPC `next_history_number()` (max+1, формат «000001»). Существующим записям проставим номера в той же миграции.
- ENUM `protocol_type` НЕ делаем — оставляем `text` + CHECK по списку, чтобы можно было гибко добавлять.
- Sidebar: пункт «Журнал визитов» виден ролям `admin` и `surgeon`.

## Что НЕ делаем
- Не дублируем `patients`/`visits` отдельной схемой из ТЗ — переиспользуем существующие.
- Не меняем дизайн-систему на тёмную «medical» из ТЗ — оставляем текущие токены проекта (правило памяти).
- Аутентификация уже есть, шаг «no auth for MVP» из ТЗ игнорируем.
