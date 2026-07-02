ALTER TABLE public.disease_articles
  ADD COLUMN IF NOT EXISTS bento_image_1 jsonb,
  ADD COLUMN IF NOT EXISTS bento_image_2 jsonb,
  ADD COLUMN IF NOT EXISTS bento_image_3 jsonb;