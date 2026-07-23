import { describe, expect, it } from "vitest";
import { PATHWAY_CARD_SCHEMES } from "@/components/metabolic/pathwayCardsV28";
import { CODE_NODE_MAP_V28 } from "./codeNodeMapV28";

describe("metabolic map v2.8 conformance", () => {
  it("keeps the pathway registry and code map in exact sync", () => {
    const mappedPaths = Object.keys(CODE_NODE_MAP_V28).sort();
    const renderedPaths = Object.keys(PATHWAY_CARD_SCHEMES).sort();

    expect(mappedPaths).toHaveLength(22);
    expect(renderedPaths).toEqual(mappedPaths);
  });

  it("contains exactly 107 code-to-node bindings", () => {
    const bindings = Object.entries(CODE_NODE_MAP_V28).flatMap(
      ([pathwaySlug, codeMap]) =>
        Object.entries(codeMap).map(([code, nodeId]) => ({
          pathwaySlug,
          code,
          nodeId,
        })),
    );

    expect(bindings).toHaveLength(107);
    expect(
      new Set(
        bindings.map(
          ({ pathwaySlug, code, nodeId }) => `${pathwaySlug}:${code}:${nodeId}`,
        ),
      ).size,
    ).toBe(107);
  });

  it("uses the canonical methylmalonate node for MMA_U", () => {
    expect(CODE_NODE_MAP_V28.methylation.MMA_U).toBe("methylmalonate");
  });
});
