import { describe, expect, it } from "vitest";
import { certificateValue, certificateDate, initialCertificate } from "./schoolCertificate";

describe("school certificate", () => {
  it("represents unfilled values with a dash", () => {
    expect(certificateValue("   ")).toBe("—");
    expect(certificateDate(undefined)).toBe("—");
  });
  it("prefills treatment dates from the visit and diagnosis from the conclusion", () => {
    expect(initialCertificate(undefined, "2026-11-19", "Цистит")).toMatchObject({
      treatmentFrom: "2026-11-19", treatmentTo: "2026-11-19", diagnosis: "Цистит",
    });
  });
  it("preserves saved certificate fields on reopening", () => {
    expect(initialCertificate({ diagnosis: "Проверено", treatmentFrom: "2026-11-01" }, "2026-11-19", "Другой диагноз"))
      .toEqual({ diagnosis: "Проверено", treatmentFrom: "2026-11-01" });
  });
});
