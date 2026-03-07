
-- Create enum for extemporaneous dosage forms
CREATE TYPE public.extemporaneous_form_type AS ENUM (
  'unguentum',    -- мазь
  'suspensio',    -- болтушка
  'suppositoria', -- свечи
  'mixtura',      -- микстура
  'tinctura',     -- настойка
  'linimentum',   -- линимент
  'pasta',        -- паста
  'cremor',       -- крем
  'gel',          -- гель
  'solutio'       -- раствор
);

-- Create table for pharmaceutical substances used in extemporaneous formulations
CREATE TABLE public.extemporaneous_substances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latin_name TEXT NOT NULL,
  russian_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  default_unit TEXT NOT NULL DEFAULT 'г',
  description TEXT,
  is_base BOOLEAN NOT NULL DEFAULT false,
  compatible_forms extemporaneous_form_type[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extemporaneous_substances ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can do everything with extemporaneous_substances"
  ON public.extemporaneous_substances FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add dosage_form_type column to prescriptions for extemporaneous
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS extemporaneous_form_type TEXT;

-- Add signa column to prescriptions
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS signa TEXT;
