-- Блок 1: жизненный цикл обзоров
ALTER TABLE public.research_reviews
  ADD COLUMN IF NOT EXISTS workflow_state text NOT NULL DEFAULT 'draft';

ALTER TABLE public.research_reviews
  DROP CONSTRAINT IF EXISTS research_reviews_workflow_state_check;

ALTER TABLE public.research_reviews
  ADD CONSTRAINT research_reviews_workflow_state_check
  CHECK (workflow_state IN ('draft','writing','editing','consilium','published'));

-- Блок 2: режим голоса. Для обзоров дефолт — impersonal.
ALTER TABLE public.research_reviews
  ADD COLUMN IF NOT EXISTS voice_mode text NOT NULL DEFAULT 'impersonal';

ALTER TABLE public.research_reviews
  DROP CONSTRAINT IF EXISTS research_reviews_voice_mode_check;

ALTER TABLE public.research_reviews
  ADD CONSTRAINT research_reviews_voice_mode_check
  CHECK (voice_mode IN ('impersonal','own_data','authorial'));

-- Для статей дефолт — authorial, чтобы поведение не изменилось.
ALTER TABLE public.disease_articles
  ADD COLUMN IF NOT EXISTS voice_mode text NOT NULL DEFAULT 'authorial';
ALTER TABLE public.disease_articles
  DROP CONSTRAINT IF EXISTS disease_articles_voice_mode_check;
ALTER TABLE public.disease_articles
  ADD CONSTRAINT disease_articles_voice_mode_check
  CHECK (voice_mode IN ('impersonal','own_data','authorial'));

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS voice_mode text NOT NULL DEFAULT 'authorial';
ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_voice_mode_check;
ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_voice_mode_check
  CHECK (voice_mode IN ('impersonal','own_data','authorial'));

ALTER TABLE public.research_articles
  ADD COLUMN IF NOT EXISTS voice_mode text NOT NULL DEFAULT 'authorial';
ALTER TABLE public.research_articles
  DROP CONSTRAINT IF EXISTS research_articles_voice_mode_check;
ALTER TABLE public.research_articles
  ADD CONSTRAINT research_articles_voice_mode_check
  CHECK (voice_mode IN ('impersonal','own_data','authorial'));

-- Блок 0: gallery_images в обзорах больше не нужен — метки живут прямо в content.
ALTER TABLE public.research_reviews DROP COLUMN IF EXISTS gallery_images;