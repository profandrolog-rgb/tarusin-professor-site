
-- Final cleanup: merge two leftover kent-side duplicates that auto-merge missed
-- because their OOREP-side targets were consumed by an earlier rule.
-- aco (kent, 1 link) -> acon (kent, 4965 links)
-- baryta-c (kent, 3 links) -> bar-c (kent, 4259 links)

DO $$
DECLARE
  v_pairs int := 0;
BEGIN
  CREATE TEMP TABLE _final_merge (canonical_id uuid, drop_id uuid) ON COMMIT DROP;

  INSERT INTO _final_merge
  SELECT
    (SELECT id FROM repertory_remedies WHERE slug = canon),
    (SELECT id FROM repertory_remedies WHERE slug = dropp)
  FROM (VALUES ('acon','aco'), ('bar-c','baryta-c')) v(canon, dropp)
  WHERE (SELECT id FROM repertory_remedies WHERE slug = canon) IS NOT NULL
    AND (SELECT id FROM repertory_remedies WHERE slug = dropp) IS NOT NULL;

  -- Resolve collisions on (rubric_id, remedy_id, repertory_id)
  WITH collide AS (
    SELECT n.id AS link_id
    FROM repertory_rubric_remedies n
    JOIN _final_merge m ON m.drop_id = n.remedy_id
    WHERE EXISTS (
      SELECT 1 FROM repertory_rubric_remedies o
      WHERE o.remedy_id = m.canonical_id
        AND o.rubric_id = n.rubric_id
        AND o.repertory_id = n.repertory_id
    )
  )
  DELETE FROM repertory_rubric_remedies r USING collide WHERE r.id = collide.link_id;

  UPDATE repertory_rubric_remedies r
  SET remedy_id = m.canonical_id
  FROM _final_merge m WHERE r.remedy_id = m.drop_id;

  UPDATE treatment_catalog SET remedy_id = m.canonical_id
  FROM _final_merge m WHERE treatment_catalog.remedy_id = m.drop_id;

  UPDATE treatment_plan_items SET repertory_remedy_id = m.canonical_id
  FROM _final_merge m WHERE treatment_plan_items.repertory_remedy_id = m.drop_id;

  UPDATE protocol_template_items SET repertory_remedy_id = m.canonical_id
  FROM _final_merge m WHERE protocol_template_items.repertory_remedy_id = m.drop_id;

  DELETE FROM repertory_remedies r USING _final_merge m WHERE r.id = m.drop_id;
  GET DIAGNOSTICS v_pairs = ROW_COUNT;
  RAISE NOTICE 'final cleanup: % remedies dropped', v_pairs;
END $$;
