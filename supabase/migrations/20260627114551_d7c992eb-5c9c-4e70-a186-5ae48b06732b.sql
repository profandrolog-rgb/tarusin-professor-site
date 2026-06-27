
-- 1) questions: remove broad public SELECT policy. Public consumption uses the
-- questions_public view which excludes author_email. Admins still have full
-- access via the existing "Admins" policies.
DROP POLICY IF EXISTS "Anyone can view published questions" ON public.questions;

-- Also revoke direct table SELECT from anon/authenticated to make the
-- protection defense-in-depth (view remains accessible).
REVOKE SELECT ON public.questions FROM anon, authenticated;

-- Ensure the public view stays readable.
GRANT SELECT ON public.questions_public TO anon, authenticated;

-- 2) treatment_plans: explicitly document that anon has no SELECT policy,
-- so PostgREST denies any attempt to read plans by public_hash. Public
-- sharing must be served via a service-role edge function if ever needed.
COMMENT ON TABLE public.treatment_plans IS
  'RLS: creator + admin only. No anon SELECT policy — public_hash sharing is not exposed via PostgREST. Use a service-role edge function for any public hash view.';

-- 3) patient_cards: the trigger trg_protect_patient_card_admin_fields already
-- blocks patients from changing clinical/admin fields (diagnosis, treatment_plan,
-- treatment_tactics, ai_reasoning, communication_notes, patient_specifics, notes).
-- IS DISTINCT FROM catches empty-string and NULL bypass attempts. No change needed,
-- but recreate the function with an explicit COMMENT for auditability.
COMMENT ON FUNCTION public.protect_patient_card_admin_fields() IS
  'Blocks non-admin updates to clinical/admin fields on patient_cards. Covers diagnosis, treatment_plan, treatment_tactics, ai_reasoning, communication_notes, patient_specifics, notes. Uses IS DISTINCT FROM to prevent empty-string/NULL bypass.';
