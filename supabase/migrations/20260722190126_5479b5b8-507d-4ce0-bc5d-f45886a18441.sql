
-- Block 1: link lab_results to visits + PDF parse cache; Block 4: cache indices interpretation

ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS visit_id uuid REFERENCES public.patient_visits(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS lab_results_visit_id_idx ON public.lab_results(visit_id);

CREATE TABLE IF NOT EXISTS public.parsed_pdf_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  file_hash text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, file_hash)
);
GRANT SELECT ON public.parsed_pdf_cache TO authenticated;
GRANT ALL ON public.parsed_pdf_cache TO service_role;
ALTER TABLE public.parsed_pdf_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read parsed_pdf_cache" ON public.parsed_pdf_cache FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Block 4: cached indices interpretation on metabolic_maps
ALTER TABLE public.metabolic_maps ADD COLUMN IF NOT EXISTS indices_interpretation jsonb;
