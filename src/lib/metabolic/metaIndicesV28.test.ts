import { describe, expect, it } from "vitest";
import { computeMatrixIndicesV28 } from "./metaIndices";

const row = (test_code: string, value: number, unit = "umol/L") => ({
  id: test_code,
  test_code,
  test_name: test_code,
  value,
  unit,
});

describe("matrix v2.8 runtime indices", () => {
  it("computes all five registered indices from exact canonical codes", () => {
    const result = computeMatrixIndicesV28([
      row("QUIN", 10), row("KYNA", 2),
      row("2MHA", 1), row("MHA_M_U", 2), row("MHA_P_U", 3),
      row("FA_LA", 10), row("FA_AA", 5), row("FA_EPA", 2), row("FA_DHA", 2), row("FA_ALA", 1),
      row("FA_MEAD", 1),
    ]);
    expect(result).toHaveLength(5);
    expect(result.find((item) => item.id === "quin_kyna")?.value).toBe(5);
    expect(result.find((item) => item.id === "mha_total")?.value).toBe(6);
    expect(result.find((item) => item.id === "omega_ratio")?.value).toBeCloseTo(3);
    expect(result.find((item) => item.id === "aa_epa")?.value).toBeCloseTo(2.5);
    expect(result.find((item) => item.id === "holman")?.value).toBeCloseTo(0.2);
    expect(result.every((item) => item.status === "unknown")).toBe(true);
  });

  it("returns unknown values for missing, incompatible or zero denominators", () => {
    const result = computeMatrixIndicesV28([
      row("FA_LA", 10, "umol/L"), row("FA_AA", 5, "umol/L"),
      row("FA_EPA", 0, "umol/L"), row("FA_DHA", 0, "umol/L"), row("FA_ALA", 0, "umol/L"),
      row("FA_MEAD", 1, "mg/L"),
    ]);
    expect(result.every((item) => item.value === null)).toBe(true);
  });
});
