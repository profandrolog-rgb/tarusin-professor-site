ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS pack_size TEXT,
  ADD COLUMN IF NOT EXISTS patient_info JSONB NOT NULL DEFAULT '{}'::jsonb;