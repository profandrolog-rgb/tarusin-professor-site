
INSERT INTO public.pathways (slug, name, sex, is_active, nodes, edges, rules, "group", group_order)
VALUES (
  'hpg_axis',
  'Гипоталамо-гипофизарно-гонадная ось (ГГГ)',
  'M',
  true,
  '[
    {"id":"hypothalamus","label":"Гипоталамус (ГнРГ)"},
    {"id":"pituitary","label":"Гипофиз"},
    {"id":"lh","label":"ЛГ"},
    {"id":"fsh","label":"ФСГ"},
    {"id":"leydig","label":"Клетки Лейдига"},
    {"id":"sertoli","label":"Клетки Сертоли"},
    {"id":"testosterone","label":"Тестостерон"},
    {"id":"free_t","label":"Свободный тестостерон"},
    {"id":"shbg","label":"ГСПГ"},
    {"id":"estradiol","label":"Эстрадиол"},
    {"id":"inhibin_b","label":"Ингибин B"},
    {"id":"amh","label":"АМГ"},
    {"id":"prolactin","label":"Пролактин"},
    {"id":"spermatogenesis","label":"Сперматогенез"}
  ]'::jsonb,
  '[
    {"from":"hypothalamus","to":"pituitary","label":"ГнРГ"},
    {"from":"pituitary","to":"lh"},
    {"from":"pituitary","to":"fsh"},
    {"from":"lh","to":"leydig"},
    {"from":"leydig","to":"testosterone"},
    {"from":"fsh","to":"sertoli"},
    {"from":"sertoli","to":"inhibin_b"},
    {"from":"sertoli","to":"spermatogenesis"},
    {"from":"testosterone","to":"estradiol","label":"ароматизация"},
    {"from":"shbg","to":"free_t","label":"связывание"},
    {"from":"testosterone","to":"hypothalamus","label":"− обратная связь"},
    {"from":"inhibin_b","to":"fsh","label":"− обратная связь"},
    {"from":"prolactin","to":"hypothalamus","label":"подавление"}
  ]'::jsonb,
  '[
    {"code":"testosterone_low","when":{"test_code":"TESTO","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["testosterone","leydig"]},
    {"code":"free_t_low","when":{"test_code":"FTESTO","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["free_t","leydig"]},
    {"code":"lh_high","when":{"test_code":"LH","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["pituitary","lh"]},
    {"code":"fsh_high","when":{"test_code":"FSH","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["pituitary","fsh"]},
    {"code":"lh_low","when":{"test_code":"LH","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["pituitary","lh"]},
    {"code":"fsh_low","when":{"test_code":"FSH","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["pituitary","fsh"]},
    {"code":"inhibin_b_low","when":{"test_code":"INHB","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["sertoli","spermatogenesis"]},
    {"code":"prolactin_high","when":{"test_code":"PRL","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["prolactin","hypothalamus"]},
    {"code":"estradiol_high_m","when":{"test_code":"E2","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["estradiol"]},
    {"code":"shbg_high_m","when":{"test_code":"SHBG","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["shbg","free_t"]}
  ]'::jsonb,
  'endocrine',
  20
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sex = EXCLUDED.sex,
  is_active = true,
  nodes = EXCLUDED.nodes,
  edges = EXCLUDED.edges,
  rules = EXCLUDED.rules;

WITH pw AS (SELECT id FROM public.pathways WHERE slug='hpg_axis')
INSERT INTO public.pathway_severity_texts (pathway_id, severity, text_pro, text_plain)
SELECT pw.id, s.severity, s.text_pro, s.text_plain FROM pw, (VALUES
  ('mild',
   'Пограничные отклонения гонадной оси (ЛГ/ФСГ/тестостерон/ингибин B у границы). Может отражать вариант нормы пубертатного перехода. Сопоставить со стадией Таннера и костным возрастом, повторить утренний забор.',
   'Небольшое отклонение гормонов полового созревания. Часто это вариант нормы — организм развивается в своём темпе.'),
  ('moderate',
   'Отчётливое нарушение: низкие гонадотропины при низком тестостероне — гипогонадотропный (центральный) тип; высокие гонадотропины при низком тестостероне — гипергонадотропный (первично-тестикулярный). Оценить костный возраст, стадию Таннера, объём яичек, динамику.',
   'Заметное нарушение гормонов полового созревания. Врач уточнит, где сбой — в «центре управления» или в самих яичках, и оценит развитие.'),
  ('severe',
   'Выраженное нарушение с клинически значимым дефицитом — установить тип гипогонадизма, решить о тактике индукции/заместительной терапии; при гипергонадотропном паттерне исключить первичную тестикулярную патологию.',
   'Существенное нарушение гормонов полового созревания, требующее уточнения причины и подбора лечения.')
) AS s(severity, text_pro, text_plain)
ON CONFLICT (pathway_id, severity) DO UPDATE SET
  text_pro = EXCLUDED.text_pro,
  text_plain = EXCLUDED.text_plain;

INSERT INTO public.reference_ranges (analyte_code, sex, age_min_years, age_max_years, ref_low, ref_high, unit, method, source) VALUES
  ('TESTO','M',0.01,0.5, 0.3,   10.376,'нмоль/л','ИХЛА','КДЛ'),
  ('TESTO','M',0.5, 9,   0,     1.241, 'нмоль/л','ИХЛА','КДЛ'),
  ('TESTO','M',9,   11,  0,     0.81,  'нмоль/л','ИХЛА','КДЛ'),
  ('TESTO','M',11,  14,  0,     15.43, 'нмоль/л','ИХЛА','КДЛ'),
  ('TESTO','M',14,  16,  1.251, 21.954,'нмоль/л','ИХЛА','КДЛ'),
  ('TESTO','M',16,  20,  5.133, 27.568,'нмоль/л','ИХЛА','КДЛ'),
  ('TESTO','M',20,  50,  8.33,  30.19, 'нмоль/л','ИХЛА','КДЛ'),
  ('TESTO','M',50,  120, 7.66,  24.82, 'нмоль/л','ИХЛА','КДЛ'),
  ('LH',   'M',0.011,0.25,0.19, 3.81,  'мМЕ/мл','ИХЛА','КДЛ'),
  ('LH',   'M',0.25,1,   0,     2.89,  'мМЕ/мл','ИХЛА','КДЛ'),
  ('LH',   'M',1,   10,  0,     0.33,  'мМЕ/мл','ИХЛА','КДЛ'),
  ('LH',   'M',10,  13,  0,     4.34,  'мМЕ/мл','ИХЛА','КДЛ'),
  ('LH',   'M',13,  15,  0,     4.11,  'мМЕ/мл','ИХЛА','КДЛ'),
  ('LH',   'M',15,  17,  0.79,  4.76,  'мМЕ/мл','ИХЛА','КДЛ'),
  ('LH',   'M',17,  19,  0.94,  7.1,   'мМЕ/мл','ИХЛА','КДЛ'),
  ('LH',   'M',19,  120, 0.57,  12.07, 'мМЕ/мл','ИХЛА','КДЛ'),
  ('FSH',  'M',19,  120, 0.95,  11.95, 'мМЕ/мл','ИХЛА','КДЛ');

UPDATE public.lab_tests_catalog
   SET synonyms = '["LH","Luteinizing Hormone","Лютропин","Лютеинизирующий гормон"]'::jsonb
 WHERE short_name = 'ЛГ';

UPDATE public.lab_tests_catalog
   SET synonyms = COALESCE(synonyms,'[]'::jsonb) || '["FTESTO","Free testosterone","Свободный тестостерон","Т свободный"]'::jsonb
 WHERE short_name = 'Т свободный';

INSERT INTO public.lab_tests_catalog (name, short_name, unit, category, is_active, synonyms)
SELECT 'Ингибин B', 'INHB', 'пг/мл', 'гормоны', true,
       '["INHB","Inhibin B","ингибин B","ингибин Б"]'::jsonb
 WHERE NOT EXISTS (
   SELECT 1 FROM public.lab_tests_catalog
    WHERE short_name = 'INHB' OR name ILIKE 'ингибин b%'
 );
