
-- 1. image_references table
CREATE TABLE IF NOT EXISTS public.image_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path text NOT NULL,
  title text,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  source_message_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_references TO authenticated;
GRANT ALL ON public.image_references TO service_role;

ALTER TABLE public.image_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "image_references_owner_all" ON public.image_references
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "image_references_admin_all" ON public.image_references
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS image_references_user_id_idx ON public.image_references(user_id, created_at DESC);

-- 2. Extend ai_messages
ALTER TABLE public.ai_messages
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS image_model text,
  ADD COLUMN IF NOT EXISTS image_cost numeric(10,6),
  ADD COLUMN IF NOT EXISTS image_refs text[];

-- 3. Storage policies for generated-images (user can manage own folder)
CREATE POLICY "generated_images_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'generated-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "generated_images_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "generated_images_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'generated-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "generated_images_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'generated-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. Storage policies for reference-library
CREATE POLICY "reference_library_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reference-library' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "reference_library_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reference-library' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "reference_library_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'reference-library' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "reference_library_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reference-library' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- update trigger
DROP TRIGGER IF EXISTS image_references_updated_at ON public.image_references;
CREATE TRIGGER image_references_updated_at
  BEFORE UPDATE ON public.image_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
