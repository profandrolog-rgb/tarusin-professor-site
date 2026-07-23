import { describe, expect, it } from "vitest";
import { wrapValueLines } from "./PathwayCardSVG";

describe("pathway value labels", () => {
  it("keeps long values within two readable lines", () => {
    const lines = wrapValueLines("12.4 ммоль/моль креатинина");
    expect(lines).toHaveLength(2);
    expect(lines.join(" ")).toContain("12.4");
    expect(lines[1].length).toBeLessThanOrEqual(20);
  });

  it("does not alter short values", () => {
    expect(wrapValueLines("4.2 нмоль/л")).toEqual(["4.2 нмоль/л"]);
  });
});
