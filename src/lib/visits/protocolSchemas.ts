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
  local_status?: string;
  recommendations?: string;
  conclusion?: string;
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

export interface DynamicWithUziData {
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

export interface RepeatWithUziData {
  complaints?: string;
  local_status?: LocalStatusData;
  ortho_status?: string;
  uzi?: UziReproductiveData;
  conclusion?: string;
  recommendations?: string;
}

export type AnyProtocolData =
  | UltrashortData
  | PostOpDay3Data
  | PostOpDay7Data
  | PrimaryShortData
  | RepeatWithLabsData
  | UziReproductiveOnlyData
  | UziUrinaryOnlyData
  | DynamicWithUziData
  | RepeatWithUziData
  | Record<string, any>;

export const DEFAULT_PROTOCOL_DATA: Partial<Record<ProtocolType, AnyProtocolData>> = {
  ultrashort: {
    complaints: "Активных жалоб не предъявляет.",
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев.",
  },
  postop_day3: {
    general_status: "Удовлетворительное. Температура тела нормальная.",
    wound_status: "Послеоперационная рана без признаков воспаления, повязка чистая, сухая.",
    dressing: "Перевязка с водным раствором хлоргексидина 0,05%.",
    pain: "Умеренный болевой синдром в зоне операции.",
    temperature: "36,6 °C",
    recommendations:
      "Перевязки 1 раз в день. Туалет послеоперационной раны. Ограничение физических нагрузок. Контрольный осмотр на 7-е сутки.",
  },
  postop_day7: {
    general_status: "Удовлетворительное.",
    wound_status: "Послеоперационная рана зажила первичным натяжением. Воспалительных явлений нет.",
    sutures_removed: true,
    healing: "Заживление первичным натяжением.",
    recommendations:
      "Ограничение физических нагрузок 1 месяц. Контрольный осмотр через 1 месяц. При появлении жалоб — обращение к лечащему врачу.",
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
};
