
-- 1. Add 'homeopathy' to treatment_category enum (covers both catalog & plan sections)
ALTER TYPE public.treatment_category ADD VALUE IF NOT EXISTS 'homeopathy';

-- 2. Kent's Repertory: 4 tables
CREATE TABLE IF NOT EXISTS public.repertory_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ord integer NOT NULL,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.repertory_remedies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_latin text NOT NULL,
  abbrev text,
  name_ru text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.repertory_rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.repertory_chapters(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.repertory_rubrics(id) ON DELETE CASCADE,
  name text NOT NULL,
  kent_page integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_chapter ON public.repertory_rubrics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_parent ON public.repertory_rubrics(parent_id);
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_name_trgm ON public.repertory_rubrics USING gin (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.repertory_rubric_remedies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL REFERENCES public.repertory_rubrics(id) ON DELETE CASCADE,
  remedy_id uuid NOT NULL REFERENCES public.repertory_remedies(id) ON DELETE CASCADE,
  grade smallint NOT NULL CHECK (grade BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rubric_id, remedy_id)
);
CREATE INDEX IF NOT EXISTS idx_rrr_rubric ON public.repertory_rubric_remedies(rubric_id);
CREATE INDEX IF NOT EXISTS idx_rrr_remedy ON public.repertory_rubric_remedies(remedy_id);

-- 3. RLS: admin only (read + write)
ALTER TABLE public.repertory_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repertory_remedies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repertory_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repertory_rubric_remedies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage repertory_chapters" ON public.repertory_chapters
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage repertory_remedies" ON public.repertory_remedies
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage repertory_rubrics" ON public.repertory_rubrics
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage repertory_rubric_remedies" ON public.repertory_rubric_remedies
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- 4. Link catalog -> remedy (nullable; only homeopathy rows use it)
ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS remedy_id uuid REFERENCES public.repertory_remedies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS potency text;
CREATE INDEX IF NOT EXISTS idx_treatment_catalog_remedy ON public.treatment_catalog(remedy_id);
