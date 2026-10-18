import { describe, it, expect } from "vitest";
import { calcDiary, isAutoNight } from "./voidingDiary";

describe("дневник ритма микций", () => {
  it("ночь по умолчанию 22:00–06:00", () => {
    expect(isAutoNight("22:00")).toBe(true);
    expect(isAutoNight("05:59")).toBe(true);
    expect(isAutoNight("06:00")).toBe(false);
    expect(isAutoNight("21:59")).toBe(false);
  });

  it("галочка ночной порции перекрывает время", () => {
    const s = calcDiary({ days: [[{ time: "12:00", voided: "100", night: true }, { time: "23:00", voided: "50", night: false }]] });
    expect(s.nightVolume).toBe(100);
    expect(s.dayVolume).toBe(50);
  });

  it("считает микции, интервалы, порции и диурез", () => {
    const s = calcDiary({
      days: [
        [
          { time: "07:00", drank: "200", voided: "100" },
          { time: "09:00", voided: "150" },
          { time: "10:00", drank: "300" },
          { time: "13:00", voided: "200" },
        ],
        [{ time: "08:00", voided: "300", drank: "100" }],
      ],
    });
    expect(s.voidsPerDay).toEqual([3, 1, 0]);
    expect(s.voidMin).toBe(120);
    expect(s.voidMax).toBe(240);
    expect(s.drinkMin).toBe(180);
    expect(s.drinkMax).toBe(180);
    expect(s.avgPortionPerDay).toEqual([150, 300, null]);
    expect(s.avgPortion3).toBe(188);
    expect(s.drankTotal).toBe(600);
    expect(s.voidedTotal).toBe(750);
    expect(s.dailyDiuresis).toBe(375);
  });
});
