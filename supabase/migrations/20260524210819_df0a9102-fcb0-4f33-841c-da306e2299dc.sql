
-- treatment_catalog: цены и числовые упаковки
ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS price_override numeric,
  ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'RUB',
  ADD COLUMN IF NOT EXISTS price_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS price_source_note text,
  ADD COLUMN IF NOT EXISTS pack_size_num numeric,
  ADD COLUMN IF NOT EXISTS units_per_dose_num numeric;

-- treatment_plans
ALTER TABLE public.treatment_plans
  ADD COLUMN IF NOT EXISTS total_cost_estimate numeric,
  ADD COLUMN IF NOT EXISTS total_cost_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS show_cost_in_print boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_cost_in_memo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lab_control_enabled boolean NOT NULL DEFAULT false;

-- treatment_plan_items
ALTER TABLE public.treatment_plan_items
  ADD COLUMN IF NOT EXISTS prn_estimated_doses integer DEFAULT 10;

-- lab_tests_catalog
CREATE TABLE IF NOT EXISTS public.lab_tests_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  unit text,
  ref_range_male text,
  category text,
  notes text,
  price_avg numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_tests_active ON public.lab_tests_catalog (is_active, category);

ALTER TABLE public.lab_tests_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage lab tests catalog" ON public.lab_tests_catalog;
CREATE POLICY "Admins manage lab tests catalog" ON public.lab_tests_catalog
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated read lab tests catalog" ON public.lab_tests_catalog;
CREATE POLICY "Authenticated read lab tests catalog" ON public.lab_tests_catalog
  FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_lab_tests_updated_at ON public.lab_tests_catalog;
CREATE TRIGGER trg_lab_tests_updated_at BEFORE UPDATE ON public.lab_tests_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- treatment_plan_lab_control
CREATE TABLE IF NOT EXISTS public.treatment_plan_lab_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  control_point text,
  at_day integer,
  test_ids uuid[] DEFAULT '{}'::uuid[],
  custom_tests text[] DEFAULT '{}'::text[],
  notes text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_control_plan ON public.treatment_plan_lab_control (plan_id, order_index);

ALTER TABLE public.treatment_plan_lab_control ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage lab control" ON public.treatment_plan_lab_control;
CREATE POLICY "Admins manage lab control" ON public.treatment_plan_lab_control
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Doctors manage own plan lab control" ON public.treatment_plan_lab_control;
CREATE POLICY "Doctors manage own plan lab control" ON public.treatment_plan_lab_control
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.treatment_plans p WHERE p.id = treatment_plan_lab_control.plan_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.treatment_plans p WHERE p.id = treatment_plan_lab_control.plan_id AND p.created_by = auth.uid()));

DROP TRIGGER IF EXISTS trg_lab_control_updated_at ON public.treatment_plan_lab_control;
CREATE TRIGGER trg_lab_control_updated_at BEFORE UPDATE ON public.treatment_plan_lab_control
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
