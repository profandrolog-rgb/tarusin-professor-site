
CREATE TABLE public.parents_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('article','video','podcast')),
  title TEXT NOT NULL,
  description TEXT,
  title_en TEXT,
  description_en TEXT,
  url TEXT NOT NULL,
  source TEXT,
  image_path TEXT,
  image_url TEXT,
  emoji TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.parents_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parents_materials TO authenticated;
GRANT ALL ON public.parents_materials TO service_role;

ALTER TABLE public.parents_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published materials"
  ON public.parents_materials FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage all materials"
  ON public.parents_materials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_parents_materials_updated_at
  BEFORE UPDATE ON public.parents_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_parents_materials_kind_sort ON public.parents_materials(kind, sort_order);
