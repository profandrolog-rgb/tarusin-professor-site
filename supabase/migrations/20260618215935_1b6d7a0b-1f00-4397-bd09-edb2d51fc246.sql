
CREATE TABLE public.pubmed_search_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pubmed_search_presets TO authenticated;
GRANT ALL ON public.pubmed_search_presets TO service_role;
ALTER TABLE public.pubmed_search_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pubmed presets"
ON public.pubmed_search_presets FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_pubmed_presets_updated_at
BEFORE UPDATE ON public.pubmed_search_presets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pubmed_presets_user ON public.pubmed_search_presets(user_id);
