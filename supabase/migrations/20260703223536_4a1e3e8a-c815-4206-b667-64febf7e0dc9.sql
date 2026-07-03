
ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS mm_targets text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS mm_application_point text,
  ADD COLUMN IF NOT EXISTS mm_evidence_level text,
  ADD COLUMN IF NOT EXISTS mm_priority int DEFAULT 50,
  ADD COLUMN IF NOT EXISTS mm_contraindications text[] DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_treatment_catalog_mm_targets
  ON public.treatment_catalog USING gin (mm_targets);
