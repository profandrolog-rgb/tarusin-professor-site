import { supabase } from "@/integrations/supabase/client";

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
