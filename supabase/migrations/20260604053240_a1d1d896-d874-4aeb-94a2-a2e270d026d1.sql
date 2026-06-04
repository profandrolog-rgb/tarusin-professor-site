
CREATE TABLE public.diagnosis_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_group TEXT NOT NULL,
  subtype TEXT NOT NULL,
  category TEXT NOT NULL,
  item_text TEXT NOT NULL,
  is_base BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icd_code TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX diagnosis_recommendations_group_subtype_idx
  ON public.diagnosis_recommendations (diagnosis_group, subtype, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnosis_recommendations TO authenticated;
GRANT ALL ON public.diagnosis_recommendations TO service_role;
ALTER TABLE public.diagnosis_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read diagnosis_recommendations"
  ON public.diagnosis_recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/editors manage diagnosis_recommendations"
  ON public.diagnosis_recommendations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER diagnosis_recommendations_set_updated_at
  BEFORE UPDATE ON public.diagnosis_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.referral_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INTEGER NOT NULL DEFAULT 0,
  specialty TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  contact_note TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX referral_specialists_sort_idx
  ON public.referral_specialists (sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_specialists TO authenticated;
GRANT ALL ON public.referral_specialists TO service_role;
ALTER TABLE public.referral_specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read referral_specialists"
  ON public.referral_specialists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/editors manage referral_specialists"
  ON public.referral_specialists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER referral_specialists_set_updated_at
  BEFORE UPDATE ON public.referral_specialists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
