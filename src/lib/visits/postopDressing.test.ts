import { describe, expect, it } from "vitest";
import { DEFAULT_POSTOP_DRESSING, parseDressingNumber, dressingActionText } from "./postopDressing";

describe("Перевязка", () => {
  it("при отсутствии операции оставляет название пустым", () => {
    expect(DEFAULT_POSTOP_DRESSING.operation_name).toBe("");
  });
  it("не предполагает состояние раны и выполненные действия", () => {
    expect(DEFAULT_POSTOP_DRESSING.dressing_local).toEqual({});
    expect(DEFAULT_POSTOP_DRESSING.dressing_actions).toEqual({});
  });
  it("принимает номер перевязки по счёту", () => {
    expect(parseDressingNumber("3")).toBe(3);
  });
  it.each(["", "0", "-1", "1.5", "abc"])("не принимает недопустимый номер %s", (value) => {
    expect(parseDressingNumber(value)).toBeNull();
  });
  it("сохраняет свободное дополнение вместе с выбранным действием", () => {
    expect(dressingActionText({ bandage: "Сухая", bandage_notes: "Дополнительная фиксация" }, "bandage"))
      .toBe("Сухая. Дополнительная фиксация");
  });
});
