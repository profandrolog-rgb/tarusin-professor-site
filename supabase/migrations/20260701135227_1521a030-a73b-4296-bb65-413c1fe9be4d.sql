DROP POLICY IF EXISTS "Public can view published questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can view all questions" ON public.questions;

CREATE POLICY "Public can view published questions"
ON public.questions
FOR SELECT
TO anon, authenticated
USING (is_published = true AND answer_text IS NOT NULL);

CREATE POLICY "Admins can view all questions"
ON public.questions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT (id, author_name, question_text, answer_text, is_published, status, created_at, updated_at, answered_at)
ON public.questions TO anon, authenticated;

GRANT SELECT (author_email), UPDATE, DELETE
ON public.questions TO authenticated;

GRANT INSERT (author_name, author_email, question_text)
ON public.questions TO anon, authenticated;

GRANT SELECT ON public.questions_public TO anon, authenticated;