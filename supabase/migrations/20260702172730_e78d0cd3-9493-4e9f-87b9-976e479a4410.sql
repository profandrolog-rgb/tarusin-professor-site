
ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS evidence_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS catalog_priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS age_min_years numeric,
  ADD COLUMN IF NOT EXISTS age_max_years numeric;

ALTER TABLE public.map_recommendations
  ADD COLUMN IF NOT EXISTS pathway_id uuid REFERENCES public.pathways(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS finding_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS evidence_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS age_warning text,
  ADD COLUMN IF NOT EXISTS contra_warning text,
  ADD COLUMN IF NOT EXISTS include_in_print boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_map_recs_pathway ON public.map_recommendations (pathway_id);
CREATE INDEX IF NOT EXISTS idx_map_recs_map_print ON public.map_recommendations (map_id, include_in_print);
CREATE INDEX IF NOT EXISTS idx_treatment_catalog_targets_gin ON public.treatment_catalog USING gin (targets);
