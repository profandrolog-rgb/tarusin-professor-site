REVOKE SELECT (author_email) ON public.blog_comments FROM anon, authenticated;
REVOKE SELECT (author_email) ON public.research_article_comments FROM anon, authenticated;