CREATE POLICY "Users manage own dictation audio" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'article-dictations' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'article-dictations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins manage all dictation audio" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'article-dictations' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'article-dictations' AND public.has_role(auth.uid(), 'admin'));