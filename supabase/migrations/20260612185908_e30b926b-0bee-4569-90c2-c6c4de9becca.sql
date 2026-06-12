
CREATE TABLE public.disease_article_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  draft_key text NOT NULL,
  article_id uuid NULL,
  title text NULL,
  slug text NULL,
  description text NULL,
  tags text NULL,
  content text NOT NULL DEFAULT '',
  chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
  formatted_content text NOT NULL DEFAULT '',
  format_status text NOT NULL DEFAULT 'idle',
  format_progress text NULL,
  last_chunk_done integer NOT NULL DEFAULT 0,
  total_chunks integer NOT NULL DEFAULT 0,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, draft_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.disease_article_drafts TO authenticated;
GRANT ALL ON public.disease_article_drafts TO service_role;

ALTER TABLE public.disease_article_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own drafts"
ON public.disease_article_drafts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert their own drafts"
ON public.disease_article_drafts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update their own drafts"
ON public.disease_article_drafts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete their own drafts"
ON public.disease_article_drafts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER disease_article_drafts_updated_at
BEFORE UPDATE ON public.disease_article_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.disease_article_drafts;
ALTER TABLE public.disease_article_drafts REPLICA IDENTITY FULL;
