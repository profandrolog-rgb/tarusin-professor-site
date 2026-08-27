-- Hide submitter emails from all direct table reads (including logged-in users)
REVOKE SELECT (author_email) ON public.questions FROM anon, authenticated, PUBLIC;

-- Admin-only access to full question rows, including emails
CREATE OR REPLACE FUNCTION public.admin_list_questions()
RETURNS TABLE (
  id uuid,
  author_name text,
  author_email text,
  question_text text,
  answer_text text,
  is_published boolean,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  answered_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.author_name, q.author_email, q.question_text, q.answer_text,
         q.is_published, q.status, q.created_at, q.updated_at, q.answered_at
  FROM public.questions q
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY q.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.admin_list_questions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_questions() TO authenticated;