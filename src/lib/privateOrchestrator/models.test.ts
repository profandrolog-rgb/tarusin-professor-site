import { describe, it, expect } from "vitest";
import { isValidModelId, PRESET_MODELS, DEFAULT_ENABLED } from "./models";

describe("private orchestrator models", () => {
  it("accepts OpenRouter-style ids incl. variants", () => {
    expect(isValidModelId("nousresearch/hermes-4-405b")).toBe(true);
    expect(isValidModelId("google/gemma-4-31b-it:free")).toBe(true);
  });
  it("rejects garbage ids", () => {
    expect(isValidModelId("hermes")).toBe(false);
    expect(isValidModelId("a/b c")).toBe(false);
  });
  it("defaults are all presets and include an uncensored model", () => {
    const ids = PRESET_MODELS.map((m) => m.id);
    expect(DEFAULT_ENABLED.every((id) => ids.includes(id))).toBe(true);
    expect(PRESET_MODELS.filter((m) => m.group === "uncensored").length).toBeGreaterThan(0);
  });
});
