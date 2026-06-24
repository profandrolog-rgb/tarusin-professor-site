ALTER TABLE public.ultrasound_results
  ADD COLUMN IF NOT EXISTS prostate_parenchyma text DEFAULT 'не изменена',
  ADD COLUMN IF NOT EXISTS prostate_capsule text DEFAULT 'не выражена';