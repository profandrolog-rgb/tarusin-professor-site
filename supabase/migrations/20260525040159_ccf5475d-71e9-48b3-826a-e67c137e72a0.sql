
-- 1. Schema
ALTER TABLE public.treatment_plans
  ADD COLUMN IF NOT EXISTS public_hash text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_view_count integer NOT NULL DEFAULT 0;

-- 2. Hash generator: 12 url-safe chars
CREATE OR REPLACE FUNCTION public.generate_plan_public_hash()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  candidate text;
  exists_already boolean;
BEGIN
  LOOP
    candidate := substr(translate(encode(gen_random_bytes(12), 'base64'), '+/=', '-_x'), 1, 12);
    SELECT EXISTS(SELECT 1 FROM public.treatment_plans WHERE public_hash = candidate) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 3. Trigger to auto-fill public_hash on INSERT
CREATE OR REPLACE FUNCTION public.assign_plan_public_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_hash IS NULL OR NEW.public_hash = '' THEN
    NEW.public_hash := public.generate_plan_public_hash();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_plan_public_hash ON public.treatment_plans;
CREATE TRIGGER trg_assign_plan_public_hash
BEFORE INSERT ON public.treatment_plans
FOR EACH ROW EXECUTE FUNCTION public.assign_plan_public_hash();

-- Backfill existing rows
UPDATE public.treatment_plans
SET public_hash = public.generate_plan_public_hash()
WHERE public_hash IS NULL;

-- 4. Public read RPC. Returns a single JSON with plan + patient + items + lab control.
--    Strips MNN, off-label, hidden positions, internal notes, cost.
CREATE OR REPLACE FUNCTION public.get_public_plan(_hash text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_row public.treatment_plans%ROWTYPE;
  patient_row public.patients%ROWTYPE;
  items_json jsonb;
  lab_json jsonb;
  test_names_json jsonb;
BEGIN
  SELECT * INTO plan_row FROM public.treatment_plans
  WHERE public_hash = _hash AND is_public = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO patient_row FROM public.patients WHERE id = plan_row.patient_id;

  -- Items with patient-friendly info merged from catalog; drop hidden positions
  SELECT COALESCE(jsonb_agg(item_json ORDER BY section_category, order_index), '[]'::jsonb)
  INTO items_json
  FROM (
    SELECT
      i.section_category,
      i.order_index,
      jsonb_build_object(
        'id', i.id,
        'catalog_id', i.catalog_id,
        'section_category', i.section_category,
        'order_index', i.order_index,
        'name_snapshot', i.name_snapshot,
        'dose', i.dose,
        'dose_unit', i.dose_unit,
        'frequency', i.frequency,
        'duration_days', i.duration_days,
        'time_of_day', i.time_of_day,
        'route_override', i.route_override,
        'day_pattern', i.day_pattern,
        'patient_info', CASE
          WHEN c.patient_info IS NOT NULL THEN c.patient_info
          ELSE NULL
        END
      ) AS item_json
    FROM public.treatment_plan_items i
    LEFT JOIN public.treatment_catalog c ON c.id = i.catalog_id
    WHERE i.plan_id = plan_row.id
      AND COALESCE(c.patient_info->>'patient_visibility', 'visible') <> 'hidden'
  ) sub;

  -- Lab control
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', lc.id,
    'control_point', lc.control_point,
    'at_day', lc.at_day,
    'test_ids', lc.test_ids,
    'custom_tests', lc.custom_tests,
    'notes', lc.notes,
    'order_index', lc.order_index
  ) ORDER BY lc.order_index), '[]'::jsonb)
  INTO lab_json
  FROM public.treatment_plan_lab_control lc
  WHERE lc.plan_id = plan_row.id;

  -- Lab test names
  SELECT COALESCE(jsonb_object_agg(lt.id::text, COALESCE(lt.short_name, lt.name)), '{}'::jsonb)
  INTO test_names_json
  FROM public.lab_tests_catalog lt
  WHERE lt.id IN (
    SELECT unnest(lc.test_ids) FROM public.treatment_plan_lab_control lc
    WHERE lc.plan_id = plan_row.id AND lc.test_ids IS NOT NULL
  );

  RETURN jsonb_build_object(
    'plan', jsonb_build_object(
      'id', plan_row.id,
      'issued_at', plan_row.issued_at,
      'duration_days', plan_row.duration_days,
      'diagnosis_short', plan_row.diagnosis_short,
      'course_number', plan_row.course_number,
      'lab_control_enabled', plan_row.lab_control_enabled,
      'mode', plan_row.mode
    ),
    'patient', CASE WHEN patient_row.id IS NULL THEN NULL ELSE jsonb_build_object(
      'full_name', patient_row.full_name,
      'birth_date', patient_row.birth_date
    ) END,
    'items', items_json,
    'lab_control', lab_json,
    'test_names', test_names_json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_plan(text) TO anon, authenticated;

-- 5. View count RPC
CREATE OR REPLACE FUNCTION public.increment_public_plan_view(_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.treatment_plans
  SET public_view_count = public_view_count + 1
  WHERE public_hash = _hash AND is_public = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_public_plan_view(text) TO anon, authenticated;
