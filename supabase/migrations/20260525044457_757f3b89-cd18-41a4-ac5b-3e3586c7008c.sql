
ALTER TABLE public.treatment_catalog
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.treatment_catalog_update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vector := to_tsvector('russian',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.inn, '') || ' ' ||
    COALESCE(NEW.notes, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(NEW.subcategory, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_treatment_catalog_search_vector ON public.treatment_catalog;
CREATE TRIGGER trg_treatment_catalog_search_vector
  BEFORE INSERT OR UPDATE OF name, inn, notes, tags, subcategory
  ON public.treatment_catalog
  FOR EACH ROW EXECUTE FUNCTION public.treatment_catalog_update_search_vector();

-- Backfill existing rows
UPDATE public.treatment_catalog SET name = name;

CREATE INDEX IF NOT EXISTS idx_treatment_catalog_search_vector
  ON public.treatment_catalog USING GIN (search_vector);
