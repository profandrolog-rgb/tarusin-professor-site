CREATE OR REPLACE FUNCTION public.increment_video_view(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.videos
     SET views = COALESCE(views, 0) + 1
   WHERE slug = _slug
     AND is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_video_view(text) TO anon, authenticated;