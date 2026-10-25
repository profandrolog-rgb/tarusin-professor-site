CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  short_title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'ClipboardCheck',
  intro text NOT NULL DEFAULT '',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.checklists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT ALL ON public.checklists TO service_role;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active checklists" ON public.checklists FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Staff manage checklists" ON public.checklists FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

ALTER TABLE public.checklist_responses ADD COLUMN respondent_name text;

CREATE OR REPLACE FUNCTION public.validate_checklist_response()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.checklist_slug IS NULL OR char_length(NEW.checklist_slug) > 64 THEN RAISE EXCEPTION 'Invalid checklist_slug'; END IF;
  IF NEW.checklist_slug !~ '^[a-z0-9_-]+$' THEN RAISE EXCEPTION 'checklist_slug contains invalid characters'; END IF;
  IF NEW.result_level IS NULL OR char_length(NEW.result_level) > 32 THEN RAISE EXCEPTION 'Invalid result_level'; END IF;
  IF NEW.answers IS NULL OR octet_length(NEW.answers::text) > 20000 THEN RAISE EXCEPTION 'answers payload too large'; END IF;
  IF NEW.user_agent IS NOT NULL AND char_length(NEW.user_agent) > 512 THEN NEW.user_agent := left(NEW.user_agent, 512); END IF;
  IF NEW.respondent_name IS NOT NULL THEN
    NEW.respondent_name := btrim(NEW.respondent_name);
    IF char_length(NEW.respondent_name) > 120 THEN RAISE EXCEPTION 'respondent_name too long'; END IF;
    IF NEW.respondent_name = '' THEN NEW.respondent_name := NULL; END IF;
  END IF;
  RETURN NEW;
END;
$function$;