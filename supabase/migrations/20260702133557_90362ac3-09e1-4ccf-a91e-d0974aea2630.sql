
ALTER TABLE public.pathways ADD COLUMN IF NOT EXISTS rules jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.metabolic_maps ADD COLUMN IF NOT EXISTS source_visit_id uuid;
ALTER TABLE public.metabolic_maps ADD COLUMN IF NOT EXISTS last_aggregated_at timestamptz;
ALTER TABLE public.metabolic_maps ADD COLUMN IF NOT EXISTS aggregate_summary jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Seed 5 pathways (upsert by slug)
INSERT INTO public.pathways (slug, name, description, nodes, edges, rules) VALUES
('iron', 'Обмен железа', 'Депо, транспорт и утилизация железа',
 '[
   {"id":"ferritin","label":"Ферритин","x":80,"y":90},
   {"id":"iron_serum","label":"Железо сыв.","x":220,"y":50},
   {"id":"transferrin","label":"Трансферрин","x":220,"y":130},
   {"id":"tsat","label":"НТЖ","x":360,"y":90},
   {"id":"hb","label":"Гемоглобин","x":500,"y":90}
 ]'::jsonb,
 '[
   {"from":"ferritin","to":"iron_serum"},
   {"from":"iron_serum","to":"tsat"},
   {"from":"transferrin","to":"tsat"},
   {"from":"tsat","to":"hb"}
 ]'::jsonb,
 '[
   {"id":"ferritin_low","node_id":"ferritin","label":"Ферритин снижен","direction":"below","match":{"codes":["ferritin"],"names":["ферритин"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"iron_low","node_id":"iron_serum","label":"Железо сыв. снижено","direction":"below","match":{"codes":["iron"],"names":["железо сыв","сывороточное железо"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"transferrin_high","node_id":"transferrin","label":"Трансферрин повышен","direction":"above","match":{"codes":["transferrin"],"names":["трансферрин"]},"thresholds":{"mild":1.1,"moderate":1.3,"severe":1.5}},
   {"id":"hb_low","node_id":"hb","label":"Гемоглобин снижен","direction":"below","match":{"codes":["hemoglobin","hb"],"names":["гемоглобин"]},"thresholds":{"mild":0.95,"moderate":0.85,"severe":0.7}}
 ]'::jsonb),

('methylation', 'Метилирование', 'Гомоцистеин и кофакторы (B12, фолат)',
 '[
   {"id":"b12","label":"B12","x":80,"y":90},
   {"id":"folate","label":"Фолат","x":80,"y":30},
   {"id":"b6","label":"B6","x":80,"y":150},
   {"id":"methyl","label":"Метил-цикл","x":300,"y":90},
   {"id":"hcy","label":"Гомоцистеин","x":520,"y":90}
 ]'::jsonb,
 '[
   {"from":"b12","to":"methyl"},{"from":"folate","to":"methyl"},{"from":"b6","to":"methyl"},{"from":"methyl","to":"hcy"}
 ]'::jsonb,
 '[
   {"id":"b12_low","node_id":"b12","label":"B12 снижен","direction":"below","match":{"codes":["b12","vitamin_b12"],"names":["b12","цианокобаламин","витамин b12"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"folate_low","node_id":"folate","label":"Фолат снижен","direction":"below","match":{"codes":["folate","folic_acid"],"names":["фолат","фолиев"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"hcy_high","node_id":"hcy","label":"Гомоцистеин повышен","direction":"above","match":{"codes":["homocysteine","hcy"],"names":["гомоцистеин"]},"thresholds":{"mild":1.1,"moderate":1.5,"severe":2.0}}
 ]'::jsonb),

('hpg', 'Ось HPG (гипоталамус–гипофиз–гонады)', 'ЛГ/ФСГ и половые стероиды',
 '[
   {"id":"lh","label":"ЛГ","x":80,"y":50},
   {"id":"fsh","label":"ФСГ","x":80,"y":130},
   {"id":"testosterone","label":"Тестостерон","x":300,"y":50},
   {"id":"estradiol","label":"Эстрадиол","x":300,"y":130},
   {"id":"shbg","label":"ГСПГ","x":520,"y":90}
 ]'::jsonb,
 '[
   {"from":"lh","to":"testosterone"},{"from":"fsh","to":"estradiol"},{"from":"testosterone","to":"shbg"},{"from":"estradiol","to":"shbg"}
 ]'::jsonb,
 '[
   {"id":"lh_out","node_id":"lh","label":"ЛГ вне нормы","direction":"outside","match":{"codes":["lh"],"names":["лг","лютеинизирующ"]},"thresholds":{"mild":0.1,"moderate":0.3,"severe":0.6}},
   {"id":"fsh_out","node_id":"fsh","label":"ФСГ вне нормы","direction":"outside","match":{"codes":["fsh"],"names":["фсг","фолликулостимулирующ"]},"thresholds":{"mild":0.1,"moderate":0.3,"severe":0.6}},
   {"id":"testo_low","node_id":"testosterone","label":"Тестостерон снижен","direction":"below","match":{"codes":["testosterone_total","testosterone"],"names":["тестостерон общий","тестостерон"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"shbg_out","node_id":"shbg","label":"ГСПГ вне нормы","direction":"outside","match":{"codes":["shbg"],"names":["гспг","shbg"]},"thresholds":{"mild":0.1,"moderate":0.3,"severe":0.6}}
 ]'::jsonb),

('energy_tca', 'Энергообмен (ЦТК/митохондрии)', 'Глюкоза, инсулин, лактат и связанное',
 '[
   {"id":"glucose","label":"Глюкоза","x":80,"y":60},
   {"id":"insulin","label":"Инсулин","x":80,"y":140},
   {"id":"homa","label":"HOMA-IR","x":260,"y":100},
   {"id":"lactate","label":"Лактат","x":440,"y":60},
   {"id":"tca","label":"ЦТК","x":440,"y":140}
 ]'::jsonb,
 '[
   {"from":"glucose","to":"homa"},{"from":"insulin","to":"homa"},{"from":"homa","to":"tca"},{"from":"lactate","to":"tca"}
 ]'::jsonb,
 '[
   {"id":"glu_high","node_id":"glucose","label":"Глюкоза повышена","direction":"above","match":{"codes":["glucose"],"names":["глюкоза"]},"thresholds":{"mild":1.05,"moderate":1.15,"severe":1.3}},
   {"id":"ins_high","node_id":"insulin","label":"Инсулин повышен","direction":"above","match":{"codes":["insulin"],"names":["инсулин"]},"thresholds":{"mild":1.1,"moderate":1.5,"severe":2.0}},
   {"id":"homa_high","node_id":"homa","label":"HOMA-IR повышен","direction":"above","match":{"codes":["homa_ir","homa"],"names":["homa","хома"]},"thresholds":{"mild":1.1,"moderate":1.5,"severe":2.0}},
   {"id":"lactate_high","node_id":"lactate","label":"Лактат повышен","direction":"above","match":{"codes":["lactate"],"names":["лактат"]},"thresholds":{"mild":1.1,"moderate":1.5,"severe":2.0}}
 ]'::jsonb),

('micronutrients', 'Микронутриенты', 'Витамин D, магний, цинк, селен',
 '[
   {"id":"vitd","label":"Витамин D","x":80,"y":50},
   {"id":"mg","label":"Магний","x":80,"y":130},
   {"id":"zn","label":"Цинк","x":300,"y":50},
   {"id":"se","label":"Селен","x":300,"y":130},
   {"id":"status","label":"Статус","x":520,"y":90}
 ]'::jsonb,
 '[
   {"from":"vitd","to":"status"},{"from":"mg","to":"status"},{"from":"zn","to":"status"},{"from":"se","to":"status"}
 ]'::jsonb,
 '[
   {"id":"vitd_low","node_id":"vitd","label":"Витамин D снижен","direction":"below","match":{"codes":["vitamin_d","25oh_d"],"names":["витамин d","25(oh)","25-oh"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"mg_low","node_id":"mg","label":"Магний снижен","direction":"below","match":{"codes":["magnesium","mg"],"names":["магний"]},"thresholds":{"mild":0.95,"moderate":0.85,"severe":0.7}},
   {"id":"zn_low","node_id":"zn","label":"Цинк снижен","direction":"below","match":{"codes":["zinc","zn"],"names":["цинк"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"se_low","node_id":"se","label":"Селен снижен","direction":"below","match":{"codes":["selenium","se"],"names":["селен"]},"thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}}
 ]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  nodes = EXCLUDED.nodes,
  edges = EXCLUDED.edges,
  rules = EXCLUDED.rules,
  is_active = true;
