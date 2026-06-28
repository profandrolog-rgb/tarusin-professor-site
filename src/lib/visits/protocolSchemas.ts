import { ProtocolType } from "./protocolTypes";
import { DEFAULT_SOMATIC, SomaticStatusData } from "@/components/visits/sections/SomaticStatus";
import { DEFAULT_LOCAL_STATUS, LocalStatusData } from "@/components/visits/sections/LocalStatusAndrology";
import { DEFAULT_SEXUAL_FORMULA, SexualFormulaData } from "@/components/visits/sections/SexualFormula";
import { DEFAULT_UZI_REPRODUCTIVE, UziReproductiveData } from "@/components/visits/sections/UziReproductive";
import { DEFAULT_UZI_URINARY, UziUrinaryData } from "@/components/visits/sections/UziUrinary";
import { SexualConstitutionData } from "@/components/visits/sections/SexualConstitution";
import { PsychStatusData } from "@/components/visits/sections/PsychStatus";



export interface UltrashortData {
  complaints?: string;
  anamnesis?: string;
  consultation_notes?: string;
  somatic?: SomaticStatusData;
  sexual_formula?: SexualFormulaData;
  sexual_formula_text?: string;
  sexual_constitution?: string | SexualConstitutionData;
  // local_status: object (новый формат) или строка (legacy)
  local_status?: LocalStatusData | string;
  conclusion?: string;
  recommendations?: string;
}

export interface PostOpDay3Data {
  operation_name?: string;
  operation_date?: string;
  general_status?: string;
  wound_status?: string;
  dressing?: string;
  pain?: string;
  temperature?: string;
  complaints?: string;
  uzi_express?: string;
  recommendations?: string;
}

export interface PostOpDay7Data {
  operation_name?: string;
  operation_date?: string;
  day_number?: number;
  general_status?: string;
  wound_status?: string;
  sutures_removed?: boolean;
  healing?: string;
  complaints?: string;
  uzi_express?: string;
  recommendations?: string;
}

export interface PrimaryShortData extends PsychStatusData {
  complaints?: string;

  anamnesis?: string;
  somatic?: SomaticStatusData;
  sexual_formula?: SexualFormulaData;
  sexual_formula_text?: string;
  sexual_constitution?: string | SexualConstitutionData;
  local_status?: LocalStatusData;
  ortho_status?: string;
  neuro_status?: string;
  neuro_status_full?: string;
  psych_status?: string;
  working_diagnosis?: string;
  diagnosis?: string;
  conclusion?: string;
  exam_plan?: string;
  recommendations?: string;
}

export interface RepeatWithLabsData {
  complaints?: string;
  dynamics?: string;
  cbc?: string;
  urinalysis?: string;
  biochem?: string;
  hormones?: string;
  other_labs?: string;
  local_status?: LocalStatusData;
  conclusion?: string;
  recommendations?: string;
}

export interface UziReproductiveOnlyData {
  indications?: string;
  uzi?: UziReproductiveData;
  recommendations?: string;
}

export interface UziUrinaryOnlyData {
  indications?: string;
  uzi?: UziUrinaryData;
  recommendations?: string;
}

export interface UziBladderData {
  indications?: string;
  device?: string;
  /** Включать ли блок УЗИ в печатный бланк (по умолчанию true). */
  print_enabled?: boolean;
  bladder_volume?: string;
  bladder_walls?: string;
  bladder_contents?: string;
  residual_urine?: string;
  residual_urine_percent?: string;
  micturition_urge?: string;
  conclusion?: string;
  recommendations?: string;
}


export interface DynamicWithUziData extends PsychStatusData {
  complaints?: string;
  anamnesis?: string;
  dynamics?: string;
  lab_results?: string;
  local_status?: LocalStatusData;
  ortho_status?: string;
  uzi?: UziReproductiveData;
  conclusion?: string;
  recommendations?: string;
}

export interface RepeatWithUziData extends PsychStatusData {
  complaints?: string;
  local_status?: LocalStatusData;
  ortho_status?: string;
  uzi?: UziReproductiveData;
  conclusion?: string;
  recommendations?: string;
}


export interface OnlineConsultData {
  reason?: string;
  complaints?: string;
  anamnesis?: string;
  prior_visit?: "yes" | "no" | "";
  prior_visit_date?: string;
  prior_visit_note?: string;
  current_state?: string;
  external_exam_by_photo?: boolean;
  external_exam_by_video?: boolean;
  external_genitalia?: string;
  interpretation?: string;
  conclusion?: string;
  recommendations?: string;
  channel?: string;
  duration_min?: number | string;
  exam_plan?: string;
  in_person_needed?: "yes" | "no" | "";
  in_person_urgency?: "plan" | "soon" | "urgent" | "";
}

export type { PeptideProgramData } from "@/components/visits/forms/PeptideProgramForm";
import { DEFAULT_PEPTIDE_PROGRAM, type PeptideProgramData } from "@/components/visits/forms/PeptideProgramForm";


export type AnyProtocolData =
  | UltrashortData
  | PostOpDay3Data
  | PostOpDay7Data
  | PrimaryShortData
  | RepeatWithLabsData
  | UziReproductiveOnlyData
  | UziUrinaryOnlyData
  | UziBladderData

  | DynamicWithUziData
  | RepeatWithUziData
  | OnlineConsultData
  | PeptideProgramData
  | Record<string, any>;

export const DEFAULT_PROTOCOL_DATA: Partial<Record<ProtocolType, AnyProtocolData>> = {
  ultrashort: {
    complaints: "Активных жалоб не предъявляет.",
    anamnesis: "Со слов родителей: рос и развивался по возрасту. Хронические заболевания отрицают.",
    somatic: DEFAULT_SOMATIC,
    sexual_formula: DEFAULT_SEXUAL_FORMULA,
    local_status: DEFAULT_LOCAL_STATUS,
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев.",
  } as UltrashortData,
  postop_day3: {
    general_status: "Удовлетворительное. Температура тела нормальная.",
    wound_status: "Послеоперационная рана без признаков воспаления, повязка чистая, сухая.",
    dressing: "Перевязка с водным раствором хлоргексидина 0,05%.",
    pain: "Умеренный болевой синдром в зоне операции.",
    temperature: "36,6 °C",
    recommendations:
      "Перевязки 1 раз в день. Туалет послеоперационной раны. Ограничение физических нагрузок. Контрольный осмотр на 7-е сутки.\nКонтрольный осмотр: ____________ 2026 г.\nКонтрольное УЗИ исследование — по назначению профессора.",
  },
  postop_day7: {
    day_number: 7,
    general_status: "Удовлетворительное.",
    wound_status: "Послеоперационная рана зажила первичным натяжением. Воспалительных явлений нет.",
    sutures_removed: true,
    healing: "Заживление первичным натяжением.",
    recommendations:
      "Ограничение физических нагрузок 1 месяц. При появлении жалоб — обращение к лечащему врачу.\nКонтрольный осмотр: ____________ 2026 г.\nКонтрольное УЗИ исследование — по назначению профессора.",
  },
  primary_short: {
    complaints: "",
    anamnesis: "Со слов родителей: рос и развивался по возрасту. Хронические заболевания отрицают. Аллергоанамнез не отягощён. Травмы, операции — нет.",
    somatic: DEFAULT_SOMATIC,
    sexual_formula: DEFAULT_SEXUAL_FORMULA,
    local_status: DEFAULT_LOCAL_STATUS,
    exam_plan: "ОАК, ОАМ, УЗИ органов мошонки и почек.",
    recommendations: "Контрольный осмотр через 6 месяцев.",
  } as PrimaryShortData,
  repeat_with_labs: {
    complaints: "Жалоб нет.",
    local_status: DEFAULT_LOCAL_STATUS,
    conclusion: "Данных за патологию не выявлено.",
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев.",
  } as RepeatWithLabsData,
  uzi_reproductive: {
    indications: "Скрининговое обследование.",
    uzi: DEFAULT_UZI_REPRODUCTIVE,
    recommendations: "Контрольное УЗИ через 6–12 месяцев.",
  } as UziReproductiveOnlyData,
  uzi_urinary: {
    indications: "Скрининговое обследование.",
    uzi: DEFAULT_UZI_URINARY,
    recommendations: "Контрольное УЗИ через 6–12 месяцев.",
  } as UziUrinaryOnlyData,
  dynamic_with_uzi: {
    complaints: "Жалоб нет.",
    local_status: DEFAULT_LOCAL_STATUS,
    uzi: DEFAULT_UZI_REPRODUCTIVE,
    conclusion: "Без отрицательной динамики.",
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев.",
  } as DynamicWithUziData,
  repeat_with_uzi: {
    complaints: "Жалоб нет.",
    local_status: DEFAULT_LOCAL_STATUS,
    uzi: DEFAULT_UZI_REPRODUCTIVE,
    conclusion: "Без отрицательной динамики.",
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев.",
  } as RepeatWithUziData,
  online_consult: {
    reason: "Первичная онлайн-консультация",
    prior_visit: "no",
    external_exam_by_photo: false,
    external_exam_by_video: false,
    external_genitalia:
      "Наружные половые органы развиты по мужскому типу, яички в мошонке, семенные канатики не изменены, область паховых колец не изменена, половой член развит по возрасту, уретра в типичном положении, меатус в типичном положении, крайняя плоть открывается, половое развитие соответствует возрасту.",
    in_person_needed: "no",
    recommendations: "Контрольный осмотр / повторная консультация по согласованию.",
  } as OnlineConsultData,
  peptide_program: DEFAULT_PEPTIDE_PROGRAM,
};
