-- 1) course_number column
ALTER TABLE public.treatment_plans
  ADD COLUMN IF NOT EXISTS course_number integer;

-- Backfill existing rows
WITH numbered AS (
  SELECT id,
         row_number() OVER (PARTITION BY patient_id ORDER BY issued_at, created_at) AS rn
  FROM public.treatment_plans
  WHERE course_number IS NULL
)
UPDATE public.treatment_plans tp
SET course_number = numbered.rn
FROM numbered
WHERE tp.id = numbered.id;

-- Trigger: auto-assign course_number BEFORE INSERT if NULL
CREATE OR REPLACE FUNCTION public.assign_course_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.course_number IS NULL AND NEW.patient_id IS NOT NULL THEN
    SELECT COALESCE(MAX(course_number), 0) + 1
      INTO NEW.course_number
    FROM public.treatment_plans
    WHERE patient_id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_treatment_plans_course_number ON public.treatment_plans;
CREATE TRIGGER trg_treatment_plans_course_number
BEFORE INSERT ON public.treatment_plans
FOR EACH ROW EXECUTE FUNCTION public.assign_course_number();

-- 2) version snapshot trigger
CREATE OR REPLACE FUNCTION public.snapshot_treatment_plan_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_no integer;
  should_snapshot boolean := false;
BEGIN
  -- Snapshot on draft -> issued, or any save when already issued
  IF (OLD.status IS DISTINCT FROM 'issued' AND NEW.status = 'issued') THEN
    should_snapshot := true;
  ELSIF (OLD.status = 'issued' AND NEW.status = 'issued') THEN
    should_snapshot := true;
  END IF;

  IF NOT should_snapshot THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(version_no), 0) + 1 INTO next_no
  FROM public.treatment_plan_versions
  WHERE plan_id = NEW.id;

  INSERT INTO public.treatment_plan_versions (plan_id, version_no, snapshot, created_by)
  VALUES (
    NEW.id,
    next_no,
    jsonb_build_object(
      'plan', to_jsonb(NEW),
      'items', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.section_category, i.order_index)
                        FROM public.treatment_plan_items i
                        WHERE i.plan_id = NEW.id), '[]'::jsonb)
    ),
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_treatment_plans_version_snapshot ON public.treatment_plans;
CREATE TRIGGER trg_treatment_plans_version_snapshot
AFTER UPDATE ON public.treatment_plans
FOR EACH ROW EXECUTE FUNCTION public.snapshot_treatment_plan_version();