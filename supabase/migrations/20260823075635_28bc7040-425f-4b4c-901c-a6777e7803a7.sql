CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients (full_name);
CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm ON public.patients USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_history_number_trgm ON public.patients USING gin (history_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patient_cards_updated_at_desc ON public.patient_cards (updated_at DESC);

ALTER POLICY "Admins and surgeons can view patients" ON public.patients
  USING ((select public.has_role(auth.uid(), 'admin'::app_role)) OR (select public.has_role(auth.uid(), 'surgeon'::app_role)));
ALTER POLICY "Admins can update patients" ON public.patients
  USING ((select public.has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY "Admins can delete patients" ON public.patients
  USING ((select public.has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY "patients parent read own" ON public.patients
  USING ((select public.has_role(auth.uid(), 'parent'::app_role)) AND public.is_guardian_of(id));

ALTER POLICY "Admins can do everything with patient_cards" ON public.patient_cards
  USING ((select public.has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY "Patients can view own card" ON public.patient_cards
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Patients can update own card" ON public.patient_cards
  USING ((select auth.uid()) = user_id);
