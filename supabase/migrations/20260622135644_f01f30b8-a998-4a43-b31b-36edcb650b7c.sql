
CREATE TABLE public.materia_medica_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remedy_id uuid NOT NULL REFERENCES public.repertory_remedies(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'boericke',
  heading text NOT NULL,
  body text NOT NULL,
  body_ru text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (remedy_id, source, heading)
);
CREATE INDEX idx_mm_sections_remedy ON public.materia_medica_sections(remedy_id);
CREATE INDEX idx_mm_sections_heading ON public.materia_medica_sections(heading);

GRANT SELECT ON public.materia_medica_sections TO authenticated;
GRANT ALL ON public.materia_medica_sections TO service_role;
ALTER TABLE public.materia_medica_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read mm sections" ON public.materia_medica_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage mm sections" ON public.materia_medica_sections FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_mm_sections_updated_at BEFORE UPDATE ON public.materia_medica_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mm_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'boericke',
  status text NOT NULL DEFAULT 'processing',
  total_remedies int NOT NULL DEFAULT 0,
  processed_remedies int NOT NULL DEFAULT 0,
  inserted_sections int NOT NULL DEFAULT 0,
  skipped int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  cursor_idx int NOT NULL DEFAULT 0,
  chain_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mm_import_jobs TO authenticated;
GRANT ALL ON public.mm_import_jobs TO service_role;
ALTER TABLE public.mm_import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage mm jobs" ON public.mm_import_jobs FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_mm_jobs_updated_at BEFORE UPDATE ON public.mm_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
