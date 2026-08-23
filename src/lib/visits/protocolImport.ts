// Импорт протоколов старого формата: извлечение содержимого файла на клиенте
// + вызов Edge Function распознавания.

import mammoth from "mammoth";
import TurndownService from "turndown";
// @ts-ignore - у turndown-plugin-gfm нет типов
import { tables as gfmTables } from "turndown-plugin-gfm";
import { supabase } from "@/integrations/supabase/client";
import type { ProtocolType } from "./protocolTypes";

export interface ParsedProtocolPatient {
  full_name?: string;
  birth_date?: string;
  sex?: "M" | "F" | string;
  history_number?: string;
  age_text?: string;
}

export interface ParsedProtocol {
  protocol_type?: ProtocolType | string;
  confidence?: number;
  patient?: ParsedProtocolPatient;
  visit_date?: string;
  diagnosis?: string;
  icd_code?: string;
  next_visit_date?: string;
  protocol_data?: Record<string, any>;
  unmapped?: string;
  notes?: string;
  _model?: string;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Не удалось прочитать файл"));
    fr.readAsDataURL(file);
  });

/** Текст + таблицы из .docx (mammoth → HTML → markdown). */
export async function docxToMarkdown(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const conv = await mammoth.convertToHtml({ arrayBuffer });
  const td = new TurndownService({ headingStyle: "atx" });
  td.use(gfmTables);
  return td.turndown(conv.value || "").trim();
}

export interface ExtractedSource {
  text?: string;
  fileData?: string;
  storageBucket?: string;
  storagePath?: string;
  fileName: string;
  kind: "docx" | "pdf" | "image" | "text";
}

const IMPORT_BUCKET = "patient-lab-docs";

function safeFileName(name: string): string {
  // Storage не принимает не-ASCII ключи ("Invalid key") — чистим имя файла.
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(-120);
  return cleaned || "protocol";
}


/**
 * Большой PDF/скан нельзя отправлять как base64 внутри тела запроса к функции:
 * Cloudflare-прокси обрывает такой POST ещё до запуска парсера («failed to send
 * a request»). Кладём оригинал в приватное хранилище и передаём только путь.
 */
async function uploadForParsing(file: File): Promise<{ bucket: string; path: string } | null> {
  try {
    const path = `protocol-import/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(IMPORT_BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) return null;
    return { bucket: IMPORT_BUCKET, path };
  } catch {
    return null;
  }
}

/** Подготовка файла к распознаванию: docx/txt → текст, pdf/картинка → хранилище. */
export async function extractProtocolSource(file: File): Promise<ExtractedSource> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Файл больше 20 МБ");
  const name = file.name.toLowerCase();
  const mime = file.type || "";

  if (name.endsWith(".docx")) {
    const text = await docxToMarkdown(file);
    if (!text) throw new Error("В документе Word не найден текст");
    return { text, fileName: file.name, kind: "docx" };
  }
  if (name.endsWith(".doc")) {
    throw new Error("Старый формат .doc не поддерживается — сохраните файл как .docx или PDF");
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".rtf") || mime.startsWith("text/")) {
    const text = (await file.text()).trim();
    if (!text) throw new Error("Файл пустой");
    return { text, fileName: file.name, kind: "text" };
  }
  const isPdf = name.endsWith(".pdf") || mime === "application/pdf";
  if (isPdf || mime.startsWith("image/")) {
    const kind: "pdf" | "image" = isPdf ? "pdf" : "image";
    const uploaded = await uploadForParsing(file);
    if (uploaded) {
      return { storageBucket: uploaded.bucket, storagePath: uploaded.path, fileName: file.name, kind };
    }
    // Хранилище недоступно — отправляем файл в теле запроса (как раньше).
    return { fileData: await readAsDataUrl(file), fileName: file.name, kind };
  }
  throw new Error("Поддерживаются Word (.docx), PDF, изображения и текстовые файлы");
}

/** Распознавание протокола: текст и/или файл → структурированные поля. */
export async function parseProtocolDocument(source: {
  text?: string;
  fileData?: string;
  storageBucket?: string;
  storagePath?: string;
  fileName?: string;
}): Promise<ParsedProtocol> {
  // functions.invoke иногда успевает взять anon-key во время восстановления
  // сохранённой сессии после открытия вкладки. Для защищённого медицинского
  // парсера всегда передаём явно проверенный пользовательский access token.
  let { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;
  const expiresSoon = !session?.expires_at || session.expires_at * 1000 < Date.now() + 60_000;
  if (expiresSoon) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw new Error("Сессия истекла. Войдите в систему ещё раз.");
    session = refreshed.session;
  }
  if (!session?.access_token) {
    throw new Error("Нет активной сессии. Войдите в систему ещё раз.");
  }

  let lastErr: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke("parse-visit-protocol", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          text: source.text || "",
          file_data: source.fileData || "",
          storage_bucket: source.storageBucket || "",
          storage_path: source.storagePath || "",
          file_name: source.fileName || "protocol",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as ParsedProtocol;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      // Повторяем сетевые сбои и шлюзовые ошибки прокси, не ошибки разбора.
      if (!/failed to (send|fetch)|network|abort|timeout|502|504|non-2xx/i.test(msg)) break;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  const msg = String(lastErr?.message || lastErr || "Не удалось распознать документ");
  throw new Error(
    /failed to (send|fetch)|network|abort/i.test(msg)
      ? "Не удалось отправить документ на сервер (сеть). Попробуйте ещё раз."
      : msg,
  );
}



/** Человеческие названия полей для экрана проверки. */
export const FIELD_LABELS: Record<string, string> = {
  complaints: "Жалобы",
  anamnesis: "Анамнез",
  dynamics: "Динамика",
  consultation_notes: "Заметки консультации",
  somatic: "Соматический статус",
  sexual_formula: "Половая формула",
  sexual_formula_text: "Половая формула (текст)",
  local_status: "Локальный статус",
  ortho_status: "Ортопедический статус",
  neuro_status: "Неврологический статус",
  psych_status: "Психический статус",
  working_diagnosis: "Рабочий диагноз",
  diagnosis: "Диагноз",
  conclusion: "Заключение",
  exam_plan: "План обследования",
  recommendations: "Рекомендации",
  cbc: "Общий анализ крови",
  urinalysis: "Общий анализ мочи",
  biochem: "Биохимия",
  hormones: "Гормоны",
  other_labs: "Другие анализы",
  lab_results: "Результаты анализов",
  indications: "Показания",
  device: "Аппарат",
  uzi: "УЗИ (репродуктивная система)",
  uzi_urinary: "УЗИ (мочевыделительная система)",
  uzi_express: "УЗИ-экспресс",
  bladder_volume: "Объём мочевого пузыря",
  bladder_walls: "Стенки мочевого пузыря",
  bladder_contents: "Содержимое мочевого пузыря",
  residual_urine: "Остаточная моча",
  residual_urine_percent: "Остаточная моча, %",
  micturition_urge: "Позыв на микцию",
  operation_name: "Название операции",
  operation_date: "Дата операции",
  general_status: "Общее состояние",
  wound_status: "Состояние раны",
  dressing: "Перевязка",
  pain: "Болевой синдром",
  temperature: "Температура",
  healing: "Заживление",
  sutures_removed: "Швы сняты",
  reason: "Повод обращения",
  current_state: "Текущее состояние",
  external_genitalia: "Наружные половые органы",
  interpretation: "Интерпретация",
};

export const fieldLabel = (key: string) => FIELD_LABELS[key] || key;

/** Плоский список «поле → текст» для предпросмотра (вложенные объекты разворачиваются). */
export interface FlatField {
  path: string;
  label: string;
  value: string;
}

export function flattenProtocolData(data: Record<string, any>, prefix = ""): FlatField[] {
  const out: FlatField[] = [];
  for (const [key, value] of Object.entries(data || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      out.push(...flattenProtocolData(value, path));
    } else {
      out.push({
        path,
        label: prefix
          ? `${fieldLabel(prefix.split(".")[0])} → ${fieldLabel(key)}`
          : fieldLabel(key),
        value: Array.isArray(value) ? value.join(", ") : String(value),
      });
    }
  }
  return out;
}

/** Запись значения по пути "a.b.c" (мутирует копию). */
export function setByPath(obj: Record<string, any>, path: string, value: string) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

export function deleteByPath(obj: Record<string, any>, path: string) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) return;
    cur = cur[parts[i]];
  }
  delete cur[parts[parts.length - 1]];
}
