
CREATE OR REPLACE FUNCTION public.get_repertory_chapter_stats()
RETURNS TABLE(chapter_id uuid, total_rubrics bigint, root_rubrics bigint, total_links bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    COUNT(rr.id)::bigint,
    COUNT(rr.id) FILTER (WHERE rr.parent_id IS NULL)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.repertory_rubric_remedies l WHERE l.rubric_id IN (SELECT id FROM public.repertory_rubrics WHERE chapter_id = c.id)), 0)::bigint
  FROM public.repertory_chapters c
  LEFT JOIN public.repertory_rubrics rr ON rr.chapter_id = c.id
  GROUP BY c.id
$$;

GRANT EXECUTE ON FUNCTION public.get_repertory_chapter_stats() TO authenticated;
