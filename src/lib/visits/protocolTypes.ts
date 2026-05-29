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

export const PROTOCOL_TYPES: ProtocolDef[] = [
  { key: "ultrashort", title: "Ультракороткий", short: "Консультация", description: "Краткая консультация без полного осмотра" },
  { key: "primary_short", title: "Первичный осмотр", short: "Короткий", description: "Первичный приём: жалобы, анамнез, локальный статус" },
  { key: "dynamic_with_uzi", title: "Динамический + УЗИ", short: "Контроль", description: "Динамический осмотр с УЗИ репродуктивной системы" },
  { key: "repeat_with_labs", title: "Повторный с анализами", short: "Лаборатория", description: "Повторный приём с оценкой анализов" },
  { key: "uzi_reproductive", title: "УЗИ репродуктивной", short: "УЗИ репр.", description: "Только УЗИ репродуктивной системы" },
  { key: "uzi_urinary", title: "УЗИ мочевыделительной", short: "УЗИ мочев.", description: "УЗИ почек, мочеточников, мочевого пузыря" },
  { key: "postop_day3", title: "Послеоп. 3 сутки", short: "Контроль 3 сут", description: "Послеоперационный контроль на 3-и сутки" },
  { key: "postop_day7", title: "Послеоп. 7 сутки", short: "Контроль 7 сут", description: "Послеоперационный контроль на 7-е сутки" },
  { key: "repeat_with_uzi", title: "Повторный с УЗИ", short: "Повторный", description: "Повторный приём с УЗИ репродуктивной системы" },
];

export const PROTOCOL_TYPE_MAP: Record<ProtocolType, ProtocolDef> = Object.fromEntries(
  PROTOCOL_TYPES.map((p) => [p.key, p])
) as Record<ProtocolType, ProtocolDef>;
