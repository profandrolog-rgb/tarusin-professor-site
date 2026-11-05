import { describe, expect, it } from "vitest";
import { appendHistoryDocuments, historyDocumentText, sameHistoryPatient } from "./historyDocuments";

describe("импорт документов как анамнеза", () => {
  it("сохраняет исходный анамнез и оба источника", () => {
    expect(appendHistoryDocuments("Исходный анамнез", [{ name: "1", text: "Документ 1" }, { name: "2", text: "Документ 2" }])).toBe("Исходный анамнез\n\nДокумент 1\n\nДокумент 2");
  });
  it("оставляет диагноз и дату старого документа в истории, а не назначением текущего визита", () => {
    const current = { diagnosis: "Пупочная грыжа", protocol_data: { anamnesis: "Ранее наблюдалась", complaints: "Боль" } };
    const text = historyDocumentText("осмотр.txt", { visit_date: "2025-01-20", diagnosis: "Цистит", protocol_data: { anamnesis: "Получала лечение", next_visit_date: "2025-02-20" } });
    const result = { ...current, protocol_data: { ...current.protocol_data, anamnesis: appendHistoryDocuments(current.protocol_data.anamnesis, [{ name: "осмотр.txt", text }]) } };
    expect(result.diagnosis).toBe("Пупочная грыжа");
    expect(result.protocol_data.complaints).toBe("Боль");
    expect(result.protocol_data.anamnesis).toContain("2025-01-20");
    expect(result.protocol_data.anamnesis).toContain("Цистит");
    expect(result.protocol_data.anamnesis).not.toContain("2025-02-20");
  });
  it("требует проверки при другом или нераспознанном пациенте", () => {
    expect(sameHistoryPatient("Иванов Иван Иванович", "иванов  Иван Иванович")).toBe(true);
    expect(sameHistoryPatient("Иванов Иван Иванович", "Петров Иван Иванович")).toBe(false);
    expect(sameHistoryPatient("Иванов Иван Иванович")).toBe(false);
  });
});
