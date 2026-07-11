import { s as supabase } from "../main.mjs";
const REGISTER_LABEL = {
  simple: "Просто (для родителя)",
  pro: "Профессионально"
};
async function fetchPathwayTexts() {
  const { data } = await supabase.from("pathway_texts").select("pathway_id, register, summary, what_broken, evidence, risks, connections, actions");
  return data || [];
}
function pickText(texts, pathwayId, register) {
  return texts.find((t) => t.pathway_id === pathwayId && t.register === register) || null;
}
async function fetchPathwaySeverityTexts() {
  const { data } = await supabase.from("pathway_severity_texts").select("pathway_id, severity, text_pro, text_plain");
  return data || [];
}
function pickSeverityText(rows, pathwayId, severity, register) {
  if (severity !== "mild" && severity !== "moderate" && severity !== "severe") return null;
  const row = rows.find((r) => r.pathway_id === pathwayId && r.severity === severity);
  if (!row) return null;
  const t = register === "pro" ? row.text_pro : row.text_plain;
  return t && t.trim() ? t : null;
}
export {
  REGISTER_LABEL as R,
  fetchPathwaySeverityTexts as a,
  pickText as b,
  fetchPathwayTexts as f,
  pickSeverityText as p
};
