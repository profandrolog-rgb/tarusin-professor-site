import { describe, it, expect, vi } from "vitest";
import { createRouteManager, type ProbeResult } from "@/lib/backendRouteManager";

const A2 = "https://api2.tarusin.pro";
const A3 = "https://api3.tarusin.pro";

function memorySession() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

function make(probe: (base: string) => Promise<ProbeResult>, nowRef = { t: 0 }) {
  return createRouteManager({
    bases: [A2, A3],
    primary: A2,
    probe,
    now: () => nowRef.t,
    session: memorySession(),
  });
}

describe("route manager", () => {
  it("api2 — безопасный default", () => {
    const m = make(async () => ({ ok: true, ms: 10 }));
    expect(m.getActive()).toBe(A2);
    expect(m.getAlternatives()).toEqual([A3]);
  });

  it("измеряет маршруты параллельно", async () => {
    let concurrent = 0;
    let peak = 0;
    const m = make(async () => {
      concurrent += 1;
      peak = Math.max(peak, concurrent);
      await new Promise((r) => setTimeout(r, 5));
      concurrent -= 1;
      return { ok: true, ms: 10 };
    });
    await m.maybeProbe();
    expect(peak).toBe(2);
  });

  it("не запускает цикл чаще одного раза в 5 минут", async () => {
    const nowRef = { t: 0 };
    const probe = vi.fn(async () => ({ ok: true, ms: 10 }));
    const m = make(probe, nowRef);
    await m.maybeProbe();
    nowRef.t = 60_000;
    await m.maybeProbe();
    expect(probe).toHaveBeenCalledTimes(2); // по одному вызову на маршрут
    nowRef.t = 5 * 60_000 + 1;
    await m.maybeProbe();
    expect(probe).toHaveBeenCalledTimes(4);
  });

  it("гистерезис: одно подтверждение не переключает, второе — переключает", async () => {
    const nowRef = { t: 0 };
    const m = make(async (base) => ({ ok: true, ms: base === A3 ? 20 : 400 }), nowRef);
    await m.maybeProbe();
    expect(m.getActive()).toBe(A2);
    nowRef.t += 5 * 60_000 + 1;
    await m.maybeProbe();
    expect(m.getActive()).toBe(A3);
  });

  it("не дёргает маршрут при близких задержках", async () => {
    const nowRef = { t: 0 };
    const m = make(async (base) => ({ ok: true, ms: base === A3 ? 95 : 100 }), nowRef);
    for (let i = 0; i < 5; i += 1) {
      await m.maybeProbe();
      nowRef.t += 5 * 60_000 + 1;
    }
    expect(m.getActive()).toBe(A2);
  });

  it("явный сетевой отказ активного маршрута переключает сразу", () => {
    const m = make(async () => ({ ok: true, ms: 10 }));
    m.reportFailure(A2);
    expect(m.getActive()).toBe(A3);
  });

  it("успешный запрос через запасной маршрут делает его активным", () => {
    const m = make(async () => ({ ok: true, ms: 10 }));
    m.reportSuccess(A3);
    expect(m.getActive()).toBe(A3);
  });

  it("недоступный маршрут получает бесконечную оценку", async () => {
    const m = make(async (base) => (base === A3 ? { ok: false, ms: Infinity } : { ok: true, ms: 50 }));
    await m.maybeProbe();
    expect(m.score(A3)).toBe(Infinity);
    expect(m.getActive()).toBe(A2);
  });
});
