// Live-каталог моделей Venice через защищённую edge-функцию list-venice-models.
// Кешируем в sessionStorage на 30 минут. Все IDs префиксуем `venice/`,
// чтобы по всему фронту единообразно отличать gateway.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LiveModelInfo } from "@/config/aiModels";

const SS_KEY = "venice.models.v1";
const SS_TTL_MS = 30 * 60 * 1000;

type CachePayload = { ts: number; list: LiveModelInfo[] };

let inFlight: Promise<LiveModelInfo[]> | null = null;

async function fetchVeniceModels(): Promise<LiveModelInfo[]> {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(SS_KEY);
      if (raw) {
        const parsed: CachePayload = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.list) && Date.now() - parsed.ts < SS_TTL_MS) {
          return parsed.list;
        }
      }
    } catch { /* ignore */ }
  }
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const { data, error } = await supabase.functions.invoke("list-venice-models", { body: {} });
    if (error) throw new Error(error.message);
    const raw: any[] = Array.isArray(data?.data) ? data.data : [];
    const list: LiveModelInfo[] = raw
      .filter((m) => m && typeof m.id === "string")
      .map((m) => {
        const spec = m.model_spec ?? {};
        const cap = spec.capabilities ?? {};
        const inputModalities: string[] = ["text"];
        if (cap.supportsVision) inputModalities.push("image");
        const ctx = typeof m.context_length === "number"
          ? m.context_length
          : typeof spec.availableContextTokens === "number" ? spec.availableContextTokens : undefined;
        const pricing = spec.pricing
          ? {
              prompt: spec.pricing.input?.usd != null ? String(spec.pricing.input.usd / 1_000_000) : undefined,
              completion: spec.pricing.output?.usd != null ? String(spec.pricing.output.usd / 1_000_000) : undefined,
            }
          : m.pricing;
        return {
          id: `venice/${m.id}`,
          name: spec.name || m.id,
          context_length: ctx,
          pricing,
          description: spec.description,
          architecture: {
            input_modalities: inputModalities,
            output_modalities: ["text"],
            modality: inputModalities.join("+") + "->text",
          },
        };
      });
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(SS_KEY, JSON.stringify({ ts: Date.now(), list } satisfies CachePayload));
      } catch { /* quota */ }
    }
    return list;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export type VeniceModelsState = {
  list: LiveModelInfo[];
  byId: Map<string, LiveModelInfo>;
  loading: boolean;
  error: string | null;
};

export function useVeniceModels(): VeniceModelsState {
  const [list, setList] = useState<LiveModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchVeniceModels()
      .then((l) => { if (!cancelled) { setList(l); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e?.message || "fetch failed"); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const byId = new Map<string, LiveModelInfo>();
  for (const m of list) byId.set(m.id, m);
  return { list, byId, loading, error };
}
