# Мультимодальный загрузчик материалов для научных обзоров (v2)

Встраиваю новый блок «Материалы и черновик» в `AdminResearchReviewEditor` над карточкой «Основное». Обработка — новые Edge Functions, финальная оркестрация — обновлённый `research-review-orchestrate`. Ниже — план с учётом критических исправлений (хранилище, изоляция от SSG, провенанс, лимиты, публикация).

## 1. Хранилище — Яндекс Object Storage (S3), НЕ Supabase Storage

Причина: Supabase доступен только через прокси (1 ГБ RAM) — критический путь всего сайта. Файлы 40–50 МБ через него грузить нельзя. Материалы обзоров — черновики, им не место в продакшн-БД.

- Бакет: `research-materials`, приватный, публичного доступа нет.
- Endpoint: `https://storage.yandexcloud.net`, регион `ru-central1`.
- Секреты (Edge Function only): `YC_ACCESS_KEY_ID`, `YC_SECRET_ACCESS_KEY`, `YC_BUCKET_NAME`. Никогда не попадают в клиентский бандл.
- Ключ объекта: `{review_id}/{uuid}-{sanitized_filename}` — легко группировать и чистить по обзору.

**Новая Edge Function `research-materials-signurl`:**
- Вход: `{ review_id, filename, contentType, operation: 'put' | 'get' | 'delete' }`.
- Авторизация: только `admin` / `editor` (проверка JWT + `has_role`).
- Подпись: AWS Signature V4, реализованная в функции (без npm-зависимостей провайдера — Deno `crypto.subtle`).
- TTL: `put` — 15 мин, `get` — 60 мин, `delete` — 15 мин.
- Ответ: `{ url, objectKey, expiresAt }`.

**Поток:**
1. Клиент → `research-materials-signurl` (`put`) → PUT напрямую в Яндекс.
2. Клиент сохраняет в `source_materials` **только `objectKey`** (не URL — ссылки протухают).
3. `research-materials-analyze` для скачивания дергает ту же функцию (`get`) и читает файл по presigned GET.
4. Удаление материала → `signurl` (`delete`) + удаление записи из `source_materials`.

Из плана убираю: Supabase-бакет `research-materials`, любую загрузку через Supabase Storage.

## 2. Изоляция от SSG-сборки

Сборка уже ≈3.64 из 4 ГБ. Новый код не должен попасть в предрендер публичных страниц.

- `MaterialsPanel.tsx` и `RefinementChat.tsx` — только через `React.lazy` + `Suspense` внутри `AdminResearchReviewEditor`.
- Библиотеки `mammoth` (DOCX) и `jszip`/xml-parse (PPTX) — **только в Edge Function** `research-materials-analyze` (через `npm:` импорты Deno). В клиентском бандле их нет.
- `vite.config.ts`: убедиться, что `isExcludedFromSsg` покрывает все `/admin/*` (уже так). Добавить `manualChunks` для админского кода (`src/pages/Admin*`, `src/components/admin/**`) → отдельный чанк `admin`, не грузится на публичных маршрутах.

## 3. Провенанс источников — сквозная нумерация [M1], [M2]…

Обзоры публикуются под именем автора — недопустимо, чтобы модель придумывала источники.

- `research-materials-analyze` присваивает каждому материалу стабильный ID `[M1]`, `[M2]`… и включает его в текстовый лейбл каждого multimodal-блока. Соответствие `marker → material` сохраняется в `source_materials[].marker`.
- Промпт написания в `research-review-orchestrate` содержит **жёсткое требование**: после каждого фактического утверждения из материалов ставить маркер вида `[M4]`; утверждения без опоры на материалы маркером не помечать; ссылки, отсутствующие в материалах, добавлять **запрещено**.
- Третий проход — **механический факт-чек**, а не переоценка истинности. Для каждого маркера проверяется, содержится ли утверждение в тексте указанного материала (Gemini получает исходный текст только этого материала + утверждение). Результат в `fact_check_report`:
  ```json
  {
    "verified": [{ "claim": "...", "marker": "[M2]" }],
    "not_found_in_source": [{ "claim": "...", "marker": "[M5]" }],
    "unmarked_claims": ["..."]
  }
  ```
- `references_list` собирается **только** из материалов, реально присутствующих в `source_materials`. Запрет на добавление источников из знаний модели сформулирован в промпте.
- В редакторе маркеры подсвечиваются (span с классом `.source-marker`); кнопка «Убрать маркеры источников» очищает `[M\d+]` перед публикацией (сохраняет черновик до чистки в `refinement_history`).

## 4. Имя модели — в переменной окружения

`google/gemini-3.1-pro-preview` — preview, могут отключить.

- Секрет `RESEARCH_AI_MODEL`, значение по умолчанию `google/gemini-3.1-pro-preview`.
- Все Edge Functions (`research-materials-analyze`, `research-materials-refine`, `research-review-orchestrate`) читают `Deno.env.get('RESEARCH_AI_MODEL') ?? 'google/gemini-3.1-pro-preview'`. Хардкода нет.

## 5. Компактный `refinement_history`

Полный снапшот на каждой правке — избыточен.

- Формат записи: `{ ts, action, prompt, diff, snapshot? }`.
- `diff` — unified diff относительно предыдущего шага (библиотека `diff` в Edge Function).
- Полный `snapshot` — каждый 5-й шаг **и** всегда перед отправкой в оркестратор, и всегда после оркестрации.
- Откат: находим ближайший предшествующий `snapshot`, последовательно применяем diff-ы до нужного шага.

## 6. Лимиты и UX загрузки

- Отдельный файл: ≤ 50 МБ. Суммарно на обзор: ≤ 200 МБ.
- Проверка размера — **на клиенте до старта аплоада** с понятным сообщением.
- В UI списка материалов: текущий занятый объём (`X / 200 МБ`), прогресс-бар на каждый файл (XHR progress event, т.к. `fetch` PUT прогресса не даёт — используем `XMLHttpRequest` для аплоада), кнопки «Удалить» и «Скачать оригинал».

## 7. Завершение цикла — публикация, печать, скачивание

Раньше отсутствовало. Добавляю в редактор после блока оркестрации:

- **«Убрать маркеры источников»** — очищает `[M\d+]` из `content` перед публикацией (с confirm; предыдущая версия сохраняется в `refinement_history`).
- **«Опубликовать»** — переводит `research_reviews.status` в `published`, ставит `published_at = now()`. Требует непустых `title`, `annotation`, `content`, `references_list`. Триггерит существующую очередь перевода на EN.
- **«Снять с публикации»** — статус в `draft`.
- **«Скачать DOCX»** — экспорт через существующий `src/lib/treatment/docxExport.ts` (или обёртка): title + annotation + content (без маркеров) + references_list в конце.
- **«Скачать PDF»** — через существующий `src/lib/exportPdf.ts` (тот же контент, брендовые стили обзоров).
- **«Печать»** — открывает окно `window.print()` с print-CSS: маркеры источников скрыты, references_list в конце, шапка с автором и датой.

## Структуры данных

`research_reviews` (миграция):
- `source_materials jsonb` — `[{ id, marker, kind, name, mime, objectKey?, url?, summary? }]`.
- `refinement_history jsonb` — `[{ ts, action, prompt, diff, snapshot? }]`.
- `fact_check_report jsonb` — структура из п.3.
- `published_at timestamptz null`.
- GRANT `authenticated`/`service_role`, RLS: чтение/запись только admin/editor.

## Edge Functions

- `research-materials-signurl` — presigned URL, SigV4, роль-check.
- `research-materials-analyze` — multimodal → JSON `{ summary, per_material, draft_outline, key_points, detected_sources }`. Извлечение текста DOCX/PPTX **здесь**. Скачивание из YC через `signurl`.
- `research-materials-refine` — 1 звонок Gemini, возвращает `{ new_content, diff_summary }`; клиент сам считает diff для истории.
- `research-review-orchestrate` (обновление) — 3 прохода: Perplexity Sonar → написание с маркерами → механический факт-чек. Модель — из `RESEARCH_AI_MODEL`.

## Frontend

- `src/components/admin/research/MaterialsPanel.tsx` — dropzone, лимиты, прогресс, ссылки, кнопка удаления, счётчик объёма.
- `src/components/admin/research/RefinementChat.tsx` — кнопки действий + свободный промпт, лента истории, кнопка отката.
- `src/components/admin/research/PublishBar.tsx` — «Убрать маркеры», «Опубликовать/Снять», «DOCX», «PDF», «Печать».
- `src/lib/research/detectMaterialType.ts` — YouTube/PubMed/URL.
- `src/lib/research/uploadToYc.ts` — обёртка над `signurl` + XHR PUT с прогрессом.
- Интеграция в `AdminResearchReviewEditor.tsx` через `React.lazy`.

## Секреты, которые нужно завести до старта

- `YC_ACCESS_KEY_ID`, `YC_SECRET_ACCESS_KEY`, `YC_BUCKET_NAME` — статические ключи сервисного аккаунта Object Storage.
- `RESEARCH_AI_MODEL` — опционально (есть дефолт).

## Не входит

- Публичный UI для парента/врача — только админский редактор.
- Автогенерация галерей внутри `content` (админ добавляет через RichTextEditor).

## Порядок реализации

Миграция БД + бакет в YC + секреты → `research-materials-signurl` → `research-materials-analyze` → `research-materials-refine` → обновление `research-review-orchestrate` → компоненты (`MaterialsPanel`, `RefinementChat`, `PublishBar`) → интеграция в редактор → smoke-check.
