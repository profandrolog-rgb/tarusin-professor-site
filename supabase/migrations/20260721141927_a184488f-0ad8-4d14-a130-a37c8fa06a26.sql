
CREATE TABLE public.spellcheck_dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX spellcheck_dictionary_word_lower_idx
  ON public.spellcheck_dictionary (lower(word));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spellcheck_dictionary TO authenticated;
GRANT ALL ON public.spellcheck_dictionary TO service_role;

ALTER TABLE public.spellcheck_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spellcheck_dictionary_select_authenticated"
  ON public.spellcheck_dictionary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "spellcheck_dictionary_insert_admin_editor"
  ON public.spellcheck_dictionary FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'editor'::public.app_role)
  );

CREATE POLICY "spellcheck_dictionary_update_admin_editor"
  ON public.spellcheck_dictionary FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'editor'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'editor'::public.app_role)
  );

CREATE POLICY "spellcheck_dictionary_delete_admin_editor"
  ON public.spellcheck_dictionary FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'editor'::public.app_role)
  );
