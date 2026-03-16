/**
 * Laboratory reference ranges organized by test group
 * Includes pediatric and adult ranges, male/female where applicable
 * 
 * For pediatric andrology: ranges vary significantly by Tanner stage and age
 */

export interface LabTest {
  code: string;
  name: string;
  unit: string;
  group: string;
  /** Get reference range based on age (years) and sex */
  getRange: (ageYears: number, sex: 'male' | 'female') => { min: number; max: number } | null;
}

// Helper to create simple adult range
const adultRange = (min: number, max: number) => () => ({ min, max });
const sexRange = (mMin: number, mMax: number, fMin: number, fMax: number) =>
  (_age: number, sex: 'male' | 'female') => sex === 'male' ? { min: mMin, max: mMax } : { min: fMin, max: fMax };

// Pediatric testosterone ranges by age (boys, nmol/L)
function testosteroneTotalRange(age: number, sex: 'male' | 'female'): { min: number; max: number } | null {
  if (sex === 'female') {
    if (age < 10) return { min: 0.1, max: 0.7 };
    if (age < 18) return { min: 0.3, max: 2.5 };
    return { min: 0.3, max: 2.5 };
  }
  // Boys/Men
  if (age < 1) return { min: 0.2, max: 10.0 };
  if (age < 7) return { min: 0.1, max: 0.7 };
  if (age < 10) return { min: 0.1, max: 1.1 };
  if (age < 12) return { min: 0.2, max: 3.5 };
  if (age < 14) return { min: 0.5, max: 15.0 };
  if (age < 16) return { min: 3.0, max: 25.0 };
  if (age < 18) return { min: 8.0, max: 30.0 };
  return { min: 8.6, max: 29.0 };
}

function lhRange(age: number, sex: 'male' | 'female') {
  if (sex === 'female') return age < 18 ? { min: 0.3, max: 12.0 } : { min: 1.7, max: 8.6 };
  if (age < 10) return { min: 0.02, max: 0.3 };
  if (age < 14) return { min: 0.2, max: 5.0 };
  if (age < 18) return { min: 0.5, max: 9.0 };
  return { min: 1.7, max: 8.6 };
}

function fshRange(age: number, sex: 'male' | 'female') {
  if (sex === 'female') return age < 18 ? { min: 0.5, max: 10.0 } : { min: 1.5, max: 12.4 };
  if (age < 10) return { min: 0.1, max: 1.5 };
  if (age < 14) return { min: 0.3, max: 5.0 };
  if (age < 18) return { min: 0.7, max: 10.0 };
  return { min: 1.5, max: 12.4 };
}

function inhibinBRange(age: number, sex: 'male' | 'female') {
  if (sex === 'female') return { min: 10, max: 200 };
  if (age < 10) return { min: 35, max: 350 };
  if (age < 14) return { min: 60, max: 400 };
  return { min: 25, max: 325 };
}

function amhRange(age: number, sex: 'male' | 'female') {
  if (sex === 'female') return { min: 1.0, max: 10.0 };
  if (age < 2) return { min: 15, max: 125 };
  if (age < 10) return { min: 7, max: 85 };
  if (age < 14) return { min: 3, max: 50 };
  if (age < 18) return { min: 1.5, max: 25 };
  return { min: 0.7, max: 19.0 };
}

function igf1Range(age: number, _sex: 'male' | 'female') {
  if (age < 6) return { min: 20, max: 200 };
  if (age < 10) return { min: 50, max: 350 };
  if (age < 14) return { min: 100, max: 600 };
  if (age < 18) return { min: 150, max: 700 };
  if (age < 30) return { min: 115, max: 355 };
  if (age < 50) return { min: 95, max: 290 };
  return { min: 70, max: 230 };
}

export const LAB_TESTS: LabTest[] = [
  // === АНДРОЛОГИЧЕСКИЙ ПРОФИЛЬ ===
  { code: "testosterone_total", name: "Тестостерон общий", unit: "нмоль/л", group: "Андрологический профиль", getRange: testosteroneTotalRange },
  { code: "testosterone_free", name: "Тестостерон свободный", unit: "пг/мл", group: "Андрологический профиль", getRange: sexRange(4.5, 42.0, 0.2, 5.0) },
  { code: "dht", name: "Дигидротестостерон (ДГТ)", unit: "пг/мл", group: "Андрологический профиль", getRange: sexRange(250, 990, 24, 368) },
  { code: "dhea_s", name: "ДГЭА-сульфат", unit: "мкмоль/л", group: "Андрологический профиль", getRange: sexRange(2.4, 13.4, 1.8, 10.1) },
  { code: "androstenedione", name: "Андростендион", unit: "нмоль/л", group: "Андрологический профиль", getRange: sexRange(1.6, 12.2, 1.2, 8.6) },
  { code: "shbg", name: "ГСПГ (SHBG)", unit: "нмоль/л", group: "Андрологический профиль", getRange: sexRange(13, 71, 18, 114) },
  { code: "17oh_progesterone", name: "17-ОН прогестерон", unit: "нмоль/л", group: "Андрологический профиль", getRange: sexRange(0.5, 7.5, 0.1, 8.0) },

  // === ГОНАДОТРОПИНЫ И РЕПРОДУКТИВНЫЕ ГОРМОНЫ ===
  { code: "lh", name: "ЛГ", unit: "мМЕ/мл", group: "Гонадотропины", getRange: lhRange },
  { code: "fsh", name: "ФСГ", unit: "мМЕ/мл", group: "Гонадотропины", getRange: fshRange },
  { code: "inhibin_b", name: "Ингибин В", unit: "пг/мл", group: "Гонадотропины", getRange: inhibinBRange },
  { code: "amh", name: "Антимюллеров гормон (АМГ)", unit: "нг/мл", group: "Гонадотропины", getRange: amhRange },
  { code: "estradiol", name: "Эстрадиол", unit: "пмоль/л", group: "Гонадотропины", getRange: sexRange(40, 162, 68, 1269) },
  { code: "prolactin", name: "Пролактин", unit: "мМЕ/л", group: "Гонадотропины", getRange: sexRange(73, 407, 109, 557) },

  // === ЩИТОВИДНАЯ ЖЕЛЕЗА ===
  { code: "tsh", name: "ТТГ", unit: "мМЕ/л", group: "Щитовидная железа", getRange: adultRange(0.27, 4.2) },
  { code: "t3_free", name: "Т3 свободный", unit: "пмоль/л", group: "Щитовидная железа", getRange: adultRange(3.1, 6.8) },
  { code: "t4_free", name: "Т4 свободный", unit: "пмоль/л", group: "Щитовидная железа", getRange: adultRange(12.0, 22.0) },

  // === УГЛЕВОДНЫЙ ОБМЕН ===
  { code: "insulin", name: "Инсулин", unit: "мкМЕ/мл", group: "Углеводный обмен", getRange: adultRange(2.6, 24.9) },
  { code: "proinsulin", name: "Проинсулин", unit: "пмоль/л", group: "Углеводный обмен", getRange: adultRange(0.5, 9.4) },
  { code: "c_peptide", name: "С-пептид", unit: "нг/мл", group: "Углеводный обмен", getRange: adultRange(0.9, 7.1) },
  { code: "hba1c", name: "Гликированный гемоглобин (HbA1c)", unit: "%", group: "Углеводный обмен", getRange: adultRange(4.0, 6.0) },
  { code: "glucose", name: "Глюкоза", unit: "ммоль/л", group: "Углеводный обмен", getRange: adultRange(3.9, 6.1) },
  { code: "homa_ir", name: "Индекс HOMA-IR", unit: "", group: "Углеводный обмен", getRange: adultRange(0, 2.7) },

  // === ЛИПИДНЫЙ ПРОФИЛЬ ===
  { code: "cholesterol", name: "Холестерин общий", unit: "ммоль/л", group: "Липидный профиль", getRange: adultRange(3.0, 5.2) },
  { code: "ldl", name: "ЛПНП", unit: "ммоль/л", group: "Липидный профиль", getRange: adultRange(0, 3.3) },
  { code: "hdl", name: "ЛПВП", unit: "ммоль/л", group: "Липидный профиль", getRange: sexRange(1.0, 2.1, 1.2, 2.5) },
  { code: "triglycerides", name: "Триглицериды", unit: "ммоль/л", group: "Липидный профиль", getRange: adultRange(0.4, 1.7) },
  { code: "atherogenic_index", name: "Коэф. атерогенности", unit: "", group: "Липидный профиль", getRange: adultRange(0, 3.0) },

  // === ПЕЧЁНОЧНЫЙ ПРОФИЛЬ ===
  { code: "bilirubin_total", name: "Билирубин общий", unit: "мкмоль/л", group: "Печёночный профиль", getRange: adultRange(3.4, 20.5) },
  { code: "bilirubin_direct", name: "Билирубин прямой", unit: "мкмоль/л", group: "Печёночный профиль", getRange: adultRange(0, 5.1) },
  { code: "bilirubin_indirect", name: "Билирубин непрямой", unit: "мкмоль/л", group: "Печёночный профиль", getRange: adultRange(3.4, 15.4) },
  { code: "alt", name: "АЛТ", unit: "Ед/л", group: "Печёночный профиль", getRange: sexRange(0, 41, 0, 33) },
  { code: "ast", name: "АСТ", unit: "Ед/л", group: "Печёночный профиль", getRange: sexRange(0, 40, 0, 32) },
  { code: "ggt", name: "Гамма-ГГТ", unit: "Ед/л", group: "Печёночный профиль", getRange: sexRange(10, 71, 6, 42) },
  { code: "amylase", name: "Амилаза", unit: "Ед/л", group: "Печёночный профиль", getRange: adultRange(28, 100) },
  { code: "lipase", name: "Липаза", unit: "Ед/л", group: "Печёночный профиль", getRange: adultRange(13, 60) },

  // === ПОЧЕЧНЫЙ ПРОФИЛЬ ===
  { code: "urea", name: "Мочевина", unit: "ммоль/л", group: "Почечный профиль", getRange: adultRange(2.5, 8.3) },
  { code: "creatinine", name: "Креатинин", unit: "мкмоль/л", group: "Почечный профиль", getRange: sexRange(62, 115, 44, 97) },
  { code: "uric_acid", name: "Мочевая кислота", unit: "мкмоль/л", group: "Почечный профиль", getRange: sexRange(202, 416, 143, 339) },
  { code: "cystatin_c", name: "Цистатин С", unit: "мг/л", group: "Почечный профиль", getRange: adultRange(0.55, 1.15) },

  // === ОБМЕН ЖЕЛЕЗА ===
  { code: "iron", name: "Железо", unit: "мкмоль/л", group: "Обмен железа", getRange: sexRange(11.6, 31.3, 9.0, 30.4) },
  { code: "ferritin", name: "Ферритин", unit: "мкг/л", group: "Обмен железа", getRange: sexRange(20, 250, 10, 120) },
  { code: "transferrin", name: "Трансферрин", unit: "г/л", group: "Обмен железа", getRange: adultRange(2.0, 3.6) },
  { code: "tibc", name: "ОЖСС", unit: "мкмоль/л", group: "Обмен железа", getRange: adultRange(45, 72) },

  // === ПРОЧЕЕ ===
  { code: "homocysteine", name: "Гомоцистеин", unit: "мкмоль/л", group: "Прочее", getRange: sexRange(5.5, 16.2, 4.4, 13.6) },
  { code: "igf1", name: "ИФР-1 (IGF-1)", unit: "нг/мл", group: "Прочее", getRange: igf1Range },
  { code: "leptin", name: "Лептин", unit: "нг/мл", group: "Прочее", getRange: sexRange(2.0, 5.6, 3.7, 11.1) },
  { code: "vitamin_d", name: "Витамин D (25-OH)", unit: "нг/мл", group: "Прочее", getRange: adultRange(30, 100) },
  { code: "cortisol", name: "Кортизол (утро)", unit: "нмоль/л", group: "Прочее", getRange: adultRange(171, 536) },

  // === СПЕРМОГРАММА (для полноты андрологического профиля) ===
  { code: "sperm_volume", name: "Объём эякулята", unit: "мл", group: "Спермограмма", getRange: () => ({ min: 1.5, max: 100 }) },
  { code: "sperm_concentration", name: "Концентрация", unit: "млн/мл", group: "Спермограмма", getRange: () => ({ min: 15, max: 1000 }) },
  { code: "sperm_motility_a_b", name: "Подвижность (A+B)", unit: "%", group: "Спермограмма", getRange: () => ({ min: 32, max: 100 }) },
  { code: "sperm_morphology", name: "Морфология (норм. формы)", unit: "%", group: "Спермограмма", getRange: () => ({ min: 4, max: 100 }) },
];

export const LAB_GROUPS = Array.from(new Set(LAB_TESTS.map(t => t.group)));

export function getTestByCode(code: string): LabTest | undefined {
  return LAB_TESTS.find(t => t.code === code);
}

export function getTestsByGroup(group: string): LabTest[] {
  return LAB_TESTS.filter(t => t.group === group);
}

/** Testicular & prostate volume norms by age (boys, ml) — imported reference data */
export interface UltrasoundAgeNorm {
  ageYears: number;
  rightTestisMl: number;
  leftTestisMl: number;
  prostateMl: number;
}

export const ULTRASOUND_AGE_NORMS: UltrasoundAgeNorm[] = [
  { ageYears: 1, rightTestisMl: 0.51, leftTestisMl: 0.51, prostateMl: 0.51 },
  { ageYears: 2, rightTestisMl: 0.55, leftTestisMl: 0.55, prostateMl: 0.55 },
  { ageYears: 3, rightTestisMl: 0.55, leftTestisMl: 0.55, prostateMl: 0.55 },
  { ageYears: 4, rightTestisMl: 0.63, leftTestisMl: 0.63, prostateMl: 0.63 },
  { ageYears: 5, rightTestisMl: 0.69, leftTestisMl: 0.69, prostateMl: 0.69 },
  { ageYears: 6, rightTestisMl: 0.69, leftTestisMl: 0.69, prostateMl: 0.69 },
  { ageYears: 7, rightTestisMl: 0.69, leftTestisMl: 0.69, prostateMl: 0.69 },
  { ageYears: 8, rightTestisMl: 0.80, leftTestisMl: 0.80, prostateMl: 0.80 },
  { ageYears: 9, rightTestisMl: 0.80, leftTestisMl: 0.80, prostateMl: 0.80 },
  { ageYears: 10, rightTestisMl: 1.29, leftTestisMl: 1.29, prostateMl: 1.29 },
  { ageYears: 11, rightTestisMl: 2.52, leftTestisMl: 2.52, prostateMl: 2.52 },
  { ageYears: 12, rightTestisMl: 4.59, leftTestisMl: 4.59, prostateMl: 4.59 },
  { ageYears: 13, rightTestisMl: 7.05, leftTestisMl: 7.05, prostateMl: 7.05 },
  { ageYears: 14, rightTestisMl: 8.87, leftTestisMl: 8.87, prostateMl: 8.87 },
  { ageYears: 15, rightTestisMl: 10.90, leftTestisMl: 10.90, prostateMl: 10.90 },
  { ageYears: 16, rightTestisMl: 12.68, leftTestisMl: 12.68, prostateMl: 12.68 },
  { ageYears: 17, rightTestisMl: 12.68, leftTestisMl: 12.68, prostateMl: 12.68 },
];

export function getUltrasoundNorm(ageYears: number): UltrasoundAgeNorm | null {
  if (ageYears < 1 || ageYears > 17) return null;
  return ULTRASOUND_AGE_NORMS.find(n => n.ageYears === Math.floor(ageYears)) ?? null;
}

/** @deprecated Use getUltrasoundNorm instead */
export function getTesticularVolumeNorm(ageYears: number): { min: number; median: number; max: number } | null {
  const norm = getUltrasoundNorm(ageYears);
  if (!norm) return null;
  // Use the mean of right+left as median, keep backward compat
  const avg = (norm.rightTestisMl + norm.leftTestisMl) / 2;
  return { min: avg * 0.5, median: avg, max: avg * 2.5 };
}
