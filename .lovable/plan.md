## Цель
Сделать русский язык дефолтным для всего сайта, английский вынести в /en/, настроить hreflang, JSON-LD, sitemap, убрать пустые блоки и дубли навигации.

## Объём работ

### 1. i18n: русский по умолчанию
Файл: `src/i18n/index.ts`
- Убрать `LanguageDetector` (или ограничить его так, чтобы при отсутствии явного выбора возвращался `ru`).
- Установить `lng: 'ru'` явно. Detection оставить только для `localStorage` (ручной выбор через переключатель), без `navigator` и `querystring`.
- `fallbackLng: 'ru'`.

### 2. Маршрутизация /en/ префикса
Файл: `src/App.tsx`
- Текущие роуты остаются для русской версии (`/`, `/for-parents`, `/team` и т.д.).
- Добавить параллельное дерево под `/en/*` с теми же компонентами и лоадерами.
- Создать обёртку `LangBoundary` (новый файл `src/components/LangBoundary.tsx`), которая:
  - На монтировании синхронно вызывает `i18n.changeLanguage('en')` или `'ru'` по пропу `lang`.
  - Управляет `document.documentElement.lang` (для SSG — через `react-helmet-async` `<Helmet htmlAttributes>`).
- Обернуть русские роуты `<LangBoundary lang="ru">`, английские — `<LangBoundary lang="en">`.

### 3. Универсальный helper для hreflang + html lang
Новый файл: `src/lib/i18nUrls.ts`
- `getAlternates(path: string)` возвращает `{ ru: 'https://tarusin.pro<path>', en: 'https://tarusin.pro/en<path>', xDefault: <ru> }`.
- `getCurrentLang(pathname)` — определить язык по URL.

Обновить `src/components/PageMeta.tsx`:
- Принимать опциональный `lang` (по умолчанию определяет из текущего pathname).
- Рендерить три `<link rel="alternate" hreflang="...">` (ru, en, x-default).
- Рендерить `<html lang="...">` через `<Helmet htmlAttributes={{ lang }}>`.
- Менять `og:locale` соответственно (`ru_RU` или `en_US`).
- canonical продолжает указывать на текущий URL (с /en/ для англ).

### 4. Дублирование навигации
Источник проблемы: `Header.tsx` рендерит и `t('nav.home')` и т.д. — это нормально, дубли вероятно от того, что pre-rendered HTML содержит RU-меню, а после гидратации показывает EN (или наоборот). После фикса п.1 (русский по умолчанию) и п.2 (синхронная установка языка через LangBoundary до рендера контента) проблема уйдёт. Дополнительной правки не требуется.

### 5. JSON-LD Physician
Файл: `src/pages/Index.tsx`
- Заменить текущий jsonLd на тот, что в задании (Physician + worksFor MedicalClinics + sameAs). Сохранить AggregateRating отдельным графом.

### 6. Sitemap с hreflang
Файл: `scripts/generate-sitemap.ts`
- Для каждой публичной страницы генерировать `<url>` с `<xhtml:link rel="alternate" hreflang="ru" .../>` и `<xhtml:link rel="alternate" hreflang="en" .../>` и `x-default`.
- Включить и `/path/` и `/en/path/` как отдельные `<url>` записи (каждая со своим набором alternates).
- Добавить namespace `xmlns:xhtml="http://www.w3.org/1999/xhtml"`.

Файл: `public/robots.txt`
- Убедиться, что есть `Sitemap: https://tarusin.pro/sitemap.xml`.

### 7. Пустой блок Certificates
Найти компонент с заглушкой "Certificates coming soon" / "Дипломы и сертификаты" (вероятно в `AboutSection.tsx` или отдельный) — обернуть условием, чтобы при пустом списке секция не рендерилась вообще.

### 8. SSR/prerender
- `vite-react-ssg` уже работает. После п.1 и п.2 главная (`/`) будет генериться с русским контентом (т.к. `i18n.init({ lng: 'ru' })` синхронен, а LangBoundary не нужен на корне).
- Для `/en/*` — LangBoundary вызовет `i18n.changeLanguage('en')` синхронно перед рендером (через конструктор / useState initializer).
- Перевыпустить sitemap-pre-script.

## Файлы

**Изменить:**
- `src/i18n/index.ts` — RU по умолчанию
- `src/App.tsx` — добавить /en/* дерево с LangBoundary
- `src/components/PageMeta.tsx` — hreflang, html lang, og:locale
- `src/pages/Index.tsx` — новый JSON-LD Physician
- `scripts/generate-sitemap.ts` — hreflang в sitemap, RU+EN URL
- `public/robots.txt` — Sitemap-директива (если ещё нет)
- Компонент с "Certificates coming soon" (определить по поиску) — скрыть пустой блок

**Создать:**
- `src/components/LangBoundary.tsx` — синхронная установка языка
- `src/lib/i18nUrls.ts` — helper для альтернатив

## Что НЕ трогаем
- title, description, OG-теги (как просил пользователь)
- `src/integrations/supabase/*`, `.env`, `supabase/config.toml`
- Текущие переводы (`ru.json`, `en.json`)
- Логику клиентских компонентов (DiseaseDetailPage, ForParents и т.д.) — они уже используют `t()`.

## Подтверждение после деплоя (за пользователя)
- `curl -A "Googlebot" https://tarusin.pro/ | grep -i "Тарусин"` — должен быть hit
- `view-source:tarusin.pro/` — `<html lang="ru">`, три hreflang, JSON-LD Physician
- `/en/` — `<html lang="en">`, EN-меню, тот же JSON-LD
- `tarusin.pro/sitemap.xml` — содержит и RU и EN URL с alternates
