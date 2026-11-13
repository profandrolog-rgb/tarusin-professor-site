CREATE OR REPLACE FUNCTION public.is_clinical_staff(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'admin') OR public.has_role(_uid,'editor') OR public.has_role(_uid,'surgeon')
$$;

DROP POLICY IF EXISTS "Anyone can read repertories" ON public.repertories;
CREATE POLICY "Staff read repertories" ON public.repertories FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can read repertory_chapters" ON public.repertory_chapters;
CREATE POLICY "Staff read repertory_chapters" ON public.repertory_chapters FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
DROP POLICY IF EXISTS "symptom_synonyms public read" ON public.symptom_synonyms;
CREATE POLICY "Staff read symptom_synonyms" ON public.symptom_synonyms FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
DROP POLICY IF EXISTS "spellcheck_dictionary_select_authenticated" ON public.spellcheck_dictionary;
CREATE POLICY "spellcheck_dictionary_select_staff" ON public.spellcheck_dictionary FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
DROP POLICY IF EXISTS "Anyone authenticated can read templates" ON public.visit_text_templates;
CREATE POLICY "Staff read visit text templates" ON public.visit_text_templates FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can submit a question" ON public.questions;
CREATE POLICY "Anyone can submit a question" ON public.questions FOR INSERT TO anon, authenticated
WITH CHECK (is_published = false AND answer_text IS NULL AND answered_at IS NULL
  AND length(question_text) BETWEEN 1 AND 5000 AND length(coalesce(author_name,'')) <= 200 AND length(coalesce(author_email,'')) <= 320);

DROP POLICY IF EXISTS "Anyone can insert checklist responses" ON public.checklist_responses;
CREATE POLICY "Anyone can insert checklist responses" ON public.checklist_responses FOR INSERT TO anon, authenticated
WITH CHECK (length(checklist_slug) BETWEEN 1 AND 200 AND length(coalesce(respondent_name,'')) <= 200
  AND length(coalesce(user_agent,'')) <= 1000 AND length(answers::text) <= 100000);