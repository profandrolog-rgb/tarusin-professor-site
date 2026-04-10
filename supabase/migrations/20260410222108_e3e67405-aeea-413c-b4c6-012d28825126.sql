
-- Consultation cases (main case per patient)
CREATE TABLE public.consultation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_full_name text NOT NULL DEFAULT '',
  parent_name text DEFAULT '',
  parent_phone text DEFAULT '',
  parent_whatsapp text DEFAULT '',
  parent_telegram text DEFAULT '',
  patient_whatsapp text DEFAULT '',
  patient_telegram text DEFAULT '',
  has_insurance boolean DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  patient_next_step text,
  patient_acknowledged_at timestamptz,
  notification_email text DEFAULT 'prof.tarusin@yandex.ru',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own cases" ON public.consultation_cases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own cases" ON public.consultation_cases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Patients can update own cases" ON public.consultation_cases
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins full access to cases" ON public.consultation_cases
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_consultation_cases_updated_at
  BEFORE UPDATE ON public.consultation_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Consultation rounds (timeline entries within a case)
CREATE TABLE public.consultation_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.consultation_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  round_number integer NOT NULL DEFAULT 1,
  complaints text DEFAULT '',
  medical_history text DEFAULT '',
  ai_assessment text DEFAULT '',
  ai_assessment_date timestamptz,
  doctor_conclusion text DEFAULT '',
  doctor_conclusion_date timestamptz,
  is_complete boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own rounds" ON public.consultation_rounds
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own rounds" ON public.consultation_rounds
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Patients can update own rounds" ON public.consultation_rounds
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins full access to rounds" ON public.consultation_rounds
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_consultation_rounds_updated_at
  BEFORE UPDATE ON public.consultation_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Consultation documents (per round, uploaded by patient)
CREATE TABLE public.consultation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.consultation_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own documents" ON public.consultation_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own documents" ON public.consultation_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access to documents" ON public.consultation_documents
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Storage bucket for consultation documents (if not exists, reuse patient-documents)
-- We'll use the existing patient-documents bucket

-- Index for performance
CREATE INDEX idx_consultation_rounds_case_id ON public.consultation_rounds(case_id);
CREATE INDEX idx_consultation_documents_round_id ON public.consultation_documents(round_id);
CREATE INDEX idx_consultation_cases_user_id ON public.consultation_cases(user_id);
CREATE INDEX idx_consultation_cases_status ON public.consultation_cases(status);
