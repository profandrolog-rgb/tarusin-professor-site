
ALTER TABLE public.pathways
  ADD COLUMN IF NOT EXISTS "group" text,
  ADD COLUMN IF NOT EXISTS group_order int DEFAULT 99,
  ADD COLUMN IF NOT EXISTS consequences jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Проставляем группы по слагам (безопасно — обновляем только если ещё не задано).
UPDATE public.pathways SET "group" = 'energy_substrates', group_order = 1
  WHERE "group" IS NULL AND slug IN ('energy_tca','insulin_glucose','lipids');

UPDATE public.pathways SET "group" = 'hormonal_axes', group_order = 2
  WHERE "group" IS NULL AND slug IN ('hpg','growth_igf1','thyroid','hpa');

UPDATE public.pathways SET "group" = 'blood_iron_inflammation', group_order = 3
  WHERE "group" IS NULL AND slug IN ('iron','inflammation');

UPDATE public.pathways SET "group" = 'micronutrients_methylation', group_order = 4
  WHERE "group" IS NULL AND slug IN ('methylation','micronutrients','micronutrients_steroid','bone_mineral');

UPDATE public.pathways SET "group" = 'amino_defense', group_order = 5
  WHERE "group" IS NULL AND slug IN ('amino_urea','oxidative_stress','detox_p12','neurotransmitters');

UPDATE public.pathways SET "group" = 'water_electrolytes', group_order = 6
  WHERE "group" IS NULL AND slug IN ('electrolytes_abr');

UPDATE public.pathways SET "group" = 'other', group_order = 7
  WHERE "group" IS NULL;

-- Дефолтные связи «причина → следствие» для цепочки проблем.
-- consequences: [{ to_slug|to_label, label, weight }]
UPDATE public.pathways SET consequences = '[
  {"to_label":"Энергетика · усталость","weight":2},
  {"to_label":"Задержка пубертата","weight":2},
  {"to_label":"Снижение когнитивных функций","weight":1}
]'::jsonb WHERE slug = 'iron' AND consequences = '[]'::jsonb;

UPDATE public.pathways SET consequences = '[
  {"to_label":"Гомоцистеин ↑","weight":2},
  {"to_label":"Костный риск","weight":1}
]'::jsonb WHERE slug = 'methylation' AND consequences = '[]'::jsonb;

UPDATE public.pathways SET consequences = '[
  {"to_label":"Задержка роста","weight":2},
  {"to_label":"Задержка пубертата","weight":1}
]'::jsonb WHERE slug = 'micronutrients' AND consequences = '[]'::jsonb;

UPDATE public.pathways SET consequences = '[
  {"to_label":"Костный риск","weight":2}
]'::jsonb WHERE slug = 'bone_mineral' AND consequences = '[]'::jsonb;

UPDATE public.pathways SET consequences = '[
  {"to_label":"Задержка пубертата","weight":2}
]'::jsonb WHERE slug = 'hpg' AND consequences = '[]'::jsonb;

UPDATE public.pathways SET consequences = '[
  {"to_label":"Задержка роста","weight":2}
]'::jsonb WHERE slug = 'growth_igf1' AND consequences = '[]'::jsonb;

UPDATE public.pathways SET consequences = '[
  {"to_label":"Энергетика · усталость","weight":2}
]'::jsonb WHERE slug = 'energy_tca' AND consequences = '[]'::jsonb;
