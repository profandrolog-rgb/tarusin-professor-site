// Централизованный менеджер маршрутов к ОДНОМУ И ТОМУ ЖЕ проекту Supabase.
//
// Задача: держать активным лучший прокси (по умолчанию — основной, api2),
// не возвращая старую проблемную схему:
//   • нет зондов при каждом переходе — цикл измерений не чаще 1 раза в 5 минут;
//   • короткий таймаут применяется ТОЛЬКО к диагностическому probe;
//   • маршруты измеряются ПАРАЛЛЕЛЬНО, никакого последовательного ожидания;
//   • переключение — только после двух подтверждений подряд (гистерезис)
//     либо при явном сетевом отказе активного маршрута.
//
// Ограничение Realtime/WebSocket: supabase-js фиксирует WS-адрес при создании
// клиента, и перехват window.fetch на него не влияет. Поэтому Realtime всегда
// продолжает работать через адрес из VITE_SUPABASE_PROXY_URL (api2). Смена
// маршрута касается REST/auth/storage/functions; для Realtime потребуется
// пересоздание клиента — сознательно вне этой задачи.

import { rawFetch } from "@/lib/rawFetch";
import { ALT_BASES, PRIMARY_BASE, ROUTE_BASES } from "./backendEndpoints";

export const PROBE_TIMEOUT_MS = 2500;
export const PROBE_INTERVAL_MS = 5 * 60 * 1000;
export const SWITCH_CONFIRMATIONS = 2;
/** Кандидат должен быть заметно лучше активного, иначе не дёргаем маршрут. */
export const HYSTERESIS_RATIO = 1.3;
/** Сглаживание задержки (EWMA): новое измерение весит 30%. */
export const LATENCY_ALPHA = 0.3;

const SESSION_KEY = "backend:activeRoute";

export interface ProbeResult {
  ok: boolean;
  ms: number;
}

export interface RouteStat {
  base: string;
  ok: boolean;
  /** Сглаженная задержка, мс. */
  latency: number | null;
}

export interface RouteManagerDeps {
  bases: string[];
  primary: string;
  probe: (base: string) => Promise<ProbeResult>;
  now?: () => number;
  session?: Pick<Storage, "getItem" | "setItem">;
}

export interface RouteManager {
  getActive(): string;
  getAlternatives(): string[];
  getStats(): RouteStat[];
  /** Оценка маршрута: меньше — лучше. Недоступный = Infinity. */
  score(base: string): number;
  /** Запустить цикл измерений (не чаще PROBE_INTERVAL_MS). */
  maybeProbe(): Promise<void>;
  /** Явный сетевой отказ активного маршрута — уходим на альтернативу сразу. */
  reportFailure(base: string): void;
  /** Успешный запрос через маршрут — делаем его активным для следующих. */
  reportSuccess(base: string): void;
}

export function createRouteManager(deps: RouteManagerDeps): RouteManager {
  const now = deps.now ?? (() => Date.now());
  const bases = deps.bases.filter(Boolean);
  const primary = deps.primary || bases[0] || "";

  const stats = new Map<string, RouteStat>(
    bases.map((base) => [base, { base, ok: true, latency: null }]),
  );

  let active = primary;
  try {
    const stored = deps.session?.getItem(SESSION_KEY);
    if (stored && bases.includes(stored)) active = stored;
  } catch {
    /* приватный режим — остаёмся на default */
  }

  let lastProbeAt: number | null = null;
  let inFlight: Promise<void> | null = null;
  let confirmFor: string | null = null;
  let confirmCount = 0;

  const persist = () => {
    try {
      deps.session?.setItem(SESSION_KEY, active);
    } catch {
      /* ignore */
    }
  };

  const setActive = (base: string) => {
    if (!bases.includes(base) || base === active) return;
    active = base;
    confirmFor = null;
    confirmCount = 0;
    persist();
  };

  const score = (base: string): number => {
    const s = stats.get(base);
    if (!s || !s.ok) return Number.POSITIVE_INFINITY;
    return s.latency ?? 0;
  };

  const bestAlternative = (): string | null => {
    const alts = bases.filter((b) => b !== active);
    if (!alts.length) return null;
    return alts.slice().sort((a, b) => score(a) - score(b))[0];
  };

  const applyProbe = (base: string, res: ProbeResult) => {
    const s = stats.get(base) ?? { base, ok: true, latency: null };
    s.ok = res.ok;
    if (res.ok) {
      s.latency = s.latency == null ? res.ms : s.latency * (1 - LATENCY_ALPHA) + res.ms * LATENCY_ALPHA;
    }
    stats.set(base, s);
  };

  const evaluate = () => {
    const candidate = bestAlternative();
    if (!candidate) return;
    const activeScore = score(active);
    const candidateScore = score(candidate);

    const better = candidateScore * HYSTERESIS_RATIO < activeScore;
    if (!better) {
      confirmFor = null;
      confirmCount = 0;
      return;
    }
    if (confirmFor === candidate) confirmCount += 1;
    else {
      confirmFor = candidate;
      confirmCount = 1;
    }
    if (confirmCount >= SWITCH_CONFIRMATIONS) setActive(candidate);
  };

  return {
    getActive: () => active,
    getAlternatives: () => bases.filter((b) => b !== active),
    getStats: () => bases.map((b) => ({ ...(stats.get(b) as RouteStat) })),
    score,
    reportFailure(base: string) {
      const s = stats.get(base);
      if (s) {
        s.ok = false;
        stats.set(base, s);
      }
      if (base !== active) return;
      const candidate = bestAlternative();
      if (candidate && score(candidate) !== Number.POSITIVE_INFINITY) setActive(candidate);
    },
    reportSuccess(base: string) {
      const s = stats.get(base);
      if (s) {
        s.ok = true;
        stats.set(base, s);
      }
      setActive(base);
    },
    maybeProbe() {
      if (bases.length < 2) return Promise.resolve();
      if (inFlight) return inFlight;
      const t = now();
      if (lastProbeAt !== null && t - lastProbeAt < PROBE_INTERVAL_MS) return Promise.resolve();
      lastProbeAt = t;
      inFlight = Promise.all(
        bases.map(async (base) => {
          try {
            applyProbe(base, await deps.probe(base));
          } catch {
            applyProbe(base, { ok: false, ms: Number.POSITIVE_INFINITY });
          }
        }),
      )
        .then(() => {
          evaluate();
        })
        .finally(() => {
          inFlight = null;
        });
      return inFlight;
    },
  };
}

/** Диагностический probe: короткий таймаут — только здесь, не в рабочих запросах. */
export async function probeHealth(base: string, apiKey: string): Promise<ProbeResult> {
  const started = Date.now();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const resp = await rawFetch(`${base}/auth/v1/health`, {
      headers: apiKey ? { apikey: apiKey } : undefined,
      signal: ctrl.signal,
      cache: "no-store",
    });
    return { ok: resp.ok, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Number.POSITIVE_INFINITY };
  } finally {
    clearTimeout(to);
  }
}

const ANON_KEY = (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";

/** Синглтон приложения. api2 (PRIMARY_BASE) — безопасный default. */
export const routeManager: RouteManager = createRouteManager({
  bases: ROUTE_BASES,
  primary: PRIMARY_BASE,
  probe: (base) => probeHealth(base, ANON_KEY),
  session: typeof sessionStorage !== "undefined" ? sessionStorage : undefined,
});

export const hasAlternativeRoutes = ALT_BASES.length > 0;
