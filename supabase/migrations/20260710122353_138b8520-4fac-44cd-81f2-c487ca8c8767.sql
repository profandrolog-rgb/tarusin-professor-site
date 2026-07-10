CREATE POLICY "Staff read patient lab docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-lab-docs' AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'surgeon'::app_role)
      OR public.has_role(auth.uid(), 'editor'::app_role)
    )
  );

CREATE POLICY "Staff insert patient lab docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-lab-docs' AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'surgeon'::app_role)
      OR public.has_role(auth.uid(), 'editor'::app_role)
    )
  );

CREATE POLICY "Staff update patient lab docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'patient-lab-docs' AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'surgeon'::app_role)
      OR public.has_role(auth.uid(), 'editor'::app_role)
    )
  );

CREATE POLICY "Staff delete patient lab docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-lab-docs' AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'surgeon'::app_role)
      OR public.has_role(auth.uid(), 'editor'::app_role)
    )
  );
