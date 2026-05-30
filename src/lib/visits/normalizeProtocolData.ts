import { ProtocolType } from "./protocolTypes";

/**
 * Импортированные визиты хранят свободные русские ключи в
 * protocol_data.fields["..."]. Формы редактирования читают
 * структурированные английские поля (complaints, wound_status и т.д.).
 * Этот нормализатор переводит русские ключи в структурированные,
 * заполняя только отсутствующие поля и не теряя исходные данные.
 *
 * Работает для ВСЕХ типов протоколов: postop, primary_short,
 * dynamic_with_uzi, repeat_with_labs, ultrashort, uzi_* и т.д.
 */

type Dict = Record<string, string[]>;

// Канонические соответствия: struct key -> список возможных русских ключей.
// Порядок важен: используется первое непустое значение.
const FIELD_ALIASES: Dict = {
  complaints: [
    "Жалобы",
    "Жалобы на момент осмотра",
    "Жалобы пациента",
  ],
  anamnesis: [
    "Анамнез",
    "Анамнез заболевания",
    "Анамнез болезни",
    "Динамика течения болезни со слов пациента",
  ],
  operation_name: [
    "Выполнена операция",
    "Название операции",
  ],
  operation_date: [
    "Дата операции",
  ],
  general_status: [
    "Соматический статус",
    "Соматический статус на момент осмотра",
    "Общее состояние",
  ],
  wound_status: [
    "Состояние раны",
    "Локальный статус",
    "Локальный статус на момент осмотра",
  ],
  healing: [
    "Заживление",
  ],
  dressing: [
    "Перевязка",
    "Местное лечение",
  ],
  pain: [
    "Болевой синдром",
  ],
  temperature: [
    "Температура",
    "Температура тела",
  ],
  conclusion: [
    "Заключение",
    "Заключение/Диагноз",
    "Клиническое заключение",
    "Предварительное заключение",
    "Рабочая формулировка диагноза",
  ],
  // Алиас для форм, где диагноз отдельным полем
  diagnosis: [
    "Заключение",
    "Клиническое заключение",
    "Диагноз",
    "Заключение/Диагноз",
  ],
  exam_plan: [
    "План обследования",
    "Рекомендации по обследованию",
  ],
  // Дополнительные статусы первичного осмотра
  ortho_status: ["Ортопедический статус"],
  neuro_status: ["Неврологический статус"],
  psych_status: ["Психологический статус"],
  // Половая формула как свободный текст (структурное представление
  // остаётся в data.sexual_formula, но текст не теряем)
  sexual_formula_text: ["Половая формула", "Половая конституция"],

  indications: [
    "Показания",
  ],
  cbc: ["КАК", "Общий анализ крови"],
  urinalysis: ["Общий анализ мочи", "ОАМ"],
  biochem: ["Биохимия", "Биохимический анализ крови"],
  hormones: ["Гормоны"],
  other_labs: ["Прочие анализы", "Результаты обследований", "Результаты обследования"],
};

// Для recommendations объединяем несколько источников.
const RECOMMENDATIONS_SOURCES = [
  "Рекомендации",
  "Рекомендовано следующее лечение",
  "Рекомендации по лечению",
  "Медикаментозная терапия",
  "Рекомендации по режиму",
  "Рекомендации по обследованию",
  "Ограничения по спорту",
  "Контрольный осмотр через",
  "Контрольный осмотр",
];

// Вложенные секции: каждый sub-ключ -> русские варианты.
// Заполняем только если соответствующее поле в секции пустое.
const NESTED_ALIASES: Record<string, Dict> = {
  local_status: {
    external_genitalia: ["Наружные половые органы"],
    penis: ["Половой член"],
    scrotum: ["Мошонка"],
    right_testis: ["Правое яичко"],
    left_testis: ["Левое яичко"],
    epididymis: ["Придатки", "Придатки яичек"],
    spermatic_cord: ["Семенные канатики"],
    inguinal_rings: ["Паховые кольца", "Наружные паховые кольца"],
  },
  somatic: {
    general: ["Соматический статус", "Общее состояние"],
    lymph_nodes: ["Лимфатические узлы", "Периферические лимфатические узлы"],
  },
};

function pickFirst(fields: Record<string, any>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = fields?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function pickJoined(fields: Record<string, any>, keys: string[]): string | undefined {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const k of keys) {
    const v = fields?.[k];
    const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
    if (s && !seen.has(s)) {
      parts.push(s);
      seen.add(s);
    }
  }
  return parts.length ? parts.join("\n") : undefined;
}

function isEmpty(v: any): boolean {
  return v === undefined || v === null || v === "";
}

export function normalizeImportedProtocolData(
  _type: ProtocolType,
  data: any,
): any {
  if (!data || typeof data !== "object") return data || {};
  // Защита от повторной нормализации: после первого прохода ставим флаг,
  // чтобы ручная очистка поля в форме не перезаписывалась при следующей
  // загрузке тем же значением из fields.
  if (data._normalized) return data;
  const fields = data.fields;
  if (!fields || typeof fields !== "object") {
    return { ...data, _normalized: true };
  }

  // 1. Плоские поля верхнего уровня
  const derived: Record<string, any> = {};
  for (const [structKey, ruKeys] of Object.entries(FIELD_ALIASES)) {
    if (!isEmpty(data[structKey])) continue;
    const v = pickFirst(fields, ruKeys);
    if (v !== undefined) derived[structKey] = v;
  }

  // recommendations — объединяем все доступные источники, если ещё не задано
  if (isEmpty(data.recommendations)) {
    const rec = pickJoined(fields, RECOMMENDATIONS_SOURCES);
    if (rec) derived.recommendations = rec;
  }

  // 2. Вложенные секции (local_status, somatic ...)
  const nestedPatch: Record<string, any> = {};
  for (const [sectionKey, subMap] of Object.entries(NESTED_ALIASES)) {
    const current = (data[sectionKey] && typeof data[sectionKey] === "object") ? data[sectionKey] : {};
    const subDerived: Record<string, any> = {};
    for (const [subKey, ruKeys] of Object.entries(subMap)) {
      if (!isEmpty(current[subKey])) continue;
      const v = pickFirst(fields, ruKeys);
      if (v !== undefined) subDerived[subKey] = v;
    }
    if (Object.keys(subDerived).length) {
      nestedPatch[sectionKey] = { ...current, ...subDerived };
    }
  }

  return { ...data, ...derived, ...nestedPatch, _normalized: true };
}
