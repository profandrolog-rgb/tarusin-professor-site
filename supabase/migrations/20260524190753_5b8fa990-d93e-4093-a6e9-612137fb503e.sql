
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.treatment_category AS ENUM (
  'iv_drip','iv_bolus','im','sc','oral_rx','oral_supplement',
  'rectal','topical','nasal','sublingual','peptide','procedure','lifestyle'
);

CREATE TYPE public.plan_mode AS ENUM ('flat','scheduled');
CREATE TYPE public.plan_status AS ENUM ('draft','issued','archived');

-- =========================================================
-- TABLES
-- =========================================================
CREATE TABLE public.treatment_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.treatment_category NOT NULL,
  subcategory TEXT,
  name TEXT NOT NULL,
  inn TEXT,
  form TEXT,
  default_dose NUMERIC,
  dose_unit TEXT,
  default_dilution_volume NUMERIC,
  default_dilution_solvent TEXT,
  default_frequency TEXT,
  default_duration_days INTEGER,
  default_route_label TEXT,
  time_of_day_default TEXT[] DEFAULT '{}',
  notes TEXT,
  contraindications TEXT,
  infusion_rate TEXT,
  is_rx BOOLEAN NOT NULL DEFAULT false,
  is_off_label BOOLEAN NOT NULL DEFAULT false,
  light_sensitive BOOLEAN NOT NULL DEFAULT false,
  glucose_only BOOLEAN NOT NULL DEFAULT false,
  dose_range_min NUMERIC,
  dose_range_max NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_catalog_cat_active ON public.treatment_catalog (category, is_active);
CREATE INDEX idx_treatment_catalog_name ON public.treatment_catalog (lower(name));

CREATE TABLE public.protocol_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_patient TEXT,
  mode public.plan_mode NOT NULL DEFAULT 'flat',
  duration_days INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.protocol_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.protocol_templates(id) ON DELETE CASCADE,
  catalog_id UUID REFERENCES public.treatment_catalog(id) ON DELETE SET NULL,
  section_category public.treatment_category NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  name_snapshot TEXT,
  dose NUMERIC,
  dose_unit TEXT,
  dilution_volume NUMERIC,
  dilution_solvent TEXT,
  frequency TEXT,
  duration_days INTEGER,
  day_pattern TEXT,
  time_of_day TEXT[] DEFAULT '{}',
  infusion_rate TEXT,
  route_override TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_template_items_template ON public.protocol_template_items (template_id, section_category, order_index);

CREATE TABLE public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  issued_at DATE NOT NULL DEFAULT CURRENT_DATE,
  mode public.plan_mode NOT NULL DEFAULT 'flat',
  duration_days INTEGER NOT NULL DEFAULT 10,
  diagnosis_short TEXT,
  clinical_summary TEXT,
  based_on_template UUID REFERENCES public.protocol_templates(id) ON DELETE SET NULL,
  status public.plan_status NOT NULL DEFAULT 'draft',
  print_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plans_patient ON public.treatment_plans (patient_id, issued_at DESC);
CREATE INDEX idx_plans_created_by ON public.treatment_plans (created_by, issued_at DESC);

CREATE TABLE public.treatment_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  catalog_id UUID REFERENCES public.treatment_catalog(id) ON DELETE SET NULL,
  section_category public.treatment_category NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  name_snapshot TEXT NOT NULL,
  inn_snapshot TEXT,
  form_snapshot TEXT,
  dose NUMERIC,
  dose_unit TEXT,
  dilution_volume NUMERIC,
  dilution_solvent TEXT,
  frequency TEXT,
  duration_days INTEGER,
  day_pattern TEXT,
  time_of_day TEXT[] DEFAULT '{}',
  infusion_rate TEXT,
  route_override TEXT,
  notes TEXT,
  is_off_label BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_items_plan ON public.treatment_plan_items (plan_id, section_category, order_index);

CREATE TABLE public.treatment_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_versions_plan ON public.treatment_plan_versions (plan_id, version_no DESC);

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE TRIGGER trg_treatment_catalog_updated_at BEFORE UPDATE ON public.treatment_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_protocol_templates_updated_at BEFORE UPDATE ON public.protocol_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.treatment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_versions ENABLE ROW LEVEL SECURITY;

-- catalog: read for any authenticated; write for admins
CREATE POLICY "Authenticated can read catalog" ON public.treatment_catalog
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage catalog" ON public.treatment_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- templates: admin-only
CREATE POLICY "Admins manage templates" ON public.protocol_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage template items" ON public.protocol_template_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- plans: admins full; doctors own
CREATE POLICY "Admins manage all plans" ON public.treatment_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Doctors view own plans" ON public.treatment_plans
  FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Doctors insert own plans" ON public.treatment_plans
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Doctors update own plans" ON public.treatment_plans
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Doctors delete own plans" ON public.treatment_plans
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- plan items: follow plan ownership
CREATE POLICY "Admins manage all plan items" ON public.treatment_plan_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Doctors manage own plan items" ON public.treatment_plan_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.treatment_plans p WHERE p.id = treatment_plan_items.plan_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.treatment_plans p WHERE p.id = treatment_plan_items.plan_id AND p.created_by = auth.uid()));

-- versions: admins only
CREATE POLICY "Admins read versions" ON public.treatment_plan_versions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert versions" ON public.treatment_plan_versions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- SEED — minimal starter set (~27 positions)
-- =========================================================
INSERT INTO public.treatment_catalog
  (category, subcategory, name, inn, form, default_dose, dose_unit, default_dilution_volume, default_dilution_solvent, default_frequency, default_duration_days, infusion_rate, is_rx, is_off_label, light_sensitive, glucose_only, time_of_day_default, notes, tags)
VALUES
-- iv_drip
('iv_drip','гепатопротектор','Ремаксол',NULL,'р-р для инфузий',400,'мл',NULL,NULL,'1 р/сут',10,'40–60 кап/мин',true,false,false,false,'{}','Готовый раствор, без разведения','{детокс,гепатопротекция}'),
('iv_drip','детоксикант','Реамберин 1,5%','меглюмина натрия сукцинат','р-р для инфузий',400,'мл',NULL,NULL,'1 р/сут',10,'40–60 кап/мин',true,false,false,false,'{}','Готовый раствор','{детокс}'),
('iv_drip','антиоксидант','Цитофлавин',NULL,'р-р для инфузий',10,'мл',200,'0.9% NaCl','1 р/сут',10,NULL,true,false,false,false,'{утро}','Утром','{антиоксидант,энергия}'),
('iv_drip','антиоксидант','Берлитион 600','тиоктовая кислота','р-р для инфузий',600,'мг',200,'0.9% NaCl','1 р/сут',10,NULL,true,false,true,false,'{}','Защищать от света','{антиоксидант,нейропатия}'),
('iv_drip','гепатопротектор','Гептрал','адеметионин','лиофилизат',800,'мг',200,'0.9% NaCl','1 р/сут',10,NULL,true,false,true,false,'{утро}','Защищать от света, утром','{гепатопротекция}'),
('iv_drip','витамин','Витамин C','аскорбиновая кислота','р-р для инъекций',2000,'мг',200,'0.9% NaCl','1 р/сут',10,NULL,true,false,false,false,'{}','','{антиоксидант,витамин}'),
('iv_drip','аминокислота','Тивортин 4,2%','L-аргинин','р-р для инфузий',100,'мл',NULL,NULL,'1 р/сут',7,NULL,true,false,false,false,'{}','Готовый раствор','{ED,эндотелий}'),
-- iv_bolus
('iv_bolus','витамин','Витамин B12','цианокобаламин','р-р для инъекций',1000,'мкг',NULL,NULL,'1 р/сут',10,NULL,true,false,false,false,'{}','Медленно струйно','{витамин,нейротропик}'),
-- im
('im','витамин','Мильгамма',NULL,'р-р для инъекций',2,'мл',NULL,NULL,'1 р/сут',10,NULL,true,false,false,false,'{}','Глубоко в/м','{витамин,нейропатия}'),
('im','гормон','ХГЧ','хорионический гонадотропин','лиофилизат',1500,'ЕД',NULL,NULL,'2 р/нед',28,NULL,true,false,false,false,'{}','Поддержка собственного тестостерона','{гормональная,андрология}'),
-- oral_rx
('oral_rx','ингибитор ФДЭ-5','Тадалафил 5 мг','тадалафил','таблетки',5,'мг',NULL,NULL,'1 р/сут',90,NULL,true,false,false,false,'{перед сном}','Длительно, на ночь','{ED,ФДЭ-5}'),
('oral_rx','ингибитор ФДЭ-5','Силденафил 50 мг','силденафил','таблетки',50,'мг',NULL,NULL,'по требованию',1,NULL,true,false,false,false,'{}','За 1 час до акта','{ED,ФДЭ-5}'),
-- oral_supplement
('oral_supplement','минерал','Цинк бисглицинат',NULL,'капсулы',25,'мг',NULL,NULL,'1 р/сут',90,NULL,false,false,false,false,'{вечер}','Не сочетать с препаратами Ca','{минералы,тестостерон}'),
('oral_supplement','омега','Омега-3 (EPA+DHA)',NULL,'капсулы',2,'г',NULL,NULL,'1 р/сут',180,NULL,false,false,false,false,'{после еды}','Не менее 60% EPA+DHA','{омега,противовоспалительное}'),
('oral_supplement','витамин','Витамин D3 5000 МЕ','холекальциферол','капсулы',5000,'МЕ',NULL,NULL,'1 р/сут',90,NULL,false,false,false,false,'{после еды}','Титрация по 25(OH)D','{витамин}'),
('oral_supplement','минерал','Магний биглицинат',NULL,'капсулы',300,'мг',NULL,NULL,'1 р/сут',60,NULL,false,false,false,false,'{перед сном}','На ночь','{минералы,сон}'),
-- rectal
('rectal','простатопротектор','Витапрост Форте',NULL,'суппозитории',100,'мг',NULL,NULL,'1 р/сут',20,NULL,true,false,false,false,'{перед сном}','На ночь, ректально','{простата}'),
-- topical
('topical','гормон','Андрогель 1%','тестостерон','гель',5,'г',NULL,NULL,'1 р/сут',180,NULL,true,false,false,false,'{утро}','На чистую сухую кожу плеч/живота, утром','{гормональная,ТРТ}'),
-- nasal
('nasal','ноотроп','Семакс 0,1%',NULL,'капли назальные',2,'капли',NULL,NULL,'2 р/сут',14,NULL,true,false,false,false,'{утро,обед}','По 2 капли в каждую ноздрю','{ноотроп,пептид}'),
('nasal','анксиолитик','Селанк 0,15%',NULL,'капли назальные',2,'капли',NULL,NULL,'3 р/сут',14,NULL,true,false,false,false,'{}','По 2 капли в каждую ноздрю','{анксиолитик,пептид}'),
-- sublingual
('sublingual','аминокислота','Глицин',NULL,'таблетки',200,'мг',NULL,NULL,'3 р/сут',30,NULL,false,false,false,false,'{}','Под язык','{аминокислота,сон}'),
-- peptide
('peptide','репарант','BPC-157',NULL,'лиофилизат',300,'мкг',NULL,NULL,'1 р/сут',30,NULL,true,true,false,false,'{}','Подкожно, восстановление тканей','{пептид,репарант}'),
('peptide','биорегулятор','Эпиталон',NULL,'лиофилизат',10,'мг',NULL,NULL,'1 р/сут',10,NULL,true,true,false,false,'{}','Подкожно, эпифизарный пептид','{пептид,антиэйдж}'),
-- procedure
('procedure','физиотерапия','УВТ на пещеристые тела (LiESWT)',NULL,'процедура',1500,'имп/сеанс',NULL,NULL,'2 р/нед',21,NULL,false,false,false,false,'{}','6 сеансов курсом','{физио,ED}'),
('procedure','физиотерапия','ВЛОК',NULL,'процедура',1,'сеанс',NULL,NULL,'1 р/сут',10,NULL,false,false,false,false,'{}','Внутривенное лазерное облучение крови, 630–660 нм','{физио,антиоксидант}'),
('procedure','рефлексотерапия','Иглорефлексотерапия (корпоральная)',NULL,'процедура',1,'сеанс',NULL,NULL,'ч/день',20,NULL,false,false,false,false,'{}','10 сеансов через день','{рефлексотерапия}'),
-- lifestyle
('lifestyle','сон','Режим сна 22:30–23:00',NULL,NULL,NULL,NULL,NULL,NULL,'ежедневно',NULL,NULL,false,false,false,false,'{}','Отбой 22:30–23:00, blackout, 18–20 °C, без экранов за 60 мин до сна, 7–8 ч','{lifestyle,сон}'),
('lifestyle','питание','Интервальное голодание 16:8',NULL,NULL,NULL,NULL,NULL,NULL,'ежедневно',NULL,NULL,false,false,false,false,'{}','Пищевое окно 12:00–20:00, белок 1,6 г/кг, дефицит ~300 ккал','{lifestyle,питание}'),
('lifestyle','физическая активность','Силовые тренировки',NULL,NULL,NULL,NULL,NULL,NULL,'3 р/нед',NULL,NULL,false,false,false,false,'{}','Многосуставные движения, 45–60 мин','{lifestyle,спорт}');
