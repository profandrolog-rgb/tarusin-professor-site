CREATE TABLE public.article_dictations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  raw_dictation TEXT NOT NULL DEFAULT '',
  cleaned_dictation TEXT,
  fragments JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_paths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'recording',
  cleaning_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_dictations TO authenticated;
GRANT ALL ON public.article_dictations TO service_role;
ALTER TABLE public.article_dictations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all dictations" ON public.article_dictations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners manage own dictations" ON public.article_dictations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_article_dictations_updated BEFORE UPDATE ON public.article_dictations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_article_dictations_user ON public.article_dictations(user_id, created_at DESC);