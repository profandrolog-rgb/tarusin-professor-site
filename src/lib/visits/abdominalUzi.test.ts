import { describe, expect, it } from "vitest";
import { abdominalPrintFields, fillAbdominalStandard } from "./abdominalUzi";

describe("abdominal ultrasound", () => {
  it("does not print an optional disabled study", () => {
    expect(abdominalPrintFields({ enabled: false, values: { liver: "Описание" }, conclusion: "Заключение" })).toEqual([]);
  });
  it("prints only filled values, including zero, without inventing dimensions", () => {
    const values = abdominalPrintFields({ enabled: true, values: { liver_right: "123", liver_left: "", portal_vein: "0" } }).map((field) => field.value);
    expect(values).toEqual(["123", "0"]);
  });
  it("keeps edited descriptions, measurements and conclusion when filling a standard", () => {
    const filled = fillAbdominalStandard({ enabled: true, values: { liver: "Очаговое образование", liver_right: "123" }, conclusion: "Требуется уточнение" });
    expect(filled.values?.liver).toBe("Очаговое образование");
    expect(filled.values?.liver_right).toBe("123");
    expect(filled.values?.liver_left).toBeUndefined();
    expect(Boolean(filled.values?.pancreas?.trim())).toBe(true);
    expect(filled.conclusion).toBe("Требуется уточнение");
  });
});
