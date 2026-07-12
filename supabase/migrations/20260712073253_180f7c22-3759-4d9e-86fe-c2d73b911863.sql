
-- Restrict internal clinical catalogs to staff roles only (admin/editor/surgeon)
DROP POLICY IF EXISTS "Authenticated can read catalog" ON public.treatment_catalog;
CREATE POLICY "Staff can read treatment catalog"
  ON public.treatment_catalog FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'surgeon'::app_role)
  );

DROP POLICY IF EXISTS "Anyone can view medication_digests" ON public.medication_digests;
CREATE POLICY "Staff can read medication digests"
  ON public.medication_digests FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'surgeon'::app_role)
  );

-- Restrict private 'videos' storage bucket to staff roles
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;
CREATE POLICY "Staff can view videos bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'editor'::app_role)
      OR has_role(auth.uid(), 'surgeon'::app_role)
    )
  );
