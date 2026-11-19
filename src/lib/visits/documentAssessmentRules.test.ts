import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDocumentRecognition } from "@/hooks/useDocumentRecognition";
import { assessDocument, recognizePart } from "./documentRecognition";
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_PIXELS, pageRanges, splitDocumentText } from "./documentAssessmentRules";

vi.mock("./documentRecognition", () => ({ assessDocument: vi.fn(), recognizePart: vi.fn() }));

describe("предварительная оценка документов", () => {
  it("сохраняет ограничение 20 МБ", () => expect(MAX_DOCUMENT_BYTES).toBe(20 * 1024 * 1024));
  it("делит 18 сканированных страниц на шесть частей по три", () => expect(pageRanges(Array(18).fill(0))).toEqual([{ start: 1, end: 3 }, { start: 4, end: 6 }, { start: 7, end: 9 }, { start: 10, end: 12 }, { start: 13, end: 15 }, { start: 16, end: 18 }]));
  it("оставляет три страницы скана одной частью", () => expect(pageRanges([0, 0, 0])).toEqual([{ start: 1, end: 3 }]));
  it("текстовый PDF ограничен шестью страницами", () => expect(pageRanges(Array(7).fill(1000))).toEqual([{ start: 1, end: 6 }, { start: 7, end: 7 }]));
  it("текстовый PDF разделяется при превышении 15000 символов", () => expect(pageRanges([8000, 8000])).toEqual([{ start: 1, end: 1 }, { start: 2, end: 2 }]));
  it("смешанный PDF использует предел сканов", () => expect(pageRanges([1000, 1000, 0, 1000])).toEqual([{ start: 1, end: 3 }, { start: 4, end: 4 }]));
  it("сохраняет все символы длинного абзаца", () => {
    const text = "А".repeat(30001);
    const parts = splitDocumentText(text);
    expect(parts.map((part) => part.length)).toEqual([15000, 15000, 1]);
    expect(parts.join("")).toBe(text);
  });
  it("не теряет переносы строк и даты", () => {
    const text = ("2026-11-19: обследование\n").repeat(1000);
    expect(splitDocumentText(text).join("")).toBe(text);
    expect(splitDocumentText(text).every((part) => part.length <= 15000)).toBe(true);
  });
  it("не разрывает суррогатную пару", () => {
    const text = "А".repeat(14999) + "😀" + "Б";
    const parts = splitDocumentText(text);
    expect(parts[0].length).toBe(14999);
    expect(parts.join("")).toBe(text);
  });
  it("ограничивает изображение 12 мегапикселями на часть", () => expect(MAX_IMAGE_PIXELS).toBe(12000000));
  it("не принимает PDF без страниц", () => expect(() => pageRanges([])).toThrow());
});

it("после ошибки повторяет только нераспознанную часть и сохраняет готовую", async () => {
  const parts = ["1", "2"].map((id) => ({ id, label: id, prepare: async () => ({}) }));
  vi.mocked(assessDocument).mockResolvedValue({ parts, requiresFragmentation: true, reason: "", dispose: async () => {} });
  vi.mocked(recognizePart).mockResolvedValueOnce({ visit_date: "2026-11-18" }).mockRejectedValueOnce(new Error("504")).mockResolvedValueOnce({ visit_date: "2026-11-19" });
  const { result } = renderHook(() => useDocumentRecognition());
  await act(async () => { await result.current.start(null, "text"); });
  expect(recognizePart).not.toHaveBeenCalled();
  act(() => result.current.resume());
  await waitFor(() => expect(result.current.phase).toBe("results"));
  expect(result.current.parts.map((part) => part.state)).toEqual(["done", "error"]);
  act(() => result.current.resume());
  await waitFor(() => expect(result.current.parts.map((part) => part.state)).toEqual(["done", "done"]));
  expect(vi.mocked(recognizePart).mock.calls.map(([part]) => part.id)).toEqual(["1", "2", "2"]);
  expect(result.current.parts[0].parsed?.visit_date).toBe("2026-11-18");
});
