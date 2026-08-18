# Чек-лист подключения Cloudflare Worker `api2.tarusin.pro`

## 1. Redirect URLs для Supabase Auth

Проект работает на Lovable Cloud. Прямой доступ к дашборду Supabase (supabase.com) отсутствует — настройки Auth управляются через интерфейс Lovable Cloud.

### Где настроить (предполагаемый путь в UI Lovable)
- Открыть проект на `lovable.dev` → **Project Settings** → раздел **Backend / Cloud / Auth** (кнопка/вкладка «View Backend» / «Backend»).
- Внутри найти подраздел **Authentication** → **URL Configuration** (или **Site URL / Redirect URLs**).

Если в UI не удаётся найти это поле — сообщите, я внесу значения через инструменты, к которым у меня есть доступ.

### Точные значения для вписывания
- **Site URL**: `https://tarusin.pro`
- **Additional Redirect URLs**:
  ```
  https://tarusin.pro
  https://www.tarusin.pro
  ```
- **api2.tarusin.pro в Redirect URLs добавлять НЕ нужно**: это прокси API, а не адрес сайта, куда пользователь возвращается после авторизации.

### Важное дополнение по OAuth
Если используется Google OAuth (по умолчанию в проекте включён), после смены Supabase-URL на `https://api2.tarusin.pro` callback-провайдера изменится на:
```
https://api2.tarusin.pro/auth/v1/callback
```
Этот URL нужно будет добавить в настройки Google OAuth Console (или другого провайдера), если он там не добавлен автоматически. В Supabase Auth он не прописывается вручную.

## 2. Env-переменные проекта после развёртывания `api2.tarusin.pro`

Изменения касаются только файла `.env.production` (используется при сборке). В текущем состоянии:

```
VITE_SUPABASE_URL=https://api.tarusin.pro
VITE_BACKEND_FALLBACK_URL=
VITE_SUPABASE_BUILD_URL=https://bpbwkizvvythqotcyfii.supabase.co
```

### Вариант A: оставить `api.tarusin.pro` основным, `api2.tarusin.pro` — резервом и для SSG
Рекомендуется, если вы планируете починить `api.tarusin.pro` позже.

```
VITE_SUPABASE_URL=https://api.tarusin.pro
VITE_BACKEND_FALLBACK_URL=https://api2.tarusin.pro
VITE_SUPABASE_BUILD_URL=https://api2.tarusin.pro
```

### Вариант B: сделать `api2.tarusin.pro` основным адресом сразу
Рекомендуется, если `api.tarusin.pro` больше использовать не планируется.

```
VITE_SUPABASE_URL=https://api2.tarusin.pro
VITE_BACKEND_FALLBACK_URL=https://api2.tarusin.pro
VITE_SUPABASE_BUILD_URL=https://api2.tarusin.pro
```

### Как внести значения
- Проще всего: пришлите мне сообщением выбранный вариант (A или B) — я обновлю `.env.production` и запущу публикацию.
- Альтернативно: если в Lovable есть интерфейс **Build Environment Variables** (отдельно от Runtime Secrets), можно прописать туда. Но для Vite `VITE_*`-переменные обычно надёжнее держать в `.env.production`, чтобы они были на моменте сборки.

## 3. Требования к Cloudflare Worker на `api2.tarusin.pro`

Worker должен проксировать все пути 1:1 к оригинальному Supabase:
- `https://api2.tarusin.pro/*` → `https://bpbwkizvvythqotcyfii.supabase.co/*`
- Передавать заголовки `Authorization`, `apikey`, `Content-Type`, `x-client-info` и тело без изменений.
- Поддерживать CORS preflight (OPTIONS) и пересылать ответы от Supabase обратно.
- DNS-запись `api2.tarusin.pro` должна быть проксирована через Cloudflare (оранжевое облако), чтобы TLS и выходной IP принадлежали Cloudflare.

## 4. Порядок действий (не вносить изменения до готовности Worker)

1. Развернуть Cloudflare Worker на `api2.tarusin.pro` с проксированием на `https://bpbwkizvvythqotcyfii.supabase.co`.
2. Добавить/проверить DNS-запись `api2.tarusin.pro` в Cloudflare с прокси-режимом.
3. Убедиться, что `https://api2.tarusin.pro/auth/v1/health` возвращает 200.
4. Прислать мне выбранный вариант (A или B) для `.env.production`.
5. Я обновлю `.env.production`, запущу сборку и публикацию.
6. После публикации проверить авторизацию на `https://tarusin.pro` и `https://www.tarusin.pro`.

## 5. Безопасный откат

Если новая конфигурация сломает доступ:
- Вернуть `.env.production` к текущим значениям:
  ```
  VITE_SUPABASE_URL=https://api.tarusin.pro
  VITE_BACKEND_FALLBACK_URL=
  VITE_SUPABASE_BUILD_URL=https://bpbwkizvvythqotcyfii.supabase.co
  ```
- Я пересоберу и переопубликую проект.

Также в коде остаётся failover-механизм: даже если `api2.tarusin.pro` вдруг станет недоступен, приложение попробует fallback-адреса и прямой `*.supabase.co` (если клиент не из РФ).
