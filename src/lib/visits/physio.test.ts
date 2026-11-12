import { describe, it, expect } from "vitest";
import { physioSessionNumbers, filledPhysioRows, PHYSIO_PROCEDURES, physioCopyDate } from "./physio";

describe("дата копии физиопротокола", () => {
  it("по умолчанию использует день заполнения", () => {
    expect(physioCopyDate(undefined, new Date(2026, 10, 12, 14, 27))).toBe("2026-11-12");
  });
  it.each(["2026-10-01", "2026-11-12", "2026-12-25"])("сохраняет произвольную выбранную дату %s", (selected) => {
    expect(physioCopyDate(new Date(selected + "T00:00:00"), new Date(2026, 10, 12))).toBe(selected);
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
