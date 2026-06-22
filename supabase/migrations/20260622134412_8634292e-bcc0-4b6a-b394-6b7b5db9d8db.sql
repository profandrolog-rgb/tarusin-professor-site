CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.rubric_embeddings (
  rubric_id uuid PRIMARY KEY REFERENCES public.repertory_rubrics(id) ON DELETE CASCADE,
  embedding vector(1024) NOT NULL,
  source_text text NOT NULL,
  model text NOT NULL DEFAULT 'voyage-4-lite',
  embedded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rubric_embeddings TO authenticated;
GRANT ALL ON public.rubric_embeddings TO service_role;
ALTER TABLE public.rubric_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rubric_embeddings admin manage" ON public.rubric_embeddings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "rubric_embeddings auth read" ON public.rubric_embeddings
  FOR SELECT TO authenticated USING (true);

CREATE INDEX rubric_embeddings_ivfflat ON public.rubric_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE public.embedding_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'queued',
  rubric_ids uuid[] NOT NULL,
  subbatch_size int NOT NULL DEFAULT 200,
  total_rubrics int NOT NULL DEFAULT 0,
  processed_rubrics int NOT NULL DEFAULT 0,
  partial_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  chain_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.embedding_batches TO authenticated;
GRANT ALL ON public.embedding_batches TO service_role;
ALTER TABLE public.embedding_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "embedding_batches admin" ON public.embedding_batches
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_embedding_batches_updated BEFORE UPDATE ON public.embedding_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.append_embedding_batch_log(_batch_id uuid, _entry jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.embedding_batches
  SET chain_log = COALESCE(chain_log,'[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('ts', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) || _entry)
  WHERE id = _batch_id;
$$;

CREATE OR REPLACE FUNCTION public.search_rubrics_by_embedding(_query vector, _limit int DEFAULT 8)
RETURNS TABLE(rubric_id uuid, name text, name_ru text, chapter_id uuid, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT r.id, r.name, r.name_ru, r.chapter_id,
         (1 - (e.embedding <=> _query))::float AS similarity
  FROM public.rubric_embeddings e
  JOIN public.repertory_rubrics r ON r.id = e.rubric_id
  ORDER BY e.embedding <=> _query
  LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.search_rubrics_by_embedding(vector,int) TO authenticated;