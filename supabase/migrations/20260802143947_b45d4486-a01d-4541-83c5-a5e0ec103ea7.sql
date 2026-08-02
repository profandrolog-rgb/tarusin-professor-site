CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.video_search_doc(
  _title text, _summary text, _transcript text,
  _tags text[], _phrases text[], _faq text[]
) RETURNS tsvector
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT to_tsvector('russian',
    coalesce(_title,'') || ' ' || coalesce(_summary,'') || ' ' || coalesce(_transcript,'') || ' ' ||
    coalesce(array_to_string(_tags,' '),'') || ' ' || coalesce(array_to_string(_phrases,' '),'') || ' ' ||
    coalesce(array_to_string(_faq,' '),''));
$$;

CREATE TABLE public.video_rubrics (
  slug text PRIMARY KEY,
  title text NOT NULL,
  description text,
  sort_order int DEFAULT 100,
  is_urgent boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_rubrics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_rubrics TO authenticated;
GRANT ALL ON public.video_rubrics TO service_role;
ALTER TABLE public.video_rubrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_rubrics public read" ON public.video_rubrics FOR SELECT USING (true);
CREATE POLICY "video_rubrics admin write" ON public.video_rubrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary_short text,
  summary_plain text,
  seo_title text,
  seo_description text,
  video_url text,
  poster_url text,
  duration_sec int,
  transcript text,
  transcript_status text DEFAULT 'none',
  transcript_error text,
  rubric text REFERENCES public.video_rubrics(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  subrubric text,
  audience text[],
  age_groups text[],
  format text DEFAULT 'short',
  level text DEFAULT 'patient',
  access_level text DEFAULT 'public',
  tags text[],
  faq_questions text[],
  symptom_phrases text[],
  cluster_slug text,
  series_slug text,
  series_order int,
  is_graphic boolean DEFAULT false,
  source text DEFAULT 'instagram',
  published_at date,
  is_published boolean DEFAULT false,
  sort_order int DEFAULT 100,
  views int DEFAULT 0,
  ai_draft jsonb,
  search_tsv tsvector GENERATED ALWAYS AS (
    public.video_search_doc(title, summary_plain, transcript, tags, symptom_phrases, faq_questions)
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos public read" ON public.videos FOR SELECT
  USING (is_published = true AND access_level = 'public');
CREATE POLICY "videos pro read" ON public.videos FOR SELECT TO authenticated
  USING (is_published = true AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
CREATE POLICY "videos admin read" ON public.videos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "videos admin insert" ON public.videos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "videos admin update" ON public.videos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "videos admin delete" ON public.videos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.video_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  start_sec int,
  end_sec int,
  content text,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_chunks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_chunks TO authenticated;
GRANT ALL ON public.video_chunks TO service_role;
ALTER TABLE public.video_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_chunks public read" ON public.video_chunks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND v.is_published = true AND v.access_level = 'public'));
CREATE POLICY "video_chunks pro read" ON public.video_chunks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "video_chunks admin write" ON public.video_chunks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.symptom_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phrase text NOT NULL,
  canonical_term text,
  rubric text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.symptom_synonyms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_synonyms TO authenticated;
GRANT ALL ON public.symptom_synonyms TO service_role;
ALTER TABLE public.symptom_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "symptom_synonyms public read" ON public.symptom_synonyms FOR SELECT USING (true);
CREATE POLICY "symptom_synonyms admin write" ON public.symptom_synonyms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX video_chunks_embedding_hnsw ON public.video_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX videos_search_tsv_gin ON public.videos USING gin (search_tsv);
CREATE INDEX symptom_synonyms_phrase_trgm ON public.symptom_synonyms USING gin (patient_phrase gin_trgm_ops);
CREATE INDEX videos_rubric_idx ON public.videos (rubric);
CREATE INDEX videos_is_published_idx ON public.videos (is_published);
CREATE INDEX videos_cluster_slug_idx ON public.videos (cluster_slug);
CREATE INDEX video_chunks_video_id_idx ON public.video_chunks (video_id);

CREATE TRIGGER videos_updated_at BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER video_rubrics_updated_at BEFORE UPDATE ON public.video_rubrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.videos_mark_reindex()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transcript IS DISTINCT FROM OLD.transcript
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.summary_plain IS DISTINCT FROM OLD.summary_plain THEN
    UPDATE public.video_chunks SET embedding = NULL WHERE video_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER videos_mark_reindex_trg AFTER UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.videos_mark_reindex();

INSERT INTO public.video_rubrics (slug, title, sort_order, is_urgent) VALUES
  ('ostraya-bol', 'Острая боль — когда ехать немедленно', 1, true),
  ('razvitie-malchika', 'Развитие мальчика и половое созревание', 2, false),
  ('yaichki', 'Яички и мошонка', 3, false),
  ('gigiena', 'Крайняя плоть, гигиена, обрезание', 4, false),
  ('gorshok', 'Горшок и туалетные навыки', 5, false),
  ('polovoy-chlen', 'Половой член: строение, размер, мифы', 6, false),
  ('erektsiya-seks', 'Эрекция и сексуальная функция', 7, false),
  ('muzhskoe-zdorovie', 'Мужское здоровье: тестостерон, простата, энергия', 8, false),
  ('zachatie', 'Зачатие, фертильность, варикоцеле', 9, false),
  ('obsledovaniya', 'Обследования: что нужно, а что нет', 10, false),
  ('operatsiya-narkoz', 'Операция и наркоз', 11, false),
  ('professor', 'Разговоры профессора', 12, false);

CREATE OR REPLACE FUNCTION public.match_video_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 20
)
RETURNS TABLE (video_id uuid, chunk_id uuid, start_sec int, content text, similarity float)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.video_id, c.id, c.start_sec, c.content, 1 - (c.embedding <=> query_embedding)
  FROM public.video_chunks c
  JOIN public.videos v ON v.id = c.video_id
  WHERE c.embedding IS NOT NULL AND v.is_published = true AND v.access_level = 'public'
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.search_videos_fts(q text, match_count int DEFAULT 20)
RETURNS TABLE (video_id uuid, rank float)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, ts_rank(v.search_tsv, websearch_to_tsquery('russian', q))::float
  FROM public.videos v
  WHERE v.is_published = true AND v.access_level = 'public'
    AND v.search_tsv @@ websearch_to_tsquery('russian', q)
  ORDER BY 2 DESC
  LIMIT match_count;
$$;