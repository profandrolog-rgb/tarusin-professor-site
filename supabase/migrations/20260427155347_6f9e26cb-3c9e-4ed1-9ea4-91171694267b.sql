DROP POLICY IF EXISTS "Admins can delete research" ON public.research_articles;
CREATE POLICY "Admins and editors can delete research"
ON public.research_articles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'editor'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete attachments" ON public.research_article_attachments;
CREATE POLICY "Admins and editors can delete attachments"
ON public.research_article_attachments
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'editor'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete research attachments" ON storage.objects;
CREATE POLICY "Admins and editors can delete research attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'research-attachments'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'editor'::public.app_role)
  )
);