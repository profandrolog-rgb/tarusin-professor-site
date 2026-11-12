import { describe, it, expect } from "vitest";
import { physioSessionNumbers, filledPhysioRows, PHYSIO_PROCEDURES, nextPhysioDate } from "./physio";

describe("дата повторного физиопротокола", () => {
  it.each([
    ["2026-11-12", "2026-11-13"],
    ["2026-11-30", "2026-12-01"],
    ["2026-12-31", "2027-01-01"],
    ["2028-02-28", "2028-02-29"],
    ["2028-02-29", "2028-03-01"],
  ])("следующий календарный день после %s — %s", (source, expected) => {
    expect(nextPhysioDate(source)).toBe(expected);
  });
});

describe("протокол физиолечения", () => {
  it("на каждый сеанс — отдельный лист", () => {
    expect(physioSessionNumbers(10)).toHaveLength(10);
  });
  it("можно напечатать один выбранный сеанс", () => {
    expect(physioSessionNumbers(10, 3)).toEqual([3]);
  });
  it("в перечне 8 процедур", () => {
    expect(PHYSIO_PROCEDURES).toHaveLength(8);
  });
  it("пустые строки процедур не печатаются", () => {
    expect(filledPhysioRows([{ name: "А" }, { name: " " }])).toHaveLength(1);
  });
});

import { physioFromAssignments as pfa } from "./physio";
describe("physioFromAssignments", () => {
  it("переносит физиопроцедуры с числом и кратностью", () => {
    const r = pfa(["Тамсулозин 0,4 мг", "Магнитотерапия передней брюшной стенки — 12 процедур, 3 раза в неделю"]);
    expect(r?.procedures?.map((p) => p.name)).toEqual(["Магнитотерапия передней брюшной стенки"]);
    expect(r?.sessions_total).toBe(12);
    expect(r?.per_week).toBe(3);
  });
  it("без физиопроцедур — null", () => {
    expect(pfa(["Тамсулозин"])).toBeNull();
  });
});
