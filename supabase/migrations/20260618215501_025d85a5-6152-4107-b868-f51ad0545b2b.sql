
CREATE TABLE public.ai_conversation_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversation_folders TO authenticated;
GRANT ALL ON public.ai_conversation_folders TO service_role;
ALTER TABLE public.ai_conversation_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat folders"
ON public.ai_conversation_folders FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.ai_conversations
  ADD COLUMN folder_id UUID NULL REFERENCES public.ai_conversation_folders(id) ON DELETE SET NULL;
CREATE INDEX idx_ai_conversations_folder_id ON public.ai_conversations(folder_id);
