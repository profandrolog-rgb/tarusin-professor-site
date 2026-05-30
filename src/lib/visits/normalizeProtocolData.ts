import { ProtocolType } from "./protocolTypes";

/**
 * Импортированные визиты хранят свободные русские ключи в
 * protocol_data.fields["..."]. Формы редактирования читают
 * структурированные английские поля (complaints, wound_status и т.д.).
 * Этот нормализатор переводит русские ключи в структурированные,
 * заполняя только отсутствующие поля и не теряя исходные данные.
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
    "Предварительное заключение",
    "Рабочая формулировка диагноза",
  ],
  exam_plan: [
    "План обследования",
    "Рекомендации по обследованию",
  ],
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
  "Рекомендации по лечению",
  "Медикаментозная терапия",
  "Рекомендации по режиму",
  "Ограничения по спорту",
  "Рекомендации по обследованию",
  "Контрольный осмотр через",
  "Контрольный осмотр",
];

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
  for (const k of keys) {
    const v = fields?.[k];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
    else if (typeof v === "number") parts.push(String(v));
  }
  return parts.length ? parts.join("\n") : undefined;
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

  const derived: Record<string, any> = {};
  for (const [structKey, ruKeys] of Object.entries(FIELD_ALIASES)) {
    if (data[structKey] !== undefined && data[structKey] !== "" && data[structKey] !== null) continue;
    const v = pickFirst(fields, ruKeys);
    if (v !== undefined) derived[structKey] = v;
  }

  // recommendations — объединяем все доступные источники, если ещё не задано
  if (!data.recommendations) {
    const rec = pickJoined(fields, RECOMMENDATIONS_SOURCES);
    if (rec) derived.recommendations = rec;
  }

  return { ...data, ...derived, _normalized: true };
}
