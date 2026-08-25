// Fetches the live OpenRouter model catalog (no auth needed) once per session.
// Cached in sessionStorage so multiple cabinet mounts within the same tab
// don't refetch. Returns a map indexed by slug + the array form for search.
import { useEffect, useState } from "react";
import type { LiveModelInfo } from "@/config/aiModels";
import { FALLBACK_BASES, PRIMARY_BASE } from "@/lib/backendEndpoints";
import { supabase } from "@/integrations/supabase/client";

const SS_KEY = "openrouter.models.v2";
const SS_TTL_MS = 30 * 60 * 1000; // 30 минут — модели меняются редко

type CachePayload = { ts: number; list: LiveModelInfo[] };

let inFlight: Promise<LiveModelInfo[]> | null = null;

const FUNCTION_PATH = "/functions/v1/list-openrouter-models";

function catalogUrls(): string[] {
  return Array.from(new Set([
    "https://openrouter.ai/api/v1/models",
    PRIMARY_BASE ? `${PRIMARY_BASE}${FUNCTION_PATH}` : null,
    ...FALLBACK_BASES.map((base) => `${base}${FUNCTION_PATH}`),
  ].filter((u): u is string => Boolean(u))));
}

async function fetchOne(url: string, timeoutMs: number, external?: AbortController, headers?: Record<string, string>): Promise<any> {
  const controller = external ?? new AbortController();
  const timer = window.setTimeout(() => controller.abort(new DOMException("timeout", "TimeoutError")), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal, headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!Array.isArray(j?.data) || !j.data.length) throw new Error("empty catalog");
    return j;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Гонка: прямой OpenRouter (быстро вне РФ) против прокси через edge function. */
function fetchCatalogRaced(proxyHeaders: Record<string, string>): Promise<any> {
  const urls = catalogUrls();
  const controllers = urls.map(() => new AbortController());
  return new Promise((resolve, reject) => {
    let failed = 0;
    let settled = false;
    urls.forEach((url, i) => {
      const isProxy = url.includes(FUNCTION_PATH);
      fetchOne(url, 10_000, controllers[i], isProxy ? proxyHeaders : undefined)

        .then((j) => {
          if (settled) return;
          settled = true;
          // Победитель отменяет остальных, чтобы не висели лишние запросы
          controllers.forEach((c, k) => {
            if (k !== i) { try { c.abort(new DOMException("superseded", "AbortError")); } catch { /* noop */ } }
          });
          resolve(j);
        })
        .catch(() => {
          failed += 1;
          if (!settled && failed === urls.length) {
            settled = true;
            reject(new Error("OpenRouter catalog unavailable"));
          }
        });
    });
  });
}


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
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    let token = anonKey;
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) token = data.session.access_token;
    } catch { /* ignore */ }
    const j = await fetchCatalogRaced({ apikey: anonKey, Authorization: `Bearer ${token}` });
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
