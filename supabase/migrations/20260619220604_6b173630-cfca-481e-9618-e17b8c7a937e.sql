
ALTER TABLE public.repertory_rubric_remedies
  ALTER COLUMN repertory_id SET NOT NULL;

ALTER TABLE public.repertory_rubric_remedies
  DROP CONSTRAINT IF EXISTS repertory_rubric_remedies_rubric_id_remedy_id_key;

ALTER TABLE public.repertory_rubric_remedies
  ADD CONSTRAINT repertory_rubric_remedies_rubric_remedy_repertory_key
  UNIQUE (rubric_id, remedy_id, repertory_id);
