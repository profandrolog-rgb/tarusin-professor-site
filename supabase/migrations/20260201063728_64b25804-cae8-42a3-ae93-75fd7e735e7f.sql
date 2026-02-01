-- Add new values to the case_category enum
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'sexology';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'psychology';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'infertility';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'erectile_dysfunction';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'enuresis';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'pelvic_pain';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'scrotal_pain';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'hernia';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'complications';
ALTER TYPE public.case_category ADD VALUE IF NOT EXISTS 'rarities';