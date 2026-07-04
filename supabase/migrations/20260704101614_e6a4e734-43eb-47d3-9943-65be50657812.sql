-- Step 1: add sex/phase/status fields for the women's metabolic pack.
-- All new columns are nullable; existing data continues to work unchanged.

-- 1. Patient sex (M/F). Nullable = not specified yet.
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS sex text;

ALTER TABLE public.patients
  DROP CONSTRAINT IF EXISTS patients_sex_check;
ALTER TABLE public.patients
  ADD CONSTRAINT patients_sex_check
  CHECK (sex IS NULL OR sex IN ('M','F'));

-- 2. Pathway sex-scoping. Nullable = shown for both sexes (default behaviour).
ALTER TABLE public.pathways
  ADD COLUMN IF NOT EXISTS sex text;

ALTER TABLE public.pathways
  DROP CONSTRAINT IF EXISTS pathways_sex_check;
ALTER TABLE public.pathways
  ADD CONSTRAINT pathways_sex_check
  CHECK (sex IS NULL OR sex IN ('M','F'));

-- 3. Reference ranges — cycle phase and reproductive status.
ALTER TABLE public.reference_ranges
  ADD COLUMN IF NOT EXISTS phase text,
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE public.reference_ranges
  DROP CONSTRAINT IF EXISTS reference_ranges_phase_check;
ALTER TABLE public.reference_ranges
  ADD CONSTRAINT reference_ranges_phase_check
  CHECK (phase IS NULL OR phase IN ('follicular','ovulatory','luteal','postmenopause'));

ALTER TABLE public.reference_ranges
  DROP CONSTRAINT IF EXISTS reference_ranges_status_check;
ALTER TABLE public.reference_ranges
  ADD CONSTRAINT reference_ranges_status_check
  CHECK (status IS NULL OR status IN ('prepubertal','pubertal','reproductive','pregnant','postmenopause','pediatric'));

-- Extend lookup index to cover phase/status without breaking existing lookups.
CREATE INDEX IF NOT EXISTS idx_reference_ranges_lookup_ext
  ON public.reference_ranges (analyte_code, sex, phase, status, age_min_years, age_max_years);
