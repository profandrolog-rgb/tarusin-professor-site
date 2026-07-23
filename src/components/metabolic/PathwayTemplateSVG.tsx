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
export type NodeValue = { text: string; sev?: Severity };

export function PathwayTemplateSVG({
  slug,
  highlights,
  rxNodes,
  rxLabelByNode,
  nodeValues,
  overlayScene,
  maxHeight = 320,
}: {
  slug: string;
  highlights?: Map<string, Severity>;
  rxNodes?: Set<string>;
  rxLabelByNode?: Map<string, string>;
  nodeValues?: Map<string, NodeValue>;
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
    const svgNS = "http://www.w3.org/2000/svg";

    // 1) Подсветка узлов
    if (highlights && highlights.size) {
      highlights.forEach((sev, nodeId) => {
        const g = svg.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`);
        if (g) g.setAttribute("data-sev", sevAttr(sev));
      });
    }

    // 1b) Значения показателей в отдельных бейджах.
    // Бейдж не должен попадать поверх подписи узла или соседней стрелки.
    if (nodeValues && nodeValues.size) {
      const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
      const nodeGeoms = Array.from(svg.querySelectorAll<SVGGElement>("[data-node-id]")).flatMap((node) => {
        const shape = node.querySelector(".node-shape") as SVGGraphicsElement | null;
        const geom = shape ? readShapeGeom(shape) : null;
        return geom ? [{ node, geom }] : [];
      });
      const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
        a.x < b.x + b.w + 3 && a.x + a.w + 3 > b.x && a.y < b.y + b.h + 3 && a.y + a.h + 3 > b.y;
      nodeValues.forEach((val, nodeId) => {
        const g = svg.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`) as SVGGElement | null;
        if (!g) return;
        // Проставим data-sev, если ещё не выставлено highlights
        if (val.sev && !g.getAttribute("data-sev")) g.setAttribute("data-sev", sevAttr(val.sev));
        const shape = g.querySelector(".node-shape") as SVGGraphicsElement | null;
        if (!shape) return;
        const geom = readShapeGeom(shape);
        if (!geom) return;
        // Убираем возможный дубль от предыдущего рендера
        g.querySelectorAll(".lbl-v").forEach((n) => n.remove());
        const lines = val.text.trim().split(/\s+/).reduce<string[]>((out, word) => {
          const last = out[out.length - 1] || "";
          if (last && `${last} ${word}`.length > 18) out[out.length - 1] = `${last} ${word}`.slice(0, 17) + "…";
          else if (last) out[out.length - 1] = `${last} ${word}`;
          else out.push(word);
          return out;
        }, []).slice(0, 2);
        const badgeW = Math.max(76, Math.min(geom.w + 28, 150));
        const badgeH = lines.length > 1 ? 27 : 18;
        const candidates = [
          { x: geom.x + geom.w / 2 - badgeW / 2, y: geom.y + geom.h + 5, w: badgeW, h: badgeH },
          { x: geom.x + geom.w / 2 - badgeW / 2, y: geom.y - badgeH - 5, w: badgeW, h: badgeH },
          { x: geom.x + geom.w + 6, y: geom.y + geom.h / 2 - badgeH / 2, w: badgeW, h: badgeH },
          { x: geom.x - badgeW - 6, y: geom.y + geom.h / 2 - badgeH / 2, w: badgeW, h: badgeH },
        ];
        const view = readViewBox(svg);
        const badge = candidates.find((candidate) =>
          candidate.x >= 0 && candidate.y >= 0 && candidate.x + candidate.w <= view.w && candidate.y + candidate.h <= view.h &&
          !nodeGeoms.some(({ geom: other }) => other.x !== geom.x && intersects(candidate, other)) &&
          !occupied.some((other) => intersects(candidate, other)),
        ) || candidates[0];
        occupied.push(badge);
        const badgeGroup = doc.createElementNS(svgNS, "g");
        badgeGroup.setAttribute("class", "lbl-v");
        badgeGroup.setAttribute("pointer-events", "none");
        const bg = doc.createElementNS(svgNS, "rect");
        bg.setAttribute("x", String(badge.x)); bg.setAttribute("y", String(badge.y));
        bg.setAttribute("width", String(badge.w)); bg.setAttribute("height", String(badge.h));
        bg.setAttribute("rx", "5"); bg.setAttribute("fill", "#fff"); bg.setAttribute("fill-opacity", "0.96");
        bg.setAttribute("stroke", "#94a3b8"); bg.setAttribute("stroke-width", "0.8");
        const t = doc.createElementNS(svgNS, "text");
        t.setAttribute("x", String(badge.x + badge.w / 2)); t.setAttribute("text-anchor", "middle");
        t.setAttribute("font-size", lines.length > 1 ? "10" : "11"); t.setAttribute("font-weight", "700"); t.setAttribute("fill", "#22303C");
        lines.forEach((line, index) => {
          const span = doc.createElementNS(svgNS, "tspan");
          span.setAttribute("x", String(badge.x + badge.w / 2)); span.setAttribute("y", String(badge.y + 12 + index * 11)); span.textContent = line;
          t.appendChild(span);
        });
        badgeGroup.append(bg, t); g.appendChild(badgeGroup);
      });
    }

    // 2) Маркеры ℞
    if (rxNodes && rxNodes.size) {
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
  }, [raw, highlights, rxNodes, rxLabelByNode, nodeValues]);

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

function readViewBox(svg: SVGSVGElement): { w: number; h: number } {
  const values = svg.getAttribute("viewBox")?.trim().split(/\s+/).map(Number) || [];
  return { w: Number.isFinite(values[2]) ? values[2] : 0, h: Number.isFinite(values[3]) ? values[3] : 0 };
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
