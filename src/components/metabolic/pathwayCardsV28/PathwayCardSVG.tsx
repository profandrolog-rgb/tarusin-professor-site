import { useEffect, useId, useMemo, useRef } from "react";

export type NodeStatus = "norm" | "mild" | "moderate" | "severe" | "nodata";

export interface NodeValue {
  value?: number | string;
  status: NodeStatus;
}

export interface PathwaySchemeProps {
  values?: Record<string, NodeValue>;
  onNodeClick?: (nodeId: string) => void;
}

export interface PathwayCardSVGProps extends PathwaySchemeProps {
  markup: string;
}

const STATUS_STROKE: Record<NodeStatus, string> = {
  norm: "#3f7d4f",
  mild: "#E0A800",
  moderate: "#E8730C",
  severe: "#C0392B",
  nodata: "#9aa0a6",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  norm: "норма",
  mild: "лёгкое отклонение",
  moderate: "умеренное отклонение",
  severe: "выраженное отклонение",
  nodata: "нет данных",
};

const SVG_NS = "http://www.w3.org/2000/svg";
const VALUE_LINE_LIMIT = 20;

type Box = { x: number; y: number; w: number; h: number };

/** Keep a displayed value readable without losing the full value in <title>. */
export function wrapValueLines(value: string, maxChars = VALUE_LINE_LIMIT): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= 2) return lines;
  const second = lines.slice(1).join(" ");
  return [lines[0], second.length > maxChars ? `${second.slice(0, maxChars - 1).trimEnd()}…` : second];
}

function intersects(a: Box, b: Box, gap = 2): boolean {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

function parseViewBox(svg: SVGSVGElement): { width: number; height: number } {
  const raw = svg.getAttribute("viewBox")?.trim().split(/\s+/).map(Number) || [];
  return {
    width: Number.isFinite(raw[2]) ? raw[2] : Number(svg.getAttribute("width")) || 0,
    height: Number.isFinite(raw[3]) ? raw[3] : Number(svg.getAttribute("height")) || 0,
  };
}

export function PathwayCardSVG({
  markup,
  values = {},
  onNodeClick,
}: PathwayCardSVGProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const arrowId = useMemo(
    () => `pathway-arrow-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId],
  );
  const preparedMarkup = useMemo(
    () => markup.split("__ARROW_ID__").join(arrowId),
    [markup, arrowId],
  );

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll("g.val-dyn, title.node-title-dyn").forEach((node) => node.remove());

    const rects = root.querySelectorAll<SVGRectElement>("[data-node-id]");
    const svg = root.querySelector("svg") as SVGSVGElement | null;
    const viewBox = svg ? parseViewBox(svg) : { width: 0, height: 0 };
    const nodeBoxes: Box[] = Array.from(rects).map((node) => ({
      x: Number(node.getAttribute("x") ?? 0),
      y: Number(node.getAttribute("y") ?? 0),
      w: Number(node.getAttribute("width") ?? 0),
      h: Number(node.getAttribute("height") ?? 0),
    }));
    const occupiedBadges: Box[] = [];
    rects.forEach((rect) => {
      const nodeId = rect.getAttribute("data-node-id");
      if (!nodeId) return;
      const value = values[nodeId];
      const status: NodeStatus = value?.status ?? "nodata";
      const isContext = rect.classList.contains("ctx");

      rect.dataset.status = status;
      rect.style.stroke = STATUS_STROKE[status];
      rect.style.strokeDasharray = isContext
        ? "6 3"
        : status === "nodata"
          ? "5 3"
          : "none";

      const parent = rect.parentElement;
      const name = Array.from(parent?.querySelectorAll("text.nm") ?? [])
        .map((node) => node.textContent?.trim())
        .filter(Boolean)
        .join(" ");
      const code = parent?.querySelector("text.code")?.textContent?.trim();
      const displayValue =
        value?.value === null || value?.value === undefined || value.value === ""
          ? null
          : String(value.value);
      const accessibleLabel = [name || nodeId, code, displayValue, STATUS_LABEL[status]]
        .filter(Boolean)
        .join(" · ");

      rect.setAttribute("aria-label", accessibleLabel);
      const title = document.createElementNS(SVG_NS, "title");
      title.setAttribute("class", "node-title-dyn");
      title.textContent = accessibleLabel;
      parent?.prepend(title);

      const clickableRect = rect as SVGRectElement & {
        onclick: ((event: MouseEvent) => void) | null;
        onkeydown: ((event: KeyboardEvent) => void) | null;
      };
      if (onNodeClick) {
        rect.style.cursor = "pointer";
        rect.setAttribute("role", "button");
        rect.setAttribute("tabindex", "0");
        clickableRect.onclick = () => onNodeClick(nodeId);
        clickableRect.onkeydown = (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onNodeClick(nodeId);
          }
        };
      } else {
        rect.style.cursor = "";
        rect.removeAttribute("role");
        rect.removeAttribute("tabindex");
        clickableRect.onclick = null;
        clickableRect.onkeydown = null;
      }

      if (displayValue === null) return;

      const x = Number(rect.getAttribute("x") ?? 0);
      const y = Number(rect.getAttribute("y") ?? 0);
      const width = Number(rect.getAttribute("width") ?? 0);
      const height = Number(rect.getAttribute("height") ?? 0);
      const currentBox: Box = { x, y, w: width, h: height };
      const lines = wrapValueLines(displayValue);
      const badgeHeight = lines.length > 1 ? 30 : 18;
      const badgeWidth = Math.max(0, width - 16);
      const candidates: Box[] = [
        { x: x + 8, y: y + height + 4, w: badgeWidth, h: badgeHeight },
        { x: x + 8, y: y - badgeHeight - 4, w: badgeWidth, h: badgeHeight },
        { x: x + width + 8, y: y + (height - badgeHeight) / 2, w: badgeWidth, h: badgeHeight },
        { x: x - badgeWidth - 8, y: y + (height - badgeHeight) / 2, w: badgeWidth, h: badgeHeight },
      ];
      const badge = candidates.find((candidate) => {
        const outside = viewBox.width > 0 && (candidate.x < 0 || candidate.x + candidate.w > viewBox.width || candidate.y < 0 || candidate.y + candidate.h > viewBox.height);
        if (outside) return false;
        const hitsNode = nodeBoxes.some((nodeBox) =>
          (nodeBox.x !== currentBox.x || nodeBox.y !== currentBox.y || nodeBox.w !== currentBox.w || nodeBox.h !== currentBox.h) &&
          intersects(candidate, nodeBox),
        );
        return !hitsNode && !occupiedBadges.some((other) => intersects(candidate, other));
      }) || candidates[0];
      occupiedBadges.push(badge);

      const badgeGroup = document.createElementNS(SVG_NS, "g");
      badgeGroup.setAttribute("class", "val-dyn");
      badgeGroup.setAttribute("pointer-events", "none");

      const background = document.createElementNS(SVG_NS, "rect");
      background.setAttribute("x", String(badge.x));
      background.setAttribute("y", String(badge.y));
      background.setAttribute("width", String(badge.w));
      background.setAttribute("height", String(badge.h));
      background.setAttribute("rx", "6");
      background.setAttribute("fill", "#FFFFFF");
      background.setAttribute("fill-opacity", "0.96");
      background.setAttribute("stroke", STATUS_STROKE[status]);
      background.setAttribute("stroke-width", "0.8");

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", String(badge.x + badge.w / 2));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", lines.length > 1 ? "9" : "10");
      text.setAttribute("font-weight", "700");
      text.setAttribute("fill", "#1f2d33");
      lines.forEach((line, index) => {
        const tspan = document.createElementNS(SVG_NS, "tspan");
        tspan.setAttribute("x", String(badge.x + badge.w / 2));
        tspan.setAttribute("y", String(badge.y + 12 + index * 11));
        tspan.textContent = line;
        text.appendChild(tspan);
      });

      badgeGroup.append(background, text);
      rect.parentElement?.parentElement?.appendChild(badgeGroup);
    });
  }, [preparedMarkup, values, onNodeClick]);

  return (
    <div style={{ overflowX: "auto" }}>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: preparedMarkup }} />
    </div>
  );
}
