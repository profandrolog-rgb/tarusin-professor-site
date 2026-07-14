import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AnnotationDoc, AnnotationShape } from "./annotationTypes";

interface Props {
  imagePath: string;
  bucket?: string;
  /** If given, load only this label. Otherwise loads all and shows a switcher. */
  label?: string;
  showAnnotations?: boolean;
  className?: string;
  alt?: string;
}

interface Row {
  label: string;
  annotation_data: AnnotationDoc;
}

/**
 * Renders an <img> plus a static SVG overlay of annotations stored in
 * public.image_annotations. Read-only, no Konva.
 */
const ImageWithAnnotations = ({
  imagePath,
  bucket = "disease-media",
  label,
  showAnnotations = true,
  className = "",
  alt = "",
}: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState<string | null>(label ?? null);

  const publicUrl = useMemo(
    () => supabase.storage.from(bucket).getPublicUrl(imagePath).data.publicUrl,
    [bucket, imagePath],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let query = supabase
        .from("image_annotations")
        .select("label, annotation_data")
        .eq("image_path", imagePath)
        .eq("bucket", bucket);
      if (label) query = query.eq("label", label);
      const { data, error } = await query;
      if (cancelled || error || !data) return;
      const cast = data as unknown as Row[];
      setRows(cast);
      if (!label && cast.length && !active) setActive(cast[0].label);
    })();
    return () => {
      cancelled = true;
    };
  }, [imagePath, bucket, label]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentDoc =
    (rows.find((r) => r.label === (label ?? active))?.annotation_data as AnnotationDoc | undefined) ?? null;

  return (
    <div className={`relative inline-block ${className}`}>
      <img src={publicUrl} alt={alt} className="block w-full h-auto select-none" draggable={false} />
      {showAnnotations && currentDoc && currentDoc.imageWidth > 0 && currentDoc.imageHeight > 0 && (
        <svg
          viewBox={`0 0 ${currentDoc.imageWidth} ${currentDoc.imageHeight}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          {currentDoc.shapes.map((s) => renderSvgShape(s, currentDoc.imageWidth, currentDoc.imageHeight))}
        </svg>
      )}
      {!label && rows.length > 1 && (
        <div className="absolute top-2 right-2 flex gap-1 bg-background/80 backdrop-blur rounded-md p-1 text-[10px] pointer-events-auto">
          {rows.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setActive(r.label)}
              className={`px-2 py-0.5 rounded ${
                (active ?? rows[0].label) === r.label
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function renderSvgShape(s: AnnotationShape, w: number, h: number) {
  const stroke = s.color;
  const sw = s.strokeWidth;
  if (s.type === "arrow") {
    const x1 = s.x1 * w;
    const y1 = s.y1 * h;
    const x2 = s.x2 * w;
    const y2 = s.y2 * h;
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
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
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

export default ImageWithAnnotations;
