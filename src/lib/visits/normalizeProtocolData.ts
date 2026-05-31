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
  ],
  // Алиас для форм, где диагноз отдельным полем
  diagnosis: [
    "Заключение",
    "Клиническое заключение",
    "Диагноз",
    "Заключение/Диагноз",
    "Предварительное заключение",
  ],
  working_diagnosis: [
    "Рабочая формулировка диагноза",
  ],
  exam_plan: [
    "План обследования",
    "Рекомендации по обследованию",
  ],
  // Дополнительные статусы первичного осмотра
  ortho_status: ["Ортопедический статус"],
  neuro_status: [
    "Неврологический статус",
    "Оценка неврологического статуса экспресс",
  ],
  psych_status: [
    "Психологический статус",
    "Оценка общего психологического статуса",
  ],
  // Половая формула — свободный текст
  sexual_formula_text: ["Половая формула"],
  // Половая конституция — отдельное поле
  sexual_constitution: ["Половая конституция"],

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
    right: ["Справа", "Правая сторона"],
    left: ["Слева", "Левая сторона"],
    penis: ["Половой член"],
    perineum: ["Промежность"],
    external_genitalia: [
      "Локальный статус на момент осмотра",
      "Локальный статус",
      "Состояние раны",
      "Наружные половые органы",
    ],
    scrotum: ["Мошонка"],
    right_testis: ["Правое яичко"],
    left_testis: ["Левое яичко"],
    epididymis: ["Придатки", "Придатки яичек"],
    spermatic_cord: ["Семенные канатики"],
    inguinal_rings: ["Паховые кольца", "Наружные паховые кольца"],
  },
  somatic: {
    general: [
      "Соматический статус на момент осмотра",
      "Соматический статус",
      "Общее состояние",
    ],
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
  return parts.length ? parts.join("\n\n") : undefined;
}

function isEmpty(v: any): boolean {
  return v === undefined || v === null || v === "";
}

// Версия нормализатора. Увеличиваем при добавлении новых алиасов,
// чтобы ранее импортированные визиты (с _normalized: true) были
// повторно прогнаны через свежий маппинг и подхватили новые поля.
export const NORMALIZATION_VERSION = 9;

export function normalizeImportedProtocolData(
  _type: ProtocolType,
  data: any,
): any {
  if (!data || typeof data !== "object") return data || {};
  // Если уже нормализовано текущей версией — ничего не делаем.
  if (data._normalized && data._normalized_version === NORMALIZATION_VERSION) return data;
  const fields = data.fields;
  if (!fields || typeof fields !== "object") {
    return { ...data, _normalized: true, _normalized_version: NORMALIZATION_VERSION };
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

  // 2b. Спец-разбор local_status: единый текст "Справа...Слева..." и
  // ключи-плейсхолдеры "Половой член..." / "Область промежности...".
  {
    const currentLs = (data.local_status && typeof data.local_status === "object")
      ? data.local_status
      : {};
    const patchedLs: Record<string, any> = { ...currentLs, ...(nestedPatch.local_status || {}) };

    if (isEmpty(patchedLs.right) && isEmpty(patchedLs.left)) {
      const raw = (
        fields["Локальный статус на момент осмотра"] ||
        fields["Локальный статус"] ||
        ""
      );
      if (typeof raw === "string" && raw.trim()) {
        const idx = raw.indexOf("Слева");
        if (idx > -1) {
          patchedLs.right = raw.slice(0, idx).replace(/^Справа\s*/i, "").trim();
          patchedLs.left = raw.slice(idx).replace(/^Слева\s*/i, "").trim();
        } else if (isEmpty(patchedLs.external_genitalia)) {
          patchedLs.external_genitalia = raw.trim();
        }
      }
    }

    if (isEmpty(patchedLs.penis) || isEmpty(patchedLs.perineum)) {
      for (const key of Object.keys(fields)) {
        const k = key.trim();
        if (isEmpty(patchedLs.penis) && k.includes("Половой член") && k.length > 20) {
          patchedLs.penis = k;
        }
        if (isEmpty(patchedLs.perineum) && k.includes("промежности") && k.length > 20) {
          patchedLs.perineum = k;
        }
      }
    }

    const changed = Object.keys(patchedLs).some(
      (k) => (currentLs as any)[k] !== patchedLs[k],
    );
    if (changed) nestedPatch.local_status = patchedLs;
  }

  // 2c. Спец-разбор somatic: полный соматический статус иногда приходит
  // как русский ключ с пустым значением, а не как значение поля.
  {
    const currentSomatic = (data.somatic && typeof data.somatic === "object")
      ? data.somatic
      : {};
    const patchedSomatic: Record<string, any> = { ...currentSomatic, ...(nestedPatch.somatic || {}) };

    if (isEmpty(patchedSomatic.full_text)) {
      for (const key of Object.keys(fields)) {
        const k = key.trim();
        if (k.startsWith("Общее состояние удовлетворительное") && k.length > 50) {
          patchedSomatic.full_text = k;
          break;
        }
      }
    }

    const changed = Object.keys(patchedSomatic).some(
      (k) => (currentSomatic as any)[k] !== patchedSomatic[k],
    );
    if (changed) nestedPatch.somatic = patchedSomatic;
  }

  // 2d. Для послеоп-визитов wound_status тянем из локального статуса.
  if (isEmpty(data.wound_status) && isEmpty(derived.wound_status) &&
      (_type === "postop_day3" || _type === "postop_day7")) {
    const ls = (nestedPatch.local_status || data.local_status || {}) as any;
    const ws =
      (typeof fields["Локальный статус на момент осмотра"] === "string" && fields["Локальный статус на момент осмотра"]) ||
      (typeof fields["Локальный статус"] === "string" && fields["Локальный статус"]) ||
      (typeof fields["Состояние раны"] === "string" && fields["Состояние раны"]) ||
      ls.notes ||
      ls.external_genitalia ||
      "";
    if (ws && typeof ws === "string" && ws.trim()) {
      derived.wound_status = ws.trim();
    }
  }

  return {
    ...data,
    ...derived,
    ...nestedPatch,
    _normalized: true,
    _normalized_version: NORMALIZATION_VERSION,
  };
}

