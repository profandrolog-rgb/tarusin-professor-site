## Источник
**OOREP `publicum`** (`/tmp/oorep/oorep.sql` уже скачан, 44 МБ распакованного SQL).
- Английская выборка на базе оригинального Кента, лицензия GPL v3, общественное достояние по содержанию.
- `kent-de` отбрасываем (немецкий, не нужен).
- В дампе ~74 667 рубрик `publicum`, ~735 тыс. записей `rubricremedy` с градациями 1/2/3, 36 глав (0–35).

## Расхождения схем

| OOREP | Наша БД |
|---|---|
| `chapter (abbrev,id,textt)` — **пуст в дампе** | `repertory_chapters (id, ord, name_en, name_ru)` |
| `rubric (id, mother, ismother, chapterid, fullpath, path, textt)` — иерархия плоская, дерево через `fullpath` | `repertory_rubrics (id, chapter_id, parent_id, name, kent_page)` |
| `remedy (id, nameabbrev, namelong, namealt[])` | `repertory_remedies (id, slug, name_latin, abbrev, name_ru)` |
| `rubricremedy (rubricid, remedyid, weight, chapterid)` | `repertory_rubric_remedies (rubric_id, remedy_id, grade)` |

Иерархию строим из `fullpath`: разбиваем по `, ` → первый сегмент = глава, остаток = путь рубрик, для каждого префикса гарантируем существование родительской рубрики.

## Шаги импорта (одноразовый скрипт через psql, без UI)

1. **Подготовка staging-таблиц** (миграция):
   - `_import_oorep_rubric (oorep_id int PK, chapter_idx int, fullpath text)`
   - `_import_oorep_remedy (oorep_id int PK, nameabbrev text, namelong text)`
   - `_import_oorep_rr (oorep_rubric_id int, oorep_remedy_id int, weight int)`
   - `_import_oorep_remedy_map (oorep_id int PK, remedy_id uuid)`
   - `_import_oorep_rubric_map (oorep_id int PK, rubric_id uuid)`

2. **Загрузка дампа** (локально через psql `\copy`):
   - Из `oorep.sql` вытаскиваем три COPY-блока (`remedy`, `rubric`, `rubricremedy`) фильтром только по `publicum` → три TSV-файла.
   - `\copy` каждой в соответствующую staging-таблицу.

3. **Главы** — для всех 36 chapter_idx, встречающихся в данных:
   - Берём `lower(first_segment(fullpath))` как `name_en`, ищем `repertory_chapters.name_en ILIKE`, если нет — `INSERT` с `ord = MAX+1`, `name_ru = name_en` (переведём позже вручную).
   - Сохраняем mapping `chapter_idx → chapters.id`.

4. **Рубрики** (батчами через рекурсивный CTE):
   - Для каждого `fullpath` генерируем все префиксы (`p1`, `p1, p2`, `p1, p2, p3`, …) с глубиной.
   - Сначала вставляем все уровни 1 (только chapter, нет parent), затем 2, и т.д. По каждому уровню:
     - сопоставляем существующие рубрики `WHERE chapter_id=? AND parent_id IS NOT DISTINCT FROM ? AND lower(name)=lower(?)` — если есть, переиспользуем (это и есть «не дублировать андрологические»);
     - если нет — `INSERT` и сохраняем id в `_import_oorep_rubric_map` для финального уровня.
   - Батчи по 5 000 строк в `INSERT … ON CONFLICT DO NOTHING` + `RETURNING`.

5. **Препараты**:
   - Для каждого OOREP-remedy: `slug = lower(nameabbrev)`. Если `repertory_remedies.slug = ?` уже есть — переиспользуем. Иначе `INSERT (slug, name_latin=namelong, abbrev=nameabbrev)`.
   - Mapping в `_import_oorep_remedy_map`.

6. **Связи rubric_remedy** (самый большой, батчами по 10 000):
   - JOIN staging-связей через оба mapping → `INSERT INTO repertory_rubric_remedies (rubric_id, remedy_id, grade) … ON CONFLICT (rubric_id, remedy_id) DO UPDATE SET grade = GREATEST(repertory_rubric_remedies.grade, EXCLUDED.grade)`.
   - Это автоматически защищает 389 существующих андрологических связей (если совпадут — оставится более высокая градация; гарантированно ничего не удалится).
   - Нужен уникальный индекс `(rubric_id, remedy_id)` — проверить, есть ли он; если нет, добавить миграцией перед импортом.

7. **Верификация** (psql-запросы, отчёт в чат):
   - Counts: рубрик / препаратов / связей до и после.
   - Sample-rubric «Mind; ANXIETY» → ожидаем десятки препаратов с распределением grade 1/2/3 как в оригинале.
   - Sample-rubric «Generalities; cold, agg.» — аналогично.
   - Проверка, что все 389 исходных андрологических связей на месте: `SELECT count(*) FROM repertory_rubric_remedies WHERE created_at < <ts_перед_импортом>`.

8. **Очистка**:
   - `DROP TABLE _import_oorep_*` после успеха.
   - Дамп `/tmp/oorep/*` не коммитим.

## Технические детали

- Импорт идёт через `psql` в exec-инструменте (быстрее edge-функции и без таймаутов).
- Каждый батч — отдельный `BEGIN; … COMMIT;`, чтобы рост WAL не съел память.
- Прогресс пишу в stdout (виден в логе инструмента): `chapters: 36/36`, `rubrics: 12 000/74 667`, и т.д.
- Уникальный индекс `(chapter_id, parent_id, lower(name))` на `repertory_rubrics` — нужен, чтобы дедуп работал; добавлю миграцией если нет.
- Уникальный индекс `(rubric_id, remedy_id)` на `repertory_rubric_remedies` — нужен для `ON CONFLICT`.
- Поле `kent_page` в наших рубриках в OOREP отсутствует — оставим `NULL` для импортируемых.

## Откат

Все импортируемые рубрики и препараты можно отличить от исходных андрологических по `created_at >= <ts_перед_импортом>`. На случай отката оставлю SQL-скрипт удаления только импортированных строк (исходные 389 связей не пострадают, т.к. их `created_at` раньше).

## Что НЕ делаем

- Не создаём новые таблицы вместо существующих.
- Не трогаем UI `/admin/repertory` — структура та же, объёмы вырастут, существующая виртуализация ScrollArea справится (если будут лаги — отдельная задача).
- Не переводим `name_ru` рубрик автоматически — это отдельный шаг (тысячи строк, нужен либо ручной перевод, либо отдельный AI-проход).
