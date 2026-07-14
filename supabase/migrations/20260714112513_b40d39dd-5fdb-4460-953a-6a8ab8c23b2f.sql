
CREATE TABLE public.image_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL,
  bucket text NOT NULL DEFAULT 'disease-media',
  label text NOT NULL DEFAULT 'default',
  annotation_data jsonb NOT NULL DEFAULT '{"shapes":[],"imageWidth":0,"imageHeight":0}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX image_annotations_path_label_idx
  ON public.image_annotations (image_path, label);
CREATE INDEX image_annotations_path_idx ON public.image_annotations (image_path);

GRANT SELECT ON public.image_annotations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_annotations TO authenticated;
GRANT ALL ON public.image_annotations TO service_role;

ALTER TABLE public.image_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read image_annotations"
  ON public.image_annotations FOR SELECT
  USING (true);

CREATE POLICY "admins insert image_annotations"
  ON public.image_annotations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update image_annotations"
  ON public.image_annotations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete image_annotations"
  ON public.image_annotations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_image_annotations_updated_at
  BEFORE UPDATE ON public.image_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
