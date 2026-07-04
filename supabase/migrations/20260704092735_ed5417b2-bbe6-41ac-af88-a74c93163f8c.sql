
CREATE TABLE public.map_schemas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id uuid NOT NULL REFERENCES public.metabolic_maps(id) ON DELETE CASCADE,
  pathway_code text NOT NULL,
  scene jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_id, pathway_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_schemas TO authenticated;
GRANT ALL ON public.map_schemas TO service_role;

ALTER TABLE public.map_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage map schemas"
  ON public.map_schemas
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX map_schemas_map_id_idx ON public.map_schemas(map_id);

CREATE TRIGGER update_map_schemas_updated_at
  BEFORE UPDATE ON public.map_schemas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
