
-- blog_comments: revoke table-level SELECT, grant column-level SELECT excluding author_email
REVOKE SELECT ON public.blog_comments FROM anon, authenticated;
GRANT SELECT (id, post_id, user_id, content, is_approved, created_at) ON public.blog_comments TO anon, authenticated;

-- questions: same pattern
REVOKE SELECT ON public.questions FROM anon, authenticated;
GRANT SELECT (id, author_name, question_text, answer_text, is_published, status, created_at, answered_at, updated_at) ON public.questions TO anon, authenticated;

-- research_article_comments: same pattern
REVOKE SELECT ON public.research_article_comments FROM anon, authenticated;
GRANT SELECT (id, article_id, user_id, author_name, content, is_approved, created_at) ON public.research_article_comments TO anon, authenticated;
