
CREATE TABLE public.treatment_catalog_backup_20260619 AS
  SELECT * FROM public.treatment_catalog;

CREATE TABLE public.treatment_plan_items_backup_20260619 AS
  SELECT * FROM public.treatment_plan_items;

CREATE TABLE public.protocol_template_items_backup_20260619 AS
  SELECT * FROM public.protocol_template_items;

REVOKE ALL ON public.treatment_catalog_backup_20260619 FROM anon, authenticated;
REVOKE ALL ON public.treatment_plan_items_backup_20260619 FROM anon, authenticated;
REVOKE ALL ON public.protocol_template_items_backup_20260619 FROM anon, authenticated;

GRANT ALL ON public.treatment_catalog_backup_20260619 TO service_role;
GRANT ALL ON public.treatment_plan_items_backup_20260619 TO service_role;
GRANT ALL ON public.protocol_template_items_backup_20260619 TO service_role;

ALTER TABLE public.treatment_catalog_backup_20260619 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items_backup_20260619 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_template_items_backup_20260619 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read backup tc" ON public.treatment_catalog_backup_20260619
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read backup tpi" ON public.treatment_plan_items_backup_20260619
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read backup pti" ON public.protocol_template_items_backup_20260619
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
