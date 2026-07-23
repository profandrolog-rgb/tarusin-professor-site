import type { Severity } from "./aggregator";

// Единая палитра тяжести для карт, схем и легенды.
// Используем чистые HEX (не CSS-переменные), т.к. цвета применяются в
// экспортируемых SVG и внутри сцен Excalidraw, где переменные темы не резолвятся.
export const SEVERITY_COLORS: Record<Severity, { stroke: string; fill: string; text: string; label: string }> = {
  no_data:  { stroke: "#9aa5b1", fill: "#eef1f4", text: "#334155", label: "Нет данных" },
  norm:     { stroke: "#2f9e64", fill: "#e6f6ec", text: "#14532d", label: "Норма" },
  mild:     { stroke: "#d69e2e", fill: "#fdf3d7", text: "#713f12", label: "Лёгкое" },
  moderate: { stroke: "#dd6b20", fill: "#fde3cf", text: "#7c2d12", label: "Умеренное" },
  severe:   { stroke: "#e02424", fill: "#fbd7d7", text: "#7f1d1d", label: "Тяжёлое" },
};

export const SEVERITY_ORDER: Severity[] = ["no_data", "norm", "mild", "moderate", "severe"];

/**
 * Нормализует статусы из map_findings (info/warn/critical) к единому
 * словарю, который используют все SVG-рендереры.
 */
export function normalizeSeverity(value: string | null | undefined): Severity {
  switch (String(value || "").toLowerCase()) {
    case "norm":
    case "normal":
      return "norm";
    case "mild":
    case "info":
      return "mild";
    case "moderate":
    case "warn":
      return "moderate";
    case "severe":
    case "critical":
      return "severe";
    default:
      return "no_data";
  }
}

export function severityRank(s: Severity): number {
  return SEVERITY_ORDER.indexOf(s);
}
