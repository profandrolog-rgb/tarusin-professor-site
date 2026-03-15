
CREATE TABLE public.anthropometry_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  measurement_date date NOT NULL DEFAULT CURRENT_DATE,
  age_months numeric,
  sex text NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female')),
  weight_kg numeric,
  height_cm numeric,
  head_circumference_cm numeric,
  waist_circumference_cm numeric,
  tanner_stage integer CHECK (tanner_stage IS NULL OR (tanner_stage >= 1 AND tanner_stage <= 5)),
  bmi numeric,
  bsa numeric,
  waist_height_ratio numeric,
  weight_z_score numeric,
  height_z_score numeric,
  bmi_z_score numeric,
  head_z_score numeric,
  weight_percentile numeric,
  height_percentile numeric,
  bmi_percentile numeric,
  head_percentile numeric,
  physical_development text,
  harmony text,
  reference_standard text DEFAULT 'WHO',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anthropometry_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with anthropometry"
  ON public.anthropometry_measurements
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
