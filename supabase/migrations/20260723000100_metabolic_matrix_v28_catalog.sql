-- Metabolic clinical matrix v2.8: additive catalog seed only.
-- This migration does NOT rewrite lab_results and does NOT seed patient reference ranges.
-- Specimen-ambiguous legacy codes are deliberately left untouched.

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
    ('GLYOX', 'Глиоксиловая кислота', 'mmol/mol_creatinine', 'oxalate_glyoxylate', '[]'::jsonb, 'matrix=v2.8; panel=OrganoMetrix_U; specimen=spot_urine; reference_policy=lab_result_only'),
    ('FIGLU', 'Формиминоглутаминовая кислота (FIGLU)', 'mmol/mol_creatinine', 'methylation', '[]'::jsonb, 'matrix=v2.8; panel=OrganoMetrix_U; specimen=spot_urine; reference_policy=lab_result_only'),
    ('MHA_M_U', 'мета-Метилгиппуровая кислота', 'mmol/mol_creatinine', 'context_panel', '[]'::jsonb, 'matrix=v2.8; panel=OrganoMetrix_U; specimen=spot_urine; reference_policy=lab_result_only'),
    ('MHA_P_U', 'пара-Метилгиппуровая кислота', 'mmol/mol_creatinine', 'context_panel', '[]'::jsonb, 'matrix=v2.8; panel=OrganoMetrix_U; specimen=spot_urine; reference_policy=lab_result_only'),
    ('HCAFF', 'Гидрокофейная кислота', 'mmol/mol_creatinine', 'context_panel', '[]'::jsonb, 'matrix=v2.8; panel=OrganoMetrix_U; specimen=spot_urine; reference_policy=lab_result_only'),
    ('CITRAMAL', '2-Гидрокси-2-метилбутандиовая кислота', 'mmol/mol_creatinine', 'context_panel', '[]'::jsonb, 'matrix=v2.8; panel=OrganoMetrix_U; specimen=spot_urine; reference_policy=lab_result_only'),
    ('AA_ARG_PL', 'Аргинин', 'umol/L', 'amino_urea', '["Arg"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only; legacy_backfill=forbidden_without_specimen_guard'),
    ('AA_VAL_PL', 'Валин', 'umol/L', 'bcaa_catabolism', '["Val"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_HIS_PL', 'Гистидин', 'umol/L', 'histidine_muscle_turnover', '["His"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_MET_PL', 'Метионин', 'umol/L', 'sulfur_one_carbon', '["Met"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_THR_PL', 'Треонин', 'umol/L', 'glycine_serine_threonine', '["Thr"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_LEU_PL', 'Лейцин', 'umol/L', 'bcaa_catabolism', '["Leu"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_LYS_PL', 'Лизин', 'umol/L', 'lysine_catabolism', '["Lys"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ILE_PL', 'Изолейцин', 'umol/L', 'bcaa_catabolism', '["Ile"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_TRP_PL', 'Триптофан', 'umol/L', 'tryptophan_kynurenine', '["Trp"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_PHE_PL', 'Фенилаланин', 'umol/L', 'aromatic_aa_metabolism', '["Phe"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ALA_PL', 'Аланин', 'umol/L', 'carbohydrate_pyruvate', '["Ala"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ASN_PL', 'Аспарагин', 'umol/L', 'amino_nitrogen_exchange', '["Asn"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ASP_PL', 'Аспарагиновая кислота', 'umol/L', 'amino_urea', '["Asp"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_GLY_PL', 'Глицин', 'umol/L', 'glycine_serine_threonine', '["Gly"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_GLN_PL', 'Глутамин', 'umol/L', 'amino_nitrogen_exchange', '["Gln"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_GLU_PL', 'Глутаминовая кислота', 'umol/L', 'amino_nitrogen_exchange', '["Glu"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_PRO_PL', 'Пролин', 'umol/L', 'collagen_turnover', '["Pro"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_SER_PL', 'Серин', 'umol/L', 'glycine_serine_threonine', '["Ser"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_TAU_PL', 'Таурин', 'umol/L', 'sulfur_one_carbon', '["Tau"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_TYR_PL', 'Тирозин', 'umol/L', 'aromatic_aa_metabolism', '["Tyr"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ASA_PL', 'Аргининоянтарная кислота', 'umol/L', 'amino_urea', '["Ars"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_HCIT_PL', 'Гомоцитруллин', 'umol/L', 'amino_urea', '["Hci"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ORN_PL', 'Орнитин', 'umol/L', 'amino_urea', '["Orn"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only; legacy_backfill=forbidden_without_specimen_guard'),
    ('AA_CIT_PL', 'Цитруллин', 'umol/L', 'amino_urea', '["Cit"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only; legacy_backfill=forbidden_without_specimen_guard'),
    ('AA_SAH_PL', 'S-Аденозилгомоцистеин', 'umol/L', 'sulfur_one_carbon', '["Agc"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_HCY2_PL', 'Гомоцистин', 'umol/L', 'sulfur_one_carbon', '["Hcy"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_CYSTATH_PL', 'Цистатионин', 'umol/L', 'sulfur_one_carbon', '["Cyst"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_CYS_SO4_PL', 'Цистеин-сульфат', 'umol/L', 'sulfur_one_carbon', '["SSC"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_CYSTINE_PL', 'Цистин', 'umol/L', 'sulfur_one_carbon', '["Cys"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_AAD_PL', 'Альфа-аминоадипиновая кислота', 'umol/L', 'lysine_catabolism', '["Aad"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_PIP_PL', 'Пипеколиновая кислота', 'umol/L', 'lysine_catabolism', '["PA"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_SAC_PL', 'Сахаропин', 'umol/L', 'lysine_catabolism', '["Sac"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_HYL_PL', 'Гидроксилизин', 'umol/L', 'collagen_turnover', '["Hyl"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_HYP4_PL', '4-Гидроксипролин', 'umol/L', 'collagen_turnover', '["Hyp"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_1MHIS_PL', '1-Метилгистидин', 'umol/L', 'histidine_muscle_turnover', '["1-MH"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_3MHIS_PL', '3-Метилгистидин', 'umol/L', 'histidine_muscle_turnover', '["3-MH"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ANS_PL', 'Ансерин', 'umol/L', 'histidine_muscle_turnover', '["Ans"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_BALA_PL', 'Бета-аланин', 'umol/L', 'beta_alanine_metabolism', '["Bal"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_CAR_PL', 'Карнозин', 'umol/L', 'histidine_muscle_turnover', '["Car"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_SAR_PL', 'Саркозин', 'umol/L', 'methylation', '["Sar"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_AABA_PL', 'Альфа-аминомасляная кислота', 'umol/L', 'context_panel', '["Abu"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_BAIB_PL', 'Бета-аминоизомасляная кислота', 'umol/L', 'context_panel', '["bAib"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_GABA_PL', 'Гамма-аминомасляная кислота', 'umol/L', 'context_panel', '["gAbu"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_PSER_PL', 'Фосфосерин', 'umol/L', 'glycerophospholipid_amines', '["Pse"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_PETN_PL', 'Фосфоэтаноламин', 'umol/L', 'glycerophospholipid_amines', '["Pet"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ETN_PL', 'Этаноламин', 'umol/L', 'glycerophospholipid_amines', '["Eta"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_ALLOILE_PL', 'Алло-изолейцин', 'umol/L', 'bcaa_catabolism', '["Ail"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('AA_NATYR_PL', 'Ацетилтирозин', 'umol/L', 'context_panel', '["Aty"]'::jsonb, 'matrix=v2.8; panel=AminoMetrix_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_ALA', 'Альфа-линоленовая кислота', 'umol/L', 'omega3_pufa', '["ALA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_EPA', 'Эйкозапентаеновая кислота', 'umol/L', 'omega3_pufa', '["EPA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_DHA', 'Докозагексаеновая кислота', 'umol/L', 'omega3_pufa', '["DHA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_LA', 'Линолевая кислота', 'umol/L', 'omega6_pufa', '["LA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_GLA', 'Гамма-линоленовая кислота', 'umol/L', 'omega6_pufa', '["GLA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_DGLA', 'Дигомо-гамма-линоленовая кислота', 'umol/L', 'omega6_pufa', '["DHGLA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_AA', 'Арахидоновая кислота', 'umol/L', 'omega6_pufa', '["AA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_EICDI', 'Эйкозадиеновая кислота', 'umol/L', 'omega6_pufa', '[]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_DOCDI', 'Докозадиеновая кислота', 'umol/L', 'omega6_pufa', '[]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_DTA', 'Докозатетраеновая кислота', 'umol/L', 'omega6_pufa', '["DTA"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_HX16_1N9', 'Гексадеценовая кислота C16:1ω9', 'umol/L', 'omega9_mufa', '["C16:1n-9"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_MEAD', 'Мидовая кислота', 'umol/L', 'omega9_mufa', '["Mead"]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_OLE', 'Олеиновая кислота', 'umol/L', 'omega9_mufa', '[]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('FA_NERV', 'Селахолевая (нервоновая) кислота', 'umol/L', 'omega9_mufa', '[]'::jsonb, 'matrix=v2.8; panel=FattyAcids_S; specimen=plasma_edta; reference_policy=lab_result_only'),
    ('LAC', 'Лактат', 'mmol/L', 'carbohydrate_pyruvate', '["LAC"]'::jsonb, 'matrix=v2.8; panel=BloodInputs_S; specimen=plasma; reference_policy=lab_result_only'),
    ('HCY', 'Гомоцистеин', 'umol/L', 'sulfur_one_carbon', '["HCY"]'::jsonb, 'matrix=v2.8; panel=BloodInputs_S; specimen=plasma; reference_policy=lab_result_only'),
    ('B12', 'Витамин B12 (кобаламин)', 'pg/mL', 'methylation', '["B12"]'::jsonb, 'matrix=v2.8; panel=BloodInputs_S; specimen=serum; reference_policy=lab_result_only'),
    ('FOLATE', 'Фолат', 'ng/mL', 'methylation', '["FOLATE"]'::jsonb, 'matrix=v2.8; panel=BloodInputs_S; specimen=serum; reference_policy=lab_result_only')
    ) AS v(code, name_ru, unit_name, category_name, aliases, note_text)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.lab_tests_catalog
      WHERE upper(coalesce(short_name, '')) = upper(rec.code)
         OR upper(coalesce(kdl_slug, '')) = upper(rec.code)
    ) THEN
      INSERT INTO public.lab_tests_catalog
        (name, short_name, kdl_slug, unit, category, synonyms, notes, is_active)
      VALUES
        (rec.name_ru, rec.code, rec.code, rec.unit_name, rec.category_name,
         rec.aliases, rec.note_text, true);
    END IF;
  END LOOP;
END $$;

-- ACAC is the canonical spelling, but lab_results has no specimen column.
-- Therefore an AcAc -> ACAC patient-data backfill is intentionally not performed
-- here; it must be done only by an importer that has the B341/spot-urine context.
