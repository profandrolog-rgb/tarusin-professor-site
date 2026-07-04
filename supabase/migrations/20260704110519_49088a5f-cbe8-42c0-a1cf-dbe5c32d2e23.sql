
-- Решения врача по строкам аудита «Правила ↔ ИИ».
-- Хранится не в map_findings (там findings перезаписываются при пересчёте),
-- а на уровне (map_id, pathway_id) — переживёт агрегацию.
CREATE TABLE IF NOT EXISTS public.map_pathway_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES public.metabolic_maps(id) ON DELETE CASCADE,
  pathway_id UUID NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  kept TEXT NOT NULL CHECK (kept IN ('rules','ai')),
  rules_status TEXT,
  ai_status TEXT,
  divergence TEXT,
  note TEXT,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (map_id, pathway_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_pathway_reviews TO authenticated;
GRANT ALL ON public.map_pathway_reviews TO service_role;

ALTER TABLE public.map_pathway_reviews ENABLE ROW LEVEL SECURITY;

-- Только admin/editor могут читать и писать (родителям панель аудита не показывается).
CREATE POLICY "admin_editor_select_reviews"
  ON public.map_pathway_reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "admin_editor_insert_reviews"
  ON public.map_pathway_reviews FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "admin_editor_update_reviews"
  ON public.map_pathway_reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "admin_editor_delete_reviews"
  ON public.map_pathway_reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE TRIGGER map_pathway_reviews_updated_at
  BEFORE UPDATE ON public.map_pathway_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS map_pathway_reviews_map_idx
  ON public.map_pathway_reviews (map_id);
