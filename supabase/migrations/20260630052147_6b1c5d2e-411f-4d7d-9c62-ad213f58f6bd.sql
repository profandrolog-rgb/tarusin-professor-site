ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS card_background_path text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS card_annotation text;
ALTER TABLE public.disease_articles ADD COLUMN IF NOT EXISTS card_background_path text;
ALTER TABLE public.disease_articles ADD COLUMN IF NOT EXISTS card_annotation text;