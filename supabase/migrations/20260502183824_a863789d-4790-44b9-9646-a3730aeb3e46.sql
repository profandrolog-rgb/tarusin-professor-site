
-- 1. Public view for blog_comments (excludes author_email)
CREATE OR REPLACE VIEW public.blog_comments_public
WITH (security_invoker = true)
AS
SELECT id, post_id, user_id, content, is_approved, created_at
FROM public.blog_comments
WHERE is_approved = true 
   OR has_role(auth.uid(), 'admin'::app_role) 
   OR auth.uid() = user_id;

-- 2. Public view for questions (excludes author_email)
CREATE OR REPLACE VIEW public.questions_public
WITH (security_invoker = true)
AS
SELECT id, author_name, question_text, answer_text, is_published, status, created_at, updated_at, answered_at
FROM public.questions
WHERE is_published = true 
   OR has_role(auth.uid(), 'admin'::app_role);

-- 3. Public view for research_article_comments (excludes author_email)
CREATE OR REPLACE VIEW public.research_article_comments_public
WITH (security_invoker = true)
AS
SELECT id, article_id, user_id, author_name, content, is_approved, created_at
FROM public.research_article_comments
WHERE is_approved = true 
   OR has_role(auth.uid(), 'admin'::app_role) 
   OR auth.uid() = user_id;
