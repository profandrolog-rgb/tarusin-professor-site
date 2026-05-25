
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read backups"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins upload backups"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update backups"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete backups"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'::public.app_role));
