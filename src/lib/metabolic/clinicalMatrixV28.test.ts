import { describe, expect, it } from "vitest";
import { CODE_NODE_MAP_V28 } from "./codeNodeMapV28";
import {
  METABOLIC_ANALYTES_V28,
  METABOLIC_CONTEXTS_V28,
  METABOLIC_INDICES_V28,
  METABOLIC_NATIVE_DENOMINATOR_V28,
  METABOLIC_PANEL_MANIFESTS_V28,
  METABOLIC_PATHS_V28,
} from "./clinicalMatrixV28.generated";

describe("clinical matrix v2.8 conformance", () => {
  it("keeps the accepted denominators and registry sizes", () => {
    expect(METABOLIC_ANALYTES_V28).toHaveLength(127);
    expect(METABOLIC_PATHS_V28).toHaveLength(22);
    expect(METABOLIC_CONTEXTS_V28).toHaveLength(48);
    expect(METABOLIC_INDICES_V28).toHaveLength(5);
    expect(METABOLIC_PANEL_MANIFESTS_V28).toHaveLength(5);
    expect(METABOLIC_NATIVE_DENOMINATOR_V28).toBe(127);
  });

  it("has unique canonical codes and target node ids", () => {
    const codes = METABOLIC_ANALYTES_V28.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);

    const nodeIds = METABOLIC_ANALYTES_V28
      .map((item) => item.targetNodeId)
      .filter((nodeId): nodeId is string => Boolean(nodeId));
    expect(nodeIds).toHaveLength(107);
    expect(new Set(nodeIds).size).toBe(nodeIds.length);
  });

  it("resolves every path, context, index and SVG binding", () => {
    const paths = new Set(METABOLIC_PATHS_V28.map((path) => path.slug));
    const contexts = new Set(METABOLIC_CONTEXTS_V28.map((context) => context.tag));
    const indices = new Set(METABOLIC_INDICES_V28.map((index) => index.id));
    const orphanPaths: string[] = [];
    const orphanContexts: string[] = [];
    const orphanIndices: string[] = [];

    for (const analyte of METABOLIC_ANALYTES_V28) {
      if (analyte.primaryPath && !paths.has(analyte.primaryPath)) {
        orphanPaths.push(analyte.primaryPath);
      }
      for (const slug of analyte.secondaryPaths) {
        if (!paths.has(slug)) orphanPaths.push(slug);
      }
      for (const tag of analyte.contextTags) {
        if (!contexts.has(tag)) orphanContexts.push(tag);
      }
      for (const id of analyte.indexIds) {
        if (!indices.has(id)) orphanIndices.push(id);
      }

      if (analyte.displaySurface === "svg") {
        expect(analyte.targetNodeId).toBeTruthy();
        expect(CODE_NODE_MAP_V28[analyte.primaryPath]?.[analyte.code]).toBe(
          analyte.targetNodeId,
        );
      } else {
        expect(analyte.displaySurface).toBe("context_panel");
        expect(analyte.primaryPath).toBeNull();
        expect(analyte.targetNodeId).toBeNull();
      }
    }
    expect(orphanPaths).toEqual([]);
    expect(orphanContexts).toEqual([]);
    expect(orphanIndices).toEqual([]);
  });

  it("resolves all registered index inputs to native analytes", () => {
    const codes = new Set(METABOLIC_ANALYTES_V28.map((item) => item.code));
    for (const index of METABOLIC_INDICES_V28) {
      expect(index.denominatorPolicy).toContain("Не добавляет строку");
      for (const code of index.inputCodes) expect(codes.has(code)).toBe(true);
    }
  });
});
