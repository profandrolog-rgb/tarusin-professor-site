
-- 1. Prevent patients from modifying admin-only medical fields in patient_cards
CREATE OR REPLACE FUNCTION public.protect_patient_card_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins are allowed full updates
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- For non-admin (patient) updates, ensure admin-only fields are unchanged
  IF NEW.diagnosis IS DISTINCT FROM OLD.diagnosis
     OR NEW.treatment_plan IS DISTINCT FROM OLD.treatment_plan
     OR NEW.treatment_tactics IS DISTINCT FROM OLD.treatment_tactics
     OR NEW.ai_reasoning IS DISTINCT FROM OLD.ai_reasoning
     OR NEW.communication_notes IS DISTINCT FROM OLD.communication_notes
     OR NEW.patient_specifics IS DISTINCT FROM OLD.patient_specifics
     OR NEW.notes IS DISTINCT FROM OLD.notes
  THEN
    RAISE EXCEPTION 'Patients cannot modify clinical/admin fields on patient_cards';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_patient_card_admin_fields ON public.patient_cards;
CREATE TRIGGER trg_protect_patient_card_admin_fields
BEFORE UPDATE ON public.patient_cards
FOR EACH ROW EXECUTE FUNCTION public.protect_patient_card_admin_fields();

-- 2. Hide author_email on questions from anon/authenticated direct table reads
REVOKE SELECT (author_email) ON public.questions FROM anon, authenticated;

-- 3. Validate checklist_responses inserts
CREATE OR REPLACE FUNCTION public.validate_checklist_response()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.checklist_slug IS NULL OR char_length(NEW.checklist_slug) > 64 THEN
    RAISE EXCEPTION 'Invalid checklist_slug';
  END IF;
  IF NEW.checklist_slug !~ '^[a-z0-9_-]+$' THEN
    RAISE EXCEPTION 'checklist_slug contains invalid characters';
  END IF;
  IF NEW.result_level IS NULL OR char_length(NEW.result_level) > 32 THEN
    RAISE EXCEPTION 'Invalid result_level';
  END IF;
  IF NEW.answers IS NULL OR octet_length(NEW.answers::text) > 20000 THEN
    RAISE EXCEPTION 'answers payload too large';
  END IF;
  IF NEW.user_agent IS NOT NULL AND char_length(NEW.user_agent) > 512 THEN
    NEW.user_agent := left(NEW.user_agent, 512);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_checklist_response ON public.checklist_responses;
CREATE TRIGGER trg_validate_checklist_response
BEFORE INSERT ON public.checklist_responses
FOR EACH ROW EXECUTE FUNCTION public.validate_checklist_response();

-- 4. Lock down internal email queue SECURITY DEFINER functions to service role only
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
