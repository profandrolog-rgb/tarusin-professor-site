CREATE OR REPLACE FUNCTION public.search_rubrics_by_embedding(_query vector, _limit integer DEFAULT 8)
 RETURNS TABLE(rubric_id uuid, name text, name_ru text, chapter_id uuid, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '25s'
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.name_ru, r.chapter_id,
         (1 - (e.embedding <=> _query))::float AS similarity
  FROM public.rubric_embeddings e
  JOIN public.repertory_rubrics r ON r.id = e.rubric_id
  ORDER BY e.embedding <=> _query
  LIMIT _limit;
END;
$function$;