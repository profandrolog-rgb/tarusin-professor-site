
-- Каталог операций и программ физической нагрузки для назначений в протоколах
CREATE TABLE public.surgery_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT,
  indications TEXT,
  description TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgery_catalog TO authenticated;
GRANT ALL ON public.surgery_catalog TO service_role;
ALTER TABLE public.surgery_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read surgery catalog" ON public.surgery_catalog
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'surgeon'));
CREATE POLICY "Admins manage surgery catalog" ON public.surgery_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER update_surgery_catalog_updated_at BEFORE UPDATE ON public.surgery_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.physical_activity_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,             -- напр. "ЛФК", "Кардио", "После операции"
  age_range TEXT,            -- напр. "5-10 лет"
  description TEXT,
  weekly_plan TEXT,
  restrictions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_activity_programs TO authenticated;
GRANT ALL ON public.physical_activity_programs TO service_role;
ALTER TABLE public.physical_activity_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read PA programs" ON public.physical_activity_programs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'surgeon'));
CREATE POLICY "Admins manage PA programs" ON public.physical_activity_programs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER update_physical_activity_programs_updated_at BEFORE UPDATE ON public.physical_activity_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
