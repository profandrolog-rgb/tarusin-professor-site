DROP POLICY IF EXISTS "reference_ranges read for authenticated" ON public.reference_ranges;
CREATE POLICY "reference_ranges read for clinicians" ON public.reference_ranges FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'surgeon'));

DROP POLICY IF EXISTS "Authenticated can read peptides" ON public.peptides;
CREATE POLICY "peptides read for clinicians" ON public.peptides FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'surgeon'));

DROP POLICY IF EXISTS "rubric_embeddings auth read" ON public.rubric_embeddings;
CREATE POLICY "rubric_embeddings read for clinicians" ON public.rubric_embeddings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'surgeon'));

DROP POLICY IF EXISTS "pathways read for authenticated" ON public.pathways;
CREATE POLICY "pathways read for clinicians and parents" ON public.pathways FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'surgeon') OR public.has_role(auth.uid(),'parent'));