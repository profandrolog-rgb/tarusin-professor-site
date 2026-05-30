import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProtocolType } from "./protocolTypes";

export interface VisitTextTemplate {
  id: string;
  protocol_type: string | null;
  operation_keywords: string[] | null;
  day_range: string;
  field_key: string;
  template_text: string;
  label: string;
  sort_order: number;
}

export function useVisitTextTemplates(_protocolType?: string | null) {
  // Запрос одинаков для всех protocolType (фильтрация делается на клиенте
  // в rankTemplates), поэтому единый ключ кэша — без дублей.
  return useQuery({
    queryKey: ["visit_text_templates"],
    queryFn: async (): Promise<VisitTextTemplate[]> => {
      const { data, error } = await supabase
        .from("visit_text_templates" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function protocolToDayRange(type: ProtocolType | string): string {
  if (type === "postop_day3") return "3";
  if (type === "postop_day7") return "7";
  if (type === "postop_day10") return "10";
  return "any";
}

function dayRangeMatches(templateRange: string, currentDay: string): boolean {
  if (templateRange === "any" || currentDay === "any") return true;
  if (templateRange === currentDay) return true;
  // ranges like "7-10" / "5-7"
  if (templateRange.includes("-")) {
    const parts = templateRange.split("-").map((s) => s.trim());
    return parts.includes(currentDay);
  }
  return false;
}

function operationMatches(keywords: string[] | null, operationName?: string | null): boolean {
  if (!keywords || keywords.length === 0) return false;
  if (!operationName) return false;
  const lower = operationName.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

/**
 * Returns templates relevant to (protocolType, fieldKey) sorted by priority (best first).
 * Priority: operation+day > operation+any > protocol_type+day > protocol_type+any > null+day > null+any
 */
export function rankTemplates(
  templates: VisitTextTemplate[],
  protocolType: ProtocolType | string,
  fieldKey: string,
  operationName?: string | null,
): VisitTextTemplate[] {
  const day = protocolToDayRange(protocolType);
  const scored = templates
    .filter((t) => t.field_key === fieldKey)
    .filter((t) => !t.protocol_type || t.protocol_type === protocolType)
    .filter((t) => dayRangeMatches(t.day_range, day))
    .map((t) => {
      let score = 0;
      const opOk = operationMatches(t.operation_keywords, operationName);
      const hasOp = !!(t.operation_keywords && t.operation_keywords.length);
      if (hasOp && opOk) score += 1000;
      else if (hasOp && !opOk) return null; // op-specific template that doesn't match -> skip
      if (t.protocol_type === protocolType) score += 100;
      if (t.day_range !== "any") score += 10;
      score -= t.sort_order * 0.001;
      return { t, score };
    })
    .filter(Boolean) as { t: VisitTextTemplate; score: number }[];
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.t);
}

export function resolveTemplate(
  templates: VisitTextTemplate[],
  protocolType: ProtocolType | string,
  fieldKey: string,
  operationName?: string | null,
): VisitTextTemplate | null {
  const ranked = rankTemplates(templates, protocolType, fieldKey, operationName);
  return ranked[0] || null;
}

/**
 * For a given protocol type, returns the mapping field_key -> form field name (top-level).
 * Used by SmartFieldLabel and "fill all" button.
 */
export function getFieldKeyMap(protocolType: ProtocolType | string): Record<string, string> {
  // Базовый минимум: каждый протокол поддерживает recommendations + complaints,
  // если они есть в схеме формы. Маппинг ниже строго соответствует полям
  // соответствующего <ProtocolType>Form. Поля без рендеринга в формах
  // (sport_limit, neuro_status, psych_status, uzi_express) сюда не включаются.
  switch (protocolType) {
    case "ultrashort":
      return {
        complaints: "complaints",
        conclusion: "conclusion",
        recommendations: "recommendations",
      };
    case "postop_day3":
    case "postop_day7":
    case "postop_day10":
      return {
        general_status: "general_status",
        wound_status: "wound_status",
        complaints: "complaints",
        recommendations: "recommendations",
      };
    case "primary_short":
      return {
        complaints: "complaints",
        recommendations: "recommendations",
      };
    case "repeat_with_labs":
    case "dynamic_with_uzi":
    case "repeat_with_uzi":
      return {
        complaints: "complaints",
        conclusion: "conclusion",
        recommendations: "recommendations",
      };
    case "uzi_reproductive":
    case "uzi_urinary":
      return { recommendations: "recommendations" };
    default:
      return { recommendations: "recommendations" };
  }
}

/**
 * Detects whether the operation_name in current data matches any op-specific template
 * for this protocol type.
 */
export function detectOperationMatch(
  templates: VisitTextTemplate[],
  protocolType: ProtocolType | string,
  operationName?: string | null,
): { matched: boolean; label: string | null; templates: VisitTextTemplate[] } {
  if (!operationName) return { matched: false, label: null, templates: [] };
  const day = protocolToDayRange(protocolType);
  const matches = templates.filter(
    (t) =>
      t.operation_keywords &&
      t.operation_keywords.length > 0 &&
      operationMatches(t.operation_keywords, operationName) &&
      (!t.protocol_type || t.protocol_type === protocolType) &&
      dayRangeMatches(t.day_range, day),
  );
  if (matches.length === 0) return { matched: false, label: null, templates: [] };
  // Derive a friendly label from the first matched keyword
  const firstKw = matches[0].operation_keywords![0];
  return { matched: true, label: firstKw, templates: matches };
}
