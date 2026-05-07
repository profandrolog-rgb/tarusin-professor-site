
CREATE TABLE public.checklist_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_slug text NOT NULL,
  answers jsonb NOT NULL,
  result_level text NOT NULL,
  result_score int,
  duration_sec int,
  anonymous_id uuid,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_responses_slug ON public.checklist_responses (checklist_slug);
CREATE INDEX idx_checklist_responses_created_at ON public.checklist_responses (created_at);
CREATE INDEX idx_checklist_responses_result_level ON public.checklist_responses (result_level);

ALTER TABLE public.checklist_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert checklist responses"
ON public.checklist_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view checklist responses"
ON public.checklist_responses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete checklist responses"
ON public.checklist_responses
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
