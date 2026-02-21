
-- Add thumbnail_path column to video_cases
ALTER TABLE public.video_cases
ADD COLUMN thumbnail_path text NULL;
