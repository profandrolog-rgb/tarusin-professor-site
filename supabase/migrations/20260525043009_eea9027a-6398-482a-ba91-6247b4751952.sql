-- 1. Patient contact fields
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- 2. memo_send_log
CREATE TABLE IF NOT EXISTS public.memo_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','telegram','link')),
  recipient TEXT,
  content_kind TEXT NOT NULL CHECK (content_kind IN ('link','pdf','both')),
  status TEXT NOT NULL CHECK (status IN ('sent','failed','queued')),
  error TEXT,
  sent_by UUID,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memo_send_log_plan ON public.memo_send_log(plan_id, sent_at DESC);

ALTER TABLE public.memo_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage memo_send_log"
  ON public.memo_send_log
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Private storage bucket for memo PDFs
INSERT INTO storage.buckets (id, name, public)
  VALUES ('memo-pdfs', 'memo-pdfs', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins manage memo-pdfs"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'memo-pdfs' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'memo-pdfs' AND has_role(auth.uid(), 'admin'::app_role));