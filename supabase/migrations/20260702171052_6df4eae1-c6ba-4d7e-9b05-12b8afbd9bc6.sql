
-- Extend lab_results
ALTER TABLE public.lab_results
  ALTER COLUMN patient_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS consultation_case_id uuid REFERENCES public.consultation_cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_document text,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

ALTER TABLE public.lab_results
  ADD CONSTRAINT lab_results_patient_or_case_check
  CHECK (patient_id IS NOT NULL OR consultation_case_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS lab_results_consultation_case_id_idx
  ON public.lab_results(consultation_case_id);

-- Diagnosis timeline
CREATE TABLE IF NOT EXISTS public.patient_diagnosis_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_case_id uuid REFERENCES public.consultation_cases(id) ON DELETE CASCADE,
  diagnosis_text text NOT NULL,
  icd10 text,
  source_date date,
  source_document text,
  source_type text,
  confidence numeric,
  needs_review boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (patient_id IS NOT NULL OR consultation_case_id IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_diagnosis_timeline TO authenticated;
GRANT ALL ON public.patient_diagnosis_timeline TO service_role;

ALTER TABLE public.patient_diagnosis_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all diagnosis timeline"
  ON public.patient_diagnosis_timeline FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users read own consultation diagnoses"
  ON public.patient_diagnosis_timeline FOR SELECT
  TO authenticated
  USING (
    consultation_case_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.consultation_cases cc
      WHERE cc.id = consultation_case_id AND cc.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_patient_diagnosis_timeline_updated_at
  BEFORE UPDATE ON public.patient_diagnosis_timeline
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS pdt_patient_idx ON public.patient_diagnosis_timeline(patient_id);
CREATE INDEX IF NOT EXISTS pdt_case_idx ON public.patient_diagnosis_timeline(consultation_case_id);

-- Lab synonyms queue for unrecognized analytes
CREATE TABLE IF NOT EXISTS public.lab_synonyms_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_name text NOT NULL,
  raw_unit text,
  suggested_test_id uuid REFERENCES public.lab_tests_catalog(id) ON DELETE SET NULL,
  suggested_test_name text,
  source_document text,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  consultation_case_id uuid REFERENCES public.consultation_cases(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_synonyms_queue TO authenticated;
GRANT ALL ON public.lab_synonyms_queue TO service_role;

ALTER TABLE public.lab_synonyms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lab synonyms queue"
  ON public.lab_synonyms_queue FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_lab_synonyms_queue_updated_at
  BEFORE UPDATE ON public.lab_synonyms_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
