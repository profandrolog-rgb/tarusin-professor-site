import { useMemo } from "react";

export type SteroidStatus = "norm" | "mild" | "moderate" | "severe" | "nodata";
export interface SteroidValue {
  value: number | string;
  status: SteroidStatus;
}
export interface SteroidHubSVGProps {
  values?: Record<string, SteroidValue>;
  onNodeClick?: (nodeId: string) => void;
}

const STATUS_STROKE: Record<SteroidStatus, string> = {
  norm: "#3f7d4f",
  mild: "#E0A800",
  moderate: "#E8730C",
  severe: "#C0392B",
  nodata: "#94a3b8",
};

/**
 * Node — прямоугольник схемы стероидогенеза с data-node-id.
 * Если статус задан в values — переопределяем stroke (и dash для nodata).
 * Иначе — оставляем исходный цвет ветви (пропы stroke/strokeDasharray).
 */
function Node({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeDasharray,
  values,
  onNodeClick,
}: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeDasharray?: string;
  values?: Record<string, SteroidValue>;
  onNodeClick?: (id: string) => void;
}) {
  const v = values?.[id];
  const finalStroke = v ? STATUS_STROKE[v.status] : stroke;
  const finalDash = v ? (v.status === "nodata" ? "5,3" : undefined) : strokeDasharray;
  return (
    <rect
      data-node-id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      fill={fill}
      stroke={finalStroke}
      strokeDasharray={finalDash}
      className="node"
      style={{ cursor: onNodeClick ? "pointer" : undefined }}
      onClick={onNodeClick ? () => onNodeClick(id) : undefined}
    />
  );
}

function ValText({
  id,
  cx,
  bottomY,
  values,
}: {
  id: string;
  cx: number;
  bottomY: number;
  values?: Record<string, SteroidValue>;
}) {
  const v = values?.[id];
  if (!v || v.value === "" || v.value === null || v.value === undefined) return null;
  const text = String(v.value);
  const badgeWidth = Math.max(84, Math.min(176, text.length * 7 + 18));
  return (
    <g className="val" pointerEvents="none">
      <rect x={cx - badgeWidth / 2} y={bottomY + 2} width={badgeWidth} height={20} rx={5} fill="#fff" fillOpacity={0.96} stroke={STATUS_STROKE[v.status]} strokeWidth={1} />
      <text x={cx} y={bottomY + 16} fontSize={12} fontWeight={700} textAnchor="middle" fill="#20303f">{text}</text>
    </g>
  );
}

export function SteroidHubSVG({ values, onNodeClick }: SteroidHubSVGProps) {
  // мемоизация не критична, но не мешает
  const v = useMemo(() => values, [values]);

  return (
    <div className="w-full overflow-hidden">
      <svg
        width="100%"
        height="auto"
        viewBox="0 0 1240 960"
        xmlns="http://www.w3.org/2000/svg"
        fontFamily="Arial, sans-serif"
        style={{ display: "block" }}
      >
        <defs>
          <marker id="sh-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 Z" fill="#5A6B7B" />
          </marker>
          <marker id="sh-arrowEnz" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#B0752A" />
          </marker>
          <marker id="sh-arrowV" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#8a3d84" />
          </marker>
          <style>{`
            .node{stroke-width:2;rx:8;}
            .lbl{font-size:13px;font-weight:bold;fill:#20303f;text-anchor:middle;}
            .sub{font-size:10px;fill:#516070;text-anchor:middle;}
            .enz{font-size:10px;fill:#B0752A;font-style:italic;text-anchor:middle;}
            .branch{font-size:14px;font-weight:bold;text-anchor:middle;}
            .cons{font-size:11px;fill:#2f6f4f;font-weight:bold;text-anchor:middle;}
            .title{font-size:22px;font-weight:bold;fill:#20303f;}
            .stitle{font-size:12px;fill:#6a7886;}
          `}</style>
        </defs>

        <text x={40} y={42} className="title">Стероидогенез — хаб (steroidogenesis)</text>
        <text x={40} y={64} className="stitle">Холестерин → прегненолон → 3 ветви. Оранжевым — ферменты (точки блока / ВДКН). Фиолетовым — Т→ДГТ. Зелёным — consequences.</text>

        {/* CHOLESTEROL */}
        <Node id="cholesterol" x={520} y={86} width={200} height={46} fill="#EAF0F6" stroke="#5A6B7B" values={v} onNodeClick={onNodeClick} />
        <text x={620} y={105} className="lbl">Холестерин</text>
        <text x={620} y={122} className="sub">субстрат (из lipids)</text>
        <ValText id="cholesterol" cx={620} bottomY={132} values={v} />
        <text x={790} y={152} className="enz">StAR / CYP11A1 (десмолаза)</text>
        <line x1={620} y1={132} x2={620} y2={170} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />

        {/* PREGNENOLONE (inferred) */}
        <Node id="pregnenolone" x={520} y={172} width={200} height={46} fill="#F0EBE2" stroke="#9a8a72" strokeDasharray="5,3" values={v} onNodeClick={onNodeClick} />
        <text x={620} y={191} className="lbl">Прегненолон</text>
        <text x={620} y={208} className="sub">inferred · общий предшественник</text>
        <ValText id="pregnenolone" cx={620} bottomY={218} values={v} />

        <text x={450} y={250} className="enz">3β-HSD</text>
        <text x={900} y={238} className="enz">CYP17 (17α-гидроксилаза)</text>

        <line x1={585} y1={220} x2={490} y2={260} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <line x1={700} y1={220} x2={880} y2={260} stroke="#B0752A" strokeWidth={2} markerEnd="url(#sh-arrowEnz)" />

        {/* 17-OH-PREGNENOLONE (inferred) */}
        <Node id="17oh_pregnenolone" x={820} y={264} width={200} height={44} fill="#F0EBE2" stroke="#9a8a72" strokeDasharray="5,3" values={v} onNodeClick={onNodeClick} />
        <text x={920} y={282} className="lbl">17-ОН-прегненолон</text>
        <text x={920} y={298} className="sub">inferred · развилка к андрогенам</text>
        <ValText id="17oh_pregnenolone" cx={920} bottomY={308} values={v} />

        {/* PROGESTERONE */}
        <Node id="progesterone" x={370} y={264} width={200} height={44} fill="#EAF0F6" stroke="#5A6B7B" values={v} onNodeClick={onNodeClick} />
        <text x={470} y={282} className="lbl">Прогестерон</text>
        <text x={470} y={298} className="sub">17-OHP путь ниже</text>
        <ValText id="progesterone" cx={470} bottomY={308} values={v} />

        <text x={290} y={322} className="enz">21-гидроксилаза</text>
        <line x1={430} y1={308} x2={270} y2={356} stroke="#B0752A" strokeWidth={2} markerEnd="url(#sh-arrowEnz)" />
        <text x={558} y={322} className="enz">CYP17</text>
        <line x1={490} y1={308} x2={530} y2={356} stroke="#B0752A" strokeWidth={2} markerEnd="url(#sh-arrowEnz)" />

        {/* MINERALOCORTICOIDS */}
        <text x={150} y={386} className="branch" fill="#2b6ca3">Минералокортикоиды</text>
        <Node id="doc" x={60} y={398} width={200} height={42} fill="#DCE9F5" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={160} y={415} className="lbl">Дезоксикортикостерон</text>
        <text x={160} y={431} className="sub">ДОК</text>
        <ValText id="doc" cx={160} bottomY={440} values={v} />
        <line x1={160} y1={440} x2={160} y2={470} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <text x={290} y={459} className="enz">11β-гидроксилаза</text>
        <Node id="corticosterone" x={60} y={472} width={200} height={42} fill="#DCE9F5" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={160} y={489} className="lbl">Кортикостерон</text>
        <text x={160} y={505} className="sub">B</text>
        <ValText id="corticosterone" cx={160} bottomY={514} values={v} />
        <line x1={160} y1={514} x2={160} y2={544} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <text x={290} y={533} className="enz">альдостерон-синтаза</text>
        <Node id="aldosterone" x={60} y={546} width={200} height={42} fill="#C9DEF0" stroke="#2b6ca3" values={v} onNodeClick={onNodeClick} />
        <text x={160} y={563} className="lbl">Альдостерон</text>
        <text x={160} y={579} className="sub">конечный минералокортикоид</text>
        <ValText id="aldosterone" cx={160} bottomY={588} values={v} />
        <line x1={160} y1={588} x2={160} y2={624} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#sh-arrow)" />
        <rect x={55} y={626} width={210} height={40} rx={8} fill="#E4F2E9" stroke="#2f6f4f" className="node" />
        <text x={160} y={651} className="cons">→ electrolytes_abr (Na⁺/K⁺)</text>

        {/* GLUCOCORTICOIDS */}
        <text x={470} y={386} className="branch" fill="#3f7d4f">Глюкокортикоиды</text>
        <Node id="ohp17" x={370} y={398} width={200} height={42} fill="#E4F2E9" stroke="#3f7d4f" values={v} onNodeClick={onNodeClick} />
        <text x={470} y={415} className="lbl">17-ОН-прогестерон</text>
        <text x={470} y={431} className="sub">17-OHP · маркер ВДКН</text>
        <ValText id="ohp17" cx={470} bottomY={440} values={v} />
        <line x1={470} y1={440} x2={470} y2={470} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <text x={600} y={459} className="enz">21-гидроксилаза</text>
        <Node id="11_deoxycortisol" x={370} y={472} width={200} height={42} fill="#E4F2E9" stroke="#3f7d4f" values={v} onNodeClick={onNodeClick} />
        <text x={470} y={489} className="lbl">11-дезоксикортизол</text>
        <text x={470} y={505} className="sub">S · (21-дезоксикортизол — шунт)</text>
        <ValText id="11_deoxycortisol" cx={470} bottomY={514} values={v} />
        <line x1={470} y1={514} x2={470} y2={544} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <text x={600} y={533} className="enz">11β-гидроксилаза</text>
        <Node id="cortisol" x={370} y={546} width={200} height={42} fill="#CFE8D8" stroke="#3f7d4f" values={v} onNodeClick={onNodeClick} />
        <text x={470} y={563} className="lbl">Кортизол ⇄ Кортизон</text>
        <text x={470} y={579} className="sub">11β-HSD · конечный глюкокортикоид</text>
        <ValText id="cortisol" cx={470} bottomY={588} values={v} />
        <line x1={470} y1={588} x2={470} y2={624} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#sh-arrow)" />
        <rect x={365} y={626} width={210} height={40} rx={8} fill="#E4F2E9" stroke="#2f6f4f" className="node" />
        <text x={470} y={651} className="cons">→ hpa (стресс-ось)</text>

        {/* ANDROGENS → ESTROGENS */}
        <text x={920} y={386} className="branch" fill="#a15a9e">Андрогены → Эстрогены</text>
        <Node id="dhea_s" x={820} y={398} width={200} height={42} fill="#F3E3F1" stroke="#a15a9e" values={v} onNodeClick={onNodeClick} />
        <text x={920} y={415} className="lbl">ДГЭА-С / ДГЭА</text>
        <text x={920} y={431} className="sub">измеряемый · 17,20-лиаза</text>
        <ValText id="dhea_s" cx={920} bottomY={440} values={v} />
        <line x1={920} y1={440} x2={920} y2={470} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <text x={1050} y={459} className="enz">3β-HSD</text>
        <Node id="androstenedione" x={820} y={472} width={200} height={42} fill="#F3E3F1" stroke="#a15a9e" values={v} onNodeClick={onNodeClick} />
        <text x={920} y={489} className="lbl">Андростендион</text>
        <text x={920} y={505} className="sub">A4</text>
        <ValText id="androstenedione" cx={920} bottomY={514} values={v} />
        <line x1={920} y1={514} x2={920} y2={544} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <text x={1050} y={533} className="enz">17β-HSD</text>
        <Node id="testosterone" x={820} y={546} width={200} height={42} fill="#EBD3E8" stroke="#a15a9e" values={v} onNodeClick={onNodeClick} />
        <text x={920} y={563} className="lbl">Тестостерон</text>
        <text x={920} y={579} className="sub">центральный андроген</text>
        <ValText id="testosterone" cx={920} bottomY={588} values={v} />

        {/* T -> DHT */}
        <line x1={880} y1={588} x2={800} y2={624} stroke="#8a3d84" strokeWidth={2} markerEnd="url(#sh-arrowV)" />
        <text x={700} y={606} className="enz">5α-редуктаза</text>
        <Node id="dht" x={670} y={626} width={180} height={42} fill="#E4C9E0" stroke="#8a3d84" values={v} onNodeClick={onNodeClick} />
        <text x={760} y={643} className="lbl">ДГТ</text>
        <text x={760} y={659} className="sub">5ARD · микропенис · T/DHT</text>
        <ValText id="dht" cx={760} bottomY={668} values={v} />
        <line x1={760} y1={668} x2={760} y2={700} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#sh-arrow)" />

        {/* T -> E2 */}
        <line x1={960} y1={588} x2={1030} y2={624} stroke="#5A6B7B" strokeWidth={2} markerEnd="url(#sh-arrow)" />
        <text x={1080} y={606} className="enz">ароматаза</text>
        <Node id="estradiol" x={940} y={626} width={200} height={42} fill="#EBD3E8" stroke="#a15a9e" values={v} onNodeClick={onNodeClick} />
        <text x={1040} y={643} className="lbl">Эстрадиол / Эстрон</text>
        <text x={1040} y={659} className="sub">E2 / E1</text>
        <ValText id="estradiol" cx={1040} bottomY={668} values={v} />
        <line x1={1040} y1={668} x2={1040} y2={700} stroke="#2f6f4f" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#sh-arrow)" />
        <rect x={935} y={702} width={210} height={40} rx={8} fill="#E4F2E9" stroke="#2f6f4f" className="node" />
        <text x={1040} y={727} className="cons">→ hpg / hpo / androgens_pcos</text>
        <rect x={665} y={702} width={190} height={40} rx={8} fill="#E4F2E9" stroke="#2f6f4f" className="node" />
        <text x={760} y={727} className="cons">→ hpg_axis (вирилизация)</text>

        {/* ВДКН callout */}
        <rect x={60} y={756} width={960} height={176} rx={10} fill="#FBFBF7" stroke="#C9B79A" />
        <text x={80} y={780} style={{ fontSize: 13, fontWeight: "bold", fill: "#8a6d3b" }}>Клинические точки блока (для инспектора и текстов):</text>
        <text x={80} y={804} style={{ fontSize: 12, fill: "#3d3d3d" }}>• Дефицит 21-гидроксилазы (класс. ВДКН) → ↑17-OHP, ↑21-дезоксикортизол, ↓кортизол, ↓альдостерон, ↑андрогены</text>
        <text x={80} y={826} style={{ fontSize: 12, fill: "#3d3d3d" }}>• Дефицит 11β-гидроксилазы → ↑11-дезоксикортизол, ↑ДОК (гипертензия), ↑андрогены</text>
        <text x={80} y={848} style={{ fontSize: 12, fill: "#3d3d3d" }}>• Дефицит 3β-HSD → ↑прегненолон/17-ОН-прегненолон, ↑ДГЭА, ↓кортизол</text>
        <text x={80} y={870} style={{ fontSize: 12, fill: "#3d3d3d" }}>• Дефицит CYP17A1 (17α-гидроксилаза/17,20-лиаза) → гипертензия + гипокалиемия + задержка пубертата / первичная аменорея</text>
        <text x={80} y={892} style={{ fontSize: 12, fill: "#3d3d3d" }}>• Дефицит 5α-редуктазы → нарушение вирилизации гениталий; избыток ароматазы → ↑эстрогены (гинекомастия)</text>
        <text x={80} y={914} style={{ fontSize: 12, fill: "#3d3d3d" }}>• Adrenarche vs gonadarche: до ~8–9 лет андрогены преимущественно надпочечниковые (ДГЭА/ДГЭА-С, A4) — учитывать при ↑17-OHP/ДГЭА-С у детей</text>
        <text x={60} y={952} style={{ fontSize: 11, fill: "#8a6d3b", fontStyle: "italic" }}>Пунктирные зелёные стрелки = consequences в другие пути карты. Серые/пунктирные узлы (прегненолоны) — inferred, не в базовой панели КДЛ-12.</text>
      </svg>
    </div>
  );
}

export default SteroidHubSVG;
