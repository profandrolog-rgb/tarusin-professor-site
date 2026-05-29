
-- 1) Extend patients with new fields from spec (keep existing full_name for compatibility)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS history_number text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS patronymic text,
  ADD COLUMN IF NOT EXISTS parent_name text;

-- Backfill: assign sequential history_number to existing patients without one
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM public.patients
  WHERE history_number IS NULL
)
UPDATE public.patients p
SET history_number = lpad(n.rn::text, 6, '0')
FROM numbered n
WHERE p.id = n.id;

-- Unique index on history_number
CREATE UNIQUE INDEX IF NOT EXISTS patients_history_number_unique ON public.patients(history_number);

-- Function to generate next history_number ("000001" -> "000002" ...)
CREATE OR REPLACE FUNCTION public.next_history_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_num integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(history_number, '\D', '', 'g'), '')::integer), 0)
    INTO max_num
  FROM public.patients
  WHERE history_number ~ '^[0-9]+$';
  RETURN lpad((max_num + 1)::text, 6, '0');
END;
$$;

-- Trigger to auto-assign history_number on insert if not provided + sync full_name
CREATE OR REPLACE FUNCTION public.patients_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.history_number IS NULL OR NEW.history_number = '' THEN
    NEW.history_number := public.next_history_number();
  END IF;
  IF (NEW.full_name IS NULL OR NEW.full_name = '') AND (NEW.last_name IS NOT NULL OR NEW.first_name IS NOT NULL) THEN
    NEW.full_name := trim(both ' ' from
      COALESCE(NEW.last_name,'') || ' ' || COALESCE(NEW.first_name,'') || ' ' || COALESCE(NEW.patronymic,''));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_patients_before_insert ON public.patients;
CREATE TRIGGER trg_patients_before_insert
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.patients_before_insert();

-- 2) patient_visits table for 9 protocol types
CREATE TABLE IF NOT EXISTS public.patient_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  protocol_type text NOT NULL,
  protocol_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  diagnosis text,
  icd_code text,
  next_visit_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patient_visits_protocol_type_check CHECK (protocol_type IN (
    'ultrashort','primary_short','dynamic_with_uzi','repeat_with_labs',
    'uzi_reproductive','uzi_urinary','postop_day3','postop_day7','repeat_with_uzi'
  ))
);

CREATE INDEX IF NOT EXISTS idx_patient_visits_patient ON public.patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_date ON public.patient_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_visits_type ON public.patient_visits(protocol_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_visits TO authenticated;
GRANT ALL ON public.patient_visits TO service_role;

ALTER TABLE public.patient_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and surgeons can manage patient_visits"
ON public.patient_visits
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'surgeon'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'surgeon'::app_role));

CREATE TRIGGER trg_patient_visits_updated_at
  BEFORE UPDATE ON public.patient_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) ICD-10 dictionary
CREATE TABLE IF NOT EXISTS public.icd10_codes (
  code text PRIMARY KEY,
  name_ru text NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.icd10_codes TO authenticated;
GRANT ALL ON public.icd10_codes TO service_role;

ALTER TABLE public.icd10_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read icd10_codes"
ON public.icd10_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage icd10_codes"
ON public.icd10_codes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed common codes
INSERT INTO public.icd10_codes(code, name_ru, category) VALUES
  ('Q53.1','Неопущение яичка одностороннее','Андрология'),
  ('Q53.2','Неопущение яичка двустороннее','Андрология'),
  ('Q54.0','Гипоспадия головки полового члена','Андрология'),
  ('Q54.1','Гипоспадия полового члена','Андрология'),
  ('Q54.2','Гипоспадия мошоночная','Андрология'),
  ('Q54.9','Гипоспадия неуточнённая','Андрология'),
  ('Q55.5','Врождённое отсутствие и аплазия полового члена','Андрология'),
  ('N35.0','Посттравматическая стриктура уретры','Урология'),
  ('N40','Гиперплазия предстательной железы','Урология'),
  ('N43.0','Гидроцеле осумкованное','Андрология'),
  ('N43.3','Гидроцеле неуточнённое','Андрология'),
  ('N44','Перекрут яичка','Андрология'),
  ('N45','Орхит и эпидидимит','Андрология'),
  ('N47','Избыточная крайняя плоть, фимоз и парафимоз','Андрология'),
  ('N48.1','Баланопостит','Андрология'),
  ('N50.8','Другие уточнённые болезни мужских половых органов','Андрология'),
  ('I86.1','Варикозное расширение вен мошонки (варикоцеле)','Андрология'),
  ('N20.0','Камни почки','Урология'),
  ('N30.0','Острый цистит','Урология'),
  ('N39.0','Инфекция мочевыводящих путей без установленной локализации','Урология')
ON CONFLICT (code) DO NOTHING;
