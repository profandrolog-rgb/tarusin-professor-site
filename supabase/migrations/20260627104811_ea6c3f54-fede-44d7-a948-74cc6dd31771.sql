
CREATE TABLE public.agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  task TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'openai/gpt-5.4',
  status TEXT NOT NULL DEFAULT 'running',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_answer TEXT,
  pending_approval JSONB,
  total_steps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_runs TO authenticated;
GRANT ALL ON public.agent_runs TO service_role;

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent runs"
  ON public.agent_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_runs_user_created ON public.agent_runs(user_id, created_at DESC);
CREATE INDEX idx_agent_runs_patient ON public.agent_runs(patient_id) WHERE patient_id IS NOT NULL;

CREATE TRIGGER trg_agent_runs_updated
  BEFORE UPDATE ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
