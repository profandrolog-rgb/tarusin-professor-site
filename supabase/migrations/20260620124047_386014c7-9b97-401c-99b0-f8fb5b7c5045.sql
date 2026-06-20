
CREATE TABLE public.translation_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  chapter_id uuid REFERENCES public.repertory_chapters(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'chapter',
  model text NOT NULL DEFAULT 'claude-sonnet-4-6',
  status text NOT NULL DEFAULT 'queued',
  total_rubrics integer NOT NULL DEFAULT 0,
  processed_rubrics integer NOT NULL DEFAULT 0,
  subbatch_size integer NOT NULL DEFAULT 150,
  rubric_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  partial_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  chain_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.translation_batches TO authenticated;
GRANT ALL ON public.translation_batches TO service_role;

ALTER TABLE public.translation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage translation batches"
  ON public.translation_batches
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_translation_batches_updated
  BEFORE UPDATE ON public.translation_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.append_translation_batch_log(_batch_id uuid, _entry jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.translation_batches
  SET chain_log = COALESCE(chain_log, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('ts', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) || _entry
  )
  WHERE id = _batch_id;
$$;
