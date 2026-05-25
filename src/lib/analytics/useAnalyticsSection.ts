import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsFilters {
  from: string | null; // YYYY-MM-DD
  to: string | null;
  status: "issued" | "all";
  doctor: string; // uuid or 'all'
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashFilters(f: AnalyticsFilters): string {
  const raw = JSON.stringify([f.from, f.to, f.status, f.doctor]);
  // Lightweight stable hash (djb2)
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const RPC_MAP = {
  top_catalog: "analytics_top_catalog",
  top_templates: "analytics_top_templates",
  cost_by_tag: "analytics_avg_cost_by_tag",
  plans_per_month: "analytics_plans_per_month",
  duration_histogram: "analytics_duration_histogram",
  section_usage: "analytics_section_usage",
} as const;

export type AnalyticsSection = keyof typeof RPC_MAP;

export function useAnalyticsSection<T = any>(section: AnalyticsSection, filters: AnalyticsFilters) {
  const cacheKey = `${section}:${hashFilters(filters)}`;

  return useQuery({
    queryKey: ["analytics", section, filters],
    queryFn: async (): Promise<T> => {
      // Try cache
      const { data: cached } = await supabase
        .from("analytics_cache")
        .select("payload, computed_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      if (cached && Date.now() - new Date(cached.computed_at).getTime() < CACHE_TTL_MS) {
        return cached.payload as T;
      }

      // Recompute via RPC
      const rpcName = RPC_MAP[section];
      const { data, error } = await supabase.rpc(rpcName as any, {
        _from: filters.from,
        _to: filters.to,
        _status: filters.status,
        _doctor: filters.doctor,
      });
      if (error) throw error;

      // Upsert cache
      await supabase.from("analytics_cache").upsert({
        cache_key: cacheKey,
        payload: data as any,
        computed_at: new Date().toISOString(),
      });

      return data as T;
    },
    staleTime: CACHE_TTL_MS,
  });
}

export function useDoctorsList() {
  return useQuery({
    queryKey: ["analytics-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("analytics_doctors_list" as any);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; email: string; plans_count: number }>;
    },
  });
}
