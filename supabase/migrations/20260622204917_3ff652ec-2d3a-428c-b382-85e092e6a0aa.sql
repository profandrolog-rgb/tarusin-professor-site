
CREATE TABLE public.complaint_repertorizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  title TEXT,
  complaint TEXT NOT NULL,
  statements JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_rubrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  ranking JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_remedies JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_repertorizations TO authenticated;
GRANT ALL ON public.complaint_repertorizations TO service_role;

ALTER TABLE public.complaint_repertorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all repertorizations"
  ON public.complaint_repertorizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner can view own repertorizations"
  ON public.complaint_repertorizations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own repertorizations"
  ON public.complaint_repertorizations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own repertorizations"
  ON public.complaint_repertorizations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own repertorizations"
  ON public.complaint_repertorizations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_complaint_repertorizations_patient ON public.complaint_repertorizations(patient_id, created_at DESC);
CREATE INDEX idx_complaint_repertorizations_user ON public.complaint_repertorizations(user_id, created_at DESC);

CREATE TRIGGER update_complaint_repertorizations_updated_at
  BEFORE UPDATE ON public.complaint_repertorizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
