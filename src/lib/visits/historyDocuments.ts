import { flattenProtocolData, type ParsedProtocol } from "./protocolImport";

export interface HistoryDocument { name: string; text: string }

export function historyDocumentText(name: string, parsed: ParsedProtocol): string {
  const fields = flattenProtocolData(parsed.protocol_data || {})
    .filter((field) => !/^(_|next_visit|day_number)/.test(field.path))
    .map((field) => `${field.label}: ${field.value}`);
  const lines = [parsed.diagnosis && `Диагноз: ${parsed.diagnosis}${parsed.icd_code ? ` (${parsed.icd_code})` : ""}`, ...fields, parsed.unmapped?.trim()].filter(Boolean);
  return lines.length ? `Из документа «${name}»${parsed.visit_date ? ` от ${parsed.visit_date}` : ""}:\n${lines.join("\n")}` : "";
}

export function appendHistoryDocuments(anamnesis: string, documents: HistoryDocument[]): string {
  return [anamnesis.trim(), ...documents.map((document) => document.text.trim()).filter(Boolean)].filter(Boolean).join("\n\n");
}

export function sameHistoryPatient(expected: string, actual?: string): boolean {
  const normalize = (name: string) => name.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
  return Boolean(actual?.trim()) && normalize(expected) === normalize(actual || "");
}
