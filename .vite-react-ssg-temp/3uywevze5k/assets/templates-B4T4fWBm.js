import { useQuery } from "@tanstack/react-query";
import { s as supabase } from "../main.mjs";
function useVisitTextTemplates(_protocolType) {
  return useQuery({
    queryKey: ["visit_text_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("visit_text_templates").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1e3
  });
}
function protocolToDayRange(type) {
  if (type === "postop_day3") return "3";
  if (type === "postop_day7") return "7";
  if (type === "postop_day10") return "10";
  return "any";
}
function dayRangeMatches(templateRange, currentDay) {
  if (templateRange === "any" || currentDay === "any") return true;
  if (templateRange === currentDay) return true;
  if (templateRange.includes("-")) {
    const parts = templateRange.split("-").map((s) => s.trim());
    return parts.includes(currentDay);
  }
  return false;
}
function operationMatches(keywords, operationName) {
  if (!keywords || keywords.length === 0) return false;
  if (!operationName) return false;
  const lower = operationName.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}
function rankTemplates(templates, protocolType, fieldKey, operationName) {
  const day = protocolToDayRange(protocolType);
  const scored = templates.filter((t) => t.field_key === fieldKey).filter((t) => !t.protocol_type || t.protocol_type === protocolType).filter((t) => dayRangeMatches(t.day_range, day)).map((t) => {
    let score = 0;
    const opOk = operationMatches(t.operation_keywords, operationName);
    const hasOp = !!(t.operation_keywords && t.operation_keywords.length);
    if (hasOp && opOk) score += 1e3;
    else if (hasOp && !opOk) return null;
    if (t.protocol_type === protocolType) score += 100;
    if (t.day_range !== "any") score += 10;
    score -= t.sort_order * 1e-3;
    return { t, score };
  }).filter(Boolean);
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.t);
}
function resolveTemplate(templates, protocolType, fieldKey, operationName) {
  const ranked = rankTemplates(templates, protocolType, fieldKey, operationName);
  return ranked[0] || null;
}
function getFieldKeyMap(protocolType) {
  switch (protocolType) {
    case "ultrashort":
      return {
        complaints: "complaints",
        conclusion: "conclusion",
        recommendations: "recommendations"
      };
    case "postop_day3":
    case "postop_day7":
    case "postop_day10":
      return {
        general_status: "general_status",
        wound_status: "wound_status",
        complaints: "complaints",
        recommendations: "recommendations"
      };
    case "primary_short":
      return {
        complaints: "complaints",
        recommendations: "recommendations"
      };
    case "repeat_with_labs":
    case "dynamic_with_uzi":
    case "repeat_with_uzi":
      return {
        complaints: "complaints",
        conclusion: "conclusion",
        recommendations: "recommendations"
      };
    case "uzi_reproductive":
    case "uzi_urinary":
      return { recommendations: "recommendations" };
    default:
      return { recommendations: "recommendations" };
  }
}
function detectOperationMatch(templates, protocolType, operationName) {
  if (!operationName) return { matched: false, label: null, templates: [] };
  const day = protocolToDayRange(protocolType);
  const matches = templates.filter(
    (t) => t.operation_keywords && t.operation_keywords.length > 0 && operationMatches(t.operation_keywords, operationName) && (!t.protocol_type || t.protocol_type === protocolType) && dayRangeMatches(t.day_range, day)
  );
  if (matches.length === 0) return { matched: false, label: null, templates: [] };
  const firstKw = matches[0].operation_keywords[0];
  return { matched: true, label: firstKw, templates: matches };
}
export {
  rankTemplates as a,
  detectOperationMatch as d,
  getFieldKeyMap as g,
  resolveTemplate as r,
  useVisitTextTemplates as u
};
