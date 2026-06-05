## План

Доработать страницу визита (`AdminPatientVisitDetail.tsx`): объединить кнопки в sticky-панель, добавить навигацию между протоколами, dirty-tracking, fullscreen-предпросмотр и горячую клавишу Ctrl+S.

### 1. Sticky-панель действий

Заменить существующий блок шапки в `AdminPatientVisitDetail.tsx` на новый компонент `VisitActionBar`:

```
[← К журналу] [Открыть протокол ▾] [+ Новый протокол] | [Сохранить ●] [Предпросмотр 👁]
```

- `position: sticky; top: 0; z-index: 50`, белый фон, тень снизу, высота 48px
- На экранах < md показываются только иконки (текст в `title`/Tooltip)
- Разделитель между группами через `flex` + `ml-auto` для правой группы

### 2. Dropdown "Открыть протокол"

Использовать `DropdownMenu` из `@/components/ui/dropdown-menu`. При открытии — запрос:

```ts
supabase.from("patient_visits")
  .select("id, visit_date, protocol_type, diagnosis")
  .eq("patient_id", visit.patient_id)
  .neq("id", visit.id)
  .order("visit_date", { ascending: false })
```

Каждый пункт: `"15.05.2026 — Первичный осмотр — Варикоцеле слева"` (title из `PROTOCOL_TYPE_MAP`). Если пусто — disabled пункт «Нет других протоколов».

### 3. Кнопка "+ Новый протокол"

Просто `<Link to={`/admin/visits/new?patient_id=${visit.patient_id}`}>` — переиспользует существующую страницу `AdminPatientVisitNew`, которая уже принимает `patient_id` из query.

### 4. Dirty-tracking

В `AdminPatientVisitDetail` уже есть `useAutoSave`. Добавить отдельный `isDirty` стейт через сравнение `visit` с baseline-снимком:

```ts
const [baseline, setBaseline] = useState<string>("");
useEffect(() => { if (visit && !baseline) setBaseline(JSON.stringify(serialize(visit))); }, [visit]);
const isDirty = useMemo(() => baseline && JSON.stringify(serialize(visit)) !== baseline, [visit, baseline]);
```

После успешного `handleSave` — обновлять baseline.

UI:
- Кнопка «Сохранить»: при `isDirty` — `variant="default"` + жёлтая точка `●`; иначе `variant="outline"` + disabled. Tooltip соответствующий.
- Под панелью жёлтая полоска `bg-yellow-50 border-yellow-300 text-yellow-900`: «⚠ Есть несохранённые изменения — не забудьте сохранить» (только при `isDirty`).

### 5. Confirm при уходе

- Перехват клика на «К журналу» и на пункты dropdown'а: если `isDirty` → `window.confirm("Есть несохранённые изменения. Уйти без сохранения?")`.
- `beforeunload` listener на закрытие вкладки.

### 6. Hotkey Ctrl+S / Cmd+S

`useEffect` с listener'ом `keydown`: при `(e.ctrlKey||e.metaKey) && e.key === 's'` → `preventDefault()` + `handleSave()`.

### 7. Fullscreen предпросмотр

Новый компонент-обёртка прямо в файле: `Dialog` из `@/components/ui/dialog` с `DialogContent className="max-w-[100vw] w-screen h-screen p-0"`. Внутри:

- Шапка модала: `[🖨 Печать] [✕ Закрыть]` справа сверху, sticky
- Body: `<ProtocolPrintLayout visit={visit} />` (компонент уже существует) — берёт **текущее состояние формы из `visit`**, включая несохранённые
- Печать: `window.print()`. Чтобы печаталось только содержимое модала, добавить класс `print-only-modal` и в существующих CSS `@media print` скрыть всё кроме `.print-only-modal *`. Проще: переиспользовать существующий механизм через временное окно — но требование явное «не новая вкладка», поэтому использовать `@media print { body * { visibility: hidden } .modal-print-root, .modal-print-root * { visibility: visible } .modal-print-root { position: absolute; inset: 0 } }`.

### Технические детали

- Файлы: правка `src/pages/AdminPatientVisitDetail.tsx` (всё уместится без выноса в отдельные файлы; компоненты `VisitActionBar` и `PreviewDialog` — локальные внутри файла или рядом).
- Существующие импорты `Tooltip`, `DropdownMenu`, `Dialog` есть в `src/components/ui`.
- Не трогать `ProtocolPrintLayout`, `ProtocolForm`, схемы и БД.
