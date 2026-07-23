-- Metabolic matrix v2.8: conservative, reference-bound clinical flags.
--
-- This migration intentionally does not introduce universal metabolomics cutoffs.
-- Each rule is evaluated only against the interval carried by the lab result or
-- the age/sex/phase-specific reference resolver. An out-of-range value is a
-- screening flag (mild), not a diagnosis. New context-only analytes and
-- derived indices remain display-only; pre-existing B12/folate rules are
-- retained because they are established clinical laboratory markers.
-- Existing HCY/LAC rules are moved to the
-- v2.8 canonical primary pathways to avoid double-counting one analyte in
-- matched_markers and to keep status/highlight on the same card as the node.
--
-- Literature/policy anchors:
--   * laboratory intervals vary by method, age, sex and specimen;
--     use the reporting laboratory's interval;
--   * urinary organic acids and plasma amino acids require clinical and
--     pre-analytic context; a single abnormal value is not diagnostic;
--   * MMA may support evaluation of B12 status but is affected by renal/context
--     factors and is not interpreted here without the lab interval.
-- Sources are recorded in the PR/clinical review, not used as universal limits.
--   Mayo OAU: https://www.mayocliniclabs.com/test-catalog/overview/80619
--   Mayo AAQP: https://www.mayocliniclabs.com/test-catalog/overview/9265
--   Merck reference-range principles: https://www.merckmanuals.com/professional/resources/normal-laboratory-values/laboratory-reference-ranges
--   Quest MMA: https://testdirectory.questdiagnostics.com/test/test-detail/34879/methylmalonic-acid?cc=MASTER
--   NIH ODS B12: https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/

DO $$
DECLARE
  item record;
  rule_code text;
  moved_hcy jsonb := '[]'::jsonb;
  moved_lac jsonb := '[]'::jsonb;
BEGIN
  -- v2.8 makes HCY primary on sulfur_one_carbon and LAC primary on
  -- carbohydrate_pyruvate. Move the already approved legacy rules before
  -- adding reference-bound rules; their existing severity is preserved.
  SELECT COALESCE(jsonb_agg(e.rule ORDER BY e.ord), '[]'::jsonb)
    INTO moved_hcy
  FROM public.pathways AS source
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(source.rules, '[]'::jsonb)) WITH ORDINALITY AS e(rule, ord)
  WHERE source.slug = 'methylation'
    AND (e.rule->'when'->>'test_code' = 'HCY' OR e.rule->>'code' = 'homocysteine_high');

  SELECT COALESCE(jsonb_agg(e.rule ORDER BY e.ord), '[]'::jsonb)
    INTO moved_lac
  FROM public.pathways AS source
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(source.rules, '[]'::jsonb)) WITH ORDINALITY AS e(rule, ord)
  WHERE source.slug = 'energy_tca'
    AND (e.rule->'when'->>'test_code' = 'LAC' OR e.rule->>'code' = 'lactate_high');

  UPDATE public.pathways AS source
  SET rules = COALESCE((
    SELECT jsonb_agg(e.rule ORDER BY e.ord)
    FROM jsonb_array_elements(COALESCE(source.rules, '[]'::jsonb)) WITH ORDINALITY AS e(rule, ord)
    WHERE COALESCE(e.rule->'when'->>'test_code', '') <> 'HCY'
      AND COALESCE(e.rule->>'code', '') <> 'homocysteine_high'
  ), '[]'::jsonb)
  WHERE source.slug = 'methylation'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(source.rules, '[]'::jsonb)) AS e(rule)
      WHERE e.rule->'when'->>'test_code' = 'HCY'
         OR e.rule->>'code' = 'homocysteine_high'
    );

  UPDATE public.pathways AS source
  SET rules = COALESCE((
    SELECT jsonb_agg(e.rule ORDER BY e.ord)
    FROM jsonb_array_elements(COALESCE(source.rules, '[]'::jsonb)) WITH ORDINALITY AS e(rule, ord)
    WHERE COALESCE(e.rule->'when'->>'test_code', '') <> 'LAC'
      AND COALESCE(e.rule->>'code', '') <> 'lactate_high'
  ), '[]'::jsonb)
  WHERE source.slug = 'energy_tca'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(source.rules, '[]'::jsonb)) AS e(rule)
      WHERE e.rule->'when'->>'test_code' = 'LAC'
         OR e.rule->>'code' = 'lactate_high'
    );

  -- Append moved rules only when the target does not already contain them.
  UPDATE public.pathways AS target
  SET rules = COALESCE(target.rules, '[]'::jsonb) || moved_hcy
  WHERE target.slug = 'sulfur_one_carbon'
    AND jsonb_array_length(moved_hcy) > 0
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(target.rules, '[]'::jsonb)) AS e(rule)
      WHERE e.rule->'when'->>'test_code' = 'HCY' OR e.rule->>'code' = 'homocysteine_high'
    );

  UPDATE public.pathways AS target
  SET rules = COALESCE(target.rules, '[]'::jsonb) || moved_lac
  WHERE target.slug = 'carbohydrate_pyruvate'
    AND jsonb_array_length(moved_lac) > 0
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(target.rules, '[]'::jsonb)) AS e(rule)
      WHERE e.rule->'when'->>'test_code' = 'LAC' OR e.rule->>'code' = 'lactate_high'
    );

  FOR item IN
    SELECT * FROM (VALUES
('carbohydrate_pyruvate', 'LACT_U', 'lactate_u'),
  ('carbohydrate_pyruvate', 'PYR_U', 'pyruvate_u'),
  ('energy_tca', 'CITR_U', 'citrate_u'),
  ('energy_tca', 'ACON', 'cis_aconitate'),
  ('energy_tca', 'ISOCIT', 'isocitrate'),
  ('energy_tca', 'AKG', 'alpha_ketoglutarate'),
  ('energy_tca', 'SUCC', 'succinate'),
  ('energy_tca', 'FUM', 'fumarate'),
  ('energy_tca', 'MAL', 'malate'),
  ('ketogenesis_beta_oxidation', '3HB', 'hydroxybutyrate_3'),
  ('bcaa_catabolism', '2OH3MB', 'hydroxy_methylbutyrate_2_3'),
  ('bcaa_catabolism', '3MCG', 'methylcrotonylglycine_3'),
  ('bcaa_catabolism', '3MGA', 'methylglutarate_3'),
  ('bcaa_catabolism', 'IVG', 'isovalerylglycine'),
  ('aromatic_aa_metabolism', 'PHPLA', 'p_hydroxyphenyllactate'),
  ('aromatic_aa_metabolism', 'PHPPA', 'p_hydroxyphenylpyruvate'),
  ('aromatic_aa_metabolism', 'HGA', 'homogentisate'),
  ('aromatic_aa_metabolism', 'PLA', 'phenyllactate'),
  ('tryptophan_kynurenine', 'XAN', 'xanthurenate'),
  ('tryptophan_kynurenine', 'PIC', 'picolinate'),
  ('oxalate_glyoxylate', 'GLYCOL', 'glycolate'),
  ('oxalate_glyoxylate', 'GLYCER', 'glycerate'),
  ('oxalate_glyoxylate', 'OXAL', 'oxalate'),
  ('oxalate_glyoxylate', 'GLYOX', 'glyoxylate'),
  ('fatty_acid_oxidation', 'GA', 'glutarate'),
  ('methylation', 'MMA_U', 'methylmalonate'),
  ('glutathione_detox', 'PYROGLU', 'pyroglutamate'),
  ('amino_urea', 'OROT', 'orotate'),
  ('ketogenesis_beta_oxidation', 'ACAC', 'acetoacetate'),
  ('amino_urea', 'AA_ARG_PL', 'arginine'),
  ('bcaa_catabolism', 'AA_VAL_PL', 'valine'),
  ('histidine_muscle_turnover', 'AA_HIS_PL', 'histidine'),
  ('sulfur_one_carbon', 'AA_MET_PL', 'methionine'),
  ('glycine_serine_threonine', 'AA_THR_PL', 'threonine'),
  ('bcaa_catabolism', 'AA_LEU_PL', 'leucine'),
  ('lysine_catabolism', 'AA_LYS_PL', 'lysine'),
  ('bcaa_catabolism', 'AA_ILE_PL', 'isoleucine'),
  ('tryptophan_kynurenine', 'AA_TRP_PL', 'tryptophan'),
  ('aromatic_aa_metabolism', 'AA_PHE_PL', 'phenylalanine'),
  ('carbohydrate_pyruvate', 'AA_ALA_PL', 'alanine'),
  ('amino_nitrogen_exchange', 'AA_ASN_PL', 'asparagine'),
  ('amino_urea', 'AA_ASP_PL', 'aspartate'),
  ('glycine_serine_threonine', 'AA_GLY_PL', 'glycine'),
  ('amino_nitrogen_exchange', 'AA_GLN_PL', 'glutamine'),
  ('amino_nitrogen_exchange', 'AA_GLU_PL', 'glutamate'),
  ('collagen_turnover', 'AA_PRO_PL', 'proline'),
  ('glycine_serine_threonine', 'AA_SER_PL', 'serine'),
  ('aromatic_aa_metabolism', 'AA_TYR_PL', 'tyrosine'),
  ('amino_urea', 'AA_ASA_PL', 'argininosuccinate'),
  ('amino_urea', 'AA_ORN_PL', 'ornithine'),
  ('amino_urea', 'AA_CIT_PL', 'citrulline'),
  ('sulfur_one_carbon', 'AA_SAH_PL', 's_adenosylhomocysteine'),
  ('sulfur_one_carbon', 'AA_CYSTATH_PL', 'cystathionine'),
  ('sulfur_one_carbon', 'AA_CYSTINE_PL', 'cystine'),
  ('lysine_catabolism', 'AA_AAD_PL', 'aminoadipate_alpha'),
  ('lysine_catabolism', 'AA_PIP_PL', 'pipecolate'),
  ('lysine_catabolism', 'AA_SAC_PL', 'saccharopine'),
  ('beta_alanine_metabolism', 'AA_BALA_PL', 'beta_alanine'),
  ('glycerophospholipid_amines', 'AA_PSER_PL', 'phosphoserine'),
  ('glycerophospholipid_amines', 'AA_PETN_PL', 'phosphoethanolamine'),
  ('glycerophospholipid_amines', 'AA_ETN_PL', 'ethanolamine'),
  ('omega3_pufa', 'FA_ALA', 'ala'),
  ('omega3_pufa', 'FA_EPA', 'epa'),
  ('omega3_pufa', 'FA_DHA', 'dha'),
  ('omega6_pufa', 'FA_LA', 'linoleic'),
  ('omega6_pufa', 'FA_GLA', 'gla'),
  ('omega6_pufa', 'FA_DGLA', 'dgla'),
  ('omega6_pufa', 'FA_AA', 'arachidonic'),
  ('omega6_pufa', 'FA_EICDI', 'eicosadienoic'),
  ('omega6_pufa', 'FA_DTA', 'dta'),
  ('omega9_mufa', 'FA_HX16_1N9', 'hexadecenoic_n9'),
  ('omega9_mufa', 'FA_OLE', 'oleic'),
  ('omega9_mufa', 'FA_NERV', 'nervonic'),
  ('carbohydrate_pyruvate', 'LAC', 'lactate_s'),
  ('sulfur_one_carbon', 'HCY', 'homocysteine_s'),
    ) AS v(path_slug, analyte_code, node_id)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.pathways WHERE slug = item.path_slug) THEN
      RAISE EXCEPTION 'v2.8 clinical rule target pathway missing: %', item.path_slug;
    END IF;

    rule_code := lower(item.analyte_code) || '_outside_ref';

    UPDATE public.pathways AS p
    SET rules = (
      SELECT jsonb_agg(rule ORDER BY ord)
      FROM (
        SELECT e.rule, e.ord
        FROM jsonb_array_elements(COALESCE(p.rules, '[]'::jsonb)) WITH ORDINALITY AS e(rule, ord)
        UNION ALL
        SELECT jsonb_build_object(
          'code', rule_code,
          'label', item.analyte_code || ' вне лабораторного референса',
          'when', jsonb_build_object(
            'op', 'outside_ref',
            'test_code', item.analyte_code
          ),
          'raises_to', 'mild',
          'highlight_nodes', jsonb_build_array(item.node_id),
          'note', 'Скрининговый флаг: отклонение от интервала лаборатории; не диагноз. Учитывать возраст, пол, единицы, материал и преданалитику.'
        ), 1000000
      ) AS appended(rule, ord)
    )
    WHERE p.slug = item.path_slug
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p.rules, '[]'::jsonb)) AS existing(rule)
        WHERE existing.rule->>'code' = rule_code
           OR existing.rule->'when'->>'test_code' = item.analyte_code
      );
  END LOOP;
END $$;

COMMENT ON COLUMN public.pathways.rules IS
  'Deterministic clinical flags. v2.8 outside_ref rules use only lab/age/sex/phase-specific intervals and are screening flags, not diagnoses; context/index entries remain display-only.';
