
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP MATERIALIZED VIEW IF EXISTS public.treatment_plans_search;

CREATE MATERIALIZED VIEW public.treatment_plans_search AS
SELECT
  tp.id AS plan_id,
  tp.patient_id,
  pt.full_name        AS patient_full_name,
  pt.birth_date       AS patient_birth_date,
  CASE WHEN pt.birth_date IS NOT NULL
       THEN EXTRACT(YEAR FROM age(tp.issued_at::timestamp, pt.birth_date::timestamp))::int
       ELSE NULL END  AS patient_age_years,
  tp.issued_at,
  tp.status::text     AS status,
  tp.mode::text       AS mode,
  tp.duration_days,
  tp.total_cost_estimate,
  tp.course_number,
  tp.diagnosis_short,
  tp.clinical_summary,
  tpl.name            AS template_name,
  COALESCE(tpl.tags, '{}'::text[]) AS template_tags,
  COALESCE(
    (SELECT array_agg(DISTINCT COALESCE(tc.name, i.name_snapshot))
     FROM public.treatment_plan_items i
     LEFT JOIN public.treatment_catalog tc ON tc.id = i.catalog_id
     WHERE i.plan_id = tp.id),
    '{}'::text[]
  ) AS item_names,
  COALESCE(
    (SELECT array_agg(DISTINCT x) FROM (
       SELECT unnest(ARRAY[i.inn_snapshot, tc.inn]) AS x
       FROM public.treatment_plan_items i
       LEFT JOIN public.treatment_catalog tc ON tc.id = i.catalog_id
       WHERE i.plan_id = tp.id
     ) s WHERE x IS NOT NULL AND x <> ''),
    '{}'::text[]
  ) AS item_inns,
  -- combined search text
  concat_ws(' ',
    pt.full_name,
    tp.diagnosis_short,
    tp.clinical_summary,
    tpl.name,
    array_to_string(COALESCE(tpl.tags, '{}'::text[]), ' '),
    (SELECT string_agg(DISTINCT COALESCE(tc.name, i.name_snapshot), ' ')
       FROM public.treatment_plan_items i
       LEFT JOIN public.treatment_catalog tc ON tc.id = i.catalog_id
       WHERE i.plan_id = tp.id),
    (SELECT string_agg(DISTINCT COALESCE(tc.inn, i.inn_snapshot), ' ')
       FROM public.treatment_plan_items i
       LEFT JOIN public.treatment_catalog tc ON tc.id = i.catalog_id
       WHERE i.plan_id = tp.id)
  ) AS search_text,
  to_tsvector('russian',
    coalesce(pt.full_name,'') || ' ' ||
    coalesce(tp.diagnosis_short,'') || ' ' ||
    coalesce(tp.clinical_summary,'') || ' ' ||
    coalesce(tpl.name,'') || ' ' ||
    coalesce(array_to_string(tpl.tags, ' '), '') || ' ' ||
    coalesce((SELECT string_agg(DISTINCT COALESCE(tc.name, i.name_snapshot), ' ')
       FROM public.treatment_plan_items i
       LEFT JOIN public.treatment_catalog tc ON tc.id = i.catalog_id
       WHERE i.plan_id = tp.id), '') || ' ' ||
    coalesce((SELECT string_agg(DISTINCT COALESCE(tc.inn, i.inn_snapshot), ' ')
       FROM public.treatment_plan_items i
       LEFT JOIN public.treatment_catalog tc ON tc.id = i.catalog_id
       WHERE i.plan_id = tp.id), '')
  ) AS search_vec
FROM public.treatment_plans tp
LEFT JOIN public.patients pt ON pt.id = tp.patient_id
LEFT JOIN public.protocol_templates tpl ON tpl.id = tp.based_on_template;

CREATE UNIQUE INDEX treatment_plans_search_pk ON public.treatment_plans_search(plan_id);
CREATE INDEX treatment_plans_search_vec_idx ON public.treatment_plans_search USING GIN(search_vec);
CREATE INDEX treatment_plans_search_trgm_idx ON public.treatment_plans_search USING GIN(search_text gin_trgm_ops);
CREATE INDEX treatment_plans_search_issued_idx ON public.treatment_plans_search(issued_at DESC);
CREATE INDEX treatment_plans_search_cost_idx ON public.treatment_plans_search(total_cost_estimate);

-- Refresh helper
CREATE OR REPLACE FUNCTION public.refresh_treatment_plans_search()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.treatment_plans_search;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW public.treatment_plans_search;
END;
$$;

-- Search RPC: admin-only
CREATE OR REPLACE FUNCTION public.search_treatment_plans(
  _q text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL,
  _cost_min numeric DEFAULT NULL,
  _cost_max numeric DEFAULT NULL,
  _age_min int DEFAULT NULL,
  _age_max int DEFAULT NULL,
  _limit int DEFAULT 500
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  ts_q tsquery;
  trimmed text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  trimmed := nullif(btrim(coalesce(_q, '')), '');
  IF trimmed IS NOT NULL THEN
    BEGIN
      ts_q := plainto_tsquery('russian', trimmed);
    EXCEPTION WHEN OTHERS THEN
      ts_q := NULL;
    END;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.rank DESC, r.issued_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      s.plan_id,
      s.patient_id,
      s.patient_full_name,
      s.patient_age_years,
      s.issued_at,
      s.status,
      s.mode,
      s.duration_days,
      s.total_cost_estimate,
      s.course_number,
      s.diagnosis_short,
      s.template_name,
      s.template_tags,
      s.item_names,
      CASE
        WHEN ts_q IS NOT NULL THEN ts_rank(s.search_vec, ts_q) + similarity(s.search_text, trimmed) * 0.3
        WHEN trimmed IS NOT NULL THEN similarity(s.search_text, trimmed)
        ELSE 0
      END AS rank,
      CASE
        WHEN trimmed IS NOT NULL THEN
          ts_headline('russian', s.search_text, COALESCE(ts_q, plainto_tsquery('russian', '_nope_')),
            'StartSel=<mark>,StopSel=</mark>,MaxWords=18,MinWords=5,ShortWord=2,MaxFragments=2')
        ELSE NULL
      END AS snippet
    FROM public.treatment_plans_search s
    WHERE
      (_from IS NULL OR s.issued_at >= _from)
      AND (_to IS NULL OR s.issued_at <= _to)
      AND (_cost_min IS NULL OR s.total_cost_estimate >= _cost_min)
      AND (_cost_max IS NULL OR s.total_cost_estimate <= _cost_max)
      AND (_age_min IS NULL OR s.patient_age_years >= _age_min)
      AND (_age_max IS NULL OR s.patient_age_years <= _age_max)
      AND (
        trimmed IS NULL
        OR (ts_q IS NOT NULL AND s.search_vec @@ ts_q)
        OR s.search_text ILIKE '%' || trimmed || '%'
        OR similarity(s.search_text, trimmed) > 0.2
      )
    ORDER BY rank DESC, s.issued_at DESC
    LIMIT _limit
  ) r;

  RETURN result;
END;
$$;

-- Initial refresh
REFRESH MATERIALIZED VIEW public.treatment_plans_search;
