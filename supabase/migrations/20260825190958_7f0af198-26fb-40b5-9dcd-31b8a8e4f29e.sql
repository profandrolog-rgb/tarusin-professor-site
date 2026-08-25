-- 1) Comments: hide author_email and full rows from public; serve public reads via definer views
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.blog_comments;
CREATE POLICY "Admins and authors can view comment rows"
ON public.blog_comments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.research_article_comments;
CREATE POLICY "Admins and authors can view comment rows"
ON public.research_article_comments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

REVOKE SELECT ON public.blog_comments FROM anon;
REVOKE SELECT ON public.research_article_comments FROM anon;

CREATE OR REPLACE VIEW public.blog_comments_public AS
SELECT id, post_id, user_id, content, is_approved, created_at
FROM public.blog_comments
WHERE is_approved = true;
ALTER VIEW public.blog_comments_public SET (security_invoker = false, security_barrier = true);
GRANT SELECT ON public.blog_comments_public TO anon, authenticated;

CREATE OR REPLACE VIEW public.research_article_comments_public AS
SELECT id, article_id, user_id, author_name, content, is_approved, created_at
FROM public.research_article_comments
WHERE is_approved = true;
ALTER VIEW public.research_article_comments_public SET (security_invoker = false, security_barrier = true);
GRANT SELECT ON public.research_article_comments_public TO anon, authenticated;

-- 2) Reactions: no public exposure of user_id; only aggregate counts are public
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.blog_post_reactions;
CREATE POLICY "Own reactions and admins"
ON public.blog_post_reactions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.blog_post_reactions FROM anon;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.research_article_reactions;
CREATE POLICY "Own reactions and admins"
ON public.research_article_reactions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.research_article_reactions FROM anon;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.video_case_reactions;
CREATE POLICY "Own reactions and admins"
ON public.video_case_reactions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.video_case_reactions FROM anon;

CREATE OR REPLACE VIEW public.blog_post_reaction_counts AS
SELECT post_id, reaction_type, count(*)::bigint AS count
FROM public.blog_post_reactions GROUP BY post_id, reaction_type;
ALTER VIEW public.blog_post_reaction_counts SET (security_invoker = false, security_barrier = true);
GRANT SELECT ON public.blog_post_reaction_counts TO anon, authenticated;

CREATE OR REPLACE VIEW public.research_article_reaction_counts AS
SELECT article_id, reaction_type, count(*)::bigint AS count
FROM public.research_article_reactions GROUP BY article_id, reaction_type;
ALTER VIEW public.research_article_reaction_counts SET (security_invoker = false, security_barrier = true);
GRANT SELECT ON public.research_article_reaction_counts TO anon, authenticated;

CREATE OR REPLACE VIEW public.video_case_reaction_counts AS
SELECT video_case_id, reaction_type, count(*)::bigint AS count
FROM public.video_case_reactions GROUP BY video_case_id, reaction_type;
ALTER VIEW public.video_case_reaction_counts SET (security_invoker = false, security_barrier = true);
GRANT SELECT ON public.video_case_reaction_counts TO anon, authenticated;