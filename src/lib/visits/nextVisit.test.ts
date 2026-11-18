import { describe, expect, it } from "vitest";
import { formatNextVisitDate, nextVisitMissing } from "./nextVisit";

describe("Нет повторного визита", () => {
  it("отменяет обязательность даты и времени", () => {
    expect(nextVisitMissing(null, { next_visit_none: true })).toEqual([]);
  });
  it("не печатает устаревшую дату и интервал", () => {
    expect(formatNextVisitDate("2026-11-20", { next_visit_none: true, next_visit_date_to: "2026-11-25" }))
      .toBe("Повторный визит не назначен");
  });
  it("при выключении возвращает обязательные поля", () => {
    expect(nextVisitMissing(null, { next_visit_none: false }))
      .toEqual(["дата контрольного осмотра", "рекомендованное время приёма"]);
  });
  it("сохраняет требования к концу интервала", () => {
    expect(nextVisitMissing("2026-11-20", { next_visit_range: true, next_visit_duration: "20 минут" }))
      .toEqual(["конец интервала дат"]);
  });
  it("сохраняет действующий заполненный повторный приём", () => {
    expect(nextVisitMissing("2026-11-20", { next_visit_duration: "20 минут" })).toEqual([]);
  });
});
