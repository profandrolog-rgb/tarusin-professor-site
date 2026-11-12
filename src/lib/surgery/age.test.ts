import { describe, it, expect } from "vitest";
import { calcAgeText } from "./referral";
describe("calcAgeText", () => {
  it("years and months on visit date", () => expect(calcAgeText("2012-08-12", "2026-11-12")).toBe("14 лет 3 мес."));
  it("infant months", () => expect(calcAgeText("2026-03-01", "2026-11-12")).toBe("8 мес."));
  it("exact year", () => expect(calcAgeText("2022-11-12", "2026-11-12")).toBe("4 года"));
});
