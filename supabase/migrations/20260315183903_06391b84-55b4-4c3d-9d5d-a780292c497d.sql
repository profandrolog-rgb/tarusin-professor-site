
-- Flexible lab results table (each row = one test result)
CREATE TABLE public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  test_group text NOT NULL,
  test_name text NOT NULL,
  test_code text,
  value numeric NOT NULL,
  unit text NOT NULL,
  reference_min numeric,
  reference_max numeric,
  is_abnormal boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with lab_results"
  ON public.lab_results
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_lab_results_patient ON public.lab_results(patient_id, test_date);
CREATE INDEX idx_lab_results_test ON public.lab_results(test_name, patient_id);

-- Ultrasound measurements table
CREATE TABLE public.ultrasound_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  exam_date date NOT NULL DEFAULT CURRENT_DATE,
  -- Testicular measurements
  right_testis_length numeric,
  right_testis_width numeric,
  right_testis_depth numeric,
  right_testis_volume numeric,
  left_testis_length numeric,
  left_testis_width numeric,
  left_testis_depth numeric,
  left_testis_volume numeric,
  -- Testicular structure
  right_testis_echostructure text,
  left_testis_echostructure text,
  -- Epididymis
  right_epididymis_head numeric,
  left_epididymis_head numeric,
  right_epididymis_notes text,
  left_epididymis_notes text,
  -- Spermatic cord / varicocele
  right_spermatic_vein_diameter numeric,
  left_spermatic_vein_diameter numeric,
  right_varicocele_grade integer,
  left_varicocele_grade integer,
  valsalva_reflux_right boolean,
  valsalva_reflux_left boolean,
  -- Prostate
  prostate_length numeric,
  prostate_width numeric,
  prostate_depth numeric,
  prostate_volume numeric,
  prostate_echostructure text,
  -- Penile measurements
  penile_length numeric,
  penile_stretched_length numeric,
  -- Hydrocele
  right_hydrocele boolean DEFAULT false,
  left_hydrocele boolean DEFAULT false,
  hydrocele_volume_right numeric,
  hydrocele_volume_left numeric,
  -- Inguinal
  right_inguinal_canal text,
  left_inguinal_canal text,
  -- Bladder
  bladder_volume numeric,
  residual_urine numeric,
  bladder_wall_thickness numeric,
  -- Kidneys
  right_kidney_length numeric,
  left_kidney_length numeric,
  right_kidney_notes text,
  left_kidney_notes text,
  -- General
  conclusion text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ultrasound_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with ultrasound_results"
  ON public.ultrasound_results
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ultrasound_patient ON public.ultrasound_results(patient_id, exam_date);
