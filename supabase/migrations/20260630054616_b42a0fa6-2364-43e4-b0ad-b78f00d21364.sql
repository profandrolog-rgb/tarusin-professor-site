
-- 1) Revoke EXECUTE from anon on SECURITY DEFINER functions that should not be callable without auth.
-- Keep public-callable: get_public_plan, increment_public_plan_view, has_role, notify_appointment_telegram (trigger).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname NOT IN ('get_public_plan','increment_public_plan_view','has_role')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, public', r.sig);
  END LOOP;
END $$;

-- 2) Revoke EXECUTE from authenticated for pure trigger/internal helpers (never called from client).
DO $$
DECLARE r record;
  internal text[] := ARRAY[
    'protect_patient_card_admin_fields',
    'assign_course_number',
    'next_history_number',
    'snapshot_treatment_plan_version',
    'refresh_treatment_plans_search',
    'invalidate_irt_analytics_cache',
    'append_analysis_batch_log',
    'append_embedding_batch_log',
    'append_translation_batch_log',
    '_analytics_filter_plans',
    'notify_appointment_telegram',
    'delete_email',
    'enqueue_email',
    'read_email_batch',
    'move_to_dlq'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname = ANY(internal)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated, anon, public', r.sig);
  END LOOP;
END $$;

-- 3) Tighten comment SELECT policies: stop returning author_email through "own row" branch.
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.blog_comments;
CREATE POLICY "Anyone can view approved comments"
ON public.blog_comments
FOR SELECT
USING (is_approved = true OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.research_article_comments;
CREATE POLICY "Anyone can view approved comments"
ON public.research_article_comments
FOR SELECT
USING (is_approved = true OR has_role(auth.uid(), 'admin'::app_role));

-- 4) Allow authenticated users to read repertory chapters (needed by complaint repertorization UI).
CREATE POLICY "Authenticated can read repertory_chapters"
ON public.repertory_chapters
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON public.repertory_chapters TO authenticated;
