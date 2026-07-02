-- ============================================================
-- 1. Guardian mapping + doctor toggle for simplified sharing
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patient_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  relation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_guardians TO authenticated;
GRANT ALL ON public.patient_guardians TO service_role;
ALTER TABLE public.patient_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardians admin manage"
  ON public.patient_guardians FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "guardians self read"
  ON public.patient_guardians FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_guardians_user ON public.patient_guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_patient ON public.patient_guardians(patient_id);

-- Doctor-controlled flag: when true, parent sees only simplified text (no raw numbers)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS share_simple_only boolean NOT NULL DEFAULT true;

-- Helper: is caller a guardian of given patient?
CREATE OR REPLACE FUNCTION public.is_guardian_of(_patient_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_guardians
    WHERE patient_id = _patient_id AND user_id = auth.uid()
  );
$$;

-- ============================================================
-- 2. Snapshots for dynamics over visits
-- ============================================================
CREATE TABLE IF NOT EXISTS public.metabolic_map_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES public.patient_visits(id) ON DELETE SET NULL,
  snapshot_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  pathway_status jsonb NOT NULL DEFAULT '{}'::jsonb, -- { slug: { status, confidence, severity_max } }
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metabolic_map_snapshots TO authenticated;
GRANT ALL ON public.metabolic_map_snapshots TO service_role;
ALTER TABLE public.metabolic_map_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots admin manage"
  ON public.metabolic_map_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "snapshots parent read own"
  ON public.metabolic_map_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'parent'::public.app_role) AND public.is_guardian_of(patient_id));

CREATE INDEX IF NOT EXISTS idx_snapshots_patient_date ON public.metabolic_map_snapshots(patient_id, snapshot_date DESC);

-- ============================================================
-- 3. Parent read-only policies for map artefacts
-- ============================================================
CREATE POLICY "maps parent read own"
  ON public.metabolic_maps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'parent'::public.app_role) AND public.is_guardian_of(patient_id));

CREATE POLICY "findings parent read own"
  ON public.map_findings FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.metabolic_maps m
      WHERE m.id = map_findings.map_id AND public.is_guardian_of(m.patient_id)
    )
  );

CREATE POLICY "recs parent read included"
  ON public.map_recommendations FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent'::public.app_role)
    AND include_in_print = true
    AND EXISTS (
      SELECT 1 FROM public.metabolic_maps m
      WHERE m.id = map_recommendations.map_id AND public.is_guardian_of(m.patient_id)
    )
  );

CREATE POLICY "diagnosis_timeline parent read own"
  ON public.patient_diagnosis_timeline FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'parent'::public.app_role) AND public.is_guardian_of(patient_id));

CREATE POLICY "patients parent read own"
  ON public.patients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'parent'::public.app_role) AND public.is_guardian_of(id));

-- ============================================================
-- 4. Seed 11 additional pathways (rules + nodes + edges)
-- ============================================================
INSERT INTO public.pathways (slug, name, description, nodes, edges, rules) VALUES
('hpa', 'Ось HPA (стресс/кортизол)', 'Гипоталамус–гипофиз–надпочечники',
 '[{"id":"crh","label":"CRH","x":40,"y":90},{"id":"acth","label":"АКТГ","x":180,"y":90},{"id":"cortisol","label":"Кортизол","x":320,"y":50},{"id":"dhea","label":"ДГЭА-С","x":320,"y":130},{"id":"ratio","label":"Кортизол/ДГЭА","x":480,"y":90}]'::jsonb,
 '[{"from":"crh","to":"acth"},{"from":"acth","to":"cortisol"},{"from":"acth","to":"dhea"},{"from":"cortisol","to":"ratio"},{"from":"dhea","to":"ratio"}]'::jsonb,
 '[
   {"id":"cortisol_high","label":"Кортизол повышен","match":{"codes":["cortisol"],"names":["кортизол"]},"node_id":"cortisol","direction":"above","thresholds":{"mild":1.05,"moderate":1.2,"severe":1.5}},
   {"id":"cortisol_low","label":"Кортизол снижен","match":{"codes":["cortisol"],"names":["кортизол"]},"node_id":"cortisol","direction":"below","thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"dhea_low","label":"ДГЭА-С снижен","match":{"codes":["dhea","dheas"],"names":["дгэа","дгэа-с"]},"node_id":"dhea","direction":"below","thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"acth_high","label":"АКТГ повышен","match":{"codes":["acth"],"names":["актг"]},"node_id":"acth","direction":"above","thresholds":{"mild":1.1,"moderate":1.3,"severe":1.6}}
 ]'::jsonb),

('thyroid', 'Щитовидная железа', 'Ось ТТГ–Т4–Т3 и антитела',
 '[{"id":"tsh","label":"ТТГ","x":40,"y":90},{"id":"ft4","label":"св. Т4","x":200,"y":50},{"id":"ft3","label":"св. Т3","x":200,"y":130},{"id":"atpo","label":"АТ-ТПО","x":360,"y":50},{"id":"attg","label":"АТ-ТГ","x":360,"y":130}]'::jsonb,
 '[{"from":"tsh","to":"ft4"},{"from":"tsh","to":"ft3"},{"from":"ft4","to":"atpo"},{"from":"ft3","to":"attg"}]'::jsonb,
 '[
   {"id":"tsh_high","label":"ТТГ повышен","match":{"codes":["tsh"],"names":["ттг"]},"node_id":"tsh","direction":"above","thresholds":{"mild":1.05,"moderate":1.3,"severe":2}},
   {"id":"tsh_low","label":"ТТГ снижен","match":{"codes":["tsh"],"names":["ттг"]},"node_id":"tsh","direction":"below","thresholds":{"mild":0.9,"moderate":0.5,"severe":0.2}},
   {"id":"ft4_low","label":"св. Т4 снижен","match":{"codes":["ft4","t4_free"],"names":["свободный т4","т4 своб"]},"node_id":"ft4","direction":"below","thresholds":{"mild":0.95,"moderate":0.85,"severe":0.7}},
   {"id":"atpo_high","label":"АТ-ТПО повышен","match":{"codes":["atpo","tpo_ab"],"names":["ат-тпо","антитела к тпо"]},"node_id":"atpo","direction":"above","thresholds":{"mild":1,"moderate":3,"severe":10}}
 ]'::jsonb),

('insulin_glucose', 'Инсулин и глюкоза', 'Углеводный обмен, HOMA-IR, HbA1c',
 '[{"id":"glucose","label":"Глюкоза","x":40,"y":90},{"id":"insulin","label":"Инсулин","x":200,"y":90},{"id":"homa","label":"HOMA-IR","x":360,"y":50},{"id":"hba1c","label":"HbA1c","x":360,"y":130},{"id":"triglyc","label":"Триглицериды","x":520,"y":90}]'::jsonb,
 '[{"from":"glucose","to":"insulin"},{"from":"glucose","to":"homa"},{"from":"insulin","to":"homa"},{"from":"glucose","to":"hba1c"},{"from":"homa","to":"triglyc"}]'::jsonb,
 '[
   {"id":"glucose_high","label":"Глюкоза повышена","match":{"codes":["glucose","glu"],"names":["глюкоза"]},"node_id":"glucose","direction":"above","thresholds":{"mild":1.05,"moderate":1.15,"severe":1.3}},
   {"id":"insulin_high","label":"Инсулин повышен","match":{"codes":["insulin"],"names":["инсулин"]},"node_id":"insulin","direction":"above","thresholds":{"mild":1.1,"moderate":1.5,"severe":2}},
   {"id":"hba1c_high","label":"HbA1c повышен","match":{"codes":["hba1c"],"names":["гликированный","hba1c"]},"node_id":"hba1c","direction":"above","thresholds":{"mild":1.05,"moderate":1.1,"severe":1.2}},
   {"id":"homa_high","label":"HOMA-IR повышен","match":{"codes":["homa","homa_ir"],"names":["homa","хома"]},"node_id":"homa","direction":"above","thresholds":{"mild":1.1,"moderate":1.5,"severe":2.5}}
 ]'::jsonb),

('lipids', 'Липидный профиль', 'ОХС, ЛПНП/ЛПВП, ТГ',
 '[{"id":"tc","label":"ОХС","x":40,"y":90},{"id":"ldl","label":"ЛПНП","x":200,"y":50},{"id":"hdl","label":"ЛПВП","x":200,"y":130},{"id":"tg","label":"Триглицериды","x":360,"y":90},{"id":"apob","label":"АпоB","x":520,"y":90}]'::jsonb,
 '[{"from":"tc","to":"ldl"},{"from":"tc","to":"hdl"},{"from":"ldl","to":"apob"},{"from":"tg","to":"apob"}]'::jsonb,
 '[
   {"id":"ldl_high","label":"ЛПНП повышен","match":{"codes":["ldl"],"names":["лпнп"]},"node_id":"ldl","direction":"above","thresholds":{"mild":1.05,"moderate":1.2,"severe":1.5}},
   {"id":"hdl_low","label":"ЛПВП снижен","match":{"codes":["hdl"],"names":["лпвп"]},"node_id":"hdl","direction":"below","thresholds":{"mild":0.9,"moderate":0.75,"severe":0.6}},
   {"id":"tg_high","label":"ТГ повышены","match":{"codes":["triglycerides","tg"],"names":["триглицериды"]},"node_id":"tg","direction":"above","thresholds":{"mild":1.1,"moderate":1.5,"severe":2}}
 ]'::jsonb),

('inflammation', 'Воспаление', 'СРБ, СОЭ, фибриноген, ферритин как APR',
 '[{"id":"crp","label":"СРБ","x":40,"y":90},{"id":"esr","label":"СОЭ","x":200,"y":90},{"id":"fibrinogen","label":"Фибриноген","x":360,"y":50},{"id":"ferritin_apr","label":"Ферритин↑","x":360,"y":130},{"id":"il6","label":"ИЛ-6","x":520,"y":90}]'::jsonb,
 '[{"from":"crp","to":"esr"},{"from":"crp","to":"fibrinogen"},{"from":"crp","to":"ferritin_apr"},{"from":"crp","to":"il6"}]'::jsonb,
 '[
   {"id":"crp_high","label":"СРБ повышен","match":{"codes":["crp","hs_crp"],"names":["срб","с-реактивный"]},"node_id":"crp","direction":"above","thresholds":{"mild":1.1,"moderate":3,"severe":10}},
   {"id":"esr_high","label":"СОЭ повышено","match":{"codes":["esr"],"names":["соэ"]},"node_id":"esr","direction":"above","thresholds":{"mild":1.1,"moderate":1.5,"severe":2}},
   {"id":"fib_high","label":"Фибриноген повышен","match":{"codes":["fibrinogen"],"names":["фибриноген"]},"node_id":"fibrinogen","direction":"above","thresholds":{"mild":1.05,"moderate":1.2,"severe":1.5}}
 ]'::jsonb),

('gut_permeability', 'Кишечный барьер', 'Зонулин, кальпротектин, дисбиоз-маркеры',
 '[{"id":"zonulin","label":"Зонулин","x":40,"y":90},{"id":"calprotectin","label":"Кальпротектин","x":200,"y":90},{"id":"sIgA","label":"sIgA","x":360,"y":50},{"id":"lps","label":"ЛПС","x":360,"y":130},{"id":"symptoms","label":"Симптомы ЖКТ","x":520,"y":90}]'::jsonb,
 '[{"from":"zonulin","to":"lps"},{"from":"calprotectin","to":"symptoms"},{"from":"sIgA","to":"symptoms"},{"from":"lps","to":"symptoms"}]'::jsonb,
 '[
   {"id":"zonulin_high","label":"Зонулин повышен","match":{"codes":["zonulin"],"names":["зонулин"]},"node_id":"zonulin","direction":"above","thresholds":{"mild":1.05,"moderate":1.2,"severe":1.5}},
   {"id":"calpro_high","label":"Кальпротектин повышен","match":{"codes":["calprotectin"],"names":["кальпротектин"]},"node_id":"calprotectin","direction":"above","thresholds":{"mild":1.1,"moderate":2,"severe":5}},
   {"id":"siga_low","label":"sIgA снижен","match":{"codes":["siga","s_iga"],"names":["siga","секреторный iga"]},"node_id":"sIgA","direction":"below","thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}}
 ]'::jsonb),

('detox_p12', 'Детоксикация (фазы 1–2)', 'CYP-система, глутатион, конъюгация',
 '[{"id":"gst","label":"Глутатион","x":40,"y":90},{"id":"ast","label":"АСТ","x":200,"y":50},{"id":"alt","label":"АЛТ","x":200,"y":130},{"id":"ggt","label":"ГГТ","x":360,"y":90},{"id":"bili","label":"Билирубин","x":520,"y":90}]'::jsonb,
 '[{"from":"gst","to":"ggt"},{"from":"ast","to":"ggt"},{"from":"alt","to":"ggt"},{"from":"ggt","to":"bili"}]'::jsonb,
 '[
   {"id":"alt_high","label":"АЛТ повышен","match":{"codes":["alt"],"names":["алт"]},"node_id":"alt","direction":"above","thresholds":{"mild":1.05,"moderate":1.5,"severe":3}},
   {"id":"ast_high","label":"АСТ повышен","match":{"codes":["ast"],"names":["аст"]},"node_id":"ast","direction":"above","thresholds":{"mild":1.05,"moderate":1.5,"severe":3}},
   {"id":"ggt_high","label":"ГГТ повышен","match":{"codes":["ggt"],"names":["ггт","gamma"]},"node_id":"ggt","direction":"above","thresholds":{"mild":1.05,"moderate":1.5,"severe":3}},
   {"id":"bili_high","label":"Билирубин повышен","match":{"codes":["bilirubin","bili"],"names":["билирубин"]},"node_id":"bili","direction":"above","thresholds":{"mild":1.05,"moderate":1.5,"severe":2}}
 ]'::jsonb),

('oxidative_stress', 'Оксидативный стресс', 'Антиоксидантная защита, окисленный ЛПНП',
 '[{"id":"glutathione","label":"Глутатион","x":40,"y":90},{"id":"vitc","label":"Витамин C","x":200,"y":50},{"id":"vite","label":"Витамин E","x":200,"y":130},{"id":"selen","label":"Селен","x":360,"y":90},{"id":"ox_ldl","label":"Ox-LDL","x":520,"y":90}]'::jsonb,
 '[{"from":"glutathione","to":"ox_ldl"},{"from":"vitc","to":"ox_ldl"},{"from":"vite","to":"ox_ldl"},{"from":"selen","to":"glutathione"}]'::jsonb,
 '[
   {"id":"vitc_low","label":"Витамин C снижен","match":{"codes":["vitamin_c","vit_c"],"names":["витамин c","аскорбин"]},"node_id":"vitc","direction":"below","thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"selen_low","label":"Селен снижен","match":{"codes":["selenium","se"],"names":["селен"]},"node_id":"selen","direction":"below","thresholds":{"mild":0.9,"moderate":0.75,"severe":0.6}},
   {"id":"vite_low","label":"Витамин E снижен","match":{"codes":["vitamin_e","vit_e"],"names":["витамин e","токоферол"]},"node_id":"vite","direction":"below","thresholds":{"mild":0.9,"moderate":0.75,"severe":0.6}}
 ]'::jsonb),

('mast_cell_histamine', 'Мастоциты / гистамин', 'Триптаза, DAO, гистамин',
 '[{"id":"tryptase","label":"Триптаза","x":40,"y":90},{"id":"histamine","label":"Гистамин","x":200,"y":90},{"id":"dao","label":"DAO","x":360,"y":50},{"id":"ige_total","label":"IgE общ.","x":360,"y":130},{"id":"symptoms","label":"Симптомы","x":520,"y":90}]'::jsonb,
 '[{"from":"tryptase","to":"symptoms"},{"from":"histamine","to":"symptoms"},{"from":"dao","to":"histamine"},{"from":"ige_total","to":"symptoms"}]'::jsonb,
 '[
   {"id":"tryptase_high","label":"Триптаза повышена","match":{"codes":["tryptase"],"names":["триптаза"]},"node_id":"tryptase","direction":"above","thresholds":{"mild":1.05,"moderate":1.3,"severe":2}},
   {"id":"histamine_high","label":"Гистамин повышен","match":{"codes":["histamine"],"names":["гистамин"]},"node_id":"histamine","direction":"above","thresholds":{"mild":1.05,"moderate":1.3,"severe":2}},
   {"id":"dao_low","label":"DAO снижен","match":{"codes":["dao"],"names":["dao","диаминоксидаза"]},"node_id":"dao","direction":"below","thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}},
   {"id":"ige_high","label":"IgE общий повышен","match":{"codes":["ige_total","ige"],"names":["ige общ","иммуноглобулин e"]},"node_id":"ige_total","direction":"above","thresholds":{"mild":1.1,"moderate":2,"severe":5}}
 ]'::jsonb),

('neurotransmitters', 'Нейромедиаторы', 'Серотонин, дофамин, ГАМК, кофакторы',
 '[{"id":"tryptophan","label":"Триптофан","x":40,"y":50},{"id":"tyrosine","label":"Тирозин","x":40,"y":130},{"id":"serotonin","label":"Серотонин","x":220,"y":50},{"id":"dopamine","label":"Дофамин","x":220,"y":130},{"id":"b6","label":"B6 (P5P)","x":400,"y":90}]'::jsonb,
 '[{"from":"tryptophan","to":"serotonin"},{"from":"tyrosine","to":"dopamine"},{"from":"b6","to":"serotonin"},{"from":"b6","to":"dopamine"}]'::jsonb,
 '[
   {"id":"b6_low","label":"B6 (P5P) снижен","match":{"codes":["vitamin_b6","b6","p5p"],"names":["витамин b6","b6","p5p","пиридоксаль"]},"node_id":"b6","direction":"below","thresholds":{"mild":0.9,"moderate":0.7,"severe":0.5}}
 ]'::jsonb),

('bone_mineral', 'Костно-минеральный обмен', 'Кальций/фосфор, ПТГ, витамин D, костные маркеры',
 '[{"id":"ca","label":"Кальций","x":40,"y":50},{"id":"p","label":"Фосфор","x":40,"y":130},{"id":"vitd","label":"25(OH)D","x":220,"y":50},{"id":"pth","label":"ПТГ","x":220,"y":130},{"id":"alp","label":"ЩФ","x":400,"y":90}]'::jsonb,
 '[{"from":"vitd","to":"ca"},{"from":"ca","to":"pth"},{"from":"p","to":"pth"},{"from":"pth","to":"alp"}]'::jsonb,
 '[
   {"id":"vitd_low","label":"25(OH)D снижен","match":{"codes":["vitamin_d","25oh_d","vit_d"],"names":["витамин d","25(oh)d"]},"node_id":"vitd","direction":"below","thresholds":{"mild":0.9,"moderate":0.6,"severe":0.4}},
   {"id":"ca_low","label":"Кальций снижен","match":{"codes":["calcium","ca"],"names":["кальций"]},"node_id":"ca","direction":"below","thresholds":{"mild":0.95,"moderate":0.85,"severe":0.75}},
   {"id":"pth_high","label":"ПТГ повышен","match":{"codes":["pth"],"names":["паратгормон","птг"]},"node_id":"pth","direction":"above","thresholds":{"mild":1.1,"moderate":1.5,"severe":2}},
   {"id":"alp_high","label":"ЩФ повышена","match":{"codes":["alp","alkaline_phosphatase"],"names":["щелочная фосфатаза","щф"]},"node_id":"alp","direction":"above","thresholds":{"mild":1.1,"moderate":1.5,"severe":2}}
 ]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Placeholder pathway_texts for new pathways (both registers)
INSERT INTO public.pathway_texts (pathway_id, register, summary, what_broken, evidence, risks, connections, actions)
SELECT p.id, r.register,
       'Резюме по пути «' || p.name || '»: заполните описание.',
       'Опишите, что именно нарушено в пути.',
       'Перечислите ключевые показатели и их значения.',
       'Опишите риски при сохранении нарушения.',
       'Опишите связи с другими системами и путями.',
       'Приведите рекомендуемые точки приложения терапии.'
FROM public.pathways p
CROSS JOIN (VALUES ('simple'), ('pro')) AS r(register)
WHERE p.slug IN ('hpa','thyroid','insulin_glucose','lipids','inflammation','gut_permeability','detox_p12','oxidative_stress','mast_cell_histamine','neurotransmitters','bone_mineral')
ON CONFLICT (pathway_id, register) DO NOTHING;

-- ============================================================
-- 5. Cohort analytics helper (SECURITY DEFINER, admin-only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cohort_pathway_stats(
  _sex text DEFAULT NULL,
  _age_min int DEFAULT NULL,
  _age_max int DEFAULT NULL,
  _icd10 text DEFAULT NULL
)
RETURNS TABLE (
  pathway_slug text,
  pathway_name text,
  patients_total int,
  patients_affected int,
  severity_mild int,
  severity_moderate int,
  severity_severe int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN QUERY
  WITH cohort AS (
    SELECT DISTINCT p.id AS patient_id
    FROM public.patients p
    LEFT JOIN public.patient_diagnosis_timeline d ON d.patient_id = p.id
    WHERE (_age_min IS NULL OR p.birth_date IS NULL OR EXTRACT(YEAR FROM age(p.birth_date))::int >= _age_min)
      AND (_age_max IS NULL OR p.birth_date IS NULL OR EXTRACT(YEAR FROM age(p.birth_date))::int <= _age_max)
      AND (_icd10 IS NULL OR d.icd10 ILIKE _icd10 || '%')
  ),
  latest_maps AS (
    SELECT m.id, m.patient_id
    FROM public.metabolic_maps m
    WHERE m.patient_id IN (SELECT patient_id FROM cohort)
  ),
  per_patient_pw AS (
    SELECT pw.id AS pathway_id, pw.slug, pw.name,
           lm.patient_id,
           MAX(CASE mf.severity WHEN 'severe' THEN 3 WHEN 'moderate' THEN 2 WHEN 'mild' THEN 1 ELSE 0 END) AS worst
    FROM public.pathways pw
    LEFT JOIN public.map_findings mf ON mf.pathway_id = pw.id
    LEFT JOIN latest_maps lm ON lm.id = mf.map_id
    WHERE pw.is_active = true
    GROUP BY pw.id, pw.slug, pw.name, lm.patient_id
  )
  SELECT
    slug AS pathway_slug,
    name AS pathway_name,
    (SELECT COUNT(*)::int FROM cohort) AS patients_total,
    COUNT(*) FILTER (WHERE worst > 0)::int AS patients_affected,
    COUNT(*) FILTER (WHERE worst = 1)::int AS severity_mild,
    COUNT(*) FILTER (WHERE worst = 2)::int AS severity_moderate,
    COUNT(*) FILTER (WHERE worst = 3)::int AS severity_severe
  FROM per_patient_pw
  WHERE patient_id IS NOT NULL
  GROUP BY slug, name
  ORDER BY patients_affected DESC, slug;
END;
$$;

REVOKE ALL ON FUNCTION public.cohort_pathway_stats(text, int, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cohort_pathway_stats(text, int, int, text) TO authenticated;