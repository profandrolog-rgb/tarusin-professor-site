# План: SSG через vite-react-ssg

## Почему именно так

`vite-react-ssg` рендерит React-дерево в Node на этапе `vite build` (через React DOM `renderToString`). Никакого Puppeteer/Chromium — это работает в build-окружении Lovable. Но есть три неочевидных следствия, которые превращают «поставить плагин» в полноценный рефакторинг. Перечисляю честно.

## Что меняется в архитектуре

### 1. Точка входа и роутер (обязательно)
- `main.tsx` → разделяется на `entry-client.tsx` (гидратация в браузере) и `entry-server.tsx` (рендер при сборке). Оба используются `ViteReactSSG`.
- Роуты переезжают из JSX-формы `<Route>` в массив `RouteRecord[]` (формат `react-router-dom` data router). Это требование `vite-react-ssg` — без массива он не знает, какие пути обходить.
- В каждом роуте, который нужно пререндерить со списком slug-ов, добавляется `getStaticPaths()` — функция, вызываемая на билде, тянет slug-и из Supabase и возвращает массив путей.
- Для `DiseaseDetailPage` добавляется `loader()` или `data()` — функция, которая на билде грузит данные конкретной статьи и кладёт их в HTML. Без этого пререндер покажет только loader (`<Loader2>`), потому что `useEffect` в SSG не выполняется.

### 2. Все компоненты в дереве должны быть SSR-безопасны
В Node нет `window`, `document`, `localStorage`, `IntersectionObserver`, `navigator`. Сейчас этим пользуются:
- `AuthProvider` — `supabase.auth.getSession()` + localStorage
- `AgeConfirmationModal` — `document.cookie`
- `ExitIntentPopup` — `window.addEventListener`, cookies
- `useTheme` / `next-themes` — `window.matchMedia`
- `AppSidebar`, `StickyBottomPanel`, многие хуки — `window.innerWidth`, `useEffect` с DOM
- Tiptap-редактор — крашится в Node
- `recharts` — частично работает, но грузит ResizeObserver

Подход: оборачивать всё, что трогает браузер, в `typeof window !== 'undefined'` guard внутри компонентов, или использовать паттерн `ClientOnly` (рендерим заглушку на сервере, реальный компонент после монтирования). Для тяжёлых клиентских (Tiptap, PatientChatbot, ExitIntentPopup) — динамический импорт + `ClientOnly`. Это пройдётся по ~15-20 компонентам.

### 3. Конфликт с `react-helmet-async`
`vite-react-ssg` использует свой механизм заголовков (`useHead` из `@unhead/react`) ИЛИ совместим с helmet через адаптер. Helmet работает, но требует `HelmetProvider` с прокидыванием контекста в `entry-server`. Каждый `PageMeta` сохраняем как есть — helmet корректно сериализуется в выходной HTML.

### 4. Сборка
- В `package.json` `"build": "vite build"` → `"build": "vite-react-ssg build"`.
- `vite.config.ts` получает плагин `ssgPlugin` / опции в `defineConfig`.
- На билде нужны Supabase URL + anon key как env переменные (уже есть в `.env`).

## Что попадёт в `dist/`

```text
dist/
  index.html                              ← /
  for-parents/index.html                  ← /for-parents
  for-parents/ginekomastiya/index.html    ← конкретная статья
  for-parents/<slug>/index.html           ← по одному на каждую опубликованную болезнь
  contacts/index.html
  reviews/index.html
  publications/index.html
  team/index.html
  ...все публичные роуты
  assets/...                              ← JS-бандл для гидратации
```

Не пререндерятся: `/auth`, `/admin/*`, `/portal`, `/admin/patient-cards` и т.п. — они остаются обычным SPA-fallback.

## Реалистичные риски

1. **Часть компонентов сломается на первой попытке билда.** Я буду чинить итеративно: запустил билд → упало в Node → обернул проблемный компонент в `ClientOnly` → повторил. Это 3-5 итераций.
2. **Supabase запросы на этапе билда.** Сейчас Lovable build идёт ~30 сек. С SSG + N запросов в Supabase + рендер N страниц станет 1-2 минуты. Терпимо.
3. **Гидратация может ругаться на mismatch.** Если SSR-версия компонента отличается от клиентской (например, `Date.now()` или `Math.random()`), React в консоли выдаст warning. Их нужно будет вылавливать и фиксить.
4. **Возможна несовместимость `lovable-tagger`** (плагин в dev-режиме) с `vite-react-ssg`. Если упадёт — выключим его для SSG-билда условием по `mode`.
5. **Если что-то фундаментально не заведётся** (например, `vite-react-ssg` несовместим с Vite 5.4 / нашей версией react-router 6.30) — придётся откатываться на `vite-prerender-plugin` с jsdom. Узнаем только в процессе.

## Этапы выполнения

1. Установить `vite-react-ssg`, обновить `package.json` build-скрипт, добавить плагин в `vite.config.ts`.
2. Реструктурировать роуты: вынести `routes` в отдельный модуль `src/routes.tsx` в формате `RouteRecord[]`. `App.tsx` станет тонкой обёрткой с провайдерами.
3. Создать `entry-client.tsx` (гидратация) и `entry-server.tsx` (рендер). `main.tsx` удалить или превратить в реэкспорт.
4. Добавить `getStaticPaths` для `/for-parents/:slug` — функция, дёргающая Supabase REST API напрямую (без supabase-js, чтобы не тащить клиент в build) и возвращающая список slug-ов опубликованных болезней.
5. Добавить `loader` для `DiseaseDetailPage`, который грузит конкретную статью на билде и передаёт через `useLoaderData`. Компонент адаптируется: данные берутся из loader, useEffect остаётся для случая SPA-навигации.
6. Создать утилитарный компонент `<ClientOnly>` и обернуть в него `AgeConfirmationModal`, `ExitIntentPopup`, `PatientChatbot`, `StickyBottomPanel`, `AppSidebar` где они используют `window`/`document`/cookies.
7. Адаптировать `AuthProvider`, `useTheme` — guards для отсутствия window.
8. Запустить локальный билд (`npx vite-react-ssg build`), починить ошибки итеративно.
9. Проверить выходные HTML: `dist/for-parents/ginekomastiya/index.html` должен содержать корректный `<title>`, `<meta description>` и текст статьи в `<body>`.
10. Опубликовать. Проверить view-source на проде.

## Объём по файлам (прикидка)

- **Новые**: `src/routes.tsx`, `src/entry-client.tsx`, `src/entry-server.tsx`, `src/components/ClientOnly.tsx`, `src/loaders/diseaseLoader.ts`
- **Изменённые**: `package.json`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx` (удалить), `src/pages/DiseaseDetailPage.tsx` (добавить loader), `src/components/AgeConfirmationModal.tsx`, `src/components/ExitIntentPopup.tsx`, `src/components/PatientChatbot.tsx`, `src/components/StickyBottomPanel.tsx`, `src/hooks/useAuth.tsx`, плюс 5-10 файлов по ходу починки SSR-ошибок.

Это работа на один длинный заход, ~30-40 файловых правок. Прошу подтверждения, что готов на такой объём, после чего начну.

## Альтернатива, если не хочется столько менять

Сузить scope: пререндерить **только статические страницы** (`/`, `/for-parents`, `/contacts`, `/reviews`, `/publications`, `/team`, `/media`, `/videos`, `/travel-notes`, `/methodologies`, `/clinical-cases`, `/blog`, `/qa`, `/results`, `/research`, `/self-check`, `/privacy-policy`, `/consent`) — без `/for-parents/:slug`. Это 60% пользы (главная и каталог получают правильные мета), но slug-страницы остаются SPA. Зато правок в 2-3 раза меньше и риск гидратации ниже.

Подтверди один из двух вариантов:
- **A**: Полный план как выше (включая slug-страницы с loader)
- **B**: Сужённый scope (только статические страницы, slug-и остаются SPA)
