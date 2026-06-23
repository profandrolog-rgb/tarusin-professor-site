# Генерация изображений в Кабинете

## 1. Хранилище и БД

**Новые бакеты Storage (приватные):**
- `generated-images` — результаты генерации (`{user_id}/{conv_id}/{timestamp}.png`)
- `reference-library` — пользовательская библиотека удачных референсов (`{user_id}/{ref_id}.png`)

**Новая таблица `image_references`:**
- `user_id`, `path` (в reference-library), `title`, `description`, `tags text[]`, `source_message_id` (откуда «опубликовано»), `created_at`
- RLS: пользователь видит/редактирует только свои; admin — всё. GRANT authenticated/service_role.

**Расширение `ai_messages`:** добавить опциональные колонки `image_path text`, `image_model text`, `image_cost numeric`, `image_refs text[]` (массив input-референсов для воспроизводимости). Контент остаётся текстовым (промпт или подпись).

## 2. Модели (src/config/aiModels.ts)

Ввести новый тип `kind: 'text' | 'image'` в `CuratedModel`. Текстовые работают как сейчас. Image-модели:

- `google/gemini-3.1-flash-image` — быстрая, серии иллюстраций → через **Lovable AI Gateway** `/v1/images/generations`
- `openai/gpt-5.4-image-2` — сложные композиции → через **Lovable AI Gateway** (если ID не в catalog — fallback на `openai/gpt-image-2`, предупредить пользователя)
- `bytedance/seedream-4.5` — портреты, мелкий текст → через **прямой OpenRouter** `/api/v1/chat/completions` с `modalities:['image','text']`

В `ExtendedModelPicker` и в основном дропдауне — отдельная секция «🎨 Иллюстрации», визуально отбита от текстовых.

## 3. Edge Function `generate-image`

Вход:
```ts
{ prompt: string, model: string, conversationId: string,
  references?: { bucket: string, path: string }[],
  uploadedRefs?: { name: string, dataBase64: string }[] }
```

Логика:
1. Auth via JWT (verify user).
2. Для каждого `references[i]` — создать signed URL (1 час) из указанного бакета (whitelist: `chat-attachments`, `patient-documents`, `disease-media`, `reference-library`, `generated-images`).
3. Загруженные с компьютера — сохранить в `chat-attachments/{user_id}/uploads/{uuid}` и тоже подписать.
4. Маршрутизация:
   - Префикс `google/` или `openai/` → Lovable AI Gateway `POST /v1/images/generations` (для Gemini — `messages`+`modalities`, для OpenAI — `prompt`). Референсы как `image_url` в content.
   - Иначе (`bytedance/...`) → `POST openrouter.ai/api/v1/chat/completions` с `Bearer $OPENROUTER_API_KEY`, `modalities:['image','text']`, референсы в messages.
5. Извлечь base64 PNG, залить в `generated-images/{user_id}/{conversationId}/{timestamp}.png`.
6. Извлечь `usage.cost` (Gateway/OpenRouter возвращает в response).
7. Вернуть `{ imagePath, signedUrl, cost, model }`. Запись в `ai_messages` делает клиент (как с обычными сообщениями) — с `image_path`, `image_cost`, `image_refs`.

## 4. UI композер (src/pages/Cabinet.tsx)

При выборе image-модели:
- Композер переключается в режим «Иллюстрация»: textarea «Опишите изображение», ряд thumbnails выбранных референсов с крестиком удаления, кнопки **«📎 Приложить референс»** (popover: «Из чата» / «Из библиотеки» / «Загрузить с компьютера») и **«🎨 Сгенерировать»**.
- При генерации показываем skeleton-сообщение «Генерируется…» в ленте.
- Готовое изображение — сообщение ассистента с `<img>` (signed URL), под ним: подпись с моделью и стоимостью (`$0.0034`), кнопки:
  - **Скачать** (прямая ссылка на signed URL с `download`).
  - **Использовать как референс** — переоткрывает композер с этим изображением в `references`.
  - **Опубликовать в библиотеку** — диалог с полями title/tags → копирует файл в `reference-library`, вставляет строку в `image_references`.
- Обычный текстовый чат под картинкой работает дальше, ассистент видит описание сгенерированного (передаём в контекст как текст «[Сгенерировано изображение: <prompt>]»).

## 5. Технические детали (для разработчика)

- `OPENROUTER_API_KEY` уже есть в проекте (используется в `ai-chat`); `LOVABLE_API_KEY` — проверим/добавим.
- Тип `ai_messages.image_path` — путь в бакете, **не** base64. Клиент сам делает signed URL (1 час) при рендере, кэшируем в state.
- В `ExtendedModelPicker` секция Venice уже есть — добавим аналогичную «Иллюстрации» с собственным бейджем.
- Приватный режим (privateMode) — для image тоже работает: файл всё равно нужен в Storage (иначе никак), но без записи в `ai_messages`; при выходе из приватного диалога — фоновое удаление файлов из `generated-images/{user_id}/private/`.
- Размер по умолчанию `1024x1024`, `quality:'low'`, без streaming (для простоты v1; стриминг превью можно добавить позже).

## 6. Объём работы

- Новые файлы: миграция, edge function `generate-image`, `src/components/cabinet/ImageComposer.tsx`, `src/components/cabinet/GeneratedImageMessage.tsx`, `src/components/cabinet/PublishToLibraryDialog.tsx`, `src/hooks/useImageGeneration.ts`.
- Правки: `aiModels.ts` (+ kind), `ExtendedModelPicker.tsx` (секция), `Cabinet.tsx` (роутинг композера, рендер image-сообщений), `useVeniceModels` остаётся как есть.

Подтвердите план — приступаю.