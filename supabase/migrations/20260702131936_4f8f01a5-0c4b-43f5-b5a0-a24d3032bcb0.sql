
-- =========================
-- Метаболическая карта — этап 1: схема БД
-- =========================

-- 1) Справочник метаболических путей
CREATE TABLE public.pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  -- Список узлов пути: [{id: "node_slug", label, x, y, kind}]
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Список рёбер: [{from: "node_a", to: "node_b", label}]
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Опциональный ручной SVG (viewBox-based); если null — рендерим по nodes/edges
  svg_template text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pathways TO authenticated;
GRANT ALL ON public.pathways TO service_role;
ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pathways read for authenticated" ON public.pathways
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pathways manage for admin" ON public.pathways
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_pathways_updated
  BEFORE UPDATE ON public.pathways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Метаболическая карта пациента (одна на пациента, но допускаем историчность через updated_at)
CREATE TABLE public.metabolic_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  notes text,
  -- Свободные атрибуты: {snapshot_date, deidentified, external_ai_used, ...}
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metabolic_maps TO authenticated;
GRANT ALL ON public.metabolic_maps TO service_role;
ALTER TABLE public.metabolic_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maps read for admin" ON public.metabolic_maps
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "maps manage for admin" ON public.metabolic_maps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_metabolic_maps_updated
  BEFORE UPDATE ON public.metabolic_maps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_metabolic_maps_patient ON public.metabolic_maps(patient_id);

-- 3) Найденные отклонения (finding = точка на пути с проблемой)
CREATE TABLE public.map_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.metabolic_maps(id) ON DELETE CASCADE,
  pathway_id uuid REFERENCES public.pathways(id) ON DELETE SET NULL,
  node_id text,                              -- id узла внутри pathways.nodes
  severity text NOT NULL DEFAULT 'info',     -- info | warn | critical
  label text NOT NULL,
  detail text,
  -- Источник: {kind:'lab', test_id, value, ref, at}, {kind:'anthro', metric,...}, {kind:'visit', visit_id,...}, {kind:'manual'}
  source_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_findings TO authenticated;
GRANT ALL ON public.map_findings TO service_role;
ALTER TABLE public.map_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "findings for admin" ON public.map_findings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_map_findings_map ON public.map_findings(map_id);
CREATE INDEX idx_map_findings_pathway ON public.map_findings(pathway_id);

-- 4) Рекомендации на основе карты (тянут из treatment_catalog)
CREATE TABLE public.map_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.metabolic_maps(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.treatment_catalog(id) ON DELETE SET NULL,
  target_node_id text,                       -- на какой узел «нацелена» рекомендация
  application_point text,                    -- точка приложения (короткая метка)
  rationale text,
  priority int NOT NULL DEFAULT 0,
  is_accepted boolean,                       -- null=не рассматривалось
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_recommendations TO authenticated;
GRANT ALL ON public.map_recommendations TO service_role;
ALTER TABLE public.map_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs for admin" ON public.map_recommendations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_map_recs_map ON public.map_recommendations(map_id);

-- 5) Расширения существующих таблиц (аккуратно, только добавление полей)
ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS targets text[] NOT NULL DEFAULT '{}',        -- id узлов, на которые действует
  ADD COLUMN IF NOT EXISTS application_point text;                       -- короткая метка «точка приложения»

ALTER TABLE public.lab_tests_catalog
  ADD COLUMN IF NOT EXISTS pathway_node_refs jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{pathway_id, node_id}]
  ADD COLUMN IF NOT EXISTS reference_ranges jsonb NOT NULL DEFAULT '{}'::jsonb;  -- {male:{age_ranges:[...]}, female:{...}}
