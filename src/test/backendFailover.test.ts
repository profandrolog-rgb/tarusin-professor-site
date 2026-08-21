import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const A2 = "https://api2.tarusin.pro";
const A3 = "https://api3.tarusin.pro";

/**
 * Перехват fetch тестируем на «живом» модуле с подменёнными env,
 * поэтому импорт динамический и модульный кэш сбрасывается перед каждым тестом.
 */
async function installWithEnv() {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_PROXY_URL", A2);
  vi.stubEnv("VITE_SUPABASE_URL", A2);
  vi.stubEnv("VITE_BACKEND_ALT_URL", A3);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "anon-key");
  delete (window as any).__backendFailoverInstalled;
  const mod = await import("@/lib/backendFailover");
  const rm = await import("@/lib/backendRouteManager");
  mod.installBackendFailover();
  return rm.routeManager;
}

let original: typeof window.fetch;

beforeEach(() => {
  original = window.fetch;
});

afterEach(() => {
  window.fetch = original;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

function res(status: number, body = "{}") {
  return new Response(body, { status, headers: { "content-type": "application/json" } });
}

describe("backend failover fetch", () => {
  it("один повтор GET при сетевой ошибке и переключение на запасной маршрут", async () => {
    const calls: string[] = [];
    window.fetch = vi.fn(async (input: any) => {
      const url = typeof input === "string" ? input : input.url;
      calls.push(url);
      if (url.startsWith(A2)) throw new TypeError("Failed to fetch");
      return res(200, "[]");
    }) as any;

    const rm = await installWithEnv();
    const r = await window.fetch(`${A2}/rest/v1/videos`);
    expect(r.status).toBe(200);
    expect(calls).toEqual([`${A2}/rest/v1/videos`, `${A3}/rest/v1/videos`]);
    expect(rm.getActive()).toBe(A3);
  });

  it("один повтор GET при 502 (и не больше)", async () => {
    const calls: string[] = [];
    window.fetch = vi.fn(async (input: any) => {
      const url = typeof input === "string" ? input : input.url;
      calls.push(url);
      return res(502);
    }) as any;

    await installWithEnv();
    const r = await window.fetch(`${A2}/rest/v1/videos`);
    expect(r.status).toBe(502);
    expect(calls).toHaveLength(2);
  });

  it("НЕ повторяет запись (POST) на другом маршруте", async () => {
    const calls: string[] = [];
    window.fetch = vi.fn(async (input: any) => {
      const url = typeof input === "string" ? input : input.url;
      calls.push(url);
      throw new TypeError("Failed to fetch");
    }) as any;

    await installWithEnv();
    await expect(
      window.fetch(`${A2}/rest/v1/patient_visits`, { method: "POST", body: "{}" }),
    ).rejects.toThrow();
    expect(calls).toEqual([`${A2}/rest/v1/patient_visits`]);
  });

  it("401 не считается отказом маршрута и не вызывает повтор", async () => {
    const calls: string[] = [];
    window.fetch = vi.fn(async (input: any) => {
      const url = typeof input === "string" ? input : input.url;
      calls.push(url);
      return res(401, '{"message":"unauthorized"}');
    }) as any;

    const rm = await installWithEnv();
    const r = await window.fetch(`${A2}/rest/v1/videos`);
    expect(r.status).toBe(401);
    expect(calls).toHaveLength(1);
    expect(rm.getActive()).toBe(A2);
  });

  it("переписывает прямой *.supabase.co на активный маршрут", async () => {
    const calls: string[] = [];
    window.fetch = vi.fn(async (input: any) => {
      calls.push(typeof input === "string" ? input : input.url);
      return res(200, "[]");
    }) as any;

    vi.stubEnv("VITE_SUPABASE_PROJECT_ID", "bpbwkizvvythqotcyfii");
    await installWithEnv();
    await window.fetch("https://bpbwkizvvythqotcyfii.supabase.co/rest/v1/videos");
    expect(calls[0]).toBe(`${A2}/rest/v1/videos`);
  });
});
