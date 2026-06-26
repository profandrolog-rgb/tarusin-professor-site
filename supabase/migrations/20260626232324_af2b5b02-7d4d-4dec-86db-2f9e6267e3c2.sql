
CREATE INDEX IF NOT EXISTS idx_translation_batches_created_at ON public.translation_batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translation_batches_status_created ON public.translation_batches (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_reviewed_notnull ON public.repertory_rubrics (name_ru_reviewed) WHERE name_ru IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_id_name_ru_notnull ON public.repertory_rubrics (id) WHERE name_ru IS NOT NULL;
