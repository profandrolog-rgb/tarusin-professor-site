import { supabase } from "@/integrations/supabase/client";
import type { Severity } from "@/lib/metabolic/aggregator";

export type Register = "simple" | "pro";
export const REGISTER_LABEL: Record<Register, string> = {
  simple: "Просто (для родителя)",
  pro: "Профессионально",
};

export interface PathwayText {
  pathway_id: string;
  register: Register;
  summary: string | null;
  what_broken: string | null;
  evidence: string | null;
  risks: string | null;
  connections: string | null;
  actions: string | null;
}

export async function fetchPathwayTexts(): Promise<PathwayText[]> {
  const { data } = await (supabase as any)
    .from("pathway_texts")
    .select("pathway_id, register, summary, what_broken, evidence, risks, connections, actions");
  return (data as PathwayText[]) || [];
}

export function pickText(
  texts: PathwayText[],
  pathwayId: string,
  register: Register
): PathwayText | null {
  return texts.find((t) => t.pathway_id === pathwayId && t.register === register) || null;
}

// ── pathway_severity_texts (тексты по тяжести пути) ──────────────────────────
// text_pro — «Профессионально», text_plain — «Просто».
// UI выбирает по (pathway_id, severity) и текущему регистру.

export interface PathwaySeverityText {
  pathway_id: string;
  severity: "mild" | "moderate" | "severe";
  text_pro: string | null;
  text_plain: string | null;
}

export async function fetchPathwaySeverityTexts(): Promise<PathwaySeverityText[]> {
  const { data } = await (supabase as any)
    .from("pathway_severity_texts")
    .select("pathway_id, severity, text_pro, text_plain");
  return (data as PathwaySeverityText[]) || [];
}

export function pickSeverityText(
  rows: PathwaySeverityText[],
  pathwayId: string,
  severity: Severity,
  register: Register,
): string | null {
  if (severity !== "mild" && severity !== "moderate" && severity !== "severe") return null;
  const row = rows.find((r) => r.pathway_id === pathwayId && r.severity === severity);
  if (!row) return null;
  const t = register === "pro" ? row.text_pro : row.text_plain;
  return t && t.trim() ? t : null;
}
