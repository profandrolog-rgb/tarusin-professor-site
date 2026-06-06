export type ProtocolType =
  | "ultrashort"
  | "primary_short"
  | "dynamic_with_uzi"
  | "repeat_with_labs"
  | "uzi_reproductive"
  | "uzi_urinary"
  | "postop_day3"
  | "postop_day7"
  | "repeat_with_uzi";

export interface ProtocolDef {
  key: ProtocolType;
  title: string;
  short: string;
  description: string;
}

/**
 * Единые человеко-читаемые названия типов протоколов.
 * Используются везде: печатный бланк, dropdown, журнал, карточка пациента.
 */
export const PROTOCOL_LABELS: Record<string, string> = {
  primary_short: "Первичная консультация",
  dynamic_with_uzi: "Динамический осмотр с ультразвуковым исследованием",
  repeat_with_uzi: "Повторный осмотр с ультразвуковым исследованием",
  repeat_with_labs: "Повторный осмотр с анализами",
  postop_day3: "Контрольный осмотр на 3 сутки после операции",
  postop_day7: "Контрольный осмотр на 7 сутки после операции",
  postop_day10: "Контрольный осмотр на 10 сутки после операции",
  uzi_reproductive: "Комплексное ультразвуковое исследование органов репродуктивной системы",
  uzi_urinary: "Ультразвуковое исследование органов мочевыделительной системы",
  ultrashort: "Краткий осмотр",
  online_consult: "ONLINE консультация",
  dynamic: "Динамический осмотр",
  unknown: "Осмотр",
};

export const getProtocolLabel = (key: string | null | undefined): string =>
  (key && PROTOCOL_LABELS[key]) || PROTOCOL_LABELS.unknown;

/** Короткие подписи для бейджей/фильтров — где длинное название не помещается. */
const PROTOCOL_SHORT: Record<string, string> = {
  primary_short: "Первичная",
  dynamic_with_uzi: "Динамический + УЗИ",
  repeat_with_uzi: "Повторный + УЗИ",
  repeat_with_labs: "Повторный + анализы",
  postop_day3: "П/о 3 сут",
  postop_day7: "П/о 7 сут",
  postop_day10: "П/о 10 сут",
  uzi_reproductive: "УЗИ репродуктивной",
  uzi_urinary: "УЗИ мочевыделительной",
  ultrashort: "Краткий",
  online_consult: "ONLINE",
  dynamic: "Динамический",
  unknown: "Осмотр",
};

export const PROTOCOL_TYPES: ProtocolDef[] = [
  "ultrashort",
  "primary_short",
  "dynamic_with_uzi",
  "repeat_with_labs",
  "uzi_reproductive",
  "uzi_urinary",
  "postop_day3",
  "postop_day7",
  "repeat_with_uzi",
].map((key) => ({
  key: key as ProtocolType,
  title: PROTOCOL_LABELS[key],
  short: PROTOCOL_SHORT[key] || PROTOCOL_LABELS[key],
  description: PROTOCOL_LABELS[key],
}));

export const PROTOCOL_TYPE_MAP: Record<ProtocolType, ProtocolDef> = Object.fromEntries(
  PROTOCOL_TYPES.map((p) => [p.key, p])
) as Record<ProtocolType, ProtocolDef>;
