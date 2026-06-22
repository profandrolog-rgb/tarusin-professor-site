ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_name text;
CREATE INDEX IF NOT EXISTS ai_conversations_patient_idx ON public.ai_conversations(patient_id);