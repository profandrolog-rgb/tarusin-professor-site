# Изображения и таблицы из загруженных материалов

Спецификация уже согласована в задании — план фиксирует порядок и точки интеграции.

## Блок 1. БД и хранилище

Миграция `source_materials`:
- `extracted_images jsonb default '[]'` — массив `{objectKey, originalFile, pageOrSlide, index, width, height, mime}`.
- `extracted_tables jsonb default '[]'` — массив `{html, markdown, sourceFile, pageOrSlide, index, caption?}`.
- Обратная совместимость: если поля пусты — старое поведение.

Yandex S3 путь: `{reviewId}/extracted/{sanitizedOriginal}/{i}.{ext}` (тот же бакет `research-materials`).

## Блок 2. Клиентская экстракция (src/lib/materials/)

Новые модули:
- `extractDocx.ts` — jszip → `word/media/*` + `mammoth.convertToHtml` для таблиц. Собирает `{images[], tablesHtml[]}`.
- `extractPptx.ts` — jszip → `ppt/media/*` + попытка разобрать таблицы из `ppt/slides/slide*.xml` (best-effort, ошибки глотаем).
- `extractPdf.ts` — `pdfjs-dist` postраничный обход операторов `OPS.paintImageXObject`, экспорт растра canvas → blob. Фильтр: `<200×200` или однотонное (проверка stdev по сэмплу пикселей).
- `filterImage.ts` — общий фильтр (мин.размер + однотонность).
- `uploadExtracted.ts` — presigned PUT в Yandex через существующий `research-materials-upload-url` (или расширить).

Вызов из `MaterialsPanel.handleUpload`: после загрузки исходника — запуск extractor'а по MIME, PUT картинок, PATCH `source_materials.extracted_images/tables`. Показать в карточке материала: «Извлечено изображений: N», «Таблиц: M», сетка миниатюр (сворачиваемая), список таблиц с превью.

## Блок 3. Edge Function `research-image-publish` (уже существует)

Проверить/дополнить: принимает `{reviewId, objectKey}`, скачивает из приватного Яндекса по presigned GET, льёт в `article-images` Supabase Storage, возвращает `{publicUrl, fileName}`. Уже создана в предыдущей итерации — сверить контракт с новой вкладкой галереи.

## Блок 4. Вкладка «Из материалов обзора» в PlaceholderGallery/GalleryEditorDialog

- Новый проп `sourceMaterials?: {reviewId, images: ExtractedImage[]}`.
- Tabs: «Загрузить с диска» | «Из материалов обзора».
- Вторая вкладка: сетка с чекбоксами, подпись `стр. N из filename`, кнопка «Взять выбранные (K)».
- По нажатию — параллельные вызовы `research-image-publish`, скачивание в стандартный флоу диалога (формат/кадрирование/подпись) как если бы пользователь только что загрузил их.

Передача пропа: `AdminResearchReviewEditor` собирает `extracted_images` со всех `source_materials` обзора → прокидывает в `RichTextEditor` → `GalleryPlaceholderNode` → `GalleryEditorDialog`.

## Блок 5. Таблицы в анализе

- `research-materials-analyze` для DOCX: перейти с `mammoth.extractRawText` на `convertToHtml`, HTML→markdown через turndown с GFM tables. Сохранять оригинальный HTML в `extracted_tables`.
- Для PDF — обновить system-промпт: «Таблицы возвращай строго в GitHub-flavored markdown, не пересказывай».
- Firecrawl уже отдаёт markdown с таблицами — проверить, что пайплайн их не режет (обзор нормализации в `research-review-orchestrate`).
- В `MaterialsPanel` — раздел «Найденные таблицы» с превью (первые 3 строки) и кнопкой «Вставить в текст обзора» → команда TipTap в позицию курсора.

## Блок 6. Таблицы в TipTap

`RichTextEditor`:
- Установить `@tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header`.
- Расширения: `Table.configure({ resizable: true })`, `TableRow`, `TableHeader`, `TableCell`.
- Панель: dropdown «Таблица» → «Вставить 3×3», «+ строка», «− строка», «+ столбец», «− столбец», «Удалить».
- Стили таблиц уже покрыты `.article-markdown table` (см. memory) — добавить те же классы к prose-контейнеру.

Проверка сквозного пути:
- Сохранение HTML `<table>` в `research_reviews.content` — OK (jsonb-string).
- Публичная страница `ResearchContent` — рендер prose уже поддерживает таблицы.
- Экспорт DOCX/PDF (`article-export` функция) — сверить рендер таблиц.
- Консилиум HTML↔MD через `galleryMarkers` + turndown/marked с GFM — уже с protectSourceMarkers; убедиться, что таблицы не ломают маркеры.

## Технические детали

Зависимости: `jszip` (есть), `mammoth` (есть), `pdfjs-dist` (проверить), `turndown` + `turndown-plugin-gfm` (проверить), `@tiptap/extension-table*` (нет — установить).

Порядок реализации:
1. Миграция БД + грант.
2. `pdfjs-dist` worker импорт (Vite).
3. Модули `src/lib/materials/*`.
4. Обновление `MaterialsPanel` (UI извлечения).
5. Расширение `GalleryEditorDialog` вкладкой.
6. Проброс `sourceMaterials` через редактор.
7. Таблицы в TipTap.
8. Обновление `research-materials-analyze` (mammoth HTML, prompt для PDF).
9. Проверка экспорта.

## Вне рамок

- OCR отсканированных PDF (сейчас Gemini уже видит их).
- Диаграммы PPTX как SVG (только растровые media).
- Векторные PDF-иллюстрации (только XObject-растры).
