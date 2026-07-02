
-- 1. Reference ranges table
CREATE TABLE IF NOT EXISTS public.reference_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyte_code text NOT NULL,
  sex text NOT NULL CHECK (sex IN ('M','F','A')),
  age_min_years numeric NOT NULL DEFAULT 0,
  age_max_years numeric NOT NULL DEFAULT 200,
  ref_low numeric,
  ref_high numeric,
  unit text,
  method text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reference_ranges_lookup ON public.reference_ranges(analyte_code, sex, age_min_years, age_max_years);
GRANT SELECT ON public.reference_ranges TO authenticated;
GRANT ALL ON public.reference_ranges TO service_role;
ALTER TABLE public.reference_ranges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reference_ranges read for authenticated" ON public.reference_ranges FOR SELECT TO authenticated USING (true);
CREATE POLICY "reference_ranges manage for admin" ON public.reference_ranges FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_reference_ranges_updated_at BEFORE UPDATE ON public.reference_ranges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Severity texts table
CREATE TABLE IF NOT EXISTS public.pathway_severity_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('mild','moderate','severe')),
  text_pro text,
  text_plain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pathway_id, severity)
);
GRANT SELECT ON public.pathway_severity_texts TO authenticated;
GRANT ALL ON public.pathway_severity_texts TO service_role;
ALTER TABLE public.pathway_severity_texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pathway_severity_texts read for authenticated" ON public.pathway_severity_texts FOR SELECT TO authenticated USING (true);
CREATE POLICY "pathway_severity_texts manage for admin" ON public.pathway_severity_texts FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_pathway_severity_texts_updated_at BEFORE UPDATE ON public.pathway_severity_texts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Upsert 6 pathways (Package 1)
INSERT INTO public.pathways (slug, name, is_active, nodes, edges, rules) VALUES
('growth_igf1','Ось роста (СТГ/ИФР-1)',true,
 '[{"id":"ghrh","label":"Соматолиберин (GHRH)"},{"id":"somatostatin","label":"Соматостатин (−)"},{"id":"pituitary_gh","label":"Гипофиз (СТГ)"},{"id":"gh","label":"СТГ"},{"id":"liver","label":"Печень"},{"id":"igf1","label":"ИФР-1"},{"id":"igfbp3","label":"ИФРСБ-3"},{"id":"growth_plate","label":"Зоны роста"},{"id":"bone_growth","label":"Линейный рост"}]'::jsonb,
 '[{"from":"ghrh","to":"pituitary_gh"},{"from":"somatostatin","to":"pituitary_gh","label":"−"},{"from":"pituitary_gh","to":"gh"},{"from":"gh","to":"liver"},{"from":"liver","to":"igf1"},{"from":"igf1","to":"igfbp3","label":"транспорт"},{"from":"igf1","to":"growth_plate"},{"from":"growth_plate","to":"bone_growth"},{"from":"igf1","to":"pituitary_gh","label":"− обратная связь"}]'::jsonb,
 '[{"code":"igf1_low","when":{"test_code":"IGF1","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["igf1","liver","growth_plate"]},{"code":"igf1_high","when":{"test_code":"IGF1","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["igf1","pituitary_gh"]},{"code":"igfbp3_low","when":{"test_code":"IGFBP3","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["igfbp3"]}]'::jsonb),
('thyroid','Щитовидная ось',true,
 '[{"id":"trh","label":"ТРГ (гипоталамус)"},{"id":"pituitary_tsh","label":"Гипофиз (ТТГ)"},{"id":"thyroid","label":"Щитовидная железа"},{"id":"ft4","label":"Т4 свободный"},{"id":"ft3","label":"Т3 свободный"},{"id":"tpo_ab","label":"АТ-ТПО"},{"id":"tissues","label":"Ткани-мишени"}]'::jsonb,
 '[{"from":"trh","to":"pituitary_tsh"},{"from":"pituitary_tsh","to":"thyroid","label":"ТТГ"},{"from":"thyroid","to":"ft4"},{"from":"ft4","to":"ft3","label":"конверсия"},{"from":"ft3","to":"tissues"},{"from":"ft4","to":"pituitary_tsh","label":"− обратная связь"},{"from":"tpo_ab","to":"thyroid","label":"аутоиммунно"}]'::jsonb,
 '[{"code":"tsh_high","when":{"test_code":"TSH","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["pituitary_tsh","thyroid"]},{"code":"tsh_low","when":{"test_code":"TSH","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["pituitary_tsh"]},{"code":"ft4_low","when":{"test_code":"FT4","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["thyroid","ft4"]},{"code":"ft4_high","when":{"test_code":"FT4","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["thyroid","ft4"]},{"code":"tpo_ab_high","when":{"test_code":"TPOAB","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["tpo_ab","thyroid"]}]'::jsonb),
('methylation','Метилирование / одноуглеродный обмен',true,
 '[{"id":"methionine","label":"Метионин"},{"id":"sam","label":"SAM"},{"id":"sah","label":"SAH"},{"id":"homocysteine","label":"Гомоцистеин"},{"id":"remethylation","label":"Реметилирование"},{"id":"transsulfuration","label":"Транссульфурация"},{"id":"b12","label":"B12"},{"id":"folate","label":"Фолат (B9)"},{"id":"b6","label":"B6"}]'::jsonb,
 '[{"from":"methionine","to":"sam"},{"from":"sam","to":"sah"},{"from":"sah","to":"homocysteine"},{"from":"homocysteine","to":"remethylation"},{"from":"remethylation","to":"methionine"},{"from":"homocysteine","to":"transsulfuration"},{"from":"b12","to":"remethylation"},{"from":"folate","to":"remethylation"},{"from":"b6","to":"transsulfuration"}]'::jsonb,
 '[{"code":"homocysteine_high","when":{"test_code":"HCY","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["homocysteine","remethylation"]},{"code":"b12_low","when":{"test_code":"B12","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["b12","remethylation"]},{"code":"folate_low","when":{"test_code":"FOLATE","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["folate","remethylation"]},{"code":"b6_low","when":{"test_code":"B6","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["b6","transsulfuration"]}]'::jsonb),
('amino_urea','Аминокислоты и цикл мочевины',true,
 '[{"id":"protein","label":"Белок пищи"},{"id":"aa_pool","label":"Пул аминокислот"},{"id":"ammonia","label":"Аммиак"},{"id":"urea_cycle","label":"Цикл мочевины"},{"id":"citrulline","label":"Цитруллин"},{"id":"ornithine","label":"Орнитин"},{"id":"arginine","label":"Аргинин"},{"id":"urea","label":"Мочевина"},{"id":"bcaa","label":"BCAA"}]'::jsonb,
 '[{"from":"protein","to":"aa_pool"},{"from":"aa_pool","to":"ammonia"},{"from":"ammonia","to":"urea_cycle"},{"from":"urea_cycle","to":"ornithine"},{"from":"ornithine","to":"citrulline"},{"from":"citrulline","to":"arginine"},{"from":"arginine","to":"urea"}]'::jsonb,
 '[{"code":"ammonia_high","when":{"test_code":"NH3","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["ammonia","urea_cycle"]},{"code":"citrulline_abn_low","when":{"test_code":"CITR","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["citrulline","urea_cycle"]},{"code":"urea_low","when":{"test_code":"UREA","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["urea_cycle"]}]'::jsonb),
('micronutrients_steroid','Микроэлементы — кофакторы стероидогенеза',true,
 '[{"id":"zinc","label":"Цинк"},{"id":"copper","label":"Медь"},{"id":"selenium","label":"Селен"},{"id":"zn_cu","label":"Zn/Cu"},{"id":"steroidogenesis","label":"Стероидогенез"},{"id":"spermatogenesis","label":"Сперматогенез"},{"id":"antiox","label":"Антиоксидантная защита"}]'::jsonb,
 '[{"from":"zinc","to":"steroidogenesis"},{"from":"zinc","to":"spermatogenesis"},{"from":"selenium","to":"antiox"},{"from":"selenium","to":"spermatogenesis"},{"from":"copper","to":"zn_cu","label":"антагонизм"},{"from":"zinc","to":"zn_cu"}]'::jsonb,
 '[{"code":"zinc_low","when":{"test_code":"ZN","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["zinc","steroidogenesis","spermatogenesis"]},{"code":"selenium_low","when":{"test_code":"SE","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["selenium","antiox","spermatogenesis"]},{"code":"copper_high","when":{"test_code":"CU","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["copper","zn_cu"]}]'::jsonb),
('bone_mineral','Костно-минеральный обмен',true,
 '[{"id":"vitamin_d","label":"Витамин D (25-OH)"},{"id":"pth","label":"ПТГ"},{"id":"calcium","label":"Кальций"},{"id":"phosphorus","label":"Фосфор"},{"id":"alp","label":"Щелочная фосфатаза"},{"id":"gut","label":"Всасывание в кишечнике"},{"id":"bone","label":"Кость"},{"id":"kidney","label":"Почки"}]'::jsonb,
 '[{"from":"vitamin_d","to":"gut"},{"from":"gut","to":"calcium"},{"from":"pth","to":"bone","label":"резорбция"},{"from":"pth","to":"kidney"},{"from":"calcium","to":"pth","label":"− обратная связь"},{"from":"vitamin_d","to":"bone"},{"from":"alp","to":"bone","label":"ремоделирование"}]'::jsonb,
 '[{"code":"vitamin_d_low","when":{"test_code":"VITD","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["vitamin_d","gut","bone"]},{"code":"pth_high","when":{"test_code":"PTH","op":">","value_from_ref":"high"},"raises_to":"moderate","highlight_nodes":["pth","bone"]},{"code":"calcium_low","when":{"test_code":"CA","op":"<","value_from_ref":"low"},"raises_to":"moderate","highlight_nodes":["calcium"]},{"code":"phosphorus_abn","when":{"test_code":"PHOS","op":"<","value_from_ref":"low"},"raises_to":"mild","highlight_nodes":["phosphorus"]},{"code":"alp_high","when":{"test_code":"ALP","op":">","value_from_ref":"high"},"raises_to":"mild","highlight_nodes":["alp","bone"]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  nodes = EXCLUDED.nodes,
  edges = EXCLUDED.edges,
  rules = EXCLUDED.rules,
  updated_at = now();

-- 4. Severity texts (3 severity × 6 pathways = 18 rows)
WITH pw AS (SELECT id, slug FROM public.pathways WHERE slug IN ('growth_igf1','thyroid','methylation','amino_urea','micronutrients_steroid','bone_mineral'))
INSERT INTO public.pathway_severity_texts (pathway_id, severity, text_pro, text_plain)
SELECT pw.id, v.severity, v.text_pro, v.text_plain FROM pw JOIN (VALUES
-- growth_igf1
('growth_igf1','mild','Пограничное отклонение ростовой оси (ИФР-1/ИФРСБ-3 у границы референса). Сопоставить со скоростью роста, костным возрастом, стадией Таннера.','Небольшое отклонение в гормонах роста. Часто вариант нормы; важно оценить темп роста ребёнка.'),
('growth_igf1','moderate','Отчётливое снижение ИФР-1 — вероятен дефицит СТГ или нечувствительность к нему; при высоком ИФР-1 — избыточная СТГ-активность. Показаны оценка костного возраста, скорости роста, при необходимости — стимуляционные пробы СТГ.','Заметное отклонение в системе роста. Нужно понять, хватает ли «гормона роста» и как ребёнок растёт по времени; врач оценивает костный возраст и динамику.'),
('growth_igf1','severe','Выраженное нарушение ростовой оси с клинически значимым дефицитом/избытком — уточнение причины и решение о тактике (в т.ч. терапии СТГ).','Существенное нарушение роста, требующее активного обследования и решения о лечении.'),
-- thyroid
('thyroid','mild','Пограничные тиреоидные показатели (ТТГ у границы, антитела). Контроль в динамике, оценка симптоматики.','Небольшое отклонение щитовидной железы; часто требует только контроля.'),
('thyroid','moderate','Явная тиреоидная дисфункция: высокий ТТГ при низком свT4 — первичный гипотиреоз; низкий ТТГ при высоком свT4 — тиреотоксикоз. Позитивные АТ-ТПО указывают на аутоиммунный характер.','Заметное нарушение щитовидной железы — работает слишком слабо или слишком активно. Врач уточнит причину и при необходимости назначит лечение.'),
('thyroid','severe','Выраженная тиреоидная дисфункция, требующая коррекции; оценить влияние на рост и пубертат.','Существенное нарушение щитовидной железы, требующее лечения.'),
-- methylation
('methylation','mild','Пограничные показатели метилирования (гомоцистеин у верхней границы или лёгкий дефицит B12/фолата).','Небольшой сбой в обмене витаминов группы B; корректируется питанием/добавками.'),
('methylation','moderate','Гипергомоцистеинемия и/или дефицит B12/фолата/B6 — нарушение реметилирования/транссульфурации. Оценить генетический контекст (MTHFR), скорректировать кофакторы.','Заметный сбой в обмене, где участвуют B12, фолиевая кислота, B6. Повышенный гомоцистеин — сигнал восполнить эти витамины.'),
('methylation','severe','Выраженная гипергомоцистеинемия — значимый сосудистый и нейрометаболический риск; активная коррекция кофакторов и контроль.','Существенное отклонение, требующее восполнения витаминов и контроля.'),
-- amino_urea
('amino_urea','mild','Единичные отклонения аминокислотного спектра без гипераммониемии — оценить нутритивный статус.','Небольшие отклонения аминокислот; часто связано с питанием.'),
('amino_urea','moderate','Значимые сдвиги аминокислотного спектра и/или пограничный аммиак — оценить белковый обмен и функцию цикла мочевины (цитруллин, орнитин, аргинин).','Заметные отклонения в обмене аминокислот. Врач оценит белковый обмен и работу системы обезвреживания аммиака.'),
('amino_urea','severe','Гипераммониемия и грубые нарушения аминокислотного спектра — исключить дефект цикла мочевины; требует срочной оценки.','Существенное нарушение обмена аминокислот с накоплением аммиака — нужна быстрая оценка.'),
-- micronutrients_steroid
('micronutrients_steroid','mild','Лёгкий дефицит цинка/селена или пограничное отношение Zn/Cu — влияние на стероидогенез и антиоксидантную защиту.','Небольшая нехватка микроэлементов (цинк, селен); корректируется питанием/добавками.'),
('micronutrients_steroid','moderate','Отчётливый дефицит цинка/селена — снижение стероидогенеза и качества сперматогенеза; высокий Cu / низкое Zn/Cu — дисбаланс. Коррекция с контролем меди.','Заметная нехватка цинка/селена, важных для полового созревания и репродукции. Врач подберёт коррекцию.'),
('micronutrients_steroid','severe','Выраженный микроэлементный дефицит с клиническим значением для пубертата/фертильности — активная коррекция и контроль.','Существенная нехватка микроэлементов, требующая коррекции под контролем.'),
-- bone_mineral
('bone_mineral','mild','Пограничный витамин D или ЩФ у верхней границы (у детей ЩФ физиологически высокая — оценивать по возрастному референсу).','Небольшое отклонение в костно-минеральном обмене; часто дефицит витамина D.'),
('bone_mineral','moderate','Дефицит витамина D и/или вторичный подъём ПТГ, отклонения Ca/P — риск для минерализации кости и роста. Коррекция витамина D, контроль Ca/P/ПТГ.','Заметное нарушение обмена кальция и витамина D, важного для крепких костей и роста. Врач назначит коррекцию и контроль.'),
('bone_mineral','severe','Выраженный дефицит витамина D с гиперпаратиреозом/гипокальциемией — риск рахитоподобных изменений; активная терапия.','Существенное нарушение, влияющее на кости; требует лечения.')
) AS v(slug, severity, text_pro, text_plain) ON v.slug = pw.slug
ON CONFLICT (pathway_id, severity) DO UPDATE SET text_pro = EXCLUDED.text_pro, text_plain = EXCLUDED.text_plain, updated_at = now();

-- 5. IGF-1 reference ranges (KDL)
INSERT INTO public.reference_ranges (analyte_code, sex, age_min_years, age_max_years, ref_low, ref_high, unit, method, source) VALUES
('IGF1','M',0,4,15.0,129.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','M',4,7,22.0,208.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','M',7,10,40.1,255.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','M',10,12,68.7,316.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','M',12,14,143.0,506.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','M',14,16,177.0,507.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','M',16,19,173.0,414.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','F',0,4,18.2,172.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','F',4,7,35.4,232.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','F',7,10,56.9,277.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','F',10,12,118.0,448.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','F',12,14,170.0,527.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','F',14,16,191.0,496.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','F',16,19,190.0,429.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',19,22,117.0,323.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',22,25,98.7,289.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',25,30,83.6,259.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',30,35,71.2,234.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',35,40,63.4,223.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',40,45,58.2,219.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',45,50,53.3,215.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',50,55,48.1,209.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',55,60,44.7,210.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',60,65,43.0,220.0,'нг/мл','ИХЛА','КДЛ'),
('IGF1','A',65,70,40.2,225.0,'нг/мл','ИХЛА','КДЛ');
