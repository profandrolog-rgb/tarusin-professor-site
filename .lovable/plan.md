# Маршрутизация всех обращений Supabase через api.tarusin.pro

## 1. Что нашёл (все места с прямым доменом или сборкой URL)

### 1.1 Хардкод прямого домена — жёсткий блокер
`vite.config.ts` через `define` перезаписывает env-переменные на прямой домен, а комментарий рядом прямо запрещает менять их на `api.tarusin.pro`. Это отменяет любую попытку переключиться через `.env` или через панель Timeweb.

- `vite.config.ts:24` — `SUPABASE_URL_FORCED = "https://bpbwkizvvythqotcyfii.supabase.co"`
- `vite.config.ts:27` — `SUPABASE_PROJECT_ID_FORCED = "bpbwkizvvythqotcyfii"`
- `vite.config.ts:39–41` — `define: { "import.meta.env.VITE_SUPABASE_URL": … }`
- `.env:3` — `VITE_SUPABASE_URL="https://bpbwkizvvythqotcyfii.supabase.co"`
- `.env:1` — `VITE_SUPABASE_PROJECT_ID="bpbwkizvvythqotcyfii"` (сам ID нужен, но URL из него нигде не собирается)

### 1.2 Клиент Supabase — корректен
`src/integrations/supabase/client.ts:5` читает строго `import.meta.env.VITE_SUPABASE_URL`. Отдельный `functionsUrl` не задаётся — значит `supabase.functions.invoke(...)` использует базовый URL клиента. После смены URL все `.invoke(...)` автоматически пойдут через прокси.

### 1.3 Захардкоженный прямой домен внутри компонентов (9 мест, 2 файла)
Обходят env-переменную и всегда бьют напрямую:

- `src/pages/AdminArticleOrchestrator.tsx`
  - `:187` — `ai-transcribe`
  - `:621`, `:732`, `:821`, `:868` — `orchestrate-article`
  - `:899` — `test-claude-connection`
  - `:920` — `format-disease-article`
- `src/components/admin/DictationStudio.tsx`
  - `:128` — `ai-transcribe`
  - `:288` — `clean-dictation`

### 1.4 Сборка URL из VITE_SUPABASE_URL — корректно, само переедет на прокси
Ничего править не нужно, но перечисляю чтобы было видно охват:

- Edge Functions: `src/pages/Cabinet.tsx:40–44,611`, `src/pages/CabinetAgent.tsx:15`, `src/components/PatientChatbot.tsx:10`, `src/components/portal/PatientPortalChat.tsx:12`, `src/components/cabinet/BatchAnalysisDialog.tsx:167,203`, `src/pages/AdminSystemBackup.tsx:70,131,161`
- Storage (публичные объекты): `src/components/parents/PlaceholderGallery.tsx:49`, `src/components/parents/ImageGallery.tsx:17` — `${VITE_SUPABASE_URL}/storage/v1/object/public/...`
- SSG-лоадеры (билд-тайм): `src/loaders/parentsLoader.ts:5`, `src/loaders/diseaseLoader.ts:4`

Сборка `URL из VITE_SUPABASE_PROJECT_ID` в коде **не встречается** — ID используется только как значение переменной, URL нигде из него не конструируется.

### 1.5 Не трогаем
- `src/lib/proxyImage.ts` — это уже прокси для Unsplash/YouTube, к Supabase отношения не имеет.
- Загрузка в Яндекс Object Storage (`src/lib/research/uploadToYc.ts`, `supabase/functions/_shared/ycStorage.ts`) — прямые обращения к S3, как и договаривались.

## 2. Предлагаемые правки (реализацию не запускаю)

1. **`vite.config.ts`** — убрать «форс» URL и ANON-ключа. Оставить только `SUPABASE_PROJECT_ID` в define (либо снять и его — он и так есть в `.env`). Удалить устаревший комментарий про поломку `api.tarusin.pro`. Смысл: перестать перекрывать env-переменные, чтобы сборка использовала значение из `.env`/панели хостинга.

2. **`.env`** — заменить `VITE_SUPABASE_URL` на `https://api.tarusin.pro`. `VITE_SUPABASE_PUBLISHABLE_KEY` и `VITE_SUPABASE_PROJECT_ID` не трогать.

3. **`src/pages/AdminArticleOrchestrator.tsx`** — 7 хардкодов заменить на `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/<name>` (или, лучше, `supabase.functions.invoke("<name>", { body })`, чтобы вообще исключить возможность повторить ошибку).

4. **`src/components/admin/DictationStudio.tsx`** — 2 хардкода заменить аналогично.

5. **Проверка на билд-хостинге (Timeweb)** — убедиться, что в панели переменных Timeweb `VITE_SUPABASE_URL` тоже `https://api.tarusin.pro` либо переменная там не задана (иначе перекроет `.env`). Это не код, а конфиг деплоя — сделаем вручную после правок.

## 3. Что должен уметь прокси api.tarusin.pro (для двойной проверки)

Раз клиент теперь ходит через один базовый URL, прокси обязан прозрачно проксировать все пути Supabase, а не только `/functions/v1/*`:

- `/auth/v1/*` — вход/refresh токена (иначе `supabase.auth` сломается)
- `/rest/v1/*` — все запросы через PostgREST (`.from(...).select(...)` и т.д.)
- `/storage/v1/*` — публичные и подписанные ссылки на файлы (`ImageGallery`, `PlaceholderGallery`, `patient_documents` и др.)
- `/realtime/v1/*` — WebSocket (если используется подписка)
- `/functions/v1/*` — Edge Functions

Все заголовки `apikey`, `Authorization`, `x-client-info`, `Content-Type` должны пробрасываться без изменений, CORS-заголовки — не подменяться.

## 4. Оценка риска

- Больше всего рискует SSG-билд (`parentsLoader`, `diseaseLoader`), потому что билд-контейнер Timeweb должен уметь достучаться до `api.tarusin.pro`. Проверим первым же успешным деплоем: если билд встанет на fetch, дадим фолбэк на прямой домен только внутри loader'ов через отдельную серверную переменную.
- Публичные картинки из `/storage/v1/object/public/...` начнут ходить через прокси — нужно, чтобы прокси не резал `Cache-Control` (иначе просядет производительность галерей).
- Ошибка HTTP 504 от `research-review-orchestrate` идёт от самого рантайма Supabase (`IDLE_TIMEOUT 150s`), а не из-за прямого домена — переезд на прокси её не устранит; она уже решается фоновой обработкой, которую сделали в прошлом шаге. Здесь я её только упоминаю, чтобы не путать причины.

## 5. Итог — что меняется по файлам

```text
vite.config.ts                                    — снять define для URL и ANON, поправить комментарий
.env                                              — VITE_SUPABASE_URL = https://api.tarusin.pro
src/pages/AdminArticleOrchestrator.tsx            — 7 хардкодов → env/invoke
src/components/admin/DictationStudio.tsx          — 2 хардкода → env/invoke
```

Жду подтверждения, чтобы приступить.
