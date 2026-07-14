# План: инструмент аннотирования изображений (стрелки/овалы/подписи)

## Куда встраиваю
Основная точка интеграции — **атлас УЗИ-снимков** (`AdminAcupointsAtlas` / связанный поток загрузки медиа в `disease-media` bucket, используемый и для статей, и для материалов для родителей, и для галерей). Это самый естественный кандидат: там уже есть галерея загруженных изображений и клинический контекст (атлас — прямой аналог "медицинского разметочного инструмента").

Дополнительно точка вызова редактора будет добавлена в `BentoImageEditor` (материалы для родителей / статьи), чтобы одно изображение можно было пометить с разными `label` для разных целей ("для атласа", "для сайта", "для книги").

Просмотрщик `<ImageWithAnnotations>` подключается к любой карточке, которая уже рендерит изображение из `disease-media` (Bento-карточки, галерея статей, атлас) — как опциональный оверлей.

## База данных
Новая таблица `public.image_annotations`:

- `id uuid pk`
- `image_path text not null` — путь в bucket `disease-media` (универсальный ключ, работает и для атласа, и для Bento, и для галереи материалов родителей; не завязываемся на конкретный `image_id` из десятка разных таблиц)
- `bucket text not null default 'disease-media'`
- `label text not null default 'default'` — "atlas" / "site" / "book" / произвольный
- `annotation_data jsonb not null` — массив объектов вида `{ type: 'arrow'|'ellipse'|'text', ...geometry, color, strokeWidth, text? }`, плюс `imageWidth/imageHeight` для нормализации координат
- `created_by uuid references auth.users`
- `created_at`, `updated_at`
- Уникальный индекс `(image_path, label)` — один набор на пару "картинка+назначение"
- GRANT + RLS: чтение всем `authenticated` (админам видно всё, обычные — только свои); запись/обновление/удаление — только `admin` через `has_role`. Публичное чтение (для показа читателям сайта) — `anon SELECT` разрешён, т.к. это оверлей поверх и так публичной картинки атласа.

## Компоненты

### `src/components/annotations/ImageAnnotator.tsx`
Редактор на `react-konva`.
- Toolbar: инструменты `select | arrow | ellipse | text | delete`, палитра (red/yellow/green/blue/white), слайдер толщины (1–8), undo/redo (стек `past/future`), "Очистить всё", "Сохранить".
- Один `<Stage>` с двумя слоями: фон (Konva.Image из public URL) + слой фигур. Координаты хранятся нормализованными (0..1) относительно `imageWidth/imageHeight`, чтобы разметка не ломалась при разном отображаемом размере.
- Мышь + touch (`Stage` из react-konva уже поддерживает pointer events).
- Пропсы: `imagePath`, `label`, `onSaved?`.
- Загрузка при mount: `select ... where image_path=? and label=?` → hydrate state.
- Сохранение: upsert по `(image_path, label)`.

### `src/components/annotations/ImageWithAnnotations.tsx`
Статичный просмотрщик.
- SVG-оверлей поверх `<img>`. Никаких Konva-раннтаймов на клиенте-читателе — только SVG, чтобы вес был минимален.
- Пропсы: `imagePath`, `label?` (если не указан — берём все и показываем переключатель), `showAnnotations` (по умолчанию `true`), `className`.
- Если наборов несколько — маленький сегментный переключатель в углу; если один — просто рендерим.

### `src/components/annotations/annotationTypes.ts`
Общие типы (`AnnotationShape`, `AnnotationDoc`) + утилиты рендеринга SVG (используются и в просмотрщике, и как fallback).

## Интеграция

1. **Атлас УЗИ (`AdminAcupointsAtlas` и/или карточка снимка)** — рядом с каждой картинкой кнопка "Разметить" (иконка карандаша), открывает `Dialog` с `ImageAnnotator`. Публичная страница атласа показывает `ImageWithAnnotations` с `label="atlas"`.
2. **`BentoImageEditor`** — в контекстное меню ячейки добавляется пункт "Аннотации…", открывающий тот же диалог. `label` выбирается в самом редакторе (input сверху toolbar) — так одна и та же картинка может иметь наборы "atlas" / "site" / "book".
3. Публичные Bento-карточки (`BentoImageCell`) получают опциональный проп `annotationLabel`; если задан — рендерят `ImageWithAnnotations` вместо голого `<img>`.

## Зависимости
`bun add konva react-konva` (react-konva тянет konva как peer).

## Технические детали / что не делаю
- **Не** флатчу разметку в PNG — оригинал остаётся чистым, как и просил.
- **Не** плодю отдельную страницу-редактор — только диалог поверх существующих потоков.
- **Не** трогаю `client.ts` / `types.ts` — типы регенерируются после миграции.
- Координаты нормализованные (0..1), чтобы шкала на телефоне и десктопе совпадала.
- Для undo/redo — простой массив снапшотов `annotation_data`, лимит 50.

## Порядок работ (после аппрува плана)
1. Миграция `image_annotations` (+ GRANT + RLS).
2. Установка `konva`/`react-konva`.
3. Файлы: `annotationTypes.ts`, `ImageAnnotator.tsx`, `ImageWithAnnotations.tsx`.
4. Кнопка "Разметить" в атласе УЗИ + пункт меню в `BentoImageEditor`.
5. Проп `annotationLabel` в `BentoImageCell` для публичного показа.

Скажу тебе точные экраны, где нажимать, после того как ты одобришь план.
