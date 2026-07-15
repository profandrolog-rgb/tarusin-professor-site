# План: раздел «Мои исследования и литературные обзоры»

Полностью зеркалит редакторский/SEO-пайплайн статей для родителей, но с академическим тоном и отдельным «Научным» system-промптом, который нельзя смешивать с промптом блога.

## 1. База данных (одна миграция)

Таблица `public.research_reviews`:
- `id uuid pk`, `slug text unique not null`
- `title text`, `annotation text`
- `content text` (TipTap HTML, как у остальных статей)
- `topic text` (для фильтра тем), `cover_image_path text null`
- `references_list jsonb default '[]'::jsonb` — `[{number, authors, title, journal, year, volume_issue, pages, doi_or_pmid, verified}]`
- `fact_check_report jsonb default '[]'::jsonb` — `[{quote, issue, suggested_fix, confidence}]` (админ-only)
- `source_type text check in ('manual_import','orchestrator_generated')`
- `seo_title text`, `seo_meta_description text` (правятся вручную)
- `status text check in ('draft','in_review','published') default 'draft'`
- `author_id uuid`, `created_at`, `updated_at`, `published_at`
- Триггер `updated_at`.

GRANTs + RLS:
- `GRANT SELECT` для `anon` только на строки `status='published'` (через policy).
- `GRANT ALL` для `authenticated` с ролью `admin`/`editor` (через `has_role`), плюс `service_role`.
- Индекс по `slug`, `status`, `published_at desc`.

## 2. Edge-функции (Supabase)

- `research-review-import` (Стратегия A): вход `{topic, raw_text}` → Claude Sonnet через Lovable AI Gateway с константой `RESEARCH_MODE_SYSTEM_PROMPT` → возвращает `{title, annotation, content, references_list, fact_check_report}` → сохраняет строку `status='draft'`, `source_type='manual_import'`.
- `research-review-orchestrate` (Стратегия B): тема → web_search + PubMed (используем существующие `ai-pubmed` / `smart-search`) → агрегация → rewrite по «Научному промпту» → fact-check-проход → сохраняет `status='draft'`, `source_type='orchestrator_generated'`. Использует инфраструктуру `orchestrate-article`, но подключает СВОЙ system-промпт.

Файл `supabase/functions/_shared/researchModePrompt.ts` содержит константу с полным текстом промпта из ТЗ и жирный комментарий-предупреждение: «НЕ смешивать с промптом блога для родителей — противоположные требования к личному голосу».

## 3. Админка

Маршрут `/admin/research-reviews`:
- Список обзоров (title, status, обновлено, действия: править / in_review / опубликовать / удалить).
- Кнопка «Новый обзор» → диалог с двумя вкладками:
  - **A. Причесать готовый текст** — поля тема, текст → «Обработать».
  - **B. Полный поиск и написание** — поле темы/вопроса → «Запустить оркестратор» (прогресс-бар этапов).
- Редактор обзора: тот же TipTap, что и в статьях для родителей (переиспользуем `RichTextEditor`), плюс блоки:
  - редактор `references_list` (нумерация, автор, журнал, год, DOI/PMID, чекбокс verified),
  - просмотр/правка `fact_check_report` (сворачиваемый, админ-only),
  - поля `seo_title`, `seo_meta_description`, `slug`, `topic`, обложка,
  - плейсхолдеры иллюстраций `[[illustration:img-N]]` через существующий механизм.
- Экран **in_review**: превью публичной страницы + fact_check_report + кнопки «Вернуть в draft» / «Опубликовать». Автопубликации нет.

## 4. Публичная часть

- `/for-doctors/research` — список опубликованных обзоров с фильтром по темам (отдельная вкладка в разделе для врачей).
- `/for-doctors/research/:slug` — страница обзора:
  - заголовок, аннотация,
  - HTML контента с DOMPurify, автоматическая замена ссылок вида `[N]` на `<a href="#ref-N">`,
  - список литературы в конце с якорями `#ref-N`,
  - иллюстрации через существующий плейсхолдер-механизм,
  - `fact_check_report` НЕ выводится.

## 5. SEO (полный паритет с пайплайном статей для родителей)

На странице обзора через `PageMeta` + `JsonLd`:
- Уникальные `seo_title` / `seo_meta_description` из БД (fallback: `title` / `annotation`).
- Canonical `https://tarusin.pro/for-doctors/research/{slug}/`.
- hreflang ru/en/x-default через существующий `getAlternates`.
- OG/Twitter теги (image = обложка обзора при наличии).
- JSON-LD: `Person` (автор — проф. Тарусин) + `MedicalScholarlyArticle` (headline, abstract, datePublished, author, citation из `references_list`).
- `scripts/generate-sitemap.ts`: подгружает опубликованные `research_reviews` и добавляет URL `/for-doctors/research/{slug}/` в sitemap при билде (тот же механизм, что уже используется).
- Slug человекочитаемый, генерируется из темы (с ручной правкой).

## 6. Архитектурная гарантия

`RESEARCH_MODE_SYSTEM_PROMPT` — отдельная константа в `supabase/functions/_shared/researchModePrompt.ts`, импортируется ТОЛЬКО в `research-review-import` и в ветку research оркестратора. В файле — комментарий с явным запретом смешивания с `EDITORIAL_FIXED_PROMPT` из `orchestrate-article`.

## Технические детали

- Модель для стратегии A: Claude Sonnet через Lovable AI Gateway (`anthropic/claude-sonnet-4.5` или ближайший доступный в каталоге; при отсутствии — fallback на `openai/gpt-5.5` с логом-предупреждением).
- Ветка B использует существующий пайплайн `orchestrate-article`, но принимает флаг `mode: 'research'`, который подменяет system-промпт и меняет пункт назначения на `research_reviews`.
- Все правки автора идут через тот же `useDebouncedAutoSave` + ручное «Сохранить»/«Опубликовать».
- Роли: доступ к админке — `admin`/`editor` (через `has_role`).

## Что затрагивается в коде

- Новая миграция БД.
- Новые файлы:
  - `supabase/functions/_shared/researchModePrompt.ts`
  - `supabase/functions/research-review-import/index.ts`
  - `supabase/functions/research-review-orchestrate/index.ts`
  - `src/pages/AdminResearchReviews.tsx` (список + диалог создания)
  - `src/pages/AdminResearchReviewEditor.tsx` (редактор + in_review)
  - `src/pages/ForDoctorsResearchList.tsx`
  - `src/pages/ForDoctorsResearchDetail.tsx`
  - компоненты `ResearchReferencesEditor.tsx`, `ResearchFactCheckPanel.tsx`
- Правки:
  - `src/App.tsx` — маршруты `/admin/research-reviews`, `/admin/research-reviews/:id`, `/for-doctors/research`, `/for-doctors/research/:slug`.
  - `src/pages/ForDoctors.tsx` — вкладка «Мои исследования и литературные обзоры».
  - `src/pages/Admin.tsx` — карточка входа в новый раздел админки.
  - `scripts/generate-sitemap.ts` — подтянуть опубликованные обзоры.

## Уточнения / допущения

- Двуязычность: пока делаю только RU-контент, но hreflang ru/en/x-default выставляю по существующему паттерну (без автоперевода). Если нужен полноценный EN-контент/перевод — скажите, добавлю связку через `content_translations`.
- Иллюстрации: использую тот же плейсхолдер `[[illustration:img-N]]` и текущий механизм подстановки, без отдельной галереи под этот раздел.
- Ветка B: реализую поверх текущего `orchestrate-article` (флаг `mode:'research'`); если хотите полностью отдельный оркестратор — скажите, вынесу.

Подтвердите план — начну реализацию.
