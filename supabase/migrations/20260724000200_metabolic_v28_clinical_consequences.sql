-- v2.8 clinical context links. These are literature-informed associations,
-- not deterministic diagnoses or treatment decisions. Lab reference intervals
-- and the patient's clinical context remain primary.
-- Idempotent: the canonical set is written on every run.

UPDATE public.pathways AS p
SET consequences = v.links,
    updated_at = now()
FROM (VALUES
  ('lipids', '[{"to_slug":"oxidative_stress","to_label":"Окислительный стресс","weight":2},{"to_slug":"inflammation","to_label":"Сосудистое воспаление","weight":1}]'::jsonb),
  ('omega3_pufa', '[{"to_slug":"inflammation","to_label":"Воспалительный фон","weight":2},{"to_slug":"lipids","to_label":"Липидный обмен","weight":1}]'::jsonb),
  ('omega6_pufa', '[{"to_slug":"inflammation","to_label":"Воспалительный фон","weight":2},{"to_slug":"lipids","to_label":"Липидный обмен","weight":1}]'::jsonb),
  ('omega9_mufa', '[{"to_slug":"lipids","to_label":"Липидный обмен","weight":1}]'::jsonb),
  ('inflammation', '[{"to_slug":"iron","to_label":"Функциональный дефицит железа","weight":2},{"to_slug":"oxidative_stress","to_label":"Окислительный стресс","weight":1}]'::jsonb),
  ('iron', '[{"to_slug":"inflammation","to_label":"Воспалительный фон","weight":1},{"to_slug":"energy_tca","to_label":"Энергетический дефицит","weight":1}]'::jsonb),
  ('hpa', '[{"to_slug":"hpg","to_label":"Гонадная ось","weight":2},{"to_slug":"insulin_glucose","to_label":"Инсулин-глюкозный обмен","weight":1}]'::jsonb),
  ('insulin_glucose', '[{"to_slug":"lipids","to_label":"Липидный обмен","weight":2},{"to_slug":"hpg","to_label":"Гонадная ось","weight":1}]'::jsonb),
  ('thyroid', '[{"to_slug":"growth_igf1","to_label":"Рост (СТГ/ИФР-1)","weight":2},{"to_slug":"hpg","to_label":"Гонадная ось","weight":1}]'::jsonb),
  ('growth_igf1', '[{"to_slug":"bone_mineral","to_label":"Костно-минеральный обмен","weight":2}]'::jsonb),
  ('bone_mineral', '[{"to_slug":"growth_igf1","to_label":"Рост (СТГ/ИФР-1)","weight":2}]'::jsonb),
  ('methylation', '[{"to_slug":"oxidative_stress","to_label":"Окислительный стресс","weight":2},{"to_slug":"inflammation","to_label":"Воспалительный фон","weight":1}]'::jsonb),
  ('glutathione_detox', '[{"to_slug":"oxidative_stress","to_label":"Окислительный стресс","weight":2}]'::jsonb),
  ('detox_p12', '[{"to_slug":"glutathione_detox","to_label":"Глутатион и детоксикация","weight":1}]'::jsonb),
  ('bcaa_catabolism', '[{"to_slug":"insulin_glucose","to_label":"Инсулин-глюкозный обмен","weight":1}]'::jsonb),
  ('tryptophan_kynurenine', '[{"to_slug":"inflammation","to_label":"Воспалительный фон","weight":2},{"to_slug":"oxidative_stress","to_label":"Окислительный стресс","weight":1}]'::jsonb),
  ('ketogenesis_beta_oxidation', '[{"to_slug":"energy_tca","to_label":"Цикл Кребса и энергообеспечение","weight":2},{"to_slug":"insulin_glucose","to_label":"Инсулин-глюкозный обмен","weight":1}]'::jsonb),
  ('amino_urea', '[{"to_slug":"energy_tca","to_label":"Цикл Кребса и энергообеспечение","weight":1}]'::jsonb)
) AS v(slug, links)
WHERE p.slug = v.slug;
