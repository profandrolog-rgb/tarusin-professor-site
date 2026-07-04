import { useMemo } from "react";

export type SchemeStatus = "norm" | "mild" | "moderate" | "severe" | "nodata";
export interface SchemeValue { value: number | string; status: SchemeStatus }
export interface EndoDisruptorsSchemeSVGProps {
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
      x={x} y={y} width={width} height={height} rx={7}
      fill={fill} stroke={finalStroke} strokeWidth={2}
      strokeDasharray={finalDash}
      style={{ cursor: onNodeClick ? "pointer" : undefined }}
      onClick={onNodeClick ? () => onNodeClick(id) : undefined}
    />
  );
}

function ValText({ id, cx, y, values }: {
  id: string; cx: number; y: number; values?: Record<string, SchemeValue>;
}) {
  const v = values?.[id];
  if (!v || v.value === "" || v.value == null) return null;
  return (
    <text x={cx} y={y} fontSize={9.5} fontWeight={700} textAnchor="middle" fill="#20303f">
      {String(v.value)}
    </text>
  );
}

export function EndoDisruptorsSchemeSVG({ values, onNodeClick }: EndoDisruptorsSchemeSVGProps) {
  const v = useMemo(() => values, [values]);
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" height="auto" viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg" fontFamily="Arial, sans-serif" style={{ minWidth: 700 }}>
        <defs>
          <marker id="ed-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#5A6B7B"/></marker>
          <marker id="ed-arrG" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#2f6f4f"/></marker>
          <style>{`
            .lbl{font-size:12px;font-weight:bold;fill:#20303f;text-anchor:middle;}
            .sub{font-size:9.5px;fill:#516070;text-anchor:middle;}
            .cons{font-size:11px;fill:#2f6f4f;font-weight:bold;text-anchor:middle;}
            .ttl{font-size:20px;font-weight:bold;fill:#20303f;}
            .st{font-size:11px;fill:#6a7886;}
            .grp{font-size:12px;font-weight:bold;text-anchor:middle;}
          `}</style>
        </defs>
        <text x={30} y={34} className="ttl">Эндокринные дизрапторы (endocrine_disruptors)</text>
        <text x={30} y={54} className="st">Маркеры экспозиции (моча, ВЭЖХ-МС/МС, на креатинин). Высокий уровень → влияние на мишени. Зелёным — consequences.</text>

        <text x={180} y={88} className="grp" fill="#a15a9e">Бисфенолы</text>
        <Node id="bpa" x={60} y={98} width={110} height={42} fill="#F3E3F1" stroke="#a15a9e" values={v} onNodeClick={onNodeClick} />
        <text x={115} y={115} className="lbl">Бисфенол A</text><text x={115} y={131} className="sub">BPA</text>
        <ValText id="bpa" cx={115} y={155} values={v} />

        <Node id="bps" x={180} y={98} width={90} height={42} fill="#F3E3F1" stroke="#a15a9e" values={v} onNodeClick={onNodeClick} />
        <text x={225} y={115} className="lbl">BPS / BPF</text><text x={225} y={131} className="sub">заменители</text>
        <ValText id="bps" cx={225} y={155} values={v} />

        <text x={520} y={88} className="grp" fill="#2b6ca3">Фталаты (метаболиты)</text>
        <Node id="mehp" x={330} y={98} width={100} height={42} fill="#DCE9F5" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={380} y={115} className="lbl">MEHP</text><text x={380} y={131} className="sub">из DEHP</text>
        <ValText id="mehp" cx={380} y={155} values={v} />

        <Node id="mep" x={440} y={98} width={90} height={42} fill="#DCE9F5" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={485} y={115} className="lbl">MEP / MBP</text>
        <ValText id="mep" cx={485} y={155} values={v} />

        <Node id="mbzp" x={540} y={98} width={90} height={42} fill="#DCE9F5" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={585} y={115} className="lbl">MBzP</text>
        <ValText id="mbzp" cx={585} y={155} values={v} />

        <Node id="parabens" x={640} y={98} width={110} height={42} fill="#F3E8DC" stroke="#B0752A" values={v} onNodeClick={onNodeClick} />
        <text x={695} y={115} className="lbl">Парабены</text><text x={695} y={131} className="sub">сумма</text>
        <ValText id="parabens" cx={695} y={155} values={v} />

        <line x1={200} y1={168} x2={380} y2={182} stroke="#5A6B7B" strokeWidth={1.5} markerEnd="url(#ed-arrow)"/>
        <line x1={450} y1={168} x2={420} y2={182} stroke="#5A6B7B" strokeWidth={1.5} markerEnd="url(#ed-arrow)"/>
        <line x1={600} y1={168} x2={460} y2={182} stroke="#5A6B7B" strokeWidth={1.5} markerEnd="url(#ed-arrow)"/>
        <rect x={310} y={188} width={260} height={50} rx={8} fill="#FCE9CF" stroke="#B0752A" strokeWidth={2}/>
        <text x={440} y={209} className="lbl">Суммарная нагрузка дизрапторами</text>
        <text x={440} y={227} className="sub">интегральный фактор-модификатор</text>

        <line x1={380} y1={238} x2={180} y2={288} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#ed-arrG)"/>
        <line x1={410} y1={238} x2={360} y2={288} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#ed-arrG)"/>
        <line x1={470} y1={238} x2={540} y2={288} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#ed-arrG)"/>
        <line x1={500} y1={238} x2={710} y2={288} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#ed-arrG)"/>

        <rect x={70} y={290} width={210} height={44} rx={8} fill="#E4F2E9" stroke="#2f6f4f" strokeWidth={1.5}/>
        <text x={175} y={316} className="cons">→ hpg_axis (сперматогенез)</text>
        <rect x={290} y={290} width={200} height={44} rx={8} fill="#E4F2E9" stroke="#2f6f4f" strokeWidth={1.5}/>
        <text x={390} y={316} className="cons">→ steroidogenesis</text>
        <rect x={500} y={290} width={180} height={44} rx={8} fill="#E4F2E9" stroke="#2f6f4f" strokeWidth={1.5}/>
        <text x={590} y={316} className="cons">→ detox_p12</text>
        <rect x={690} y={290} width={150} height={44} rx={8} fill="#E4F2E9" stroke="#2f6f4f" strokeWidth={1.5}/>
        <text x={765} y={316} className="cons">→ hpo_axis</text>

        <rect x={70} y={352} width={770} height={100} rx={8} fill="#FBFBF7" stroke="#C9B79A"/>
        <text x={90} y={374} style={{ fontSize: 12, fontWeight: "bold", fill: "#8a6d3b" }}>Клиническое значение для андрологии:</text>
        <text x={90} y={396} style={{ fontSize: 11, fill: "#3d3d3d" }}>• BPA ассоциирован с PCOS, ожирением, инсулинорезистентностью; ↑ у пациентов с нарушением фертильности.</text>
        <text x={90} y={416} style={{ fontSize: 11, fill: "#3d3d3d" }}>• Фталаты (MEHP и др.) — антиандрогенный эффект: связь с крипторхизмом, гипоспадией, снижением аногенитального расстояния.</text>
        <text x={90} y={436} style={{ fontSize: 11, fill: "#3d3d3d" }}>• Пренатальная/детская экспозиция особенно значима. Маркеры — моча на ВЭЖХ-МС/МС, не рутинный, но измеримый скрининг.</text>
      </svg>
    </div>
  );
}

export default EndoDisruptorsSchemeSVG;
