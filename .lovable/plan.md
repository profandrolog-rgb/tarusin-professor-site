## Цель
Заменить textarea в `ArticleMarkdownEditor` на визуальный WYSIWYG-редактор на TipTap. Markdown из БД должен рендериться как форматированный текст (заголовки, жирный, списки), а маркеры `[[GALLERY: caption="..."]]` — как серые блоки-плейсхолдеры с подписью. При сохранении контент конвертируется обратно в markdown.

## Что делаем

### 1. Зависимости
Установить парсеры markdown ↔ HTML:
- `marked` — markdown → HTML (при загрузке)
- `turndown` — HTML → markdown (при сохранении)
- `turndown-plugin-gfm` — поддержка таблиц/strikethrough

TipTap уже есть в проекте (`@tiptap/react`, `@tiptap/starter-kit` используются в `RichTextEditor.tsx` и блог-редакторе).

### 2. Новый компонент `ArticleWysiwygEditor.tsx`
Заменяет внутренности `ArticleMarkdownEditor` (панель инструментов + textarea). Сохраняем тот же интерфейс `{ value, onChange }`, где `value` — markdown-строка.

Архитектура:
- При монтировании / смене `value` извне: `marked(value)` → HTML → `editor.commands.setContent(html)`. Защита от циклов через флаг "внутреннее обновление".
- При изменениях в редакторе: HTML → `turndown(html)` → `onChange(markdown)`.
- Конвертация маркеров галерей в обе стороны (см. ниже).

### 3. Кастомный TipTap-узел `GalleryPlaceholder`
- Тип: `Node`, `group: 'block'`, `atom: true`, `selectable: true`.
- Атрибут: `caption: string`.
- `renderHTML`: `<div data-gallery-placeholder data-caption="...">…</div>`.
- `parseHTML`: матч по `div[data-gallery-placeholder]`.
- NodeView (React): серый прямоугольник `border-2 border-dashed bg-muted` с иконкой `ImagePlus`, текстом «Галерея: {caption}» и кнопкой-карандашом для редактирования подписи через тот же диалог.

### 4. Преобразование маркеров
**Markdown → HTML (загрузка):** перед `marked()` заменяем регулярку `\[\[GALLERY:\s*caption="([^"]*)"\]\]` на `<div data-gallery-placeholder data-caption="$1"></div>`. TipTap парсит это в узел `GalleryPlaceholder`.

**HTML → Markdown (сохранение):** регистрируем правило в `turndown`:
```
turndownService.addRule('galleryPlaceholder', {
  filter: (node) => node.getAttribute?.('data-gallery-placeholder') !== null,
  replacement: (_, node) => `\n\n[[GALLERY: caption="${node.getAttribute('data-caption')}"]]\n\n`
})
```

### 5. Панель инструментов
Сохраняем все существующие кнопки:
- **Загрузить .docx** — без изменений (mammoth → текст → `onChange`).
- **Форматировать** (✨) — без изменений (вызывает edge-функцию, заменяет `value`).
- **Галерея** (📷) — открывает текущий диалог, при подтверждении вместо вставки строки делает `editor.chain().focus().insertContent({ type: 'galleryPlaceholder', attrs: { caption } }).run()`.

Добавляем базовые WYSIWYG-кнопки (H1/H2/H3, Bold, Italic, маркированный/нумерованный список, цитата, ссылка) — стиль как в `RichTextEditor.tsx`.

Переключатель «Редактор / Предпросмотр» оставляем — в режиме предпросмотра показываем `MarkdownArticle` с актуальным `value` (markdown).

### 6. Файлы
- **Новый**: `src/components/parents/ArticleWysiwygEditor.tsx` — главный компонент.
- **Новый**: `src/components/parents/tiptap/GalleryPlaceholderNode.tsx` — Node + NodeView.
- **Новый**: `src/lib/markdown/galleryMarkers.ts` — `markdownToHtml(md)` / `htmlToMarkdown(html)` с правилами для галерей.
- **Изменён**: `src/components/parents/ArticleMarkdownEditor.tsx` — оборачивает новый компонент (или прямая замена, экспорт остаётся прежним, чтобы не трогать места использования).

### 7. Совместимость
- Внешний API (`value: string` markdown, `onChange(v: string)`) не меняется → `AdminDiseaseArticles` и предпросмотр `MarkdownArticle` работают без изменений.
- БД-формат остаётся markdown с маркерами `[[GALLERY:...]]` — старые статьи и публичная страница `/for-parents/:slug` работают как раньше.

## Технические детали

- `marked` настройка: `{ gfm: true, breaks: false }`.
- `turndown` настройка: `{ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' }` + плагин gfm.
- TipTap extensions: `StarterKit`, `Link`, `Image` (на будущее), `GalleryPlaceholder`.
- Защита от лупа: при `onUpdate` сравнивать новый markdown с последним пропом `value`; обновлять контент редактора при изменении `value` только если он отличается от текущего сериализованного.
- Стили серого блока: `rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/40 p-6 my-4 flex items-center gap-3 text-muted-foreground`.

## Что НЕ делаем
- Не меняем `MarkdownArticle` (публичный рендер) — он по-прежнему получает markdown.
- Не меняем edge-функцию `format-disease-article`.
- Не меняем схему БД.
- Загрузку реальных фото в галерею оставляем на существующий механизм страницы статьи (как раньше).
