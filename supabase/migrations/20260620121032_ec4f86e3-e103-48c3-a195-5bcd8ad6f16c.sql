ALTER TABLE public.repertory_rubrics
  ADD COLUMN IF NOT EXISTS name_ru text,
  ADD COLUMN IF NOT EXISTS name_ru_reviewed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_ru_source text;

CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_name_ru_null
  ON public.repertory_rubrics (chapter_id) WHERE name_ru IS NULL;