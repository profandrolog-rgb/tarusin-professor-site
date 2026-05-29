import { ProtocolType } from "./protocolTypes";

export interface UltrashortData {
  complaints?: string;
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
  recommendations?: string;
}

export type AnyProtocolData = UltrashortData | PostOpDay3Data | PostOpDay7Data | Record<string, any>;

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
};
