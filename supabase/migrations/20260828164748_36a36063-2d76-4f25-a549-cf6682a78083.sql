ALTER TABLE public.disease_articles
  ADD COLUMN IF NOT EXISTS has_article_content boolean
  GENERATED ALWAYS AS (article_content IS NOT NULL AND length(btrim(article_content)) > 0) STORED;