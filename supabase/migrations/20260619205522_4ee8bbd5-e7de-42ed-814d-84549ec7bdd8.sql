
ALTER TABLE public.analysis_batches ADD COLUMN IF NOT EXISTS chain_log jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.append_analysis_batch_log(_batch_id uuid, _entry jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.analysis_batches
  SET chain_log = COALESCE(chain_log, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('ts', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) || _entry
  )
  WHERE id = _batch_id;
$$;

GRANT EXECUTE ON FUNCTION public.append_analysis_batch_log(uuid, jsonb) TO service_role, authenticated;
