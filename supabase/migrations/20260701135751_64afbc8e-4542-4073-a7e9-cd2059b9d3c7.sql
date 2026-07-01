CREATE TABLE IF NOT EXISTS public.admin_smoke_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deploy_id TEXT,
  deploy_status TEXT,
  route TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  error TEXT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_smoke_checks TO authenticated;
GRANT ALL ON public.admin_smoke_checks TO service_role;

ALTER TABLE public.admin_smoke_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read smoke checks"
  ON public.admin_smoke_checks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert smoke checks"
  ON public.admin_smoke_checks FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_smoke_checks_created ON public.admin_smoke_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_smoke_checks_deploy ON public.admin_smoke_checks(deploy_id);