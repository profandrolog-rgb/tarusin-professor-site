
CREATE TABLE public.acupuncture_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  indications text,
  contraindications text,
  session_count integer DEFAULT 10,
  session_duration_min integer DEFAULT 30,
  frequency text,
  tags text[] DEFAULT '{}',
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.acupuncture_protocol_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.acupuncture_protocols(id) ON DELETE CASCADE,
  acupoint_id uuid NOT NULL REFERENCES public.acupoints(id) ON DELETE RESTRICT,
  order_index integer NOT NULL DEFAULT 0,
  manipulation text,
  depth_mm text,
  retention_min integer,
  side text DEFAULT 'bilateral',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acupuncture_protocol_points_protocol ON public.acupuncture_protocol_points(protocol_id, order_index);

ALTER TABLE public.acupuncture_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acupuncture_protocol_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage acupuncture_protocols" ON public.acupuncture_protocols
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage acupuncture_protocol_points" ON public.acupuncture_protocol_points
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_acupuncture_protocols_updated_at
  BEFORE UPDATE ON public.acupuncture_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS acupuncture_protocol_id uuid REFERENCES public.acupuncture_protocols(id) ON DELETE SET NULL;
