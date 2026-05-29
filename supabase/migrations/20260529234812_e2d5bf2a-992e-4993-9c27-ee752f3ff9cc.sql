ALTER TABLE public.patient_visits DROP CONSTRAINT IF EXISTS patient_visits_protocol_type_check;
ALTER TABLE public.patient_visits ADD CONSTRAINT patient_visits_protocol_type_check
  CHECK (protocol_type = ANY (ARRAY[
    'ultrashort','primary_short','dynamic','dynamic_with_uzi','repeat_with_labs',
    'uzi_reproductive','uzi_urinary','postop_day3','postop_day7','postop_day10',
    'repeat_with_uzi','online_consult','unknown'
  ]));