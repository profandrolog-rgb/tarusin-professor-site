import { CODE_NODE_MAP } from "@/lib/metabolic/codeNodeMap";

export interface MappingLabRow {
  id: string;
}

export interface MappingStats {
  total: number;
  catalogResolved: number;
  mappedToPath: number;
  noCatalogCode: number;
  noPath: number;
  unaccounted: number;
}

/**
 * Counts laboratory rows by their actual display state.
 *
 * `catalogResolved` is deliberately separate from `mappedToPath`: a catalog
 * code may exist without being assigned to any metabolic pathway. The UI must
 * not call those rows "accounted for".
 */
export function computeMappingStats(
  rows: MappingLabRow[],
  labCodesById: Map<string, string>,
  codeNodeMap: Record<string, Record<string, string>> = CODE_NODE_MAP,
): MappingStats {
  const mappedCodes = new Set<string>();
  for (const pathMap of Object.values(codeNodeMap)) {
    for (const code of Object.keys(pathMap)) mappedCodes.add(code.toUpperCase());
  }

  let catalogResolved = 0;
  let mappedToPath = 0;
  let noCatalogCode = 0;
  let noPath = 0;

  for (const row of rows) {
    const code = labCodesById.get(row.id);
    if (!code) {
      noCatalogCode += 1;
      continue;
    }

    catalogResolved += 1;
    if (mappedCodes.has(code.toUpperCase())) mappedToPath += 1;
    else noPath += 1;
  }

  return {
    total: rows.length,
    catalogResolved,
    mappedToPath,
    noCatalogCode,
    noPath,
    unaccounted: noCatalogCode + noPath,
  };
}
