
-- 1. analysis_batches table
CREATE TABLE public.analysis_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  task text NOT NULL,
  model text NOT NULL DEFAULT 'anthropic/claude-sonnet-4.5',
  status text NOT NULL DEFAULT 'pending', -- pending|processing|done|error
  file_paths text[] NOT NULL DEFAULT '{}',
  subbatch_size integer NOT NULL DEFAULT 7,
  total_files integer NOT NULL DEFAULT 0,
  processed_files integer NOT NULL DEFAULT 0,
  partial_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_result text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_batches TO authenticated;
GRANT ALL ON public.analysis_batches TO service_role;

ALTER TABLE public.analysis_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own batches"
  ON public.analysis_batches FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_analysis_batches_updated_at
  BEFORE UPDATE ON public.analysis_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_batches;

-- 2. RLS for chat-attachments storage bucket (path layout: {user_id}/{batch_id}/{filename})
CREATE POLICY "chat_attachments_owner_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "chat_attachments_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "chat_attachments_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "chat_attachments_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
