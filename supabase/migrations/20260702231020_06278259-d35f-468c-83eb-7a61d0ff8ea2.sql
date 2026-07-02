
-- Откат ложных совпадений
UPDATE public.lab_tests_catalog
   SET short_name = NULL, kdl_slug = NULL, synonyms = '[]'::jsonb, updated_at = now()
 WHERE short_name IN ('PHOS','HGB','TG')
   AND (name ILIKE '%креатинин%' OR name ILIKE '%гликированный%' OR name ILIKE 'ттг%');

-- Также очистить TSH, если оно осталось прикрепленным к пустой записи
UPDATE public.lab_tests_catalog SET short_name = NULL, kdl_slug = NULL WHERE short_name = 'TSH' AND (name IS NULL OR trim(name) = '');

-- Создать/дополнить недостающие записи
INSERT INTO public.lab_tests_catalog (name, short_name, kdl_slug, synonyms, is_active, unit) VALUES
 ('Фосфор', 'PHOS', 'PHOS', '["phosphorus","фосфор неорганический","P"]'::jsonb, true, 'ммоль/л'),
 ('Гемоглобин', 'HGB', 'HGB', '["hemoglobin","Hb","HGB"]'::jsonb, true, 'г/л'),
 ('Триглицериды', 'TG', 'TG', '["triglycerides","ТГ"]'::jsonb, true, 'ммоль/л'),
 ('ТТГ', 'TSH', 'TSH', '["тиреотропный гормон","TSH"]'::jsonb, true, 'мкМЕ/мл'),
 ('Гликированный гемоглобин', 'HBA1C', 'HBA1C', '["HbA1c","гликогемоглобин"]'::jsonb, true, '%')
ON CONFLICT DO NOTHING;
