
-- 1) questions.author_email — column-level защита (defense-in-depth)
REVOKE SELECT (author_email) ON public.questions FROM anon, authenticated;
COMMENT ON COLUMN public.questions.author_email IS
  'PII: доступ к колонке отозван у anon/authenticated. Читают только admin/service_role. Если когда-либо появится публичная SELECT-политика, email всё равно не утечёт.';

-- 2) patient_cards — отзыв UPDATE-привилегий на чувствительные клинические колонки у обычных авторизованных
REVOKE UPDATE (diagnosis, treatment_plan, treatment_tactics, ai_reasoning,
               communication_notes, patient_specifics, notes)
  ON public.patient_cards FROM authenticated;

COMMENT ON TABLE public.patient_cards IS
  'Клинические поля (diagnosis, treatment_plan, treatment_tactics, ai_reasoning, communication_notes, patient_specifics, notes) защищены двумя уровнями: column-level REVOKE UPDATE для authenticated и триггер protect_patient_card_admin_fields. Редактируют только admin/service_role.';

-- service_role и админский путь (через edge-функции) сохраняют полный доступ — service_role не затрагивается REVOKE на authenticated.
