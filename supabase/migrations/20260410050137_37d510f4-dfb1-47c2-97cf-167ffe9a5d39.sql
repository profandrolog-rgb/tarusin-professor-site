
-- Create disease_articles table
CREATE TABLE public.disease_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  age_group TEXT NOT NULL DEFAULT 'children' CHECK (age_group IN ('children', 'adults')),
  category TEXT NOT NULL DEFAULT 'general',
  keywords TEXT[] DEFAULT '{}',
  video_path TEXT,
  audio_path TEXT,
  article_content TEXT,
  description TEXT,
  thumbnail_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disease_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can view published articles
CREATE POLICY "Anyone can view published disease articles"
ON public.disease_articles FOR SELECT
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert
CREATE POLICY "Admins can insert disease articles"
ON public.disease_articles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update disease articles"
ON public.disease_articles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete disease articles"
ON public.disease_articles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_disease_articles_updated_at
BEFORE UPDATE ON public.disease_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for disease media (videos + audio)
INSERT INTO storage.buckets (id, name, public) VALUES ('disease-media', 'disease-media', true);

-- Storage policies
CREATE POLICY "Anyone can view disease media"
ON storage.objects FOR SELECT
USING (bucket_id = 'disease-media');

CREATE POLICY "Admins can upload disease media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'disease-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update disease media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'disease-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete disease media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'disease-media' AND has_role(auth.uid(), 'admin'::app_role));
