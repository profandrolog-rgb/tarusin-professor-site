
ALTER TABLE public.acupuncture_protocols
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE public.acupuncture_protocol_points
  ADD COLUMN IF NOT EXISTS ea_freq_hz numeric,
  ADD COLUMN IF NOT EXISTS ea_duration_min integer,
  ADD COLUMN IF NOT EXISTS moxa boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ea_pair_with uuid REFERENCES public.acupoints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_app_points_acupoint
  ON public.acupuncture_protocol_points(acupoint_id);
CREATE INDEX IF NOT EXISTS idx_protocols_is_template
  ON public.acupuncture_protocols(is_template) WHERE is_archived = false;
