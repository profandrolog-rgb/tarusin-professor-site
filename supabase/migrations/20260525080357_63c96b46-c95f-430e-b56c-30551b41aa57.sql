ALTER TABLE public.treatment_plan_items
  ADD COLUMN IF NOT EXISTS remedy_id uuid REFERENCES public.repertory_remedies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS potency text;

ALTER TABLE public.protocol_template_items
  ADD COLUMN IF NOT EXISTS remedy_id uuid REFERENCES public.repertory_remedies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS potency text;

CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_remedy ON public.treatment_plan_items(remedy_id);
CREATE INDEX IF NOT EXISTS idx_protocol_template_items_remedy ON public.protocol_template_items(remedy_id);