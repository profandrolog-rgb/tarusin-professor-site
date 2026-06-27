
-- referral_specialists: restrict reading personal phone numbers to admin/editor only.
DROP POLICY IF EXISTS "Authenticated can read referral_specialists" ON public.referral_specialists;

CREATE POLICY "Admins/editors can read referral_specialists"
  ON public.referral_specialists FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

COMMENT ON COLUMN public.referral_specialists.phone IS
  'Personal phone of medical specialist. SELECT restricted to admin/editor roles via RLS.';

-- questions: defense-in-depth column-level REVOKE so author_email can never
-- be read directly even if a future SELECT policy is added by mistake.
REVOKE SELECT (author_email) ON public.questions FROM anon, authenticated, PUBLIC;

COMMENT ON COLUMN public.questions.author_email IS
  'PII. Column-level SELECT revoked from anon/authenticated. Only service_role / admin (via questions table policies) may access. Public consumption uses questions_public view which excludes this column.';
