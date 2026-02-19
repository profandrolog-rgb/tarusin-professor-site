
CREATE TABLE public.blog_post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog post images"
ON public.blog_post_images FOR SELECT
USING (true);

CREATE POLICY "Admins can insert blog post images"
ON public.blog_post_images FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog post images"
ON public.blog_post_images FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog post images"
ON public.blog_post_images FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
