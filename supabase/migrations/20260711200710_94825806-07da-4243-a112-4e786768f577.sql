GRANT ALL ON public.orchestrator_call_metrics TO service_role;
GRANT SELECT ON public.orchestrator_call_metrics TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.orchestrator_call_metrics_id_seq TO service_role;