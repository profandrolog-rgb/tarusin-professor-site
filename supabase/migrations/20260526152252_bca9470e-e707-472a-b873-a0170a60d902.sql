
-- Cache invalidation for IRT analytics dashboard
CREATE OR REPLACE FUNCTION public.invalidate_irt_analytics_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.analytics_cache WHERE cache_key LIKE 'irt_dashboard:%';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_irt_cache_plans ON public.treatment_plans;
CREATE TRIGGER trg_invalidate_irt_cache_plans
AFTER INSERT OR UPDATE OR DELETE ON public.treatment_plans
FOR EACH STATEMENT EXECUTE FUNCTION public.invalidate_irt_analytics_cache();

DROP TRIGGER IF EXISTS trg_invalidate_irt_cache_items ON public.treatment_plan_items;
CREATE TRIGGER trg_invalidate_irt_cache_items
AFTER INSERT OR UPDATE OR DELETE ON public.treatment_plan_items
FOR EACH STATEMENT EXECUTE FUNCTION public.invalidate_irt_analytics_cache();

DROP TRIGGER IF EXISTS trg_invalidate_irt_cache_protocols ON public.acupuncture_protocols;
CREATE TRIGGER trg_invalidate_irt_cache_protocols
AFTER INSERT OR UPDATE OR DELETE ON public.acupuncture_protocols
FOR EACH STATEMENT EXECUTE FUNCTION public.invalidate_irt_analytics_cache();

DROP TRIGGER IF EXISTS trg_invalidate_irt_cache_protocol_points ON public.acupuncture_protocol_points;
CREATE TRIGGER trg_invalidate_irt_cache_protocol_points
AFTER INSERT OR UPDATE OR DELETE ON public.acupuncture_protocol_points
FOR EACH STATEMENT EXECUTE FUNCTION public.invalidate_irt_analytics_cache();
