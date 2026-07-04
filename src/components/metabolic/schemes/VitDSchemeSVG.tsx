import { useMemo } from "react";

export type SchemeStatus = "norm" | "mild" | "moderate" | "severe" | "nodata";
export interface SchemeValue { value: number | string; status: SchemeStatus }
export interface VitDSchemeSVGProps {
  values?: Record<string, SchemeValue>;
  onNodeClick?: (nodeId: string) => void;
}

const STATUS_STROKE: Record<SchemeStatus, string> = {
  norm: "#3f7d4f",
  mild: "#E0A800",
  moderate: "#E8730C",
  severe: "#C0392B",
  nodata: "#94a3b8",
};

function Node({
  id, x, y, width, height, fill, stroke, values, onNodeClick,
}: {
  id: string; x: number; y: number; width: number; height: number;
  fill: string; stroke: string;
  values?: Record<string, SchemeValue>;
  onNodeClick?: (id: string) => void;
}) {
  const v = values?.[id];
  const finalStroke = v ? STATUS_STROKE[v.status] : stroke;
  const finalDash = v && v.status === "nodata" ? "5,3" : undefined;
  return (
    <rect
      data-node-id={id}
      x={x} y={y} width={width} height={height} rx={8}
      fill={fill} stroke={finalStroke} strokeWidth={2}
      strokeDasharray={finalDash}
      style={{ cursor: onNodeClick ? "pointer" : undefined }}
      onClick={onNodeClick ? () => onNodeClick(id) : undefined}
    />
  );
}

function ValText({ id, cx, bottomY, values }: {
  id: string; cx: number; bottomY: number; values?: Record<string, SchemeValue>;
}) {
  const v = values?.[id];
  if (!v || v.value === "" || v.value == null) return null;
  return (
    <text x={cx} y={bottomY - 4} fontSize={10} textAnchor="middle" fill="#20303f">
      {String(v.value)}
    </text>
  );
}

export function VitDSchemeSVG({ values, onNodeClick }: VitDSchemeSVGProps) {
  const v = useMemo(() => values, [values]);
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" height="auto" viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" fontFamily="Arial, sans-serif" style={{ minWidth: 640 }}>
        <defs>
          <marker id="vd-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#5A6B7B"/></marker>
          <marker id="vd-arrowB" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#B0752A"/></marker>
          <marker id="vd-arrG" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#2f6f4f"/></marker>
          <style>{`
            .lbl{font-size:13px;font-weight:bold;fill:#20303f;text-anchor:middle;}
            .sub{font-size:10px;fill:#516070;text-anchor:middle;}
            .cons{font-size:11px;fill:#2f6f4f;font-weight:bold;text-anchor:middle;}
            .ttl{font-size:20px;font-weight:bold;fill:#20303f;}
            .st{font-size:11px;fill:#6a7886;}
          `}</style>
        </defs>
        <text x={30} y={34} className="ttl">Витамин D и минеральный обмен (vit_d_bone)</text>
        <text x={30} y={54} className="st">Витамин D → регуляция кальций-фосфорного обмена и минерализации кости. Зелёным — consequences.</text>

        <Node id="vitamin_d" x={60} y={90} width={180} height={52} fill="#EAF0F6" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={150} y={112} className="lbl">25-ОН витамин D</text>
        <text x={150} y={130} className="sub">депо-форма (маркер статуса)</text>
        <ValText id="vitamin_d" cx={150} bottomY={142} values={v} />
        <line x1={240} y1={116} x2={320} y2={116} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#vd-arrow)"/>

        <Node id="vitamin_d_active" x={320} y={90} width={180} height={52} fill="#DCE9F5" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={410} y={112} className="lbl">1,25-ОН витамин D</text>
        <text x={410} y={130} className="sub">активная форма (кальцитриол)</text>
        <ValText id="vitamin_d_active" cx={410} bottomY={142} values={v} />

        <Node id="pth" x={600} y={90} width={180} height={52} fill="#F3E8DC" stroke="#B0752A" values={v} onNodeClick={onNodeClick} />
        <text x={690} y={112} className="lbl">Паратгормон (ПТГ)</text>
        <text x={690} y={130} className="sub">регулятор Ca/P</text>
        <ValText id="pth" cx={690} bottomY={142} values={v} />
        <line x1={600} y1={116} x2={500} y2={116} stroke="#B0752A" strokeWidth={2} strokeDasharray="4,3" markerEnd="url(#vd-arrowB)"/>

        <line x1={410} y1={142} x2={410} y2={180} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#vd-arrow)"/>
        <Node id="calcium" x={230} y={182} width={160} height={48} fill="#E4F2E9" stroke="#3f7d4f" values={v} onNodeClick={onNodeClick} />
        <text x={310} y={203} className="lbl">Кальций</text>
        <text x={310} y={220} className="sub">общий / ионизированный</text>
        <ValText id="calcium" cx={310} bottomY={230} values={v} />

        <Node id="phosphate" x={430} y={182} width={160} height={48} fill="#E4F2E9" stroke="#3f7d4f" values={v} onNodeClick={onNodeClick} />
        <text x={510} y={203} className="lbl">Фосфор</text>
        <text x={510} y={220} className="sub">неорганический</text>
        <ValText id="phosphate" cx={510} bottomY={230} values={v} />

        <line x1={380} y1={160} x2={320} y2={182} stroke="#5A6B7B" strokeWidth={1.5} markerEnd="url(#vd-arrow)"/>
        <line x1={440} y1={160} x2={500} y2={182} stroke="#5A6B7B" strokeWidth={1.5} markerEnd="url(#vd-arrow)"/>

        <Node id="alp" x={620} y={182} width={180} height={48} fill="#F0EBE2" stroke="#9a8a72" values={v} onNodeClick={onNodeClick} />
        <text x={710} y={203} className="lbl">Щелочная фосфатаза</text>
        <text x={710} y={220} className="sub">маркер активности остеобластов</text>
        <ValText id="alp" cx={710} bottomY={230} values={v} />

        <line x1={310} y1={230} x2={310} y2={280} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#vd-arrG)"/>
        <rect x={180} y={282} width={260} height={44} rx={8} fill="#E4F2E9" stroke="#2f6f4f" strokeWidth={1.5}/>
        <text x={310} y={308} className="cons">→ bone_mineral (минерализация)</text>

        <line x1={510} y1={230} x2={510} y2={280} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#vd-arrG)"/>
        <rect x={460} y={282} width={240} height={44} rx={8} fill="#E4F2E9" stroke="#2f6f4f" strokeWidth={1.5}/>
        <text x={580} y={308} className="cons">→ growth_igf1 (рост)</text>

        <rect x={180} y={344} width={520} height={52} rx={8} fill="#FBFBF7" stroke="#C9B79A"/>
        <text x={200} y={366} style={{ fontSize: 11, fill: "#3d3d3d" }}>Дефицит 25-ОН D &lt;20 нг/мл → ↓ минерализация, рахит/остеомаляция, задержка роста,</text>
        <text x={200} y={384} style={{ fontSize: 11, fill: "#3d3d3d" }}>вторичный гиперпаратиреоз (↑ПТГ), у мальчиков — задержка пубертата, ↓ тестостерона.</text>
      </svg>
    </div>
  );
}

export default VitDSchemeSVG;
