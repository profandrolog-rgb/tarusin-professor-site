CREATE TABLE public.peptides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_name text,
  target_organ text,
  composition text,
  indications text,
  typical_schedule text,
  course_duration text,
  expected_effect text,
  monitoring text,
  side_effects text,
  onco_risk text,
  evidence_level text,
  rf_status text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.peptides TO authenticated;
GRANT ALL ON public.peptides TO service_role;
ALTER TABLE public.peptides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read peptides" ON public.peptides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage peptides" ON public.peptides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_peptides_updated_at BEFORE UPDATE ON public.peptides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX peptides_group_idx ON public.peptides(group_name);