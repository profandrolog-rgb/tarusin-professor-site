-- Create enum for clinical case categories
CREATE TYPE public.case_category AS ENUM (
  'hydrocele',
  'cryptorchidism',
  'hypospadias',
  'varicocele',
  'phimosis',
  'other'
);

-- Create table for travel gallery photos
CREATE TABLE public.travel_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  image_path TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for clinical cases
CREATE TABLE public.clinical_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category case_category NOT NULL DEFAULT 'other',
  history TEXT NOT NULL,
  conclusions TEXT,
  recommendations TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for clinical case images
CREATE TABLE public.clinical_case_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.travel_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travel_photos
CREATE POLICY "Anyone can view travel photos"
ON public.travel_photos
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert travel photos"
ON public.travel_photos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update travel photos"
ON public.travel_photos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete travel photos"
ON public.travel_photos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for clinical_cases
CREATE POLICY "Anyone can view published clinical cases"
ON public.clinical_cases
FOR SELECT
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert clinical cases"
ON public.clinical_cases
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update clinical cases"
ON public.clinical_cases
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete clinical cases"
ON public.clinical_cases
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for clinical_case_images
CREATE POLICY "Anyone can view clinical case images"
ON public.clinical_case_images
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert clinical case images"
ON public.clinical_case_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update clinical case images"
ON public.clinical_case_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete clinical case images"
ON public.clinical_case_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_travel_photos_updated_at
BEFORE UPDATE ON public.travel_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_cases_updated_at
BEFORE UPDATE ON public.clinical_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-photos', 'travel-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('case-images', 'case-images', true);

-- Storage policies for travel-photos bucket
CREATE POLICY "Travel photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'travel-photos');

CREATE POLICY "Admins can upload travel photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'travel-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update travel photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'travel-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete travel photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'travel-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for case-images bucket
CREATE POLICY "Case images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'case-images');

CREATE POLICY "Admins can upload case images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'case-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update case images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'case-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete case images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'case-images' AND has_role(auth.uid(), 'admin'::app_role));