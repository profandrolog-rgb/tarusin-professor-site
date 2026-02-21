
-- Add category column to video_cases using existing case_category enum
ALTER TABLE public.video_cases
ADD COLUMN category case_category NOT NULL DEFAULT 'other';
