import { useEffect, useMemo, useRef } from "react";
import type { Severity } from "@/lib/metabolic/aggregator";
import type { SceneJson } from "./PathwaySceneSVG";
import { PathwaySceneSVG } from "./PathwaySceneSVG";

// Vite raw imports SVG-шаблонов путей
import methylationSvg from "@/assets/pathways/methylation.svg?raw";
import ironSvg from "@/assets/pathways/iron.svg?raw";
import thyroidSvg from "@/assets/pathways/thyroid.svg?raw";
import insulinGlucoseSvg from "@/assets/pathways/insulin_glucose.svg?raw";
import boneMineralSvg from "@/assets/pathways/bone_mineral.svg?raw";
import growthIgf1Svg from "@/assets/pathways/growth_igf1.svg?raw";
import hpaSvg from "@/assets/pathways/hpa.svg?raw";
import lipidsSvg from "@/assets/pathways/lipids.svg?raw";
import inflammationSvg from "@/assets/pathways/inflammation.svg?raw";
import oxidativeStressSvg from "@/assets/pathways/oxidative_stress.svg?raw";
import electrolytesAbrSvg from "@/assets/pathways/electrolytes_abr.svg?raw";
import energyTcaSvg from "@/assets/pathways/energy_tca.svg?raw";
import aminoUreaSvg from "@/assets/pathways/amino_urea.svg?raw";
import micronutrientsSteroidSvg from "@/assets/pathways/micronutrients_steroid.svg?raw";
import detoxP12Svg from "@/assets/pathways/detox_p12.svg?raw";
import gutPermeabilitySvg from "@/assets/pathways/gut_permeability.svg?raw";
import hpgAxisSvg from "@/assets/pathways/hpg_axis.svg?raw";
import hpoAxisSvg from "@/assets/pathways/hpo_axis.svg?raw";
import androgensPcosSvg from "@/assets/pathways/androgens_pcos.svg?raw";
import prolactinRegSvg from "@/assets/pathways/prolactin_reg.svg?raw";

export const PATHWAY_SVG_TEMPLATES: Record<string, string> = {
  methylation: methylationSvg,
  iron: ironSvg,
  thyroid: thyroidSvg,
  insulin_glucose: insulinGlucoseSvg,
  bone_mineral: boneMineralSvg,
  growth_igf1: growthIgf1Svg,
  hpa: hpaSvg,
  lipids: lipidsSvg,
  inflammation: inflammationSvg,
  oxidative_stress: oxidativeStressSvg,
  electrolytes_abr: electrolytesAbrSvg,
  energy_tca: energyTcaSvg,
  amino_urea: aminoUreaSvg,
  micronutrients_steroid: micronutrientsSteroidSvg,
  detox_p12: detoxP12Svg,
  gut_permeability: gutPermeabilitySvg,
  hpg_axis: hpgAxisSvg,
  hpo_axis: hpoAxisSvg,
  androgens_pcos: androgensPcosSvg,
  prolactin_reg: prolactinRegSvg,
};


export function hasPathwaySvgTemplate(slug: string): boolean {
  return !!PATHWAY_SVG_TEMPLATES[slug];
}

// Тяжесть → значение атрибута data-sev в стилях SVG-шаблона
function sevAttr(s: Severity): string {
  if (s === "no_data") return "nodata";
  return s;
}

/**
 * Рендер статичного SVG-шаблона пути с:
 *  - подсветкой узлов по highlights (data-sev на <g data-node-id="...">)
 *  - маркерами ℞ у узлов с рекомендациями
 *  - опциональным Excalidraw-оверлеем поверх (правки врача, не меняющие шаблон)
 */
export function PathwayTemplateSVG({
  slug,
  highlights,
  rxNodes,
  rxLabelByNode,
  overlayScene,
  maxHeight = 320,
}: {
  slug: string;
  highlights?: Map<string, Severity>;
  rxNodes?: Set<string>;
  rxLabelByNode?: Map<string, string>;
  overlayScene?: SceneJson | null;
  maxHeight?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const raw = PATHWAY_SVG_TEMPLATES[slug];

  const processed = useMemo(() => {
    if (!raw) return null;
    // Парсим и модифицируем SVG в DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "image/svg+xml");
    const svg = doc.documentElement as unknown as SVGSVGElement;

    // 1) Подсветка узлов
    if (highlights && highlights.size) {
      highlights.forEach((sev, nodeId) => {
        const g = svg.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`);
        if (g) g.setAttribute("data-sev", sevAttr(sev));
      });
    }

    // 2) Маркеры ℞
    if (rxNodes && rxNodes.size) {
      const svgNS = "http://www.w3.org/2000/svg";
      rxNodes.forEach((nodeId) => {
        const g = svg.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`) as SVGGElement | null;
        if (!g) return;
        const shape = g.querySelector(".node-shape") as SVGGraphicsElement | null;
        if (!shape) return;
        // Пытаемся получить bbox после парсинга: используем атрибуты x/y/width или cx/cy/r
        const geom = readShapeGeom(shape);
        if (!geom) return;
        const marker = doc.createElementNS(svgNS, "g");
        marker.setAttribute("transform", `translate(${geom.x + geom.w - 6}, ${geom.y + 6})`);
        marker.setAttribute("pointer-events", "none");
        const c = doc.createElementNS(svgNS, "circle");
        c.setAttribute("r", "9");
        c.setAttribute("fill", "#10b981");
        c.setAttribute("stroke", "#065f46");
        c.setAttribute("stroke-width", "1.2");
        const t = doc.createElementNS(svgNS, "text");
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("dominant-baseline", "central");
        t.setAttribute("font-size", "10");
        t.setAttribute("font-weight", "700");
        t.setAttribute("fill", "white");
        t.textContent = "℞";
        marker.appendChild(c);
        marker.appendChild(t);
        const label = rxLabelByNode?.get(nodeId);
        if (label) {
          const lt = doc.createElementNS(svgNS, "text");
          lt.setAttribute("x", "12");
          lt.setAttribute("y", "3");
          lt.setAttribute("font-size", "9");
          lt.setAttribute("fill", "#065f46");
          lt.textContent = label.length > 32 ? label.slice(0, 32) + "…" : label;
          marker.appendChild(lt);
        }
        g.appendChild(marker);
      });
    }

    // Гарантируем стили размера
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    return new XMLSerializer().serializeToString(svg);
  }, [raw, highlights, rxNodes, rxLabelByNode]);

  useEffect(() => {
    const host = hostRef.current;
    if (host && processed) host.innerHTML = processed;
  }, [processed]);

  if (!raw) return null;

  return (
    <div className="relative w-full rounded bg-muted/20 overflow-hidden" style={{ maxHeight }}>
      <div ref={hostRef} className="w-full" style={{ maxHeight }} />
      {overlayScene && Array.isArray(overlayScene.elements) && overlayScene.elements.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <PathwaySceneSVG scene={overlayScene} maxHeight={maxHeight} />
        </div>
      )}
    </div>
  );
}

function cssEscape(s: string): string {
  // Простое экранирование для querySelector
  return s.replace(/([^\w-])/g, "\\$1");
}

function readShapeGeom(el: SVGGraphicsElement): { x: number; y: number; w: number; h: number } | null {
  const tag = el.tagName.toLowerCase();
  const num = (a: string | null) => (a == null ? NaN : Number(a));
  if (tag === "rect") {
    const x = num(el.getAttribute("x"));
    const y = num(el.getAttribute("y"));
    const w = num(el.getAttribute("width"));
    const h = num(el.getAttribute("height"));
    if ([x, y, w, h].every((n) => !isNaN(n))) return { x, y, w, h };
  }
  if (tag === "circle") {
    const cx = num(el.getAttribute("cx"));
    const cy = num(el.getAttribute("cy"));
    const r = num(el.getAttribute("r"));
    if ([cx, cy, r].every((n) => !isNaN(n))) return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
  }
  if (tag === "ellipse") {
    const cx = num(el.getAttribute("cx"));
    const cy = num(el.getAttribute("cy"));
    const rx = num(el.getAttribute("rx"));
    const ry = num(el.getAttribute("ry"));
    if ([cx, cy, rx, ry].every((n) => !isNaN(n))) return { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 };
  }
  return null;
}
