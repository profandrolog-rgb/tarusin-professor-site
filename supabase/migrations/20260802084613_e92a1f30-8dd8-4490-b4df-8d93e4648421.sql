ALTER TABLE public.medication_digests
  ADD COLUMN IF NOT EXISTS latin_name text,
  ADD COLUMN IF NOT EXISTS dosage_form text,
  ADD COLUMN IF NOT EXISTS default_dose text,
  ADD COLUMN IF NOT EXISTS default_frequency text,
  ADD COLUMN IF NOT EXISTS atc_code text;