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
      const badgeY = y + height + 4;

      const badge = document.createElementNS(SVG_NS, "g");
      badge.setAttribute("class", "val-dyn");
      badge.setAttribute("pointer-events", "none");

      const background = document.createElementNS(SVG_NS, "rect");
      background.setAttribute("x", String(x + 8));
      background.setAttribute("y", String(badgeY));
      background.setAttribute("width", String(Math.max(0, width - 16)));
      background.setAttribute("height", "18");
      background.setAttribute("rx", "6");
      background.setAttribute("fill", "#FFFFFF");
      background.setAttribute("fill-opacity", "0.96");
      background.setAttribute("stroke", STATUS_STROKE[status]);
      background.setAttribute("stroke-width", "0.8");

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", String(x + width / 2));
      text.setAttribute("y", String(badgeY + 13));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "10");
      text.setAttribute("font-weight", "700");
      text.setAttribute("fill", "#1f2d33");
      text.textContent = displayValue;

      badge.append(background, text);
      rect.parentElement?.parentElement?.appendChild(badge);
    });
  }, [preparedMarkup, values, onNodeClick]);

  return (
    <div style={{ overflowX: "auto" }}>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: preparedMarkup }} />
    </div>
  );
}
