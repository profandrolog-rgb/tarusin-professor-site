
ALTER TABLE public.research_reviews
  ADD COLUMN IF NOT EXISTS source_materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS refinement_history jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "research_materials_admin_read" ON storage.objects;
DROP POLICY IF EXISTS "research_materials_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "research_materials_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "research_materials_admin_delete" ON storage.objects;

CREATE POLICY "research_materials_admin_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'research-materials'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));

CREATE POLICY "research_materials_admin_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'research-materials'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));

CREATE POLICY "research_materials_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'research-materials'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));

CREATE POLICY "research_materials_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'research-materials'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
