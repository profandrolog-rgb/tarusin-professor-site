import { SEVERITY_COLORS } from "@/lib/metabolic/severityColors";
import type { Severity } from "@/lib/metabolic/aggregator";

export type ChainCause = {
  id: string;
  slug: string;
  name: string;
  status: Severity; // только mild/moderate/severe попадают в цепочку
  /** consequences: [{ to_slug?: string, to_label?: string, weight?: number }] */
  consequences: Array<{ to_slug?: string; to_label?: string; weight?: number }>;
};

/**
 * Компактная SVG-цепочка «Причина → Следствие» по прототипу.
 * Только затронутые пути (mild+). Линия окрашена по severity причины.
 *
 * Раскладка: колонка причин слева, колонка следствий справа, соединения — плавные кривые Безье.
 */
export function ProblemChainSVG({ causes }: { causes: ChainCause[] }) {
  const affected = causes.filter(
    (c) => c.status === "mild" || c.status === "moderate" || c.status === "severe",
  );

  if (!affected.length) {
    return (
      <div className="text-xs italic text-muted-foreground px-3 py-6 text-center">
        Затронутых путей не выявлено — цепочка проблем пуста.
      </div>
    );
  }

  // Собираем уникальные эффекты справа.
  const effectKey = (e: { to_slug?: string; to_label?: string }) =>
    e.to_slug ? `slug:${e.to_slug}` : `lbl:${e.to_label || ""}`;
  const effectsMap = new Map<string, { key: string; label: string; slug?: string }>();
  const causeToEffects = new Map<string, string[]>();

  for (const c of affected) {
    const list: string[] = [];
    for (const eff of c.consequences || []) {
      const k = effectKey(eff);
      const label = (eff.to_label || eff.to_slug || "").trim();
      if (!label) continue;
      if (!effectsMap.has(k)) effectsMap.set(k, { key: k, label, slug: eff.to_slug });
      list.push(k);
    }
    if (list.length) causeToEffects.set(c.id, list);
  }
  const drawableCauses = affected.filter((c) => causeToEffects.has(c.id));
  const effects = [...effectsMap.values()];

  if (!drawableCauses.length || !effects.length) {
    return (
      <div className="text-xs italic text-muted-foreground px-3 py-6 text-center">
        Для затронутых путей ещё не заданы следствия — заполните `consequences` в справочнике путей.
      </div>
    );
  }

  // Геометрия
  const W = 900;
  const boxW = 220;
  const boxH = 48;
  const gapY = 16;
  const leftX = 20;
  const rightX = W - boxW - 20;
  const topPad = 24;

  const leftH = drawableCauses.length * (boxH + gapY) - gapY;
  const rightH = effects.length * (boxH + gapY) - gapY;
  const H = Math.max(leftH, rightH) + topPad * 2;

  const leftY = (i: number) =>
    topPad + (H - topPad * 2 - leftH) / 2 + i * (boxH + gapY);
  const rightY = (i: number) =>
    topPad + (H - topPad * 2 - rightH) / 2 + i * (boxH + gapY);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Цепочка проблем: причины и следствия"
      >
        {/* Соединения — рисуем ПОД боксами, чтобы не перекрывали текст */}
        {drawableCauses.map((c, i) => {
          const y1 = leftY(i) + boxH / 2;
          const x1 = leftX + boxW;
          const stroke = SEVERITY_COLORS[c.status].stroke;
          const width = c.status === "severe" ? 2.5 : c.status === "moderate" ? 2 : 1.5;
          return (causeToEffects.get(c.id) || []).map((effKey) => {
            const j = effects.findIndex((e) => e.key === effKey);
            if (j < 0) return null;
            const y2 = rightY(j) + boxH / 2;
            const x2 = rightX;
            const midX = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
            return (
              <path
                key={`${c.id}-${effKey}`}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                strokeOpacity={0.75}
              />
            );
          });
        })}

        {/* Причины слева */}
        {drawableCauses.map((c, i) => {
          const y = leftY(i);
          const col = SEVERITY_COLORS[c.status];
          return (
            <g key={`cause-${c.id}`}>
              <rect
                x={leftX}
                y={y}
                width={boxW}
                height={boxH}
                rx={8}
                ry={8}
                fill={col.fill}
                stroke={col.stroke}
                strokeWidth={1.5}
              />
              <text
                x={leftX + 12}
                y={y + 20}
                fontSize={12}
                fontWeight={600}
                fill={col.text}
              >
                {truncate(c.name, 30)}
              </text>
              <text
                x={leftX + 12}
                y={y + 36}
                fontSize={10}
                fill={col.text}
                opacity={0.75}
              >
                причина · {col.label.toLowerCase()}
              </text>
            </g>
          );
        })}

        {/* Следствия справа */}
        {effects.map((e, j) => {
          const y = rightY(j);
          return (
            <g key={`eff-${e.key}`}>
              <rect
                x={rightX}
                y={y}
                width={boxW}
                height={boxH}
                rx={8}
                ry={8}
                fill="hsl(var(--muted))"
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />
              <text
                x={rightX + 12}
                y={y + 20}
                fontSize={12}
                fontWeight={600}
                fill="hsl(var(--foreground))"
              >
                {truncate(e.label, 30)}
              </text>
              <text
                x={rightX + 12}
                y={y + 36}
                fontSize={10}
                fill="hsl(var(--muted-foreground))"
              >
                следствие
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-[11px] text-muted-foreground italic mt-1 px-1">
        Цвет линии соответствует тяжести причины. Пути «норма» и «нет данных» скрыты.
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
