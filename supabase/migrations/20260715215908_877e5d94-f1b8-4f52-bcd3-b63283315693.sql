
CREATE TABLE public.research_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  annotation text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  topic text,
  cover_image_path text,
  references_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  fact_check_report jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_type text NOT NULL DEFAULT 'manual_import' CHECK (source_type IN ('manual_import','orchestrator_generated')),
  seo_title text,
  seo_meta_description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','published')),
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX research_reviews_status_idx ON public.research_reviews(status);
CREATE INDEX research_reviews_published_at_idx ON public.research_reviews(published_at DESC);
CREATE INDEX research_reviews_topic_idx ON public.research_reviews(topic);

GRANT SELECT ON public.research_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_reviews TO authenticated;
GRANT ALL ON public.research_reviews TO service_role;

ALTER TABLE public.research_reviews ENABLE ROW LEVEL SECURITY;

-- Публично видны только опубликованные обзоры
CREATE POLICY "Public can view published research reviews"
  ON public.research_reviews FOR SELECT
  USING (status = 'published');

-- Админы/редакторы видят всё
CREATE POLICY "Admins and editors can view all research reviews"
  ON public.research_reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can insert research reviews"
  ON public.research_reviews FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can update research reviews"
  ON public.research_reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can delete research reviews"
  ON public.research_reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER update_research_reviews_updated_at
  BEFORE UPDATE ON public.research_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
