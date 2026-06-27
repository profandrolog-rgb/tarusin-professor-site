
-- M2M patient links for vault notes
CREATE TABLE public.vault_note_patients (
  note_id uuid NOT NULL REFERENCES public.vault_notes(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, patient_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_note_patients TO authenticated;
GRANT ALL ON public.vault_note_patients TO service_role;
ALTER TABLE public.vault_note_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vnp admin all"
  ON public.vault_note_patients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_vnp_patient ON public.vault_note_patients(patient_id);
CREATE INDEX idx_vnp_note ON public.vault_note_patients(note_id);

-- Attachments: AI reasoning, treatment plan, ultrasound, visit, lab, etc.
CREATE TABLE public.vault_note_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.vault_notes(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('ai_run','treatment_plan','ultrasound','visit','lab','consultation','prescription')),
  ref_id uuid,
  mode text NOT NULL DEFAULT 'live' CHECK (mode IN ('live','snapshot')),
  title text NOT NULL,
  summary text,
  snapshot jsonb,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_note_attachments TO authenticated;
GRANT ALL ON public.vault_note_attachments TO service_role;
ALTER TABLE public.vault_note_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vna admin all"
  ON public.vault_note_attachments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_vna_note ON public.vault_note_attachments(note_id, position);
CREATE INDEX idx_vna_patient ON public.vault_note_attachments(patient_id);
