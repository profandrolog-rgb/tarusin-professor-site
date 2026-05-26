
CREATE OR REPLACE FUNCTION public.analytics_irt_dashboard(
  _from date,
  _to date,
  _status text DEFAULT 'issued',
  _doctor text DEFAULT 'all',
  _ttl_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    'protocols',  to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_top_protocols(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'points',     to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_top_points(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'meridians',  to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_meridian_distribution(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'modality',   to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_modality_usage(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'per_month',  to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_plans_per_month(_from,_to,_status,_doctor) t), '[]'::jsonb)),
    'nosology',   to_jsonb(coalesce((SELECT jsonb_agg(t) FROM public.analytics_irt_nosology_distribution(_from,_to,_status,_doctor) t), '[]'::jsonb))
  );

  INSERT INTO public.analytics_cache (cache_key, payload, computed_at)
  VALUES (k, result, now())
  ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, computed_at = EXCLUDED.computed_at;

  RETURN jsonb_set(result, '{_cache}', to_jsonb('miss'::text));
END;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_irt_dashboard(date,date,text,text,integer) TO authenticated;
