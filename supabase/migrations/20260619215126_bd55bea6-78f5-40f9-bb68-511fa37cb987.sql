
CREATE TABLE public.repertories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  source text,
  license text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.repertories TO anon, authenticated;
GRANT ALL ON public.repertories TO service_role;

ALTER TABLE public.repertories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read repertories"
  ON public.repertories FOR SELECT
  USING (true);

CREATE POLICY "Admins manage repertories"
  ON public.repertories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.repertories (code, name, source, license, description) VALUES
  ('kent-andrology',
   'Kent (андрологическая выборка)',
   'Ручная курация',
   'Public domain (Kent original)',
   'Ручная подборка из репертория Кента под андрологические рубрики. Исходные 57 рубрик и 389 связей.'),
  ('oorep-publicum',
   'Repertorium Publicum (OOREP)',
   'OOREP publicum dataset (github.com/openhmlp/oorep)',
   'GPL v3',
   'Расширенный Кент с элементами структуры Бённингхаузена и Богера, опубликованный сообществом OOREP. НЕ является буквально Богером или Бённингхаузеном — самостоятельная компиляция на основе Кента.');

ALTER TABLE public.repertory_remedies
  ADD COLUMN repertory_id uuid REFERENCES public.repertories(id) ON DELETE SET NULL;

CREATE INDEX idx_repertory_remedies_repertory ON public.repertory_remedies(repertory_id);

ALTER TABLE public.repertory_rubric_remedies
  ADD COLUMN repertory_id uuid REFERENCES public.repertories(id) ON DELETE RESTRICT;

CREATE INDEX idx_rrr_repertory ON public.repertory_rubric_remedies(repertory_id);
