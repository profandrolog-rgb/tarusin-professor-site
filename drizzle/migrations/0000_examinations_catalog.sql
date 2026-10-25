CREATE TABLE public.examinations_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX examinations_catalog_name_uidx ON public.examinations_catalog (lower(btrim(name)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.examinations_catalog TO authenticated;
GRANT ALL ON public.examinations_catalog TO service_role;
ALTER TABLE public.examinations_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read examinations_catalog" ON public.examinations_catalog FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'surgeon'));
CREATE POLICY "Admins/editors manage examinations_catalog" ON public.examinations_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER examinations_catalog_set_updated_at BEFORE UPDATE ON public.examinations_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.diagnosis_examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_group TEXT NOT NULL,
  examination_id UUID NOT NULL REFERENCES public.examinations_catalog(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (diagnosis_group, examination_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnosis_examinations TO authenticated;
GRANT ALL ON public.diagnosis_examinations TO service_role;
ALTER TABLE public.diagnosis_examinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read diagnosis_examinations" ON public.diagnosis_examinations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'surgeon'));
CREATE POLICY "Admins/editors manage diagnosis_examinations" ON public.diagnosis_examinations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

INSERT INTO public.examinations_catalog (name, sort_order)
SELECT DISTINCT ON (lower(btrim(item_text))) btrim(item_text), 0
FROM public.diagnosis_recommendations
WHERE category = 'обследование' AND btrim(item_text) <> ''
ORDER BY lower(btrim(item_text)), sort_order;

INSERT INTO public.diagnosis_examinations (diagnosis_group, examination_id)
SELECT DISTINCT r.diagnosis_group, c.id
FROM public.diagnosis_recommendations r
JOIN public.examinations_catalog c ON lower(btrim(c.name)) = lower(btrim(r.item_text))
WHERE r.category = 'обследование'
ON CONFLICT DO NOTHING;