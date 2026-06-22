## Контекст и допущения

- Проверил: таблицы `materia_medica_sections` (с разделами Бёрике типа "Relationship") в БД **нет**. В части 2 буду опираться на её появление; если её нет на момент реализации — блок «Сочетания и сравнения» оставлю как заглушку с пометкой «Импортируйте Бёрике». **Уточните: импорт уже сделан под другим именем? Если да — укажите таблицу.**
- Архитектура цепочек подсмотрена из `translate-rubrics-batch` и `analyze-documents-batch`: self-invoke с `x-internal-chain`, `EdgeRuntime.waitUntil`, лог через `append_*_log`, recovery-крон на «зависшие» батчи > 4 мин.
- Voyage AI требует ключ — попрошу через `add_secret` (`VOYAGE_API_KEY`).

---

## Часть 1 — Эмбеддинги рубрик

### 1.1 Миграция БД
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.rubric_embeddings (
  rubric_id uuid PRIMARY KEY REFERENCES public.repertory_rubrics(id) ON DELETE CASCADE,
  embedding vector(1024) NOT NULL,           -- voyage-4-lite = 1024 dims
  source_text text NOT NULL,                 -- что именно эмбеддили (name_ru + chapter)
  model text NOT NULL DEFAULT 'voyage-4-lite',
  embedded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rubric_embeddings TO authenticated;
GRANT ALL ON public.rubric_embeddings TO service_role;
ALTER TABLE public.rubric_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rubric_embeddings admin manage" ON public.rubric_embeddings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "rubric_embeddings auth read" ON public.rubric_embeddings
  FOR SELECT TO authenticated USING (true);

-- ANN-индекс (cosine)
CREATE INDEX rubric_embeddings_ivfflat ON public.rubric_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Батчи эмбеддингов (по аналогии с translation_batches)
CREATE TABLE public.embedding_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'queued',     -- queued|processing|done|error
  rubric_ids uuid[] NOT NULL,
  subbatch_size int NOT NULL DEFAULT 200,
  total_rubrics int NOT NULL DEFAULT 0,
  processed_rubrics int NOT NULL DEFAULT 0,
  partial_results jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{subbatch_index, ok_count, error?}]
  chain_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.embedding_batches TO authenticated;
GRANT ALL ON public.embedding_batches TO service_role;
ALTER TABLE public.embedding_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "embedding_batches admin" ON public.embedding_batches
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_embedding_batches_updated BEFORE UPDATE ON public.embedding_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC для логирования (как append_translation_batch_log)
CREATE OR REPLACE FUNCTION public.append_embedding_batch_log(_batch_id uuid, _entry jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.embedding_batches
  SET chain_log = COALESCE(chain_log,'[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('ts', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) || _entry)
  WHERE id = _batch_id;
$$;

-- RPC семантического поиска (использует cosine distance)
CREATE OR REPLACE FUNCTION public.search_rubrics_by_embedding(_query vector, _limit int DEFAULT 8)
RETURNS TABLE(rubric_id uuid, name text, name_ru text, chapter_id uuid, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT r.id, r.name, r.name_ru, r.chapter_id,
         1 - (e.embedding <=> _query) AS similarity
  FROM public.rubric_embeddings e
  JOIN public.repertory_rubrics r ON r.id = e.rubric_id
  ORDER BY e.embedding <=> _query
  LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.search_rubrics_by_embedding(vector,int) TO authenticated;
```

### 1.2 Edge function `embed-rubrics-batch`
Полная копия паттерна `translate-rubrics-batch`:
- Вход: `{ batchId, subbatchIndex? }`.
- На `subbatchIndex===0` → status=processing, считает `total_rubrics`.
- Subbatch = 200 ID. Загружает `id, name_ru, chapter_id` → формирует `source_text` = `"{chapter_name_ru}: {name_ru}"`.
- Одним запросом к Voyage:
  ```
  POST https://api.voyageai.com/v1/embeddings
  { model:"voyage-4-lite", input:[...], input_type:"document" }
  ```
- Upsert в `rubric_embeddings`.
- Пишет в `partial_results` `{subbatch_index, ok_count}`, обновляет `processed_rubrics`.
- `EdgeRuntime.waitUntil(selfInvoke({batchId, subbatchIndex: subbatchIndex+1}))`.
- Идемпотентно: skip если subbatch уже в `partial_results`.

### 1.3 Edge function `embed-batch-recovery` (cron)
Аналог `analysis-batch-recovery`: сканит `embedding_batches` где `status='processing' AND updated_at < now()-4min`, вычисляет `nextIdx` из `partial_results`, перезапускает `embed-rubrics-batch`. Установить cron каждую минуту через `pg_cron` (SQL via insert tool, не миграция — содержит anon key).

### 1.4 Запрос секрета
Через `add_secret` запрошу `VOYAGE_API_KEY` (https://dash.voyageai.com/api-keys).

---

## Часть 2 — Поиск по жалобам

### Edge Function `repertorize-from-complaint`
Защищена `verify_jwt`-проверкой admin-роли (как `search_treatment_plans`).

Вход: `{ complaint: string, mode: "extract" | "select", statements?, candidates? }` — двухшаговый протокол, чтобы фронт мог показать промежуточный список и доктор успел подправить.

**Шаг 1 (`extract`):**
1. Claude `claude-sonnet-4-5` (с фолбэком как в `translate-rubrics-batch`): system-промпт «выдели клинически значимые утверждения», ответ — JSON-массив строк. Каждое утверждение — конкретное (модальность/локализация/ощущение/время), а не «болит голова».
2. Для каждого утверждения — Voyage embedding (`input_type:"query"`).
3. Для каждого вектора — `search_rubrics_by_embedding(_query, 8)`.
4. Объединить кандидатов по `rubric_id` (взять max similarity, сохранить какие statements её «подняли»).
5. Вернуть `{ statements, candidates: [{rubric_id, name_ru, similarity, matched_statements:[...]}] }`.

**Шаг 2 (`select`):**
1. На входе: `complaint`, `candidates` (уже урезанный список, что выбрал доктор).
2. Запрос к Claude: system «выбери из переданных кандидатов только те, что реально характерны». Передаём ID + name_ru. Жёсткое требование: возвращать только rubric_id из переданного списка, плюс краткое (1-2 предложения) обоснование.
3. Ответ — JSON `[{rubric_id, reason}]`. Валидируем что все ID есть в исходном списке.
4. Возвращаем `{ selected: [...] }`.

### Подсчёт результатов
Используется существующий клиентский движок из `AdminRepertory.tsx` (`ranking` useMemo: count + sum grades). Не дублируем на бэке — фронт просто заполняет `selected` в state и переиспользует тот же UI ранжирования.

### Materia Medica «Сочетания и сравнения»
- **Если** существует таблица с разделами Бёрике: новая edge-функция или прямой запрос к ней (`SELECT remedy_id, heading, body FROM materia_medica_sections WHERE remedy_id IN (...) AND heading='Relationship'`). Показываем рядом с топ-5.
- **Если нет** (текущее состояние БД): UI блок отрисует пустое состояние «Materia Medica не импортирована». В плане отдельной задачей пометим импорт Бёрике — но это уже не входит в этот тикет.

---

## Часть 3 — Интерфейс

Новая вкладка/режим в `/admin/repertory`. Текущая страница уже использует двухколоночный layout — добавим переключатель сверху или отдельный маршрут `/admin/repertory/by-complaint`.

Маршрут: добавлю в `App.tsx` `<Route path="/admin/repertory/by-complaint" element={<AdminRepertoryByComplaint/>} />` и кнопку «Поиск по жалобам» на главной странице репертория.

```
┌─────────────────────────────────────────────┐
│  ← Назад к репертuрию                       │
│  Поиск по жалобам                           │
├─────────────────────────────────────────────┤
│  [Textarea свободный текст жалоб]           │
│  [Найти кандидатов]      (loading spinner)  │
├─────────────────────────────────────────────┤
│  Извлечённые утверждения (chips, removable) │
│  ──────────────────────────────────         │
│  Найденные рубрики (checkboxes, по умолч.   │
│   отмечены те, что выбрал Claude на шаге 2; │
│   рядом — обоснование и similarity).        │
│  [+ Добавить рубрику вручную] — открывает   │
│   поиск из существующего UI репертория.     │
│  [Посчитать ранжирование]                   │
├─────────────────────────────────────────────┤
│  Топ-10 средств (тот же компонент, что в    │
│  существующем AdminRepertory ranking).      │
│  ──────────────────────────────────         │
│  Сочетания и сравнения (Materia Medica):    │
│   Для топ-5 — карточки с Compare /          │
│   Complementary / Antidote.                 │
└─────────────────────────────────────────────┘
```

Прогресс эмбеддингов: на `/admin/repertory` рядом со счётчиком («N рубрик») — индикатор «эмбеддингов: M/N» + кнопка «Запустить эмбеддинги» (как «Очередь переводов»). Использует `embedding_batches.processed_rubrics / total_rubrics`.

---

## Технические детали и порядок работ

1. **Запрос секрета** `VOYAGE_API_KEY` (отдельным сообщением).
2. **Миграция БД** (extension + 2 таблицы + 2 RPC).
3. **Edge functions**: `embed-rubrics-batch`, `embed-batch-recovery`, `repertorize-from-complaint`.
4. **Cron** на recovery (через insert tool, не migration).
5. **Фронт**: новая страница `AdminRepertoryByComplaint.tsx`, маршрут в `App.tsx`, кнопки/индикатор в `AdminRepertory.tsx`.
6. **Кнопка запуска эмбеддингов**: создаёт `embedding_batches` запись и invoke первой итерации.

## Открытые вопросы

1. **Materia Medica Бёрике** — таблица в БД сейчас отсутствует. Уточните название, либо подтвердите, что для топ-5 показываем заглушку, а импорт сделаем отдельным тикетом.
2. **Размерность Voyage** — `voyage-4-lite` действительно даёт 1024-dim (если по факту окажется иначе, поправлю миграцию до запуска).
3. **Cron-периодичность** — минута норм или реже (например, раз в 5 минут)?
