
-- ============ VAULT NOTES ============
CREATE TABLE public.vault_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_path text NOT NULL DEFAULT '/',
  title text NOT NULL,
  slug text NOT NULL,
  content_md text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  is_daily boolean NOT NULL DEFAULT false,
  daily_date date,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  search_text text GENERATED ALWAYS AS (title || ' ' || coalesce(content_md,'')) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, folder_path, slug)
);

CREATE INDEX vault_notes_owner_idx ON public.vault_notes (owner_id, updated_at DESC);
CREATE INDEX vault_notes_folder_idx ON public.vault_notes (owner_id, folder_path);
CREATE INDEX vault_notes_tags_idx ON public.vault_notes USING gin (tags);
CREATE INDEX vault_notes_search_trgm ON public.vault_notes USING gin (search_text gin_trgm_ops);
CREATE INDEX vault_notes_daily_idx ON public.vault_notes (owner_id, daily_date) WHERE is_daily = true;
CREATE INDEX vault_notes_patient_idx ON public.vault_notes (patient_id) WHERE patient_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_notes TO authenticated;
GRANT ALL ON public.vault_notes TO service_role;

ALTER TABLE public.vault_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_notes admin all"
ON public.vault_notes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND owner_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND owner_id = auth.uid());

CREATE TRIGGER vault_notes_updated_at
BEFORE UPDATE ON public.vault_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ VAULT LINKS (wiki-links graph) ============
CREATE TABLE public.vault_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_note_id uuid NOT NULL REFERENCES public.vault_notes(id) ON DELETE CASCADE,
  to_note_id uuid REFERENCES public.vault_notes(id) ON DELETE CASCADE,
  to_title text NOT NULL,           -- сохраняем даже если целевой заметки ещё нет (broken link)
  context_snippet text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vault_links_from_idx ON public.vault_links (from_note_id);
CREATE INDEX vault_links_to_idx   ON public.vault_links (to_note_id) WHERE to_note_id IS NOT NULL;
CREATE INDEX vault_links_to_title ON public.vault_links (owner_id, lower(to_title));
CREATE INDEX vault_links_owner_idx ON public.vault_links (owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_links TO authenticated;
GRANT ALL ON public.vault_links TO service_role;

ALTER TABLE public.vault_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_links admin all"
ON public.vault_links FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND owner_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND owner_id = auth.uid());

-- ============ VAULT EMBEDDINGS ============
CREATE TABLE public.vault_note_embeddings (
  note_id uuid NOT NULL PRIMARY KEY REFERENCES public.vault_notes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding halfvec(1024) NOT NULL,
  content_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vault_note_embeddings_owner_idx ON public.vault_note_embeddings (owner_id);
CREATE INDEX vault_note_embeddings_hnsw ON public.vault_note_embeddings
  USING hnsw (embedding halfvec_cosine_ops);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_note_embeddings TO authenticated;
GRANT ALL ON public.vault_note_embeddings TO service_role;

ALTER TABLE public.vault_note_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_emb admin all"
ON public.vault_note_embeddings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND owner_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND owner_id = auth.uid());

-- ============ SEMANTIC SEARCH FUNCTION ============
CREATE OR REPLACE FUNCTION public.search_vault_by_embedding(
  _owner_id uuid,
  _query vector,
  _limit integer DEFAULT 10
)
RETURNS TABLE (
  note_id uuid,
  title text,
  folder_path text,
  similarity float,
  snippet text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
SET statement_timeout = '15s'
AS $$
DECLARE
  _q halfvec(1024) := _query::halfvec(1024);
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.folder_path,
         (1 - (e.embedding <=> _q))::float AS similarity,
         left(coalesce(n.content_md,''), 240) AS snippet
  FROM public.vault_note_embeddings e
  JOIN public.vault_notes n ON n.id = e.note_id
  WHERE e.owner_id = _owner_id
  ORDER BY e.embedding <=> _q
  LIMIT _limit;
END;
$$;
