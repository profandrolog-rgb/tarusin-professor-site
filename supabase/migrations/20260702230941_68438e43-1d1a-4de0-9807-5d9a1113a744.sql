
ALTER TABLE public.lab_tests_catalog ADD COLUMN IF NOT EXISTS synonyms jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_lab_tests_short_name ON public.lab_tests_catalog(short_name);
CREATE INDEX IF NOT EXISTS idx_lab_tests_kdl_slug ON public.lab_tests_catalog(kdl_slug);

DROP TABLE IF EXISTS _new_codes;
CREATE TEMP TABLE _new_codes(test_code text);

DO $$
DECLARE
  rec record;
  found_id uuid;
  syn text;
BEGIN
  FOR rec IN
    SELECT code, name_ru, synonyms FROM (VALUES
      ('IGF1','Соматомедин С (ИФР-1)', ARRAY['ИФР-1','IGF-1','инсулиноподобный фактор роста 1','соматомедин С']),
      ('IGFBP3','ИФР-связывающий белок 3', ARRAY['ИФРСБ-3','IGFBP-3']),
      ('TSH','ТТГ', ARRAY['тиреотропный гормон','TSH']),
      ('FT4','Т4 свободный', ARRAY['тироксин свободный','свT4','FT4']),
      ('FT3','Т3 свободный', ARRAY['трийодтиронин свободный','свT3','FT3']),
      ('TPOAB','АТ-ТПО', ARRAY['антитела к тиреопероксидазе','anti-TPO']),
      ('HCY','Гомоцистеин', ARRAY['homocysteine']),
      ('FOLATE','Фолиевая кислота', ARRAY['фолат','B9','folate']),
      ('B6','Витамин B6', ARRAY['пиридоксаль-5-фосфат','пиридоксин']),
      ('NH3','Аммиак', ARRAY['ammonia','NH3']),
      ('CITR','Цитруллин', ARRAY['citrulline']),
      ('UREA','Мочевина', ARRAY['urea','карбамид']),
      ('ZN','Цинк', ARRAY['zinc','Zn']),
      ('CU','Медь', ARRAY['copper','Cu']),
      ('SE','Селен', ARRAY['selenium','Se']),
      ('VITD','Витамин D (25-OH)', ARRAY['25-OH витамин D','25(OH)D','кальцидиол']),
      ('PTH','Паратгормон', ARRAY['ПТГ','parathyroid hormone']),
      ('CA','Кальций', ARRAY['calcium','Ca','кальций общий']),
      ('PHOS','Фосфор', ARRAY['phosphorus','фосфор неорганический','P']),
      ('ALP','Щелочная фосфатаза', ARRAY['ЩФ','alkaline phosphatase','alk phos']),
      ('LDL','ЛПНП', ARRAY['холестерин ЛПНП','LDL','липопротеины низкой плотности']),
      ('HDL','ЛПВП', ARRAY['холестерин ЛПВП','HDL','липопротеины высокой плотности']),
      ('VLDL','ЛПОНП', ARRAY['холестерин ЛПОНП','VLDL']),
      ('CHOL','Холестерин общий', ARRAY['общий холестерол','total cholesterol']),
      ('TG','Триглицериды', ARRAY['triglycerides','ТГ']),
      ('CRP','С-реактивный белок', ARRAY['СРБ','CRP','hs-CRP']),
      ('ESR','СОЭ', ARRAY['скорость оседания эритроцитов','ESR']),
      ('ALB','Альбумин', ARRAY['albumin']),
      ('UA','Мочевая кислота', ARRAY['uric acid','урат']),
      ('VITE','Витамин E', ARRAY['токоферол','tocopherol']),
      ('K','Калий', ARRAY['potassium','K+']),
      ('NA','Натрий', ARRAY['sodium','Na+']),
      ('HCO3','Бикарбонат', ARRAY['гидрокарбонат','HCO3','углекислота']),
      ('LAC','Лактат', ARRAY['молочная кислота','lactate']),
      ('LDH','ЛДГ', ARRAY['лактатдегидрогеназа','LDH']),
      ('MG','Магний', ARRAY['magnesium','Mg']),
      ('GLU','Глюкоза', ARRAY['glucose','сахар крови']),
      ('HOMA','HOMA-IR', ARRAY['индекс HOMA','индекс инсулинорезистентности']),
      ('INS','Инсулин', ARRAY['insulin']),
      ('CORT','Кортизол', ARRAY['cortisol','кортизол утренний']),
      ('DHEAS','ДГЭА-С', ARRAY['дегидроэпиандростерон-сульфат','DHEA-S']),
      ('ALT','АЛТ', ARRAY['аланинаминотрансфераза','ALT','АлАТ']),
      ('AST','АСТ', ARRAY['аспартатаминотрансфераза','AST','АсАТ']),
      ('GGT','ГГТ', ARRAY['гамма-глутамилтрансфераза','GGT','ГГТП']),
      ('TBIL','Билирубин общий', ARRAY['total bilirubin','билирубин']),
      ('CALPRO','Кальпротектин', ARRAY['calprotectin','фекальный кальпротектин']),
      ('ZONULIN','Зонулин', ARRAY['zonulin']),
      ('SIGA','Секреторный IgA', ARRAY['sIgA','секреторный иммуноглобулин A']),
      ('FERR','Ферритин', ARRAY['ferritin']),
      ('TSAT','Насыщение трансферрина', ARRAY['коэффициент насыщения трансферрина','transferrin saturation','TSAT']),
      ('HGB','Гемоглобин', ARRAY['hemoglobin','Hb','HGB']),
      ('MCV','MCV', ARRAY['средний объём эритроцита','mean corpuscular volume'])
    ) AS t(code, name_ru, synonyms)
  LOOP
    found_id := NULL;
    SELECT id INTO found_id FROM public.lab_tests_catalog
     WHERE short_name = rec.code OR kdl_slug = rec.code LIMIT 1;
    IF found_id IS NULL THEN
      SELECT id INTO found_id FROM public.lab_tests_catalog
       WHERE name ILIKE rec.name_ru OR name ILIKE '%' || rec.name_ru || '%'
       ORDER BY length(name) LIMIT 1;
    END IF;
    IF found_id IS NULL THEN
      FOREACH syn IN ARRAY rec.synonyms LOOP
        SELECT id INTO found_id FROM public.lab_tests_catalog
         WHERE name ILIKE syn OR name ILIKE '%' || syn || '%' OR short_name ILIKE syn
         ORDER BY length(name) LIMIT 1;
        EXIT WHEN found_id IS NOT NULL;
      END LOOP;
    END IF;

    IF found_id IS NOT NULL THEN
      UPDATE public.lab_tests_catalog
         SET short_name = rec.code,
             kdl_slug = rec.code,
             synonyms = to_jsonb(rec.synonyms),
             updated_at = now()
       WHERE id = found_id;
    ELSE
      INSERT INTO public.lab_tests_catalog (name, short_name, kdl_slug, synonyms, is_active)
      VALUES (rec.name_ru, rec.code, rec.code, to_jsonb(rec.synonyms), true);
      INSERT INTO _new_codes(test_code) VALUES (rec.code);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE lst text;
BEGIN
  SELECT string_agg(test_code, ', ' ORDER BY test_code) INTO lst FROM _new_codes;
  RAISE NOTICE 'Newly created test_codes: %', COALESCE(lst, '(none)');
END $$;
