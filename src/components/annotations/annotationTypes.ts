// Shared types & helpers for image annotation overlays.
// Coordinates are normalized (0..1) relative to the source image dimensions,
// so annotations survive any display size or device pixel ratio.

export type AnnotationTool = "select" | "arrow" | "ellipse" | "text";

export interface BaseShape {
  id: string;
  color: string;
  strokeWidth: number;
}

export interface ArrowShape extends BaseShape {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface TextShape extends BaseShape {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number; // in normalized units (relative to imageHeight)
}

export type AnnotationShape = ArrowShape | EllipseShape | TextShape;

export interface AnnotationDoc {
  shapes: AnnotationShape[];
  imageWidth: number;
  imageHeight: number;
}

export const EMPTY_DOC: AnnotationDoc = { shapes: [], imageWidth: 0, imageHeight: 0 };

export const PRESET_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#22c55e", // green
  "#3b82f6", // blue
  "#ffffff", // white
];

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
