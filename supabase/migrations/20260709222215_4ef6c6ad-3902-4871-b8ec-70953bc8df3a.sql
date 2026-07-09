CREATE TABLE public.orchestrator_call_metrics (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  model text NOT NULL,
  purpose text NOT NULL,
  attempt smallint NOT NULL,
  duration_ms integer NOT NULL,
  ok boolean NOT NULL,
  error_kind text,
  error_message text
);
CREATE INDEX orchestrator_call_metrics_created_at_idx ON public.orchestrator_call_metrics (created_at DESC);
CREATE INDEX orchestrator_call_metrics_model_idx ON public.orchestrator_call_metrics (model, created_at DESC);

GRANT SELECT ON public.orchestrator_call_metrics TO authenticated;
GRANT ALL ON public.orchestrator_call_metrics TO service_role;

ALTER TABLE public.orchestrator_call_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read orchestrator metrics"
  ON public.orchestrator_call_metrics
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));