
-- Add category to research_articles
ALTER TABLE public.research_articles ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

-- Research article attachments
CREATE TABLE public.research_article_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.research_articles(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_article_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attachments of published articles" ON public.research_article_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_articles ra
      WHERE ra.id = article_id
      AND (ra.is_published = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
    )
  );

CREATE POLICY "Admins and editors can insert attachments" ON public.research_article_attachments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can update attachments" ON public.research_article_attachments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can delete attachments" ON public.research_article_attachments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Research article comments
CREATE TABLE public.research_article_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.research_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments" ON public.research_article_comments
  FOR SELECT USING (is_approved = true OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert comments" ON public.research_article_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update comments" ON public.research_article_comments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete comments" ON public.research_article_comments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Research article reactions
CREATE TABLE public.research_article_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.research_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id)
);

ALTER TABLE public.research_article_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.research_article_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reactions" ON public.research_article_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON public.research_article_reactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.research_article_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for research attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('research-attachments', 'research-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view research attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'research-attachments');

CREATE POLICY "Admins and editors can upload research attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'research-attachments' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins can delete research attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'research-attachments' AND public.has_role(auth.uid(), 'admin'));
