// Соответствие кодов маркеров (test_code) → id узла (data-node-id) в SVG-шаблоне пути.
// Один и тот же код в разных путях может отображаться на разные узлы
// (например, FERR → ferritin_store в iron и FERR → ferritin_react в inflammation).
// Используется только слоем отображения (карточки путей и печать), правила/данные не меняет.

export const CODE_NODE_MAP: Record<string, Record<string, string>> = {
  lipids: {
    CHOL: "total_chol",
    LDL: "ldl",
    HDL: "hdl",
    VLDL: "vldl",
    TG: "tg",
  },
  methylation: {
    HCY: "homocysteine",
    B12: "b12",
    FOLATE: "folate",
    B6: "b6",
  },
  iron: {
    FERR: "ferritin_store",
    IRON: "serum_iron",
    TRF: "transferrin",
    TSAT: "tsat",
    TIBC: "tibc",
    HGB: "hemoglobin",
    MCV: "mcv",
  },
  thyroid: {
    TSH: "pituitary_tsh",
    FT4: "ft4",
    FT3: "ft3",
    TPOAB: "tpo_ab",
  },
  insulin_glucose: {
    GLU: "glucose",
    INS: "insulin",
    HOMA: "homa",
    HBA1C: "hba1c",
    CPEP: "c_peptide",
  },
  bone_mineral: {
    VITD: "vitamin_d",
    PTH: "pth",
    CA: "calcium",
    PHOS: "phosphorus",
    ALP: "alp",
    // OA-панель: оксалатный обмен
    OXAL: "oxalate",
    GLYCOL: "glycolate",
    GLYCER: "glycerate",
  },
  inflammation: {
    CRP: "crp",
    ESR: "esr",
    ALB: "albumin",
    FERR: "ferritin_react",
  },
  oxidative_stress: {
    UA: "uric_acid",
    SE: "selenium_ox",
    VITE: "vit_e",
  },
  electrolytes_abr: {
    K: "potassium",
    NA: "sodium",
    CL: "chloride",
    HCO3: "bicarbonate",
  },
  energy_tca: {
    LAC: "lactate",
    LDH: "ldh",
    MG: "magnesium",
    GLU: "glucose",
    CK: "ck",
  },
  amino_urea: {
    NH3: "ammonia",
    CITR: "citrulline",
    UREA: "urea",
    ARG: "arginine",
    ORN: "ornithine",
  },
  micronutrients_steroid: {
    ZN: "zinc",
    CU: "copper",
    SE: "selenium",
  },
  detox_p12: {
    ALT: "alt",
    AST: "ast",
    GGT: "ggt",
    TBIL: "bilirubin",
  },
  gut_permeability: {
    CALPRO: "calprotectin",
    ZONULIN: "zonulin",
    SIGA: "siga",
  },
  hpg_axis: {
    TESTO: "testosterone",
    FTESTO: "free_t",
    LH: "lh",
    FSH: "fsh",
    INHB: "inhibin_b",
    PRL: "prolactin",
    E2: "estradiol",
    SHBG: "shbg",
    AMH: "amh",
  },
  hpo_axis: {
    FSH: "fsh",
    LH: "lh",
    E2: "estradiol",
    PROG: "progesterone",
    AMH: "amh",
    INHB: "inhibin_b",
    PRL: "prolactin",
  },
  androgens_pcos: {
    TESTO: "testosterone",
    DHEAS: "dhea_s",
    OHP17: "ohp17",
    SHBG: "shbg",
    FAI: "fai",
  },
  prolactin_reg: {
    PRL: "prolactin",
    MACROPRL: "macroprl",
  },
  hpa: {
    CORT: "cortisol",
    DHEAS: "dhea_s",
  },
  growth_igf1: {
    IGF1: "igf1",
    IGFBP3: "igfbp3",
  },
  steroidogenesis: {
    CHOL: "cholesterol",
    PREGNENOLONE: "pregnenolone",
    "17OH_PREGNENOLONE": "17oh_pregnenolone",
    PROG: "progesterone",
    OHP17: "ohp17",
    "11_DEOXYCORTISOL": "11_deoxycortisol",
    CORT: "cortisol",
    DOC: "doc",
    CORTICOSTERONE: "corticosterone",
    ALDOSTERONE: "aldosterone",
    DHEAS: "dhea_s",
    ANDROSTENEDIONE: "androstenedione",
    TESTO: "testosterone",
    DHT: "dht",
    E2: "estradiol",
  },
};

export function nodeIdForCode(pathwaySlug: string, code: string | null | undefined): string | null {
  if (!code) return null;
  const m = CODE_NODE_MAP[pathwaySlug];
  if (!m) return null;
  return m[String(code).toUpperCase().trim()] || null;
}
