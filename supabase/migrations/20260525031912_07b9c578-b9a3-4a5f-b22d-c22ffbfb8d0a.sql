
-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- treatment_catalog: auto-price fields
ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS price_auto numeric,
  ADD COLUMN IF NOT EXISTS price_auto_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS price_auto_sources jsonb,
  ADD COLUMN IF NOT EXISTS price_source_preference text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS parse_query text;

-- lab_tests_catalog: auto-price fields
ALTER TABLE public.lab_tests_catalog
  ADD COLUMN IF NOT EXISTS price_auto numeric,
  ADD COLUMN IF NOT EXISTS price_auto_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS price_auto_sources jsonb,
  ADD COLUMN IF NOT EXISTS kdl_slug text;

-- price_parse_log
CREATE TABLE IF NOT EXISTS public.price_parse_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  status text NOT NULL,
  sources_count integer DEFAULT 0,
  price_result numeric,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_parse_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage price parse log" ON public.price_parse_log;
CREATE POLICY "Admins manage price parse log"
ON public.price_parse_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_price_parse_log_entity ON public.price_parse_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_catalog_price_auto_updated ON public.treatment_catalog (price_auto_updated_at NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_lab_tests_catalog_price_auto_updated ON public.lab_tests_catalog (price_auto_updated_at NULLS FIRST);
