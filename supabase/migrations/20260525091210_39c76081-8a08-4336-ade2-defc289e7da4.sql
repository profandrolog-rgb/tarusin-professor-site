
-- Acupuncture catalog: meridians + acupoints
CREATE TABLE IF NOT EXISTS public.acupoint_meridians (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name_en       text NOT NULL,
  name_ru       text NOT NULL,
  channel_type  text,
  polarity      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acupoints (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  who_code              text NOT NULL UNIQUE,
  pinyin                text,
  chinese               text,
  name_ru               text,
  meridian_id           uuid REFERENCES public.acupoint_meridians(id) ON DELETE SET NULL,
  location_description  text,
  depth_mm              text,
  indications           text,
  contraindications     text,
  is_caution            boolean NOT NULL DEFAULT false,
  manipulation_default  text,
  svg_marker_x          numeric,
  svg_marker_y          numeric,
  svg_view              text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS acupoints_meridian_idx ON public.acupoints (meridian_id);
CREATE INDEX IF NOT EXISTS acupoints_who_code_idx ON public.acupoints (who_code);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS acupoints_name_trgm ON public.acupoints USING gin (
  (coalesce(who_code,'') || ' ' || coalesce(pinyin,'') || ' ' ||
   coalesce(name_ru,'') || ' ' || coalesce(indications,'')) gin_trgm_ops
);

ALTER TABLE public.acupoint_meridians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acupoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage meridians"
  ON public.acupoint_meridians FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage acupoints"
  ON public.acupoints FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
