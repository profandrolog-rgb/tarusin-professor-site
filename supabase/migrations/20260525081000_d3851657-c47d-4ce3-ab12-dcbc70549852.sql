ALTER TABLE public.treatment_plan_items RENAME COLUMN remedy_id TO repertory_remedy_id;
ALTER TABLE public.treatment_plan_items
  ADD CONSTRAINT treatment_plan_items_repertory_remedy_id_fkey
  FOREIGN KEY (repertory_remedy_id) REFERENCES public.repertory_remedies(id) ON DELETE SET NULL;
ALTER TABLE public.treatment_plan_items ADD COLUMN dosing_schedule text;

ALTER TABLE public.protocol_template_items RENAME COLUMN remedy_id TO repertory_remedy_id;
ALTER TABLE public.protocol_template_items
  ADD CONSTRAINT protocol_template_items_repertory_remedy_id_fkey
  FOREIGN KEY (repertory_remedy_id) REFERENCES public.repertory_remedies(id) ON DELETE SET NULL;
ALTER TABLE public.protocol_template_items ADD COLUMN dosing_schedule text;