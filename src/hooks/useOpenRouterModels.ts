// Fetches the live OpenRouter model catalog (no auth needed) once per session.
// Cached in sessionStorage so multiple cabinet mounts within the same tab
// don't refetch. Returns a map indexed by slug + the array form for search.
import { useEffect, useState } from "react";
import type { LiveModelInfo } from "@/config/aiModels";

const SS_KEY = "openrouter.models.v2";
const SS_TTL_MS = 30 * 60 * 1000; // 30 минут — модели меняются редко

type CachePayload = { ts: number; list: LiveModelInfo[] };

let inFlight: Promise<LiveModelInfo[]> | null = null;

async function fetchModels(): Promise<LiveModelInfo[]> {
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
    const r = await fetch("https://openrouter.ai/api/v1/models", { cache: "force-cache" });
    if (!r.ok) throw new Error(`OpenRouter models HTTP ${r.status}`);
    const j = await r.json();
    const data: any[] = Array.isArray(j?.data) ? j.data : [];
    const list: LiveModelInfo[] = data
      .filter((m) => m && typeof m.id === "string")
      .map((m) => ({
        id: m.id,
        name: m.name,
        context_length: typeof m.context_length === "number" ? m.context_length : undefined,
        pricing: m.pricing,
        description: m.description,
        architecture: m.architecture,
      }));
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(SS_KEY, JSON.stringify({ ts: Date.now(), list } satisfies CachePayload));
      } catch { /* quota / privacy mode */ }
    }
    return list;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export type OpenRouterModelsState = {
  list: LiveModelInfo[];
  byId: Map<string, LiveModelInfo>;
  loading: boolean;
  error: string | null;
};

export function useOpenRouterModels(): OpenRouterModelsState {
  const [list, setList] = useState<LiveModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchModels()
      .then((l) => { if (!cancelled) { setList(l); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e?.message || "fetch failed"); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const byId = new Map<string, LiveModelInfo>();
  for (const m of list) byId.set(m.id, m);
  return { list, byId, loading, error };
}
