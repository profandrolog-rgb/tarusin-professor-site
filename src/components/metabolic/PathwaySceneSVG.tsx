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
  rxNodes,
  rxLabelByNode,
  className = "",
  fallback,
  maxHeight,
}: {
  scene: SceneJson | null | undefined;
  highlights?: Map<string, Severity>;
  /** Узлы, к которым в каталоге привязано хотя бы одно средство — рисуем зелёный ℞ */
  rxNodes?: Set<string>;
  /** Подписи ℞: nodeId → "Метод 1 · Метод 2" */
  rxLabelByNode?: Map<string, string>;
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

        // Наложение ℞ маркеров рядом с узлами (по customData.nodeId)
        if (rxNodes && rxNodes.size > 0) {
          const svgNS = "http://www.w3.org/2000/svg";
          for (const el of scene.elements as any[]) {
            const nodeId: string | undefined = el?.customData?.nodeId;
            if (!nodeId || !rxNodes.has(nodeId)) continue;
            const w = Number(el.width) || 0;
            const h = Number(el.height) || 0;
            const cx = Number(el.x) + w;
            const cy = Number(el.y);
            const g = document.createElementNS(svgNS, "g");
            g.setAttribute("transform", `translate(${cx - 10}, ${cy - 10})`);
            const c = document.createElementNS(svgNS, "circle");
            c.setAttribute("r", "12");
            c.setAttribute("fill", "#10b981");
            c.setAttribute("stroke", "#065f46");
            c.setAttribute("stroke-width", "1.5");
            const t = document.createElementNS(svgNS, "text");
            t.setAttribute("text-anchor", "middle");
            t.setAttribute("dominant-baseline", "central");
            t.setAttribute("font-size", "13");
            t.setAttribute("font-weight", "700");
            t.setAttribute("fill", "white");
            t.textContent = "℞";
            g.appendChild(c);
            g.appendChild(t);
            const label = rxLabelByNode?.get(nodeId);
            if (label) {
              const lt = document.createElementNS(svgNS, "text");
              lt.setAttribute("text-anchor", "start");
              lt.setAttribute("x", "16");
              lt.setAttribute("y", "4");
              lt.setAttribute("font-size", "11");
              lt.setAttribute("fill", "#065f46");
              lt.textContent = label.length > 40 ? label.slice(0, 40) + "…" : label;
              g.appendChild(lt);
            }
            svg.appendChild(g);
          }
        }

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
  }, [scene, highlights, maxHeight, rxNodes, rxLabelByNode]);

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
