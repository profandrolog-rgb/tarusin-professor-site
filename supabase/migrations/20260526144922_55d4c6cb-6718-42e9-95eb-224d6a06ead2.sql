
CREATE OR REPLACE FUNCTION public.analytics_irt_top_protocols(
  _from date DEFAULT NULL, _to date DEFAULT NULL,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(protocol_id uuid, name text, is_template boolean, usage_count bigint, plans_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ap.id, ap.name, ap.is_template,
         COUNT(tpi.id)::bigint, COUNT(DISTINCT tpi.plan_id)::bigint
  FROM treatment_plan_items tpi
  JOIN treatment_plans tp ON tp.id = tpi.plan_id
  JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
  JOIN acupuncture_protocols ap ON ap.id = tc.acupuncture_protocol_id
  WHERE (_from IS NULL OR tp.created_at::date >= _from)
    AND (_to IS NULL OR tp.created_at::date <= _to)
    AND (_status = 'all' OR tp.status::text = _status)
    AND (_doctor = 'all' OR tp.created_by::text = _doctor)
    AND tc.acupuncture_protocol_id IS NOT NULL
  GROUP BY ap.id, ap.name, ap.is_template
  ORDER BY 4 DESC LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION public.analytics_irt_top_points(
  _from date DEFAULT NULL, _to date DEFAULT NULL,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(acupoint_id uuid, who_code text, name_ru text, meridian_code text, usage_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ac.id, ac.who_code, ac.name_ru, am.code, COUNT(*)::bigint
  FROM treatment_plan_items tpi
  JOIN treatment_plans tp ON tp.id = tpi.plan_id
  JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
  JOIN acupuncture_protocol_points app ON app.protocol_id = tc.acupuncture_protocol_id
  JOIN acupoints ac ON ac.id = app.acupoint_id
  LEFT JOIN acupoint_meridians am ON am.id = ac.meridian_id
  WHERE (_from IS NULL OR tp.created_at::date >= _from)
    AND (_to IS NULL OR tp.created_at::date <= _to)
    AND (_status = 'all' OR tp.status::text = _status)
    AND (_doctor = 'all' OR tp.created_by::text = _doctor)
    AND tc.acupuncture_protocol_id IS NOT NULL
  GROUP BY ac.id, ac.who_code, ac.name_ru, am.code
  ORDER BY 5 DESC LIMIT 15;
$$;

CREATE OR REPLACE FUNCTION public.analytics_irt_meridian_distribution(
  _from date DEFAULT NULL, _to date DEFAULT NULL,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(meridian_code text, meridian_name text, points_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(am.code, '—'), COALESCE(am.name_ru, 'Без меридиана'), COUNT(*)::bigint
  FROM treatment_plan_items tpi
  JOIN treatment_plans tp ON tp.id = tpi.plan_id
  JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
  JOIN acupuncture_protocol_points app ON app.protocol_id = tc.acupuncture_protocol_id
  JOIN acupoints ac ON ac.id = app.acupoint_id
  LEFT JOIN acupoint_meridians am ON am.id = ac.meridian_id
  WHERE (_from IS NULL OR tp.created_at::date >= _from)
    AND (_to IS NULL OR tp.created_at::date <= _to)
    AND (_status = 'all' OR tp.status::text = _status)
    AND (_doctor = 'all' OR tp.created_by::text = _doctor)
    AND tc.acupuncture_protocol_id IS NOT NULL
  GROUP BY am.code, am.name_ru
  ORDER BY 3 DESC;
$$;

CREATE OR REPLACE FUNCTION public.analytics_irt_modality_usage(
  _from date DEFAULT NULL, _to date DEFAULT NULL,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(modality text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH used AS (
    SELECT app.ea_freq_hz, app.moxa
    FROM treatment_plan_items tpi
    JOIN treatment_plans tp ON tp.id = tpi.plan_id
    JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
    JOIN acupuncture_protocol_points app ON app.protocol_id = tc.acupuncture_protocol_id
    WHERE (_from IS NULL OR tp.created_at::date >= _from)
      AND (_to IS NULL OR tp.created_at::date <= _to)
      AND (_status = 'all' OR tp.status::text = _status)
      AND (_doctor = 'all' OR tp.created_by::text = _doctor)
      AND tc.acupuncture_protocol_id IS NOT NULL
  )
  SELECT 'Электроакупунктура (ЭАП)'::text, COUNT(*)::bigint FROM used WHERE ea_freq_hz IS NOT NULL
  UNION ALL
  SELECT 'Мокса'::text, COUNT(*)::bigint FROM used WHERE moxa = true
  UNION ALL
  SELECT 'Классическая ИРТ'::text, COUNT(*)::bigint FROM used WHERE ea_freq_hz IS NULL AND moxa = false;
$$;

CREATE OR REPLACE FUNCTION public.analytics_irt_plans_per_month(
  _from date DEFAULT NULL, _to date DEFAULT NULL,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(month text, plans_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_char(date_trunc('month', tp.created_at), 'YYYY-MM'),
         COUNT(DISTINCT tp.id)::bigint
  FROM treatment_plans tp
  JOIN treatment_plan_items tpi ON tpi.plan_id = tp.id
  JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
  WHERE (_from IS NULL OR tp.created_at::date >= _from)
    AND (_to IS NULL OR tp.created_at::date <= _to)
    AND (_status = 'all' OR tp.status::text = _status)
    AND (_doctor = 'all' OR tp.created_by::text = _doctor)
    AND tc.acupuncture_protocol_id IS NOT NULL
  GROUP BY 1 ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_irt_top_protocols(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_irt_top_points(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_irt_meridian_distribution(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_irt_modality_usage(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_irt_plans_per_month(date,date,text,text) TO authenticated;
