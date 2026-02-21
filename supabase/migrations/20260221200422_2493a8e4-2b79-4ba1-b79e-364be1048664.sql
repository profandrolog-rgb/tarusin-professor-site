
-- Table for video cases
CREATE TABLE public.video_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_path text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published video cases"
ON public.video_cases AS PERMISSIVE FOR SELECT TO public
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert video cases"
ON public.video_cases FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update video cases"
ON public.video_cases FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete video cases"
ON public.video_cases FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_video_cases_updated_at
BEFORE UPDATE ON public.video_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for reactions (like/dislike)
CREATE TABLE public.video_case_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_case_id uuid NOT NULL REFERENCES public.video_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_case_id, user_id)
);

ALTER TABLE public.video_case_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
ON public.video_case_reactions AS PERMISSIVE FOR SELECT TO public
USING (true);

CREATE POLICY "Authenticated users can insert reactions"
ON public.video_case_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.video_case_reactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.video_case_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Storage bucket for video cases
INSERT INTO storage.buckets (id, name, public) VALUES ('video-cases', 'video-cases', true);

CREATE POLICY "Anyone can view video case files"
ON storage.objects AS PERMISSIVE FOR SELECT TO public
USING (bucket_id = 'video-cases');

CREATE POLICY "Admins can upload video case files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video-cases' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete video case files"
ON storage.objects FOR DELETE
USING (bucket_id = 'video-cases' AND has_role(auth.uid(), 'admin'::app_role));
