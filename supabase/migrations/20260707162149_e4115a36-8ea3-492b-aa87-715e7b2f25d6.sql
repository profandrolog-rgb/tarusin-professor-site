
ALTER TABLE public.parents_materials DROP CONSTRAINT parents_materials_kind_check;
ALTER TABLE public.parents_materials
  ADD CONSTRAINT parents_materials_kind_check
  CHECK (kind IN ('article','video','podcast','handout'));

ALTER TABLE public.parents_materials ALTER COLUMN url DROP NOT NULL;

ALTER TABLE public.parents_materials
  ADD COLUMN slug TEXT,
  ADD COLUMN file_path TEXT,
  ADD COLUMN file_size_bytes BIGINT,
  ADD COLUMN pages_count INT,
  ADD COLUMN long_description TEXT,
  ADD COLUMN long_description_en TEXT,
  ADD COLUMN seo_title TEXT,
  ADD COLUMN seo_title_en TEXT,
  ADD COLUMN seo_description TEXT,
  ADD COLUMN seo_description_en TEXT,
  ADD COLUMN og_image_path TEXT,
  ADD COLUMN audience TEXT CHECK (audience IN ('parent','adult_man','pediatric_patient','professional')),
  ADD COLUMN download_count INT NOT NULL DEFAULT 0,
  ADD COLUMN gated BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX idx_parents_materials_slug ON public.parents_materials(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_parents_materials_kind_pub_sort ON public.parents_materials(kind, is_published, sort_order);

CREATE OR REPLACE FUNCTION public.increment_material_download(material_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.parents_materials
     SET download_count = download_count + 1
   WHERE id = material_id AND is_published = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_material_download(UUID) TO anon, authenticated;
