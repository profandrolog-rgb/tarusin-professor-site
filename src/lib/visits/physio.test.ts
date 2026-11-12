import { describe, it, expect } from "vitest";
import { physioSessionNumbers, filledPhysioRows, PHYSIO_PROCEDURES } from "./physio";

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
