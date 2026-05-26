
CREATE OR REPLACE FUNCTION public.analytics_irt_plans_last_12m(
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(month text, plans_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH months AS (
    SELECT to_char(date_trunc('month', (now() - (n || ' months')::interval)), 'YYYY-MM') AS month
    FROM generate_series(0, 11) n
  ),
  plans AS (
    SELECT to_char(date_trunc('month', tp.created_at), 'YYYY-MM') AS month,
           COUNT(DISTINCT tp.id)::bigint AS plans_count
    FROM treatment_plans tp
    JOIN treatment_plan_items tpi ON tpi.plan_id = tp.id
    JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
    WHERE tp.created_at >= date_trunc('month', now()) - interval '11 months'
      AND (_status = 'all' OR tp.status::text = _status)
      AND (_doctor = 'all' OR tp.created_by::text = _doctor)
      AND tc.acupuncture_protocol_id IS NOT NULL
    GROUP BY 1
  )
  SELECT m.month, COALESCE(p.plans_count, 0)::bigint
  FROM months m LEFT JOIN plans p USING (month)
  ORDER BY m.month;
$$;

CREATE OR REPLACE FUNCTION public.analytics_irt_meridian_trends(
  _from date DEFAULT NULL, _to date DEFAULT NULL,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(month text, meridian_code text, points_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_char(date_trunc('month', tp.created_at), 'YYYY-MM') AS month,
         COALESCE(am.code, '—') AS meridian_code,
         COUNT(*)::bigint
  FROM treatment_plans tp
  JOIN treatment_plan_items tpi ON tpi.plan_id = tp.id
  JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
  JOIN acupuncture_protocol_points app ON app.protocol_id = tc.acupuncture_protocol_id
  JOIN acupoints ac ON ac.id = app.acupoint_id
  LEFT JOIN acupoint_meridians am ON am.id = ac.meridian_id
  WHERE (_from IS NULL OR tp.created_at::date >= _from)
    AND (_to IS NULL OR tp.created_at::date <= _to)
    AND (_status = 'all' OR tp.status::text = _status)
    AND (_doctor = 'all' OR tp.created_by::text = _doctor)
    AND tc.acupuncture_protocol_id IS NOT NULL
  GROUP BY 1, 2 ORDER BY 1, 2;
$$;

CREATE OR REPLACE FUNCTION public.analytics_irt_compare_periods(
  _from date, _to date,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  span integer;
  prev_from date;
  prev_to date;
  cur_plans bigint; prev_plans bigint;
  cur_points bigint; prev_points bigint;
  cur_protocols bigint; prev_protocols bigint;
BEGIN
  span := GREATEST((_to - _from), 0);
  prev_to := _from - 1;
  prev_from := prev_to - span;

  SELECT COUNT(DISTINCT tp.id),
         COUNT(app.*),
         COUNT(DISTINCT tc.acupuncture_protocol_id)
    INTO cur_plans, cur_points, cur_protocols
  FROM treatment_plans tp
  JOIN treatment_plan_items tpi ON tpi.plan_id = tp.id
  JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
  LEFT JOIN acupuncture_protocol_points app ON app.protocol_id = tc.acupuncture_protocol_id
  WHERE tp.created_at::date BETWEEN _from AND _to
    AND (_status = 'all' OR tp.status::text = _status)
    AND (_doctor = 'all' OR tp.created_by::text = _doctor)
    AND tc.acupuncture_protocol_id IS NOT NULL;

  SELECT COUNT(DISTINCT tp.id),
         COUNT(app.*),
         COUNT(DISTINCT tc.acupuncture_protocol_id)
    INTO prev_plans, prev_points, prev_protocols
  FROM treatment_plans tp
  JOIN treatment_plan_items tpi ON tpi.plan_id = tp.id
  JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
  LEFT JOIN acupuncture_protocol_points app ON app.protocol_id = tc.acupuncture_protocol_id
  WHERE tp.created_at::date BETWEEN prev_from AND prev_to
    AND (_status = 'all' OR tp.status::text = _status)
    AND (_doctor = 'all' OR tp.created_by::text = _doctor)
    AND tc.acupuncture_protocol_id IS NOT NULL;

  RETURN jsonb_build_object(
    'current', jsonb_build_object(
      'from', _from, 'to', _to,
      'plans', COALESCE(cur_plans,0),
      'points', COALESCE(cur_points,0),
      'protocols', COALESCE(cur_protocols,0)
    ),
    'previous', jsonb_build_object(
      'from', prev_from, 'to', prev_to,
      'plans', COALESCE(prev_plans,0),
      'points', COALESCE(prev_points,0),
      'protocols', COALESCE(prev_protocols,0)
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_irt_plans_last_12m(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_irt_meridian_trends(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_irt_compare_periods(date,date,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.analytics_irt_dashboard(
  _from date,
  _to date,
  _status text DEFAULT 'issued',
  _doctor text DEFAULT 'all',
  _ttl_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  k text;
  cached jsonb;
  computed_at_v timestamptz;
  result jsonb;
BEGIN
  k := 'irt_dashboard:' || coalesce(_from::text,'') || ':' || coalesce(_to::text,'')
       || ':' || coalesce(_status,'') || ':' || coalesce(_doctor,'');

  SELECT payload, computed_at INTO cached, computed_at_v
  FROM public.analytics_cache WHERE cache_key = k;

  IF cached IS NOT NULL AND computed_at_v > now() - make_interval(mins => _ttl_minutes) THEN
    RETURN jsonb_set(cached, '{_cache}', to_jsonb('hit'::text));
  END IF;

  result := jsonb_build_object(
    'protocols',        to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_top_protocols(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'points',           to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_top_points(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'meridians',        to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_meridian_distribution(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'modality',         to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_modality_usage(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'per_month',        to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_plans_per_month(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'nosology',         to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_nosology_distribution(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'last_12m',         to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_plans_last_12m(_status,_doctor) t), '[]'::jsonb)),
    'meridian_trends',  to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_meridian_trends(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'compare',          public.analytics_irt_compare_periods(_from,_to,_status,_doctor)
  );

  INSERT INTO public.analytics_cache (cache_key, payload, computed_at)
  VALUES (k, result, now())
  ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, computed_at = EXCLUDED.computed_at;

  RETURN jsonb_set(result, '{_cache}', to_jsonb('miss'::text));
END;
$$;
