
-- Table for post reactions (likes/dislikes)
CREATE TABLE public.blog_post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.blog_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.blog_post_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reactions" ON public.blog_post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON public.blog_post_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.blog_post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Add object_position column to blog_post_images for photo cropping control
ALTER TABLE public.blog_post_images ADD COLUMN object_position text DEFAULT 'center' NOT NULL;
