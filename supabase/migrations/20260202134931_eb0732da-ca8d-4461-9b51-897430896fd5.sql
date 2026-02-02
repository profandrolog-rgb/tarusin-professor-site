-- Create table for appointment requests
CREATE TABLE public.appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_age TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  parent_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view all requests
CREATE POLICY "Admins can view all appointment requests"
ON public.appointment_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Anyone can submit a request (no auth required)
CREATE POLICY "Anyone can submit appointment request"
ON public.appointment_requests
FOR INSERT
WITH CHECK (true);

-- Only admins can update requests
CREATE POLICY "Admins can update appointment requests"
ON public.appointment_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete requests
CREATE POLICY "Admins can delete appointment requests"
ON public.appointment_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_appointment_requests_updated_at
BEFORE UPDATE ON public.appointment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();