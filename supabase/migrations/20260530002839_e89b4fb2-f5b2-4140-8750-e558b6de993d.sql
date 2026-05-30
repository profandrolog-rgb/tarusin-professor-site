
-- Унифицируем field_key: операционные шаблоны 'local_status' для послеоперационных
-- протоколов теперь пишут в 'wound_status' (единое поле в форме).
UPDATE public.visit_text_templates
SET field_key = 'wound_status'
WHERE field_key = 'local_status'
  AND protocol_type IN ('postop_day3', 'postop_day7', 'postop_day10');

-- Шаблон «Жалобы — нет» (универсальный)
INSERT INTO public.visit_text_templates
  (protocol_type, operation_keywords, day_range, field_key, label, template_text, sort_order)
VALUES
  (NULL, NULL, 'any', 'complaints', 'Жалобы — нет',
   'Активных жалоб не предъявляет.', 15),
  ('postop_day3', NULL, '3', 'complaints', 'Жалобы — 3 сутки (норма)',
   'Жалобы на умеренный болевой синдром в зоне операции, проходящий после приёма анальгетика.', 16),
  ('postop_day7', NULL, '7', 'complaints', 'Жалобы — 7 сутки (норма)',
   'Активных жалоб не предъявляет. Болевой синдром купирован.', 17);
