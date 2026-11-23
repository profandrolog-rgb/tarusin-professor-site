DROP POLICY IF EXISTS "Anyone can view clinical case images" ON public.clinical_case_images;
CREATE POLICY "View images of published clinical cases"
ON public.clinical_case_images FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.clinical_cases c
    WHERE c.id = clinical_case_images.case_id AND c.is_published = true
  )
);