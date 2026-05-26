
CREATE OR REPLACE FUNCTION public.analytics_irt_nosology_distribution(
  _from date DEFAULT NULL, _to date DEFAULT NULL,
  _status text DEFAULT 'issued', _doctor text DEFAULT 'all'
) RETURNS TABLE(tag text, usage_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(tag_value, ''), 'Без тега') AS tag, COUNT(*)::bigint
  FROM (
    SELECT unnest(COALESCE(ap.tags, ARRAY[]::text[])) AS tag_value
    FROM treatment_plan_items tpi
    JOIN treatment_plans tp ON tp.id = tpi.plan_id
    JOIN treatment_catalog tc ON tc.id = tpi.catalog_id
    JOIN acupuncture_protocols ap ON ap.id = tc.acupuncture_protocol_id
    WHERE (_from IS NULL OR tp.created_at::date >= _from)
      AND (_to IS NULL OR tp.created_at::date <= _to)
      AND (_status = 'all' OR tp.status::text = _status)
      AND (_doctor = 'all' OR tp.created_by::text = _doctor)
      AND tc.acupuncture_protocol_id IS NOT NULL
  ) sub
  GROUP BY tag_value
  ORDER BY 2 DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_irt_nosology_distribution(date,date,text,text) TO authenticated;
