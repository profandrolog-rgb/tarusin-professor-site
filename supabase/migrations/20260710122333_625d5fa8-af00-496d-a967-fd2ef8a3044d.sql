-- Патient lab documents: анализы/заключения, которые пациент приносит с собой на приём

CREATE TABLE public.patient_lab_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES public.patient_visits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_date DATE,
  document_type TEXT, -- 'labs' | 'imaging' | 'conclusion' | 'other'
  source_lab TEXT,    -- лаборатория / клиника, откуда результат
  file_url TEXT,      -- storage путь (в bucket patient-lab-docs)
  file_mime TEXT,
  parsed_summary TEXT,      -- краткое резюме / расшифровка
  parsed_values JSONB,      -- структурированные значения (если распарсили)
  full_text TEXT,           -- полный текст OCR / документа
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_lab_documents_patient ON public.patient_lab_documents(patient_id, document_date DESC);
CREATE INDEX idx_patient_lab_documents_visit ON public.patient_lab_documents(visit_id) WHERE visit_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_lab_documents TO authenticated;
GRANT ALL ON public.patient_lab_documents TO service_role;

ALTER TABLE public.patient_lab_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and surgeons manage lab docs"
  ON public.patient_lab_documents FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'surgeon'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'surgeon'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  );

CREATE TRIGGER trg_patient_lab_documents_updated
  BEFORE UPDATE ON public.patient_lab_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
