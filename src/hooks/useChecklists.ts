import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { allChecklists } from "@/data/checklists";
import { ChecklistDefinition } from "@/data/checklists/types";

export interface ChecklistRow {
  id: string;
  slug: string;
  title: string;
  short_title: string;
  description: string;
  icon: string;
  intro: string;
  questions: any;
  results: any;
  is_active: boolean;
  sort_order: number;
}

export function rowToDefinition(r: ChecklistRow): ChecklistDefinition {
  return {
    slug: r.slug,
    title: r.title,
    shortTitle: r.short_title || r.title,
    description: r.description,
    icon: r.icon,
    intro: r.intro,
    consentLabel: "",
    questions: Array.isArray(r.questions) ? r.questions : [],
    results: Array.isArray(r.results) ? r.results : [],
  };
}

/** Активные опросники из конструктора; при ошибке или пустой базе — встроенные. */
export function usePublicChecklists() {
  return useQuery({
    queryKey: ["public-checklists"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ChecklistDefinition[]> => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error || !data || data.length === 0) return allChecklists;
      return (data as unknown as ChecklistRow[]).map(rowToDefinition);
    },
  });
}
