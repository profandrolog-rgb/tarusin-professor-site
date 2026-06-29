
-- Safe performance indexes (IF NOT EXISTS, no schema changes, no data changes)

-- translation_batches: ORDER BY created_at DESC pagination + status filter
CREATE INDEX IF NOT EXISTS idx_translation_batches_created_at_desc
  ON public.translation_batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translation_batches_status
  ON public.translation_batches (status);

-- embedding_batches: ORDER BY created_at DESC pagination
CREATE INDEX IF NOT EXISTS idx_embedding_batches_created_at_desc
  ON public.embedding_batches (created_at DESC);

-- repertory_rubrics: heavy filters used by translation pipeline
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_chapter_id
  ON public.repertory_rubrics (chapter_id);
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_chapter_name_ru_null
  ON public.repertory_rubrics (chapter_id)
  WHERE name_ru IS NULL;
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_name_ru_reviewed
  ON public.repertory_rubrics (name_ru_reviewed)
  WHERE name_ru IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_repertory_rubrics_name_ru_not_null
  ON public.repertory_rubrics (id)
  WHERE name_ru IS NOT NULL;

-- patient_visits: admin list pagination ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_patient_visits_created_at_desc
  ON public.patient_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient_id
  ON public.patient_visits (patient_id);

-- repertory_rubric_remedies: lookups by rubric_id and repertory_id
CREATE INDEX IF NOT EXISTS idx_rrr_rubric_id
  ON public.repertory_rubric_remedies (rubric_id);
CREATE INDEX IF NOT EXISTS idx_rrr_repertory_id
  ON public.repertory_rubric_remedies (repertory_id);

ANALYZE public.translation_batches;
ANALYZE public.embedding_batches;
ANALYZE public.repertory_rubrics;
ANALYZE public.patient_visits;
ANALYZE public.repertory_rubric_remedies;
