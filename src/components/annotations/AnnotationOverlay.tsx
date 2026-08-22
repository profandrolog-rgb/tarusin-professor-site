import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AnnotationDoc, AnnotationShape } from "./annotationTypes";

/**
 * Статичный SVG-слой разметки поверх <img>.
 * Координаты в документе нормализованы (0..1), поэтому слой подходит
 * любому размеру отображения. `fit` должен совпадать с object-fit картинки.
 */
export function AnnotationOverlay({
  doc,
  fit = "contain",
}: {
  doc: AnnotationDoc | null | undefined;
  fit?: "contain" | "cover";
}) {
  if (!doc || !doc.shapes?.length) return null;
  const w = doc.imageWidth || 1000;
  const h = doc.imageHeight || 1000;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
      aria-hidden="true"
    >
      {doc.shapes.map((s) => renderSvgShape(s, w, h))}
    </svg>
  );
}

/**
 * Загружает разметку сразу для набора файлов одного бакета/папки.
 * Возвращает карту: имя файла → документ разметки.
 */
export function useAnnotationsMap(
  filenames: string[],
  opts: { bucket?: string; folder?: string; label?: string } = {},
) {
  const { bucket = "disease-media", folder = "article-images", label = "default" } = opts;
  const [map, setMap] = useState<Record<string, AnnotationDoc>>({});
  const key = filenames.join("|");

  useEffect(() => {
    const names = key ? key.split("|").filter(Boolean) : [];
    if (!names.length) {
      setMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      const paths = names.map((n) => (folder ? `${folder}/${n}` : n));
      const { data, error } = await supabase
        .from("image_annotations")
        .select("image_path, annotation_data")
        .eq("bucket", bucket)
        .eq("label", label)
        .in("image_path", paths);
      if (cancelled || error || !data) return;
      const next: Record<string, AnnotationDoc> = {};
      for (const row of data as unknown as { image_path: string; annotation_data: AnnotationDoc }[]) {
        const name = row.image_path.split("/").pop() || row.image_path;
        if (row.annotation_data?.shapes?.length) next[name] = row.annotation_data;
      }
      setMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [key, bucket, folder, label]);

  return map;
}

export function renderSvgShape(s: AnnotationShape, w: number, h: number) {
  const stroke = s.color;
  const sw = s.strokeWidth;
  if (s.type === "arrow") {
    const markerId = `arrowhead-${s.id}`;
    return (
      <g key={s.id}>
        <defs>
          <marker
            id={markerId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={stroke} />
          </marker>
        </defs>
        <line
          x1={s.x1 * w}
          y1={s.y1 * h}
          x2={s.x2 * w}
          y2={s.y2 * h}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      </g>
    );
  }
  if (s.type === "ellipse") {
    return (
      <ellipse
        key={s.id}
        cx={s.cx * w}
        cy={s.cy * h}
        rx={s.rx * w}
        ry={s.ry * h}
        stroke={stroke}
        strokeWidth={sw}
        fill="none"
      />
    );
  }
  return (
    <text
      key={s.id}
      x={s.x * w}
      y={s.y * h}
      fill={stroke}
      fontSize={s.fontSize * h}
      fontFamily="sans-serif"
      style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.6)", strokeWidth: sw * 0.5 }}
    >
      {s.text}
    </text>
  );
}

export default AnnotationOverlay;
