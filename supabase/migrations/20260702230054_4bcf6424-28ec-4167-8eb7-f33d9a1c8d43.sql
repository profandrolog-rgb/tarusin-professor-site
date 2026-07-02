
-- Upsert 10 pathways (Package 2 + 3)
INSERT INTO public.pathways (slug, name, is_active, nodes, edges, rules) VALUES
('lipids','Липидный обмен',true,
 '[{"id":"liver","label":"Печень"},{"id":"ldl","label":"ЛПНП"},{"id":"hdl","label":"ЛПВП"},{"id":"vldl","label":"ЛПОНП"},{"id":"total_chol","label":"Общий ХС"},{"id":"tg","label":"Триглицериды"},{"id":"athero","label":"Индекс атерогенности"},{"id":"vessel","label":"Сосудистая стенка"}]'::jsonb,
 '[{"from":"liver","to":"ldl"},{"from":"liver","to":"vldl"},{"from":"vldl","to":"tg"},{"from":"hdl","to":"liver","label":"обратный транспорт"},{"from":"ldl","to":"vessel"}]'::jsonb,
 '[{"code":"ldl_high","when":{"test_code":"LDL","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["ldl","vessel"]},{"code":"total_chol_high","when":{"test_code":"CHOL","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["total_chol"]},{"code":"tg_high","when":{"test_code":"TG","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["tg","vldl"]},{"code":"hdl_low","when":{"test_code":"HDL","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["hdl"]}]'::jsonb),
('inflammation','Воспаление / протеинограмма',true,
 '[{"id":"crp","label":"СРБ"},{"id":"esr","label":"СОЭ"},{"id":"ferritin_react","label":"Ферритин (реактант)"},{"id":"albumin","label":"Альбумин"},{"id":"globulins","label":"Глобулины"},{"id":"total_protein","label":"Общий белок"}]'::jsonb,
 '[{"from":"crp","to":"esr"},{"from":"ferritin_react","to":"crp"},{"from":"albumin","to":"total_protein"},{"from":"globulins","to":"total_protein"}]'::jsonb,
 '[{"code":"crp_high","when":{"test_code":"CRP","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["crp"]},{"code":"esr_high","when":{"test_code":"ESR","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["esr"]},{"code":"albumin_low","when":{"test_code":"ALB","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["albumin"]}]'::jsonb),
('oxidative_stress','Оксидативный стресс',true,
 '[{"id":"ros","label":"АФК (ROS)"},{"id":"glutathione","label":"Глутатион"},{"id":"selenium_ox","label":"Селен"},{"id":"vit_e","label":"Витамин E"},{"id":"vit_c","label":"Витамин C"},{"id":"uric_acid","label":"Мочевая кислота"},{"id":"antiox","label":"Антиоксидантная защита"}]'::jsonb,
 '[{"from":"ros","to":"antiox"},{"from":"glutathione","to":"antiox"},{"from":"selenium_ox","to":"antiox"},{"from":"vit_e","to":"antiox"},{"from":"vit_c","to":"antiox"}]'::jsonb,
 '[{"code":"uric_acid_high","when":{"test_code":"UA","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["uric_acid"]},{"code":"selenium_low_ox","when":{"test_code":"SE","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["selenium_ox","antiox"]},{"code":"vit_e_low","when":{"test_code":"VITE","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["vit_e"]}]'::jsonb),
('electrolytes_abr','Электролиты / КЩБ',true,
 '[{"id":"sodium","label":"Натрий"},{"id":"potassium","label":"Калий"},{"id":"chloride","label":"Хлор"},{"id":"bicarbonate","label":"Бикарбонат"},{"id":"anion_gap","label":"Анионный разрыв"},{"id":"kidney","label":"Почки"},{"id":"acid_base","label":"КЩБ"}]'::jsonb,
 '[{"from":"kidney","to":"sodium"},{"from":"kidney","to":"potassium"},{"from":"bicarbonate","to":"acid_base"},{"from":"anion_gap","to":"acid_base"}]'::jsonb,
 '[{"code":"potassium_high","when":{"test_code":"K","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["potassium"]},{"code":"potassium_low","when":{"test_code":"K","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["potassium"]},{"code":"sodium_low","when":{"test_code":"NA","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["sodium"]},{"code":"bicarbonate_low","when":{"test_code":"HCO3","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["bicarbonate","acid_base"]}]'::jsonb),
('energy_tca','Энергетика / цикл Кребса',true,
 '[{"id":"glucose","label":"Глюкоза"},{"id":"pyruvate","label":"Пируват"},{"id":"lactate","label":"Лактат"},{"id":"tca","label":"Цикл Кребса"},{"id":"resp_chain","label":"Дыхательная цепь"},{"id":"b_vit","label":"B1/B2/B3/B5"},{"id":"magnesium","label":"Магний"},{"id":"ldh","label":"ЛДГ"},{"id":"ck","label":"КФК"}]'::jsonb,
 '[{"from":"glucose","to":"pyruvate"},{"from":"pyruvate","to":"lactate"},{"from":"pyruvate","to":"tca"},{"from":"tca","to":"resp_chain"},{"from":"b_vit","to":"tca"},{"from":"magnesium","to":"tca"}]'::jsonb,
 '[{"code":"lactate_high","when":{"test_code":"LAC","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["lactate","tca"]},{"code":"ldh_high","when":{"test_code":"LDH","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["ldh"]},{"code":"magnesium_low","when":{"test_code":"MG","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["magnesium","tca"]}]'::jsonb),
('insulin_glucose','Инсулин-глюкоза / инсулинорезистентность',true,
 '[{"id":"pancreas","label":"Поджелудочная (β-клетки)"},{"id":"insulin","label":"Инсулин"},{"id":"glucose","label":"Глюкоза"},{"id":"homa","label":"HOMA-IR"},{"id":"c_peptide","label":"C-пептид"},{"id":"hba1c","label":"HbA1c"},{"id":"insulin_receptor","label":"Инсулиновый рецептор"},{"id":"muscle","label":"Мышцы/жир"}]'::jsonb,
 '[{"from":"pancreas","to":"insulin"},{"from":"insulin","to":"insulin_receptor"},{"from":"insulin_receptor","to":"muscle"},{"from":"glucose","to":"pancreas","label":"стимул"}]'::jsonb,
 '[{"code":"glucose_high","when":{"test_code":"GLU","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["glucose","pancreas"]},{"code":"hba1c_high","when":{"test_code":"HBA1C","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["hba1c"]},{"code":"homa_high","when":{"test_code":"HOMA","op":">","value":3.4},"raises_to":"moderate","highlight_nodes":["homa","insulin_receptor"],"note":"порог настраиваемый; у подростков зависит от стадии пубертата"},{"code":"insulin_high","when":{"test_code":"INS","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["insulin","insulin_receptor"]}]'::jsonb),
('hpa','Надпочечники / ось стресса (HPA)',true,
 '[{"id":"crh","label":"КРГ (гипоталамус)"},{"id":"acth","label":"АКТГ (гипофиз)"},{"id":"adrenal","label":"Надпочечники"},{"id":"cortisol","label":"Кортизол"},{"id":"dhea_s","label":"ДГЭА-С"},{"id":"stress","label":"Стресс"}]'::jsonb,
 '[{"from":"crh","to":"acth"},{"from":"acth","to":"adrenal"},{"from":"adrenal","to":"cortisol"},{"from":"adrenal","to":"dhea_s"},{"from":"cortisol","to":"crh","label":"− обратная связь"},{"from":"stress","to":"crh"}]'::jsonb,
 '[{"code":"cortisol_low","when":{"test_code":"CORT","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["cortisol","adrenal"]},{"code":"cortisol_high","when":{"test_code":"CORT","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["cortisol","adrenal"]},{"code":"dhea_s_low","when":{"test_code":"DHEAS","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["dhea_s"]}]'::jsonb),
('detox_p12','Детоксикация I–II фазы (печень)',true,
 '[{"id":"phase1","label":"I фаза (CYP)"},{"id":"phase2","label":"II фаза (конъюгация)"},{"id":"glutathione2","label":"Глутатион"},{"id":"alt","label":"АЛТ"},{"id":"ast","label":"АСТ"},{"id":"ggt","label":"ГГТ"},{"id":"bilirubin","label":"Билирубин"},{"id":"liver2","label":"Печень"}]'::jsonb,
 '[{"from":"phase1","to":"phase2"},{"from":"glutathione2","to":"phase2"},{"from":"phase2","to":"liver2"}]'::jsonb,
 '[{"code":"alt_high","when":{"test_code":"ALT","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["alt","liver2","phase1"]},{"code":"ast_high","when":{"test_code":"AST","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["ast","liver2"]},{"code":"ggt_high","when":{"test_code":"GGT","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["ggt","phase2"]},{"code":"bilirubin_high","when":{"test_code":"TBIL","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["bilirubin","liver2"]}]'::jsonb),
('gut_permeability','Кишечная проницаемость',true,
 '[{"id":"barrier","label":"Кишечный барьер"},{"id":"zonulin","label":"Зонулин"},{"id":"calprotectin","label":"Кальпротектин"},{"id":"siga","label":"Секреторный IgA"},{"id":"microbiota","label":"Микробиота"}]'::jsonb,
 '[{"from":"barrier","to":"zonulin"},{"from":"barrier","to":"calprotectin"},{"from":"microbiota","to":"barrier"}]'::jsonb,
 '[{"code":"calprotectin_high","when":{"test_code":"CALPRO","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["calprotectin","barrier"]},{"code":"zonulin_high","when":{"test_code":"ZONULIN","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["zonulin","barrier"]},{"code":"siga_low","when":{"test_code":"SIGA","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["siga"]}]'::jsonb),
('iron','Обмен железа',true,
 '[{"id":"ferritin_store","label":"Ферритин (депо)"},{"id":"serum_iron","label":"Сыв. железо"},{"id":"tibc","label":"ОЖСС"},{"id":"tsat","label":"Насыщение трансферрина"},{"id":"transferrin","label":"Трансферрин"},{"id":"hemoglobin","label":"Гемоглобин"},{"id":"mcv","label":"MCV"},{"id":"erythron","label":"Эритрон"}]'::jsonb,
 '[{"from":"ferritin_store","to":"serum_iron"},{"from":"serum_iron","to":"erythron"},{"from":"erythron","to":"hemoglobin"},{"from":"transferrin","to":"tsat"}]'::jsonb,
 '[{"code":"ferritin_low","when":{"test_code":"FERR","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["ferritin_store","erythron"]},{"code":"tsat_low","when":{"test_code":"TSAT","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["tsat"]},{"code":"hemoglobin_low","when":{"test_code":"HGB","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["hemoglobin","erythron"]},{"code":"mcv_low","when":{"test_code":"MCV","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["mcv"]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, is_active = EXCLUDED.is_active,
  nodes = EXCLUDED.nodes, edges = EXCLUDED.edges, rules = EXCLUDED.rules,
  updated_at = now();

-- Severity texts (30 rows)
WITH pw AS (SELECT id, slug FROM public.pathways WHERE slug IN ('lipids','inflammation','oxidative_stress','electrolytes_abr','energy_tca','insulin_glucose','hpa','detox_p12','gut_permeability','iron'))
INSERT INTO public.pathway_severity_texts (pathway_id, severity, text_pro, text_plain)
SELECT pw.id, v.severity, v.text_pro, v.text_plain FROM pw JOIN (VALUES
('lipids','mild','Пограничная дислипидемия — контроль питания, повтор натощак; у детей ориентироваться на возрастной референс.','Небольшое отклонение холестерина; часто корректируется питанием.'),
('lipids','moderate','Отчётливая дислипидемия (повышение ЛПНП/ТГ или снижение ЛПВП) — оценить семейный анамнез, исключить вторичные причины, скорректировать образ жизни.','Заметное нарушение баланса жиров крови. Важно питание и образ жизни; врач оценит причины.'),
('lipids','severe','Выраженная дислипидемия — исключить семейную гиперлипидемию; решение о тактике коррекции.','Существенное нарушение жиров крови, требующее обследования и коррекции.'),
('inflammation','mild','Пограничные маркеры воспаления — оценить клинику, повтор в динамике.','Небольшие признаки воспаления; часто требует только контроля.'),
('inflammation','moderate','Активное воспаление (СРБ/СОЭ) и/или сдвиги протеинограммы — искать источник; ферритин как реактант может маскировать дефицит железа.','Заметные признаки воспаления. Врач ищет причину и учитывает влияние на другие показатели.'),
('inflammation','severe','Выраженная воспалительная реакция — требует установления причины и активной оценки.','Существенное воспаление, требующее обследования.'),
('oxidative_stress','mild','Признаки дисбаланса антиоксидантной защиты (дефицит селена/вит.E, гиперурикемия).','Небольшой дисбаланс защиты клеток от «окисления»; корректируется питанием.'),
('oxidative_stress','moderate','Значимый оксидативный дисбаланс — влияние на сперматогенез и сосуды; коррекция антиоксидантного статуса.','Заметный дисбаланс, важный в т.ч. для репродукции; врач подберёт коррекцию.'),
('oxidative_stress','severe','Выраженный оксидативный стресс — активная коррекция и поиск причины.','Существенный дисбаланс, требующий коррекции.'),
('electrolytes_abr','mild','Пограничные электролитные сдвиги — контроль, оценка гидратации/почек.','Небольшое отклонение солей крови; часто требует контроля.'),
('electrolytes_abr','moderate','Значимый электролитный сдвиг (особенно калий) и/или нарушение КЩБ — оценить функцию почек, гидратацию, кислотно-щелочной баланс.','Заметное нарушение солевого/кислотного баланса. Врач оценит почки и водный обмен.'),
('electrolytes_abr','severe','Выраженное нарушение (гипер/гипокалиемия, ацидоз) — требует срочной оценки.','Существенное нарушение баланса, требующее быстрой оценки.'),
('energy_tca','mild','Пограничные маркеры энергообмена (магний, лёгкая гиперлактатемия).','Небольшое отклонение в «энергетике» клеток; часто дефицит магния.'),
('energy_tca','moderate','Значимая гиперлактатемия/дефицит кофакторов — оценить митохондриальную функцию, восполнить кофакторы (B-витамины, магний).','Заметное отклонение в выработке энергии клетками. Врач восполнит нужные витамины и минералы.'),
('energy_tca','severe','Выраженная гиперлактатемия — исключить митохондриальную/метаболическую патологию.','Существенное нарушение энергообмена, требующее обследования.'),
('insulin_glucose','mild','Пограничная инсулинорезистентность (HOMA-IR у порога, лёгкая гиперинсулинемия) — образ жизни, контроль.','Небольшой сбой в усвоении сахара; корректируется питанием и активностью.'),
('insulin_glucose','moderate','Отчётливая инсулинорезистентность/нарушение гликемии — оценить массу тела, липиды, при ИР рассмотреть метформин (off-label) для снижения гиперинсулинемии.','Заметный сбой в усвоении сахара. Важны питание, вес и активность; врач подберёт тактику.'),
('insulin_glucose','severe','Выраженное нарушение углеводного обмена — исключить диабет, активная коррекция.','Существенное нарушение обмена сахара, требующее обследования.'),
('hpa','mild','Пограничные показатели HPA — учесть время забора (утро) и стресс-контекст.','Небольшое отклонение «гормонов стресса»; важно время сдачи анализа.'),
('hpa','moderate','Значимый сдвиг кортизола/ДГЭА-С — оценить хронический стресс (влияет на кисспептин и пубертат), при низком кортизоле исключить надпочечниковую недостаточность.','Заметное отклонение гормонов стресса. Хронический стресс влияет и на половое созревание; врач оценит ситуацию.'),
('hpa','severe','Выраженное нарушение — исключить надпочечниковую недостаточность/гиперкортицизм.','Существенное нарушение, требующее обследования.'),
('detox_p12','mild','Пограничные печёночные маркеры — оценить нагрузку, повтор в динамике.','Небольшое отклонение печёночных показателей; часто требует контроля.'),
('detox_p12','moderate','Значимый цитолиз/холестаз или снижение конъюгации — оценить причину (лекарства, стеатоз, вирусы), поддержать II фазу.','Заметное отклонение работы печени. Врач уточнит причину и поддержит функцию.'),
('detox_p12','severe','Выраженное нарушение печёночных проб — требует обследования.','Существенное нарушение печени, требующее обследования.'),
('gut_permeability','mild','Пограничные маркеры барьерной функции — оценить питание, микробиоту (доказательность части маркеров ограничена).','Небольшой сигнал со стороны кишечника; часто связан с питанием.'),
('gut_permeability','moderate','Повышенный кальпротектин — признак кишечного воспаления; требует гастроэнтерологической оценки.','Заметный признак воспаления в кишечнике. Нужна оценка и, возможно, дообследование.'),
('gut_permeability','severe','Выраженное кишечное воспаление — активная оценка причины.','Существенное воспаление кишечника, требующее обследования.'),
('iron','mild','Латентный дефицит железа (снижение ферритина при нормальном Hb) — коррекция, контроль.','Скрытая нехватка железа; корректируется питанием/препаратами.'),
('iron','moderate','Железодефицит (низкий ферритин/насыщение, микроцитоз) — коррекция с контролем; учесть маскировку ферритина воспалением.','Нехватка железа, влияющая на кровь и энергию. Врач назначит коррекцию и контроль.'),
('iron','severe','Железодефицитная анемия — активная терапия и поиск источника потерь.','Существенная нехватка железа с анемией — требует лечения и обследования.')
) AS v(slug, severity, text_pro, text_plain) ON v.slug = pw.slug
ON CONFLICT (pathway_id, severity) DO UPDATE SET text_pro = EXCLUDED.text_pro, text_plain = EXCLUDED.text_plain, updated_at = now();

-- Lipid references (KDL, adults)
INSERT INTO public.reference_ranges (analyte_code, sex, age_min_years, age_max_years, ref_low, ref_high, unit, source) VALUES
('CHOL','A',18,120,0,5.2,'ммоль/л','КДЛ (взрослые)'),
('LDL','A',18,120,0,3.3,'ммоль/л','КДЛ (взрослые)'),
('HDL','A',18,120,1.03,1.55,'ммоль/л','КДЛ (взрослые)'),
('VLDL','A',18,120,0.13,1.63,'ммоль/л','КДЛ (взрослые)'),
('TG','A',18,120,0,2.25,'ммоль/л','КДЛ (взрослые)');
