CREATE OR REPLACE VIEW public.questions_public
WITH (security_barrier = true)
AS
SELECT
  id,
  author_name,
  question_text,
  answer_text,
  is_published,
  status,
  created_at,
  updated_at,
  answered_at
FROM public.questions
WHERE is_published = true
   OR public.has_role(auth.uid(), 'admin'::public.app_role);

REVOKE ALL ON public.questions_public FROM PUBLIC;
GRANT SELECT ON public.questions_public TO anon, authenticated;

REVOKE SELECT ON public.questions FROM anon, authenticated;