
-- Fix blog_posts SELECT policy: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
CREATE POLICY "Anyone can view published blog posts"
ON blog_posts
AS PERMISSIVE
FOR SELECT
TO public
USING ((is_published = true) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix blog_post_images SELECT policy
DROP POLICY IF EXISTS "Anyone can view blog post images" ON blog_post_images;
CREATE POLICY "Anyone can view blog post images"
ON blog_post_images
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Fix blog_post_reactions SELECT policy
DROP POLICY IF EXISTS "Anyone can view reactions" ON blog_post_reactions;
CREATE POLICY "Anyone can view reactions"
ON blog_post_reactions
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Fix blog_comments SELECT policy
DROP POLICY IF EXISTS "Anyone can view approved comments" ON blog_comments;
CREATE POLICY "Anyone can view approved comments"
ON blog_comments
AS PERMISSIVE
FOR SELECT
TO public
USING ((is_approved = true) OR has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = user_id));
