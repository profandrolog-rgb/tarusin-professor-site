import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { SEVERITY_COLORS, severityRank } from "@/lib/metabolic/severityColors";
import type { Severity } from "@/lib/metabolic/aggregator";

export type SceneJson = {
  elements: any[];
  appState?: any;
  files?: any;
};

// Универсальный рендер сцены Excalidraw в SVG с перекраской узлов по severity.
// В сцене у ключевых элементов должно быть customData.nodeId (стабильный id узла).
// Стрелки/линии с bindings автоматически перекрашиваются по подсвеченному концу.
export function PathwaySceneSVG({
  scene,
  highlights,
  className = "",
  fallback,
  maxHeight,
}: {
  scene: SceneJson | null | undefined;
  highlights?: Map<string, Severity>;
  className?: string;
  fallback?: React.ReactNode;
  maxHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!scene || !Array.isArray(scene.elements) || scene.elements.length === 0) {
        setEmpty(true);
        setLoading(false);
        return;
      }
      setEmpty(false);
      setLoading(true);

      try {
        const { exportToSvg } = await import("@excalidraw/excalidraw");

        // Клонируем элементы и перекрашиваем по подсветкам
        const nodeSeverityByElId = new Map<string, Severity>();
        const elements = (scene.elements as any[]).map((el) => ({ ...el }));

        // 1) прямые совпадения по customData.nodeId
        for (const el of elements) {
          const nodeId: string | undefined = el?.customData?.nodeId;
          if (nodeId && highlights?.has(nodeId)) {
            const sev = highlights.get(nodeId)!;
            const c = SEVERITY_COLORS[sev];
            el.strokeColor = c.stroke;
            el.backgroundColor = c.fill;
            nodeSeverityByElId.set(el.id, sev);
          }
        }
        // 2) стрелки/линии с bindings — берём max severity из концов
        for (const el of elements) {
          if (el.type !== "arrow" && el.type !== "line") continue;
          const startId = el.startBinding?.elementId;
          const endId = el.endBinding?.elementId;
          const sevs: Severity[] = [];
          if (startId && nodeSeverityByElId.has(startId)) sevs.push(nodeSeverityByElId.get(startId)!);
          if (endId && nodeSeverityByElId.has(endId)) sevs.push(nodeSeverityByElId.get(endId)!);
          if (!sevs.length) continue;
          const worst = sevs.reduce((a, b) => (severityRank(a) >= severityRank(b) ? a : b));
          if (worst === "no_data" || worst === "norm") continue;
          el.strokeColor = SEVERITY_COLORS[worst].stroke;
          el.strokeWidth = Math.max(2, (el.strokeWidth ?? 1) + 1);
        }

        const svg: SVGSVGElement = await exportToSvg({
          elements,
          appState: {
            ...(scene.appState || {}),
            exportBackground: false,
            exportWithDarkMode: false,
          } as any,
          files: scene.files || null,
        });

        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.display = "block";
        svg.style.maxWidth = "100%";
        if (maxHeight) svg.style.maxHeight = `${maxHeight}px`;

        if (cancelled) return;
        const host = containerRef.current;
        if (host) {
          host.innerHTML = "";
          host.appendChild(svg);
        }
        setLoading(false);
      } catch (e) {
        console.error("[PathwaySceneSVG] render failed", e);
        setLoading(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [scene, highlights, maxHeight]);

  if (empty) {
    return (
      <div className={`text-xs italic text-muted-foreground px-2 py-6 text-center rounded bg-muted/30 ${className}`}>
        {fallback ?? "Схема пути пока не задана"}
      </div>
    );
  }

  return (
    <div className={`relative rounded bg-muted/20 overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
