
DROP POLICY IF EXISTS "Admins can do everything with operations_journal" ON public.operations_journal;

CREATE POLICY "Admins and surgeons can manage operations_journal"
  ON public.operations_journal
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'surgeon'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'surgeon'));

UPDATE public.user_roles
SET role = 'surgeon'
WHERE user_id = '87a1ac14-5623-4512-a096-164bc2e9f525';
