import { describe, expect, it } from "vitest";
import { computeMappingStats } from "./mappingStats";

describe("computeMappingStats", () => {
  it("separates catalog resolution from pathway mapping", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const codes = new Map([
      ["a", "KNOWN"],
      ["b", "UNBOUND"],
      ["c", ""],
    ]);

    expect(computeMappingStats(rows, codes, { pathway: { KNOWN: "node" } })).toEqual({
      total: 4,
      catalogResolved: 2,
      mappedToPath: 1,
      noCatalogCode: 2,
      noPath: 1,
      unaccounted: 3,
    });
  });
});
