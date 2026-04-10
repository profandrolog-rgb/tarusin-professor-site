
-- Patient cards (doctor-only fields + patient-visible fields)
CREATE TABLE public.patient_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_full_name TEXT NOT NULL DEFAULT '',
  parent_name TEXT DEFAULT '',
  parent_phone TEXT DEFAULT '',
  parent_whatsapp TEXT DEFAULT '',
  parent_telegram TEXT DEFAULT '',
  patient_whatsapp TEXT DEFAULT '',
  patient_telegram TEXT DEFAULT '',
  has_insurance BOOLEAN DEFAULT false,
  diagnosis TEXT DEFAULT '',
  treatment_tactics TEXT DEFAULT '',
  treatment_plan TEXT DEFAULT '',
  patient_specifics TEXT DEFAULT '',
  communication_notes TEXT DEFAULT '',
  ai_reasoning TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.patient_cards ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can do everything with patient_cards"
  ON public.patient_cards FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Patient can view own card (limited fields handled in app)
CREATE POLICY "Patients can view own card"
  ON public.patient_cards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Patient can update own contact fields
CREATE POLICY "Patients can update own card"
  ON public.patient_cards FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Patient can create own card
CREATE POLICY "Patients can create own card"
  ON public.patient_cards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_patient_cards_updated_at
  BEFORE UPDATE ON public.patient_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Patient documents
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.patient_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  uploaded_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with patient_documents"
  ON public.patient_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Patients can view own documents"
  ON public.patient_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Patient chat messages
CREATE TABLE public.patient_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all chat messages"
  ON public.patient_chat_messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own messages"
  ON public.patient_chat_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.patient_chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert assistant messages
CREATE POLICY "Service role can insert messages"
  ON public.patient_chat_messages FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

-- Storage bucket for patient documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);

CREATE POLICY "Admins can manage patient documents storage"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'patient-documents' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'patient-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Patients can view own documents in storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
