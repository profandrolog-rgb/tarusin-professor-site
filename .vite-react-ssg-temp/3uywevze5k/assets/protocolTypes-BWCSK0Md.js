const PROTOCOL_LABELS = {
  primary_short: "Первичная консультация",
  dynamic_with_uzi: "Динамический осмотр с ультразвуковым исследованием",
  repeat_with_uzi: "Повторный осмотр с ультразвуковым исследованием",
  repeat_with_labs: "Повторный осмотр с анализами",
  postop_day3: "Контрольный осмотр на 3 сутки после операции",
  postop_day7: "Контрольный осмотр на 7 сутки после операции",
  postop_day10: "Контрольный осмотр на 10 сутки после операции",
  uzi_reproductive: "Комплексное ультразвуковое исследование органов репродуктивной системы",
  uzi_urinary: "Ультразвуковое исследование органов мочевыделительной системы",
  uzi_bladder: "Ультразвуковое исследование мочевого пузыря с определением остаточной мочи",
  ultrashort: "Краткий осмотр",
  online_consult: "ONLINE консультация",
  peptide_program: "Пептидная программа",
  dynamic: "Динамический осмотр",
  unknown: "Осмотр"
};
const PROTOCOL_SHORT = {
  primary_short: "Первичная",
  dynamic_with_uzi: "Динамический + УЗИ",
  repeat_with_uzi: "Повторный + УЗИ",
  repeat_with_labs: "Повторный + анализы",
  postop_day3: "П/о 3 сут",
  postop_day7: "П/о 7 сут",
  postop_day10: "П/о 10 сут",
  uzi_reproductive: "УЗИ репродуктивной",
  uzi_urinary: "УЗИ мочевыделительной",
  uzi_bladder: "УЗИ мочевого пузыря",
  ultrashort: "Краткий",
  online_consult: "ONLINE",
  peptide_program: "Пептидная программа",
  dynamic: "Динамический",
  unknown: "Осмотр"
};
const PROTOCOL_TYPES = [
  "ultrashort",
  "primary_short",
  "online_consult",
  "dynamic_with_uzi",
  "repeat_with_labs",
  "uzi_reproductive",
  "uzi_urinary",
  "uzi_bladder",
  "postop_day3",
  "postop_day7",
  "repeat_with_uzi",
  "peptide_program"
].map((key) => ({
  key,
  title: PROTOCOL_LABELS[key],
  short: PROTOCOL_SHORT[key] || PROTOCOL_LABELS[key],
  description: PROTOCOL_LABELS[key]
}));
const PROTOCOL_TYPE_MAP = Object.fromEntries(
  PROTOCOL_TYPES.map((p) => [p.key, p])
);
export {
  PROTOCOL_TYPE_MAP as P,
  PROTOCOL_TYPES as a
};
