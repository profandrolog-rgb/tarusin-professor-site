
CREATE TABLE public.operations_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  patient_name TEXT NOT NULL,
  patient_birth_date DATE NOT NULL,
  diagnosis TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  protocol_notes TEXT,
  surgeon_name TEXT NOT NULL DEFAULT 'Профессор, д.м.н. Тарусин Дмитрий Игоревич',
  assistant_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.operations_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with operations_journal"
  ON public.operations_journal
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
