-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  specialties TEXT[] NOT NULL,
  mission TEXT NOT NULL,
  description TEXT NOT NULL,
  conditions TEXT NOT NULL,
  professor_opinion TEXT NOT NULL,
  photo_path TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view published team members"
ON public.team_members
FOR SELECT
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert team members"
ON public.team_members
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update team members"
ON public.team_members
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete team members"
ON public.team_members
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for team photos
INSERT INTO storage.buckets (id, name, public) VALUES ('team-photos', 'team-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view team photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-photos');

CREATE POLICY "Admins can upload team photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update team photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete team photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'::app_role));