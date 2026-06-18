
CREATE POLICY "ai-chat-files own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-chat-files own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-chat-files own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-chat-files own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
