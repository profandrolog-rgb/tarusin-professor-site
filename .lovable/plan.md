## Фаза 2C — cleanup + инфра под Фазу 3

### Замечание о схеме БД (важно)
Проверил БД:
- В `treatment_plans` **нет** колонки `course_number` — пункт 2.1 требует миграцию (вы писали «уже есть в модели», но фактически нет).
- `treatment_plan_versions` существует, но колонка называется `snapshot` (не `snapshot_jsonb`) — буду использовать существующее имя.

### Миграции (один файл)
1. `ALTER TABLE treatment_plans ADD COLUMN course_number int` (nullable, без unique-constraint).
2. Бэкфилл существующих листов: `course_number = row_number() OVER (PARTITION BY patient_id ORDER BY issued_at, created_at)`.
3. Триггер `BEFORE INSERT` на `treatment_plans`: если `course_number IS NULL` → `COALESCE(MAX+1, 1)` по `patient_id`.
4. Триггер `AFTER UPDATE` на `treatment_plans` для записи в `treatment_plan_versions`: пишем версию только когда `OLD.status='issued'` (любое сохранение после выпуска) или при переходе `draft→issued`. `version_no = COALESCE(MAX+1, 1)` per `plan_id`. `snapshot` = `jsonb_build_object('plan', row_to_json(NEW), 'items', (SELECT json_agg(i) FROM treatment_plan_items i WHERE plan_id=NEW.id))`.

### 1.1 Контекстное меню дня (Gantt header)
- `GanttHeader` → добавить per-day `⋮` Popover с пунктами: Copy day X to → submenu (1..N), Clear day X, Set all to every day, Shift course by N.
- Пропсы: список всех items + `onBulkPatternChange(updater)` колбэк из редактора.
- Парсинг/сериализация через существующий `dayPattern.ts` (`expandDays`, `compactDays`, `shiftDays`).

### 1.2 Печать Gantt-календаря
- В `TreatmentPlanPrint.tsx`: если `plan.mode==='scheduled'` → блок «КАЛЕНДАРЬ КУРСА» (таблица позиции × дни, заливка `#888` для активных дней).
- Compact mode при > 30 items (6pt / 12px колонки), иначе 8pt.
- `@page { size: A4 landscape }` инжектится в `<style>`, если `duration_days > 21`.

### 1.3 Импорт из medications (только oral_rx)
- Новый компонент `MedicationImportDialog.tsx` в `src/components/treatment/`.
- В drawer `TreatmentCatalog.tsx` — кнопка видна только если `category==='oral_rx'`.
- Autocomplete по `medications` (поиск по `latin_name`, `trade_name`).
- Diff-подтверждение: для каждого поля показать «текущее → новое», галочка применить (по умолчанию off если поле уже заполнено).

### 1.4 Дублирование на другого пациента
- Новый компонент `DuplicatePlanDialog.tsx`: PatientPicker (autocomplete по `patients` по `full_name`).
- В `TreatmentPlans.tsx` — пункт в action menu строки.
- Логика: insert новый plan (course_number триггер посчитает сам), затем batch-insert items, redirect в `/admin/treatment-plans/:newId`.

### 1.5 Верификация CSV
- Прочитаю `TreatmentCatalog.tsx` и `CsvImportDialog.tsx`, добью недостающее по чек-листу (preview 10, strategy Skip/Update/Create, детальный лог ошибок). Если всё на месте — отмечу в финальном сообщении.

### 2.1 course_number в UI
- Заголовок `TreatmentPlanEditor`: «Лист назначений № N для …».
- Печатная форма: «ЛИСТ НАЗНАЧЕНИЙ № N» + номер в имени файла print.
- Колонка «№» в таблице `TreatmentPlans.tsx`.
- Editable input в редакторе.

### 2.2 История версий (UI)
- Новый компонент `PlanVersionHistoryDrawer.tsx`: список версий с кратким diff-резюме (сравнение количества items по секциям между соседними версиями).
- Кнопка «🕓 История» в шапке редактора (только при `status==='issued'`).
- Read-only viewer выбранной версии (рендер из `snapshot.items` в том же layout, disabled).
- «Восстановить» → insert new plan (status=draft) + items из snapshot, redirect.

### Файлы
**Создать:** migration sql; `MedicationImportDialog.tsx`, `DuplicatePlanDialog.tsx`, `PlanVersionHistoryDrawer.tsx`, `DayContextMenu.tsx` (для Gantt header), `RestoreVersionConfirm.tsx`.
**Изменить:** `GanttStrip.tsx` (header принимает items + handlers), `TreatmentPlanEditor.tsx`, `TreatmentPlans.tsx`, `TreatmentPlanPrint.tsx`, `TreatmentCatalog.tsx`, `CsvImportDialog.tsx` (если нужно), `dayPattern.ts` (если нужны новые хелперы).

### Acceptance
Соответствует списку в промте. Регрессии не ожидаю — все правки аддитивные.

---

Подтвердите план — запускаю миграцию первым шагом, затем UI.