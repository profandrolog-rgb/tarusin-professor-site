DROP POLICY "Public can view published questions" ON public.questions;

DROP POLICY "Case images are publicly accessible" ON storage.objects;

CREATE POLICY "Case images readable for published cases"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-images'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.clinical_case_images i
      JOIN public.clinical_cases c ON c.id = i.case_id
      WHERE i.image_path = storage.objects.name
        AND c.is_published = true
    )
  )
);