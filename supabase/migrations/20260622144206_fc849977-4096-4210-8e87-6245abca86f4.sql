CREATE OR REPLACE FUNCTION public.enqueue_all_missing_embeddings()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[];
  v_batch_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT array_agg(r.id)
  INTO v_ids
  FROM public.repertory_rubrics r
  WHERE r.name_ru IS NOT NULL
    AND r.name_ru <> ''
    AND NOT EXISTS (SELECT 1 FROM public.rubric_embeddings e WHERE e.rubric_id = r.id);

  IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.embedding_batches (rubric_ids, subbatch_size, total_rubrics, status)
  VALUES (v_ids, 200, array_length(v_ids, 1), 'pending')
  RETURNING id INTO v_batch_id;

  RETURN v_batch_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_all_missing_embeddings() TO authenticated;