# Оценка: перевод всех обращений браузера на собственный домен (BFF/reverse-proxy)

Оценка по коду проекта, без изменений. Ничего не редактировалось, не публиковалось, production не тронут, failover сохранён.

## 1. Где сейчас выполняются запросы к бэкенду

| Тип запроса | Как идёт сейчас | Проходит через failover |
|---|---|---|
| Статьи/данные (PostgREST) | `supabase-js` с базой `runtimeBackendBase()` (`src/integrations/supabase/client.ts`) → `api2` (production) / `api3` (preview) | Да, через перехват `fetch` в `backendFailover.ts` |
| Авторизация | `/auth/v1/*` тем же клиентом, токены в `localStorage` (`persistSession`, `autoRefreshToken`, `previewAuthStorage`) | Да |
| Публичные картинки и видео | `storage.getPublicUrl` обёрнут в `installStoragePublicUrlProxy.ts` → `api2` (или `VITE_PUBLIC_STORAGE_PROXY`), плюс `storageThumb` на `/storage/v1/render/image/public/` | **Нет.** `<img>`/`<video>` не проходят через `fetch`; есть только одноразовый `onError` → `storageFallback.ts` |
| Приватные файлы | `createSignedUrl` на 60 с — 14 дней (видео, документы пациентов, вложения кабинета, бэкапы) | Только сама выдача ссылки; загрузка файла по ссылке — нет |
| `image_annotations` | обычный PostgREST-запрос (`AnnotationOverlay`, `ImageAnnotator`, `ImageWithAnnotations`) | Да |
| Edge Functions | частично `supabase.functions.invoke`, частично прямой `fetch` по `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/...` (Cabinet, CabinetAgent, AdminArticleOrchestrator, BatchAnalysisDialog, AdminSystemBackup, PatientChatbot и др.) | Да (перехват `fetch` переписывает host) |
| Realtime/WebSocket | используется в `BatchAnalysisDialog.tsx` и `ArticleMarkdownEditor.tsx` | **Нет.** WS фиксируется на адресе создания клиента, перехват `fetch` на него не действует |
| Внешние картинки | Unsplash и `i.ytimg.com` → `api.tarusin.pro` (`proxyImage.ts`) | Отдельный маршрут |

Прямой `*.supabase.co` в браузере по умолчанию выключен (`ALLOW_DIRECT === false`), он остаётся только как `DIRECT_BASE` для перезаписи легаси-URL и как аварийный `onError` для картинок.

Это объясняет наблюдаемую картину: **API-запросы имеют защиту, картинки — почти нет** (отсюда timeout на изображениях), а 403 приходит от приложения/политик доступа либо от WAF прокси и failover-ом сознательно не считается отказом маршрута.

## 2–4. Реализуемость схемы «браузер → собственный домен → proxy → Supabase»

**Реализуемо.** Более того, схема укладывается в текущий деплой без второго сервиса: приложение уже отдаётся nginx-контейнером (`Dockerfile` + `nginx.conf`), поэтому reverse-proxy добавляется теми же `location`-блоками в том же контейнере — то есть **same-origin**, без CORS и без сторонних cookie.

Маршруты, которые нужно добавить в nginx:

```text
/api/     → <upstream>/rest/v1/          данные, image_annotations
/auth/    → <upstream>/auth/v1/          вход, refresh
/media/   → <upstream>/storage/v1/       публичные и подписанные объекты, render/image
/fn/      → <upstream>/functions/v1/     Edge Functions
/rt/      → <upstream>/realtime/v1/      WebSocket (нужен Upgrade/Connection)
```

Полностью убрать прямые обращения браузера к `*.supabase.co` и `api2/api3` — **реализуемо**, но требует замены базы в нескольких местах, а не в одном: помимо `client.ts` есть ~20 мест с `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/...`, обёртка `getPublicUrl`, `storageThumb`, `storageFallback`, `proxyImage`. Один пропущенный вызов = один запрос в обход прокси.

## 5. Безопасность и корректность

**Реализуемо:**
- Авторизация: same-origin `/auth/*`, схема токенов не меняется — Supabase остаётся источником истины.
- CORS: исчезает как проблема (тот же origin, тот же порт).
- Кэширование картинок: `proxy_cache` в nginx на `/media/` c respect для `Cache-Control` Supabase; для `render/image` кэш особенно выгоден.
- Тайм-ауты и повторы: `proxy_connect_timeout`, `proxy_read_timeout`, `proxy_next_upstream` на серверной стороне; для стриминга AI-ответов обязательно `proxy_buffering off`.
- Переключение между `api2`, `api3` и прямым Supabase: `upstream` с несколькими серверами и `proxy_next_upstream error timeout http_502 http_503 http_504` — серверный failover рядом с клиентским, а не вместо него.
- Секреты: anon-ключ и так публичный; `service_role` в схеме не участвует и в браузер не попадает.

**Требует проверки:**
- Cookie-режим авторизации (перевод с `localStorage` на httpOnly-cookie) — это смена контракта `previewAuthStorage` и preview-логики; отдельная задача, в первую итерацию не входит.
- Подписанные URL: Supabase подписывает путь, а не хост, поэтому подмена хоста на `/media/` должна работать — но проверить нужно на каждом бакете (`patient-documents`, `memo-pdfs`, `backups`, `chat-attachments`, `generated-images`).
- Realtime через nginx: WebSocket-проксирование требует корректного `Upgrade`, длинных таймаутов и отключённой буферизации; клиент `supabase-js` придётся создавать с новым base URL.
- Потоковые Edge Functions (`ai-chat`, `ai-agent`, `ai-council`, `patient-chat`) — при включённой буферизации стриминг ломается.
- Куда именно ставить контейнер: Алматы отвечает к Supabase за ~0.32 с, но это KZ-датацентр, а не проверка того, как из РФ доходят до Алматы; нужен отдельный замер «дом/мобайл РФ → Алматы».

**Не рекомендуется:**
- Делать прокси на РФ-локации (Timeweb Москва) — упрётся в ту же блокировку `*.supabase.co`.
- Удалять клиентский failover при включении серверного: тогда единственная точка отказа — сам прокси.
- Ставить `Access-Control-Allow-Origin: *` на новые маршруты, если авторизация переедет в cookie.
- Проксировать `service_role`-операции через публичный `/api/*`.
- Менять сразу все типы запросов одним релизом.

## 6. Ограничения проекта и деплоя

- Runtime — nginx со статикой, Node-сервера в контейнере нет. Значит BFF на JS/TS (`/api`-хендлеры) без изменения `Dockerfile` невозможен; на nginx — возможен сразу.
- Lovable-preview живёт на `*.lovable.app` и по контракту обязан ходить на `api3`. Preview физически не может пользоваться nginx-прокси production-контейнера, поэтому логика выбора базы должна остаться двухветочной.
- SSG-пререндер (`vite-react-ssg`) на сборочном сервере в РФ использует `VITE_SUPABASE_BUILD_URL` и к прокси в собственном контейнере обратиться не может — для сборки остаётся `api2`.
- `src/integrations/supabase/client.ts`, `previewAuthStorage.ts` и `types.ts` — автогенерируемые; base URL там сейчас берётся из `runtimeBackendBase()`, менять этот файл напрямую нежелательно.

## 7. Почему служебный домен отдаёт другую сборку

Замеры показали: `tarusin.pro` → `147.45.173.6`, страница `/for-parents/varicocele/` отдаётся пререндеренной (356 КБ, заголовок «Варикоцеле»). Служебный `...7851.twc1.net` → `188.225.31.33`, тот же URL отдаёт общий `index.html` без пререндера (230 КБ). Разные IP и разное содержимое = **два разных приложения Timeweb**, служебный домен привязан не к тому app, что обслуживает production.

**Риск реальный и высокий**: если прокси-конфиг задеплоить «по служебному домену», он попадёт в неиспользуемое приложение, а production останется без изменений — и наоборот, при путанице можно перезаписать production. Перед любым шагом нужно зафиксировать ID приложения Timeweb, обслуживающего `147.45.173.6`, и работать только с ним.

## 8. Безопасный план миграции

1. **Идентификация.** Через Timeweb API зафиксировать: какой app держит `147.45.173.6` (production) и какой — `188.225.31.33` (служебный). Выбрать площадку для эксперимента — только служебный/новый app.
2. **Прокси без клиента.** В экспериментальном app добавить `location`-блоки `/api/`, `/auth/`, `/media/`, `/fn/` и проверить их напрямую curl-ом (данные, авторизация, картинка, функция). Клиентский код не меняется — прокси инертен.
3. **Один тип запросов.** Первым перевести **только публичные картинки** (`/media/`) — там сейчас нет защиты и максимальный выигрыш. Клиентский failover не трогать.
4. **Тестирование** из домашних и мобильных сетей РФ (см. ниже). Только при чистом результате — следующий тип.
5. **Далее по одному:** данные → Edge Functions → авторизация. Realtime и cookie-режим — последними, отдельными задачами.
6. **Production** только после того, как экспериментальный app стабильно проходит все проверки; перевод обратимый (переключение переменной окружения, без удаления старых маршрутов).

## 9. Что будет затронуто

**Файлы (по шагам, не все сразу):**
- `nginx.conf` — новые `location`/`upstream`/`proxy_cache` (шаг 2).
- `src/lib/installStoragePublicUrlProxy.ts`, `src/lib/storageImage.ts`, `src/lib/storageFallback.ts` — база для картинок (шаг 3).
- `src/lib/backendEndpoints.ts` — добавление same-origin базы как варианта, без удаления `api2`/`api3` (шаг 5).
- места с `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/...`: `src/pages/Cabinet.tsx`, `CabinetAgent.tsx`, `AdminArticleOrchestrator.tsx`, `AdminSystemBackup.tsx`, `src/components/cabinet/BatchAnalysisDialog.tsx`, `src/components/PatientChatbot.tsx`, `src/hooks/useVeniceModels.ts`, `useOpenRouterModels.ts` (шаг 5).
- `src/lib/backendFailover.ts`, `backendRouteManager.ts` — только при необходимости учесть новый маршрут; удаление failover не предполагается.
- `Dockerfile` — только если понадобится `proxy_cache` каталог или новые build args.

**Переменные окружения:** `VITE_PUBLIC_STORAGE_PROXY` (уже поддерживается), новая `VITE_SAME_ORIGIN_BACKEND` (вкл/выкл same-origin режим), `VITE_BACKEND_ALT_URL` и `VITE_SUPABASE_BUILD_URL` остаются как есть.

**Supabase:** изменений схемы не требуется. Проверить только список разрешённых Redirect URL для авторизации, если появится новый домен, и что политики Storage не завязаны на конкретный origin.

**Timeweb:** правильный app для деплоя; локация вне РФ (Алматы/Амстердам); при `proxy_cache` — запас по диску; отдельная проверка, что панель не перепривязывает домены при редеплое.

**Тесты из сетей РФ (обязательно вручную, с телефона и из дома):**
- открыть 3–4 статьи `/for-parents/<slug>/` и убедиться, что все картинки грузятся, без «висящих» запросов;
- вход `prof.androlog@gmail.com` из мобильной сети (МТС/Билайн/Мегафон) и из домашнего провайдера;
- открыть видео и подписанную ссылку на документ;
- один AI-запрос в кабинете (проверка стриминга);
- страница с `image_annotations`;
- в DevTools зафиксировать: нет запросов к `*.supabase.co`, нет 403, нет timeout, время до первой картинки.

## Рекомендация

Начинать **можно**, но не в клоне Lovable-проекта: клон не меняет географию хостинга и не даст ответа на главный вопрос. Правильная песочница — служебное/новое приложение Timeweb вне РФ, где шаг 2 (nginx-прокси без изменений клиента) выполняется полностью безопасно для production. До шага 3 не переходить, пока curl-проверки прокси и предварительный замер «РФ → Алматы» не будут чистыми.
