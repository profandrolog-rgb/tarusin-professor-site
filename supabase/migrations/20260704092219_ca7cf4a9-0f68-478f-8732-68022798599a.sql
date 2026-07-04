
-- Хранилище сцен схем метаболических путей (Excalidraw JSON).
-- Ключ — code пути (совпадает с pathways.slug). Одна запись — один шаблон.
CREATE TABLE IF NOT EXISTS public.pathway_schemas (
  pathway_code text PRIMARY KEY,
  scene        jsonb NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid NULL
);

GRANT SELECT ON public.pathway_schemas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pathway_schemas TO authenticated;
GRANT ALL ON public.pathway_schemas TO service_role;

ALTER TABLE public.pathway_schemas ENABLE ROW LEVEL SECURITY;

-- Схемы читают все (нужны для отображения карты у родителей/врачей и в печати).
CREATE POLICY "pathway_schemas_read_all"
  ON public.pathway_schemas FOR SELECT
  USING (true);

-- Изменять могут только админ / редактор / хирург (те же роли, что редактируют карту).
CREATE POLICY "pathway_schemas_write_staff"
  ON public.pathway_schemas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'surgeon'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'surgeon'));

CREATE TRIGGER trg_pathway_schemas_updated_at
  BEFORE UPDATE ON public.pathway_schemas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
