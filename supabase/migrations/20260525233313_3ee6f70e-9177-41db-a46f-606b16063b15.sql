
CREATE OR REPLACE FUNCTION public.get_public_plan(_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_row public.treatment_plans%ROWTYPE;
  patient_row public.patients%ROWTYPE;
  items_json jsonb;
  lab_json jsonb;
  test_names_json jsonb;
  acu_json jsonb;
BEGIN
  SELECT * INTO plan_row FROM public.treatment_plans
  WHERE public_hash = _hash AND is_public = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO patient_row FROM public.patients WHERE id = plan_row.patient_id;

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

  SELECT COALESCE(jsonb_object_agg(lt.id::text, COALESCE(lt.short_name, lt.name)), '{}'::jsonb)
  INTO test_names_json
  FROM public.lab_tests_catalog lt
  WHERE lt.id IN (
    SELECT unnest(lc.test_ids) FROM public.treatment_plan_lab_control lc
    WHERE lc.plan_id = plan_row.id AND lc.test_ids IS NOT NULL
  );

  -- IRT expansion: catalog_id -> { protocol meta + points[] }
  SELECT COALESCE(jsonb_object_agg(catalog_id::text, payload), '{}'::jsonb)
  INTO acu_json
  FROM (
    SELECT
      c.id AS catalog_id,
      jsonb_build_object(
        'name', ap.name,
        'session_count', ap.session_count,
        'session_duration_min', ap.session_duration_min,
        'frequency', ap.frequency,
        'points', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'order_index', app.order_index,
            'who_code', a.who_code,
            'name_ru', a.name_ru,
            'pinyin', a.pinyin,
            'side', app.side,
            'manipulation', app.manipulation,
            'depth_mm', app.depth_mm,
            'retention_min', app.retention_min,
            'notes', app.notes
          ) ORDER BY app.order_index)
          FROM public.acupuncture_protocol_points app
          LEFT JOIN public.acupoints a ON a.id = app.acupoint_id
          WHERE app.protocol_id = ap.id
        ), '[]'::jsonb)
      ) AS payload
    FROM public.treatment_plan_items i
    JOIN public.treatment_catalog c ON c.id = i.catalog_id
    JOIN public.acupuncture_protocols ap ON ap.id = c.acupuncture_protocol_id
    WHERE i.plan_id = plan_row.id
      AND c.acupuncture_protocol_id IS NOT NULL
    GROUP BY c.id, ap.id
  ) s;

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
    'test_names', test_names_json,
    'acupuncture', acu_json
  );
END;
$function$;
