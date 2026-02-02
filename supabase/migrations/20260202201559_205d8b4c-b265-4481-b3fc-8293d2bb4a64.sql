-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_path TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view published certificates"
ON public.certificates
FOR SELECT
USING (is_published = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert certificates"
ON public.certificates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update certificates"
ON public.certificates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete certificates"
ON public.certificates
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true);

-- Storage policies
CREATE POLICY "Anyone can view certificate images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Admins can upload certificate images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update certificate images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete certificate images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'));