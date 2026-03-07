
CREATE TABLE public.medication_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_name text NOT NULL UNIQUE,
  synonyms text,
  pharmacological_group text,
  indications text,
  contraindications text,
  dosage_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with medication_digests"
  ON public.medication_digests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view medication_digests"
  ON public.medication_digests FOR SELECT
  TO authenticated
  USING (true);
