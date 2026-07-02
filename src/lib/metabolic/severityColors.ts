import type { Severity } from "./aggregator";

// Единая палитра тяжести для карт, схем и легенды.
// Используем чистые HEX (не CSS-переменные), т.к. цвета применяются в
// экспортируемых SVG и внутри сцен Excalidraw, где переменные темы не резолвятся.
export const SEVERITY_COLORS: Record<Severity, { stroke: string; fill: string; text: string; label: string }> = {
  no_data:  { stroke: "#94a3b8", fill: "#f1f5f9", text: "#334155", label: "Нет данных" },
  norm:     { stroke: "#16a34a", fill: "#dcfce7", text: "#14532d", label: "Норма" },
  mild:     { stroke: "#eab308", fill: "#fef9c3", text: "#713f12", label: "Лёгкое" },
  moderate: { stroke: "#f97316", fill: "#ffedd5", text: "#7c2d12", label: "Умеренное" },
  severe:   { stroke: "#dc2626", fill: "#fee2e2", text: "#7f1d1d", label: "Тяжёлое" },
};

export const SEVERITY_ORDER: Severity[] = ["no_data", "norm", "mild", "moderate", "severe"];

export function severityRank(s: Severity): number {
  return SEVERITY_ORDER.indexOf(s);
}
