# Мультимодальный загрузчик материалов для научных обзоров

Встраиваю новый блок «Материалы и черновик» прямо в `AdminResearchReviewEditor` над существующей карточкой «Основное». Всю тяжёлую работу выполняют 3 новых Edge Function, финальную оркестрацию — обновлённый `research-review-orchestrate`.

## Что появится на странице обзора

**Секция 1 — «Материалы»**
- Drop-zone для файлов: PDF, DOCX, PPTX, изображения (PNG/JPG/WEBP), аудио (mp3/m4a/webm). Загрузка в приватный бакет `research-materials` через signed URL.
- Поле «Добавить ссылку»: авто-определение YouTube / PubMed-PMC / обычного веб-URL.
- Список добавленных материалов с типом, названием, превью и кнопкой удаления.
- Многострочное поле «Дополнительный контекст / инструкции».

**Секция 2 — «Первичный анализ» (1 звонок)**
- Кнопка «Проанализировать материалы» → вызывает `research-materials-analyze`.
- Результат: краткое саммари, ключевые тезисы, черновой план обзора, распознанные источники (готовые к включению в references_list).

**Секция 3 — «Что сделать с материалом» (обе опции в одном UI)**
- Быстрые кнопки: **Сократить · Углубить · Расширить/Дополнить · Объединить (для мерджа с уже сгенерированным контентом обзора) · Переписать научнее**.
- Поле свободного промпта + кнопка «Применить».
- Каждое действие — 1 звонок в `research-materials-refine`, история правок в чат-ленте (можно откатиться к предыдущей версии).

**Секция 4 — «В оркестратор» (3 звонка)**
- Кнопка «Отправить в оркестратор» → обновлённый `research-review-orchestrate`:
  1. **Поиск литературы** (Perplexity Sonar по теме + материалам).
  2. **Написание обзора** (Gemini 3.1 Pro Preview с полным контекстом материалов и научным промптом).
  3. **Факт-чек и правки** (Gemini повторным проходом сверяет с материалами и источниками, возвращает `fact_check_report`).
- Результат подставляется в поля `title / annotation / content / references_list / fact_check_report` текущего обзора (перезапись с confirm).
- После оркестрации доступен тот же чат правок (кнопки + свободный промпт) — контекст сохраняется.

## Технические детали

**Новые Edge Functions:**
- `research-materials-analyze` — принимает `{materials: [...], instructions}`, готовит multimodal message для Gemini 3.1 Pro Preview через AI Gateway. Логика подготовки контента по типу:
  - `file/pdf|image|audio` → скачивает по signed URL, base64 → `image_url` / `input_audio` / `file` block.
  - `file/docx|pptx` → извлекает текст (mammoth для DOCX, jszip+xml для PPTX) → text block с пометкой источника.
  - `youtube` → URL передаётся Gemini напрямую (Gemini умеет youtube.com). Если Gemini вернёт ошибку/пусто — фолбэк на `ai-transcribe`.
  - `pubmed` (URL с PMID/PMC) → вызывает существующую `ai-pubmed-fulltext`, вставляет полученный markdown как text block.
  - `url` → Firecrawl `/v2/scrape` (formats: markdown, summary), вставляет как text block с указанием источника.
- `research-materials-refine` — принимает `{current_content, action, custom_prompt, materials_context}`, 1 звонок в Gemini, возвращает `{new_content, diff_summary}`.
- Обновление `research-review-orchestrate` — добавляется параметр `materials_context` (текст из первичного анализа) и третий проход факт-чека.

**Хранение состояния:**
- Новое поле в `research_reviews`: `source_materials jsonb` — массив материалов (тип, url/path, имя, короткое саммари) для отображения истории.
- Новое поле `refinement_history jsonb` — лента правок (action, prompt, timestamp, snapshot_content).
- Миграция + GRANT для `authenticated`/`service_role`.
- Storage bucket `research-materials` (приватный, RLS на роль admin/editor).

**Frontend:**
- Новый компонент `src/components/admin/research/MaterialsPanel.tsx` (drop-zone, список, добавление ссылок).
- Новый компонент `src/components/admin/research/RefinementChat.tsx` (кнопки действий + свободный промпт, история).
- Интеграция в `AdminResearchReviewEditor.tsx` (две новые карточки перед «Основное»).
- Утилиты `src/lib/research/materialTypes.ts`, `detectMaterialType.ts` (регэкспы YouTube/PubMed).

**Модель и промпты:**
- Основная модель для всех новых вызовов: `google/gemini-3.1-pro-preview` через Lovable AI Gateway (multimodal T,I,A,V → T).
- Промпты хранятся в `supabase/functions/_shared/researchModePrompt.ts` (добавляю новые пресеты для analyze/refine).

**Ограничения MVP:**
- Формат «интеллект-карт» (`.mm`, XMind) — поддерживаю через экспорт в изображение/PDF. Про сырые бинарники MindMeister/XMind явно скажу в UI.
- Схемы (drawio, excalidraw) — как экспортированные PNG/SVG.
- Максимум 20 материалов за раз, суммарно ≤ 50 МБ (лимит Gemini на inline base64).

## Не входит в этот этап
- Публичный UI для парента/врача — только админский редактор.
- Автоматическое добавление галерей внутрь `content` (галереи админ добавляет сам через RichTextEditor). Форматирование и стили обзоров уже единые.
- Автоперевод обзоров на EN — существующая translate-queue отработает после публикации.

Продолжаю с реализации в этом порядке: миграция БД → 3 edge function → компоненты → интеграция в редактор.
