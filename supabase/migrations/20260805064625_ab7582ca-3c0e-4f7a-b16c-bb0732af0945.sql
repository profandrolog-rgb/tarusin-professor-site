-- Каталог предоперационных обследований
CREATE TABLE public.surgery_exam_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  group_name TEXT,
  note TEXT,
  valid_days INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgery_exam_catalog TO authenticated;
GRANT ALL ON public.surgery_exam_catalog TO service_role;
ALTER TABLE public.surgery_exam_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage exam catalog" ON public.surgery_exam_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- Шаблоны памятки
CREATE TABLE public.surgery_memo_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Памятка пациенту, которому предстоит оперативное лечение',
  body TEXT NOT NULL DEFAULT '',
  coordinator_name TEXT NOT NULL DEFAULT 'Надежда Александровна',
  coordinator_phone TEXT NOT NULL DEFAULT '+7 903 005-61-11',
  coordinator_instruction TEXT NOT NULL DEFAULT 'По этому номеру в Telegram, WhatsApp или MAX необходимо переслать первый лист путёвки.',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgery_memo_templates TO authenticated;
GRANT ALL ON public.surgery_memo_templates TO service_role;
ALTER TABLE public.surgery_memo_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage memo templates" ON public.surgery_memo_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- Путёвки
CREATE TABLE public.surgery_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES public.patient_visits(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  birth_date DATE,
  age_text TEXT,
  diagnosis TEXT,
  operation_name TEXT,
  planned_date_from DATE,
  planned_date_to DATE,
  status TEXT NOT NULL DEFAULT 'issued',
  memo_body TEXT,
  memo_title TEXT,
  coordinator_name TEXT,
  coordinator_phone TEXT,
  coordinator_instruction TEXT,
  public_hash TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  telegram_chat_id TEXT,
  telegram_link_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  patient_email TEXT,
  last_contact_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  reminders_sent INTEGER NOT NULL DEFAULT 0,
  internal_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT surgery_referrals_status_check CHECK (status IN (
    'issued','labs_in_progress','labs_ready','date_set','hospitalized','operated','postponed','declined','lost'
  ))
);
CREATE INDEX idx_surgery_referrals_status ON public.surgery_referrals(status);
CREATE INDEX idx_surgery_referrals_patient ON public.surgery_referrals(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgery_referrals TO authenticated;
GRANT ALL ON public.surgery_referrals TO service_role;
ALTER TABLE public.surgery_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage referrals" ON public.surgery_referrals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- Обследования в путёвке
CREATE TABLE public.surgery_referral_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.surgery_referrals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  note TEXT,
  valid_days INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_done BOOLEAN NOT NULL DEFAULT false,
  done_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_surgery_referral_items_ref ON public.surgery_referral_items(referral_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgery_referral_items TO authenticated;
GRANT ALL ON public.surgery_referral_items TO service_role;
ALTER TABLE public.surgery_referral_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage referral items" ON public.surgery_referral_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- Журнал событий
CREATE TABLE public.surgery_referral_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.surgery_referrals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT,
  comment TEXT,
  actor UUID,
  actor_kind TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_surgery_referral_events_ref ON public.surgery_referral_events(referral_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgery_referral_events TO authenticated;
GRANT ALL ON public.surgery_referral_events TO service_role;
ALTER TABLE public.surgery_referral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage referral events" ON public.surgery_referral_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- updated_at триггеры
CREATE TRIGGER trg_surgery_exam_catalog_updated BEFORE UPDATE ON public.surgery_exam_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_surgery_memo_templates_updated BEFORE UPDATE ON public.surgery_memo_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_surgery_referrals_updated BEFORE UPDATE ON public.surgery_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_surgery_referral_items_updated BEFORE UPDATE ON public.surgery_referral_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Публичный просмотр путёвки по секретной ссылке
CREATE OR REPLACE FUNCTION public.get_public_surgery_referral(_hash TEXT)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', r.id,
    'full_name', r.full_name,
    'birth_date', r.birth_date,
    'age_text', r.age_text,
    'diagnosis', r.diagnosis,
    'operation_name', r.operation_name,
    'planned_date_from', r.planned_date_from,
    'planned_date_to', r.planned_date_to,
    'status', r.status,
    'memo_title', r.memo_title,
    'memo_body', r.memo_body,
    'coordinator_name', r.coordinator_name,
    'coordinator_phone', r.coordinator_phone,
    'coordinator_instruction', r.coordinator_instruction,
    'telegram_link_code', r.telegram_link_code,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'name', i.name, 'note', i.note,
        'valid_days', i.valid_days, 'is_done', i.is_done, 'done_at', i.done_at
      ) ORDER BY i.sort_order, i.name)
      FROM public.surgery_referral_items i WHERE i.referral_id = r.id
    ), '[]'::jsonb)
  )
  FROM public.surgery_referrals r
  WHERE r.public_hash = _hash
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_surgery_referral(TEXT) TO anon, authenticated;

-- Пациент отмечает обследование как сданное
CREATE OR REPLACE FUNCTION public.mark_public_referral_item(_hash TEXT, _item_id UUID, _done BOOLEAN)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ref_id UUID;
BEGIN
  SELECT id INTO _ref_id FROM public.surgery_referrals WHERE public_hash = _hash;
  IF _ref_id IS NULL THEN RETURN false; END IF;

  UPDATE public.surgery_referral_items
    SET is_done = _done, done_at = CASE WHEN _done THEN CURRENT_DATE ELSE NULL END
    WHERE id = _item_id AND referral_id = _ref_id;

  INSERT INTO public.surgery_referral_events (referral_id, event_type, comment, actor_kind)
  VALUES (_ref_id, CASE WHEN _done THEN 'item_done' ELSE 'item_undone' END, NULL, 'patient');

  UPDATE public.surgery_referrals
    SET last_contact_at = now(),
        status = CASE WHEN status = 'issued' THEN 'labs_in_progress' ELSE status END
    WHERE id = _ref_id;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_public_referral_item(TEXT, UUID, BOOLEAN) TO anon, authenticated;