# План: научные обзоры — 6 блоков

Задача крупная и затрагивает БД, edge-функции, редактор, оркестратор, публичную страницу и защиту маркеров. Ниже — что и в каком порядке делаю, с указанием файлов и переиспользуемых механизмов. Перед реализацией разберу существующий код (`AdminArticleOrchestrator.tsx`, `PlaceholderGallery.tsx`, `galleryMarkers.ts`, `research-materials-refine`), чтобы ничего не дублировать.

## Порядок работы

### Блок 0 — очистка редактора обзоров
- В `AdminResearchReviewEditor.tsx` убрать: импорт/вызовы `GalleryEditorDialog`, `PickFromMaterialsDialog`, кнопку загрузки галереи, выбор пропорций, плашку миниатюр/счётчика.
- Удалить файлы `src/components/gallery/GalleryEditorDialog.tsx` и `PickFromMaterialsDialog` (если он ещё жив), поле `gallery_images` — миграция `ALTER TABLE research_reviews DROP COLUMN gallery_images`.
- Узел TipTap `GalleryPlaceholderNode` **упростить в редакторе обзоров** до простой плашки с подписью (без миниатюр/кнопки редактирования). Для статей узел остаётся прежним — параметризую через опцию `variant: "editable" | "marker-only"`.
- Проверить: статьи (`ArticleMarkdownEditor`, `MarkdownArticle`, `PlaceholderGallery`) не меняются.

### Блок 1 — жизненный цикл
- Миграция: `ALTER TABLE research_reviews ADD COLUMN workflow_state text NOT NULL DEFAULT 'draft'` + CHECK на 5 значений. `status` не трогаю.
- В редакторе — панель состояний со стрелками переходов, кнопки: «В работу», «На научное редактирование», «На консилиум», «Опубликовать», «Вернуть на доработку», «Снять с публикации», «Снять с консилиума».
- `consilium` → редактор read-only через `editable={false}` у TipTap + disable у полей.
- Автопереход `writing → editing` — по завершении оркестратора в `AdminResearchReviewEditor.tsx` (там уже есть polling `orchestrator_state`).
- В `AdminResearchReviews.tsx` — бейдж состояния (`Badge` с цветами по состоянию).

### Блок 2 — режим голоса
- Миграция: `ALTER TABLE research_reviews ADD COLUMN voice_mode text NOT NULL DEFAULT 'impersonal'` и `ALTER TABLE disease_articles/blog_posts/research_articles ADD COLUMN voice_mode text NOT NULL DEFAULT 'authorial'` (или в общей таблице, где хранятся статьи).
- В редакторе обзора — Select с тремя значениями и подсказкой.
- Собрать общий модуль `supabase/functions/_shared/voicePrompts.ts` с текстовыми блоками для каждого режима.
- Внедрить в: `research-review-orchestrate` (write/refine стадии), `research-materials-refine`, будущий `research-review-add-section`, а также в консилиум (передаётся в `state.recheck.voiceMode`, оркестратор статей читает и добавляет в промпты ревью/консолидации).

### Блок 3 — «Найти и добавить раздел»
- Новый компонент `src/components/research/AddSectionDialog.tsx`: input аспекта → шаг 1 (поиск) → чекбокс-список источников → шаг 2 (написание) → предпросмотр с редактируемым заголовком и селектом позиции вставки.
- Новая edge-функция `research-add-section` с двумя режимами: `mode: "search"` (использует `RESEARCH_SEARCH_MODEL`, возвращает `[{title, abstract, url, doi, ...}]`) и `mode: "write"` (использует `RESEARCH_WRITE_MODEL`, принимает выбранные источники + текущий `maxMarker`, возвращает `{ headingHtml, bodyHtml, newSources }`). Разбиение на два вызова — против таймаута.
- В редакторе: считать max `[M#]` через `collectMarkers` из `src/lib/research/markers.ts`, передать в write; после вставки — merge `references_list` с `verified: false`.
- Позиция вставки: `endOfDocument` или `afterHeadingId` — реализую поиск `<h2/h3>` в HTML и вставку сразу после закрывающего тега соответствующей секции.

### Блок 4 — консилиум через оркестратор статей
- В `AdminArticleOrchestrator.tsx`:
  - Расширить тип `incoming.recheck.kind` значением `"research_reviews"`.
  - В `loadForRecheck` — ветка: SELECT из `research_reviews`, `htmlToMarkdown(content)`.
  - Плашка сверху «Научный обзор: …».
  - Кнопка «Разместить» подменяется на «Принять и вернуть в научный редактор»: `markdownToHtml` → UPDATE `research_reviews.content` + `workflow_state='editing'` + `navigate("/admin/research-reviews/:id")`.
  - Пробросить `voice_mode` в промпты всех стадий ревью/консолидации.
- В редакторе обзора — кнопка «Отправить на консилиум»: UPDATE `workflow_state='consilium'` + `navigate("/admin/orchestrator", { state: { recheck: { id, kind: "research_reviews", title } } })`.

- **Защита маркеров** — критично, реализую в отдельном модуле `src/lib/research/markerProtection.ts`:
  - `escapeMarkersForRoundtrip(html)` / `unescapeMarkers(md)` — заменяют `[M#]` и `[[GALLERY:...]]` на инлайновые токены-плейсхолдеры (`⟦MARK:m1⟧`, `⟦GAL:0⟧`) перед `htmlToMarkdown`/`markdownToHtml` и обратно. Токены не содержат символов, которые markdown/turndown стали бы экранировать.
  - Жёсткие инструкции в промптах ревью/консолидации/переписывания: не трогать `[M#]` и `[[GALLERY:...]]`.
  - На уровне отдельной правки (в `FactCheckFixList` или где обрабатываются `original/suggested`): сравнить наборы маркеров. Если в `original` были маркеры, а в `suggested` их нет — дописать в конец и пометить карточку `restored`. Если правка удалена целиком / слияние — красная карточка + три действия (`Вернуть маркер`, `Принять без маркера`, `Отклонить`).
  - Метки галерей — блочные: восстановление возможно только на прежнее место, а не в конец предложения. Хранить якорь (индекс параграфа) в escape-фазе, вставлять обратно перед применением.
  - Финальная сверка перед `Принять и вернуть`: `collectMarkers(before)` vs `collectMarkers(after)`, диалог со сводкой пропаж + «Всё равно применить» / «Вернуться к правкам».
  - Обновлять и `content`, и `content_with_markers` одной транзакцией.

### Блок 5 — галереи в обзорах
- **Обобщение `PlaceholderGallery`.** Ввести пропсы:
  ```
  ownerTable: string   // "disease_articles" | "research_reviews"
  ownerIdColumn: string // "id"
  contentColumn: string // "article_content" | "content"
  ownerId: string
  ownerSlug: string
  ```
  Все внутренние SELECT/UPDATE, автосохранение, определение типа, кадрирование, DnD, Ctrl+V — не трогать. Совместимость статей: у `MarkdownArticle` вызов остаётся с прежним поведением по умолчанию.
- **Кнопка «Место для галереи» в редакторе обзоров** — вставка `[[GALLERY: caption="..."]]` через TipTap-команду **в позицию курсора** (в отличие от `insertGalleryMarker` статьи, который дописывает в конец). Валидация: подпись непустая и уникальна — сканирую текущий `content` через `GALLERY_RE`, если совпадение — toast с объяснением, не вставляю.
- **Публичная страница `ResearchContent.tsx`** — переписать по образцу `MarkdownArticle`:
  - `splitContentByGallery(html)` → сегменты
  - `text` → sanitize + `dangerouslySetInnerHTML`
  - `gallery` с файлами → `<ImageGallery>`, для админа под ней `<PlaceholderGallery ownerTable="research_reviews" contentColumn="content" .../>` для дополнения
  - `gallery` без файлов + админ → `<PlaceholderGallery>`
  - `gallery` без файлов + не админ → скрыть
  - Проверить, что `upsertGalleryEntriesInContent` корректно работает с HTML-контентом (маркеры и `<div data-gallery-placeholder>` там уже поддерживаются).

### Блок 6 — сохранность работы
- Автосохранение через существующий `useDebouncedAutoSave` (или `useAutoSave`), задержка 2–3с, статус «сохранено / есть несохранённые».
- `beforeunload` — по dirty-флагу.
- Undo — использовать встроенный TipTap history (`editor.commands.undo()`) + кнопка в панели.
- Черновик в `localStorage` с ключом `research-review-draft-<id>` восстанавливается на монтировании, если `updated_at` в БД старше локального — предложить восстановить.

## Что переиспользую (не дублирую)
- `AdminArticleOrchestrator.loadForRecheck` — расширяю.
- `src/lib/research/markers.ts` — `collectMarkers`, `countMarkers`.
- `src/lib/markdown/galleryMarkers.ts` — весь парсинг, `upsertGalleryEntriesInContent`, `htmlToMarkdown`, `markdownToHtml`.
- `PlaceholderGallery` — обобщаю пропсами, всю внутреннюю логику оставляю.
- `ImageGallery`, `GalleryPlaceholderNode` (упрощаю через `variant`).
- `useDebouncedAutoSave`, `Badge`, `FactCheckFixList`, `OrchestratorProgress`.
- Edge-функции ревью/консолидации — добавляю в промпты защиту маркеров и `voice_mode`, не переписываю.

## Порядок исполнения
1. Миграция БД (workflow_state, voice_mode, drop gallery_images) — одним запросом.
2. Блок 0 (очистка редактора и узла).
3. Блок 1 (жизненный цикл, бейджи, read-only, автопереход).
4. Блок 2 (voice_mode + shared prompts + прокидывание).
5. Блок 5а (обобщение `PlaceholderGallery` пропсами, «Место для галереи» в редакторе, `ResearchContent`).
6. Блок 3 (`research-add-section` + `AddSectionDialog`).
7. Блок 4 (консилиум, защита маркеров, возврат).
8. Блок 6 (автосохранение, beforeunload, undo, localStorage).
9. Прогон сквозного сценария глазами: черновик → написание → раздел → метка → консилиум → возврат → публикация.

## Технические заметки
- Миграции по обзорам делаю отдельным вызовом до кода (тип `Database` регенерируется после аппрува).
- Защита маркеров при HTML↔MD: пробую сначала на живых образцах, если turndown коверкает — включаю escape-токены.
- Не трогаю: `MarkdownArticle`, `ArticleMarkdownEditor`, `ImageGallery`, edge-функции статей.

Оцениваю объём: ~1 миграция, 2 новых edge-функции (`research-add-section`, обновление `research-review-orchestrate`), 1 новый модуль защиты маркеров, 1 новый диалог, обобщение `PlaceholderGallery`, крупный рефакторинг `AdminResearchReviewEditor.tsx` и `AdminArticleOrchestrator.tsx`. Пойду блоками, после каждого сверяюсь с типами и билдом.

Одобряете план — начинаю с миграции и Блока 0.
