import { describe, expect, it } from "vitest";
import { evaluateRule, type LabRow } from "@/lib/metabolic/aggregator";

const lab: LabRow = {
  id: "lab-1",
  test_date: "2026-07-23",
  test_code: "AA_VAL_PL",
  test_name: "Валин",
  value: 120,
  unit: "мкмоль/л",
  reference_min: 50,
  reference_max: 100,
};

describe("metabolic clinical rule evaluation", () => {
  it("flags a value outside the lab-provided interval once", () => {
    expect(evaluateRule({
      code: "aa_val_outside_ref",
      when: { op: "outside_ref", test_code: "AA_VAL_PL" },
      raises_to: "mild",
    }, lab, 50, 100)).toBe("mild");
  });

  it("does not flag a value inside the interval", () => {
    expect(evaluateRule({
      code: "aa_val_outside_ref",
      when: { op: "outside_ref", test_code: "AA_VAL_PL" },
      raises_to: "mild",
    }, { ...lab, value: 75 }, 50, 100)).toBe("norm");
  });

  it("does not manufacture a result when both bounds are unavailable", () => {
    expect(evaluateRule({
      code: "aa_val_outside_ref",
      when: { op: "outside_ref", test_code: "AA_VAL_PL" },
      raises_to: "mild",
    }, lab, null, null)).toBeNull();
  });
});
