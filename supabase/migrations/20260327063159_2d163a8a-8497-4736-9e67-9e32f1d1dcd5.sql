
CREATE TABLE public.research_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text,
  image_path text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published research" ON public.research_articles
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can insert research" ON public.research_articles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can update research" ON public.research_articles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can delete research" ON public.research_articles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
