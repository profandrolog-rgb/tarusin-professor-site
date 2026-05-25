
-- analytics_cache
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage analytics_cache" ON public.analytics_cache;
CREATE POLICY "Admins manage analytics_cache" ON public.analytics_cache
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Helper: filtered plans CTE function returns set of plan ids
CREATE OR REPLACE FUNCTION public._analytics_filter_plans(_from date, _to date, _status text, _doctor text)
RETURNS TABLE(id uuid, duration_days integer, total_cost_estimate numeric, based_on_template uuid, created_by uuid, ref_date date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.duration_days, p.total_cost_estimate, p.based_on_template, p.created_by,
         COALESCE(p.issued_at, p.created_at::date) AS ref_date
  FROM public.treatment_plans p
  WHERE (_from IS NULL OR COALESCE(p.issued_at, p.created_at::date) >= _from)
    AND (_to   IS NULL OR COALESCE(p.issued_at, p.created_at::date) <= _to)
    AND (_status = 'all' OR p.status::text = _status)
    AND (_doctor = 'all' OR _doctor IS NULL OR p.created_by = _doctor::uuid)
$$;

-- 1) TOP catalog
CREATE OR REPLACE FUNCTION public.analytics_top_catalog(_from date, _to date, _status text, _doctor text, _limit int DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_plans bigint;
  result jsonb;
BEGIN
  SELECT count(*) INTO total_plans FROM public._analytics_filter_plans(_from,_to,_status,_doctor);
  IF total_plans = 0 THEN RETURN '[]'::jsonb; END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.rank), '[]'::jsonb) INTO result
  FROM (
    SELECT
      row_number() OVER (ORDER BY count(DISTINCT i.plan_id) DESC, max(i.name_snapshot) ASC) AS rank,
      COALESCE(c.name, i.name_snapshot, '—') AS name,
      COALESCE(c.category::text, i.section_category::text) AS section,
      count(DISTINCT i.plan_id) AS usage_count,
      round(100.0 * count(DISTINCT i.plan_id) / total_plans, 1) AS pct_of_plans
    FROM public.treatment_plan_items i
    JOIN public._analytics_filter_plans(_from,_to,_status,_doctor) fp ON fp.id = i.plan_id
    LEFT JOIN public.treatment_catalog c ON c.id = i.catalog_id
    GROUP BY COALESCE(c.name, i.name_snapshot, '—'), COALESCE(c.category::text, i.section_category::text)
    ORDER BY usage_count DESC
    LIMIT _limit
  ) t;
  RETURN result;
END $$;

-- 2) TOP templates
CREATE OR REPLACE FUNCTION public.analytics_top_templates(_from date, _to date, _status text, _doctor text, _limit int DEFAULT 10)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.rank), '[]'::jsonb)
  FROM (
    SELECT
      row_number() OVER (ORDER BY count(*) DESC, max(pt.name) ASC) AS rank,
      pt.name,
      count(*) AS usage_count,
      round(avg(fp.duration_days)::numeric, 1) AS avg_duration_days,
      round(avg(fp.total_cost_estimate)::numeric, 0) AS avg_cost
    FROM public._analytics_filter_plans(_from,_to,_status,_doctor) fp
    JOIN public.protocol_templates pt ON pt.id = fp.based_on_template
    GROUP BY pt.id, pt.name
    ORDER BY usage_count DESC
    LIMIT _limit
  ) t
$$;

-- 3) Avg cost by tag
CREATE OR REPLACE FUNCTION public.analytics_avg_cost_by_tag(_from date, _to date, _status text, _doctor text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.plans_count DESC), '[]'::jsonb)
  FROM (
    SELECT
      tag,
      round(avg(total_cost_estimate)::numeric, 0) AS avg_cost,
      count(DISTINCT plan_id) AS plans_count
    FROM (
      SELECT DISTINCT fp.id AS plan_id, fp.total_cost_estimate, unnest(pt.tags) AS tag
      FROM public._analytics_filter_plans(_from,_to,_status,_doctor) fp
      JOIN public.protocol_templates pt ON pt.id = fp.based_on_template
      WHERE pt.tags IS NOT NULL AND array_length(pt.tags,1) > 0
        AND fp.total_cost_estimate IS NOT NULL
    ) sub
    GROUP BY tag
    HAVING count(DISTINCT plan_id) >= 1
    ORDER BY plans_count DESC
    LIMIT 20
  ) t
$$;

-- 4) Plans per month (last 12)
CREATE OR REPLACE FUNCTION public.analytics_plans_per_month(_from date, _to date, _status text, _doctor text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH months AS (
    SELECT to_char(generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month'), 'YYYY-MM') AS month
  ),
  agg AS (
    SELECT to_char(ref_date, 'YYYY-MM') AS month, count(*) AS count
    FROM public._analytics_filter_plans(_from,_to,_status,_doctor)
    GROUP BY 1
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('month', m.month, 'count', COALESCE(a.count, 0)) ORDER BY m.month), '[]'::jsonb)
  FROM months m LEFT JOIN agg a ON a.month = m.month
$$;

-- 5) Duration histogram
CREATE OR REPLACE FUNCTION public.analytics_duration_histogram(_from date, _to date, _status text, _doctor text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH buckets(idx, bucket, lo, hi) AS (VALUES
    (1, '1-5'::text,   1, 5),
    (2, '6-10',        6, 10),
    (3, '11-14',       11, 14),
    (4, '15-21',       15, 21),
    (5, '22-30',       22, 30),
    (6, '30+',         31, 100000)
  ),
  agg AS (
    SELECT b.idx, b.bucket, count(fp.id) AS count
    FROM buckets b
    LEFT JOIN public._analytics_filter_plans(_from,_to,_status,_doctor) fp
      ON fp.duration_days BETWEEN b.lo AND b.hi
    GROUP BY b.idx, b.bucket
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('bucket', bucket, 'count', count) ORDER BY idx), '[]'::jsonb)
  FROM agg
$$;

-- 6) Section usage (which of 13 categories filled how often)
CREATE OR REPLACE FUNCTION public.analytics_section_usage(_from date, _to date, _status text, _doctor text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE total bigint; result jsonb;
BEGIN
  SELECT count(*) INTO total
  FROM (
    SELECT DISTINCT i.plan_id, i.section_category
    FROM public.treatment_plan_items i
    JOIN public._analytics_filter_plans(_from,_to,_status,_doctor) fp ON fp.id = i.plan_id
  ) s;
  IF total = 0 THEN RETURN '[]'::jsonb; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'section', section, 'count', cnt,
    'pct', round(100.0 * cnt / total, 1)
  ) ORDER BY cnt DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT i.section_category::text AS section, count(DISTINCT i.plan_id) AS cnt
    FROM public.treatment_plan_items i
    JOIN public._analytics_filter_plans(_from,_to,_status,_doctor) fp ON fp.id = i.plan_id
    GROUP BY i.section_category
  ) s;
  RETURN result;
END $$;

-- 7) Doctors list
CREATE OR REPLACE FUNCTION public.analytics_doctors_list()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', d.created_by, 'email', COALESCE(pr.email, d.created_by::text), 'plans_count', d.cnt) ORDER BY d.cnt DESC), '[]'::jsonb)
  FROM (
    SELECT created_by, count(*) AS cnt
    FROM public.treatment_plans
    WHERE created_by IS NOT NULL
    GROUP BY created_by
  ) d
  LEFT JOIN public.profiles pr ON pr.user_id = d.created_by
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.analytics_top_catalog(date,date,text,text,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_templates(date,date,text,text,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_avg_cost_by_tag(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_plans_per_month(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_duration_histogram(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_section_usage(date,date,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_doctors_list() TO authenticated;
