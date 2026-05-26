CREATE OR REPLACE FUNCTION public.snapshot_treatment_plan_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_no integer;
  should_snapshot boolean := false;
BEGIN
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
      'items', COALESCE((
        SELECT jsonb_agg(
          to_jsonb(i) || jsonb_build_object(
            '_irt',
            CASE
              WHEN c.acupuncture_protocol_id IS NULL THEN NULL
              ELSE (
                SELECT jsonb_build_object(
                  'protocol_id', ap.id,
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
                )
                FROM public.acupuncture_protocols ap
                WHERE ap.id = c.acupuncture_protocol_id
              )
            END
          )
          ORDER BY i.section_category, i.order_index
        )
        FROM public.treatment_plan_items i
        LEFT JOIN public.treatment_catalog c ON c.id = i.catalog_id
        WHERE i.plan_id = NEW.id
      ), '[]'::jsonb)
    ),
    NEW.created_by
  );
  RETURN NEW;
END;
$function$;