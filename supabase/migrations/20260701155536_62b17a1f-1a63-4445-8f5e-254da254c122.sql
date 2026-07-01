DROP POLICY IF EXISTS "Admins can do everything with patients" ON public.patients;
DROP POLICY IF EXISTS "Admins and surgeons can view patients" ON public.patients;
DROP POLICY IF EXISTS "Admins and surgeons can create patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can update patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;

CREATE POLICY "Admins and surgeons can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'surgeon')
);

CREATE POLICY "Admins and surgeons can create patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'surgeon')
);

CREATE POLICY "Admins can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;