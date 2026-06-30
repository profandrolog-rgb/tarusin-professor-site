
CREATE TABLE IF NOT EXISTS public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  title text,
  slug text,
  description text,
  content text,
  card_annotation text,
  keywords text[] NOT NULL DEFAULT '{}',
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'draft',
  source_hash text,
  auto_generated boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, locale)
);

CREATE INDEX IF NOT EXISTS content_translations_entity_idx
  ON public.content_translations (entity_type, entity_id, locale);
CREATE INDEX IF NOT EXISTS content_translations_locale_status_idx
  ON public.content_translations (locale, status);
CREATE INDEX IF NOT EXISTS content_translations_slug_idx
  ON public.content_translations (locale, slug) WHERE slug IS NOT NULL;

GRANT SELECT ON public.content_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_translations TO authenticated;
GRANT ALL ON public.content_translations TO service_role;

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published translations"
  ON public.content_translations FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins and editors read all translations"
  ON public.content_translations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors insert translations"
  ON public.content_translations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors update translations"
  ON public.content_translations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors delete translations"
  ON public.content_translations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER content_translations_set_updated_at
  BEFORE UPDATE ON public.content_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
