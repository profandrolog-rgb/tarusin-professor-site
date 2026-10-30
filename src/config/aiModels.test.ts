import { describe, expect, it } from "vitest";
import { getOpenRouterModelTags } from "./aiModels";

describe("OpenRouter explicit model categories", () => {
  it("identifies Instruct without claiming ablation", () => {
    expect(getOpenRouterModelTags({ id: "meta-llama/llama-3.3-70b-instruct" })).toEqual(["Instruct"]);
  });
  it("identifies Abliterated separately", () => {
    expect(getOpenRouterModelTags({ id: "provider/example-abliterated" })).toEqual(["Abliterated"]);
  });
  it("does not infer ablation from Uncensored or generic description", () => {
    expect(getOpenRouterModelTags({ id: "provider/uncensored", description: "Instruction tuned" })).toEqual(["Uncensored"]);
  });
  it("keeps multimodal Instruct models accepting text", () => {
    expect(getOpenRouterModelTags({ id: "qwen/qwen3-vl-8b-instruct", architecture: { output_modalities: ["text"] } })).toEqual(["Instruct"]);
  });
});
