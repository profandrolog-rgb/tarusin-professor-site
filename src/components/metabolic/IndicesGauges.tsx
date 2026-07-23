// Панель полукруглых циферблатов для интегральных индексов.
// Данные приходят уже посчитанные (metaIndices из src/lib/metabolic/metaIndices.ts).
// БД не трогаем, только визуализация. Цвета зон соответствуют промту 10.

import type { IndexResult } from "@/lib/metabolic/metaIndices";

type Zone = { from: number; to: number; color: "green" | "yellow" | "red" };
type GaugeCfg = {
  kind: "higher_better" | "lower_better" | "band";
  domain: [number, number];
  zones: Zone[];
  unit?: string;
  subLabel?: string;
};

const COLORS: Record<Zone["color"], string> = {
  green: "#3f7d4f",
  yellow: "#E0A800",
  red: "#C0392B",
};
const AXIS = "#20303f";
const GREY = "#9AA6B2";

const VERDICT: Record<Zone["color"], string> = {
  green: "в норме",
  yellow: "пограничное",
  red: "вне цели",
};

function cfgFor(id: string, sex?: "M" | "F" | null): GaugeCfg | null {
  switch (id) {
    case "omega3_index":
      return { kind: "higher_better", domain: [0, 12], unit: "%", subLabel: "EPA+DHA",
        zones: [{ from: 0, to: 4, color: "red" }, { from: 4, to: 8, color: "yellow" }, { from: 8, to: 12, color: "green" }] };
    case "omega_ratio":
      return { kind: "lower_better", domain: [0, 12],
        zones: [{ from: 0, to: 4, color: "green" }, { from: 4, to: 7, color: "yellow" }, { from: 7, to: 12, color: "red" }] };
    case "aa_epa":
      return { kind: "lower_better", domain: [0, 15],
        zones: [{ from: 0, to: 3, color: "green" }, { from: 3, to: 6, color: "yellow" }, { from: 6, to: 15, color: "red" }] };
    case "holman":
      return { kind: "lower_better", domain: [0, 1],
        zones: [{ from: 0, to: 0.2, color: "green" }, { from: 0.2, to: 0.4, color: "yellow" }, { from: 0.4, to: 1, color: "red" }] };
    case "carnitine_ester_ratio":
      return { kind: "lower_better", domain: [0, 1.2],
        zones: [{ from: 0, to: 0.4, color: "green" }, { from: 0.4, to: 0.6, color: "yellow" }, { from: 0.6, to: 1.2, color: "red" }] };
    case "fai":
      if (sex === "F") return { kind: "band", domain: [0, 8],
        zones: [{ from: 0, to: 0.3, color: "red" }, { from: 0.3, to: 5.4, color: "green" }, { from: 5.4, to: 8, color: "red" }] };
      return { kind: "band", domain: [0, 120],
        zones: [{ from: 0, to: 35, color: "red" }, { from: 35, to: 100, color: "green" }, { from: 100, to: 120, color: "red" }] };
    case "t_dht":
      return { kind: "band", domain: [0, 30],
        zones: [{ from: 0, to: 8, color: "red" }, { from: 8, to: 16, color: "green" }, { from: 16, to: 30, color: "red" }] };
    case "t_e2":
      return null; // порогов нет — рисуем nodata
    default:
      return null;
  }
}

// Точка на полукруге с центром (cx,cy) и радиусом r по значению domain.
const CX = 135, CY = 150, R = 95;

function valueToAngleDeg(v: number, [dMin, dMax]: [number, number]): number {
  const clamped = Math.max(dMin, Math.min(dMax, v));
  const t = (clamped - dMin) / (dMax - dMin || 1);
  return 180 - t * 180; // 180° слева, 0° справа
}

function polar(angleDeg: number, radius = R): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function arcPath(fromAngle: number, toAngle: number): string {
  // fromAngle > toAngle (движемся по часовой стрелке от 180 к 0)
  const p1 = polar(fromAngle);
  const p2 = polar(toAngle);
  const largeArc = Math.abs(fromAngle - toAngle) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
}

function zoneOfValue(v: number, zones: Zone[]): Zone | null {
  for (const z of zones) {
    if (v >= z.from && v <= z.to) return z;
  }
  // За пределами — крайняя зона по стороне
  if (v < zones[0].from) return zones[0];
  return zones[zones.length - 1];
}

function Gauge({ label, ix, cfg }: { label: string; ix: IndexResult | null; cfg: GaugeCfg | null }) {
  const hasValue = !!(ix && ix.value != null);
  // Если есть пороги — используем их; иначе строим авто-домен от значения для отображения стрелки.
  const autoDomain: [number, number] = hasValue
    ? [0, Math.max(1, (ix!.value as number) * 1.6)]
    : [0, 1];
  const effectiveDomain: [number, number] = cfg ? cfg.domain : autoDomain;
  const zones = cfg?.zones ?? [];
  const zone = hasValue && cfg ? zoneOfValue(ix!.value as number, zones) : null;
  const valColor = hasValue && zone ? COLORS[zone.color] : (hasValue ? "#20303f" : GREY);

  return (
    <div className="rounded-xl border bg-[#FBFCFD] border-[#DCE3EA] p-2">
      <svg viewBox="0 0 270 230" className="w-full h-auto" role="img" aria-label={label}>
        <text x="135" y="26" textAnchor="middle" fontSize="14" fontWeight="700" fill="#20303f">{label}</text>

        {/* Дуги зон */}
        {cfg
          ? zones.map((z, i) => {
              const a1 = valueToAngleDeg(z.from, cfg.domain);
              const a2 = valueToAngleDeg(z.to, cfg.domain);
              return <path key={i} d={arcPath(a1, a2)} fill="none" stroke={COLORS[z.color]} strokeWidth="16" strokeLinecap="butt" />;
            })
          : <path d={arcPath(180, 0)} fill="none" stroke="#E1E6EB" strokeWidth="16" />
        }

        {/* Стрелка — рисуем при наличии значения, даже если порогов нет */}
        {hasValue && (() => {
          const ang = valueToAngleDeg(ix!.value as number, effectiveDomain);
          const tip = polar(ang, R - 15);
          return (
            <>
              <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={AXIS} strokeWidth="3" strokeLinecap="round" />
              <circle cx={CX} cy={CY} r="6" fill={AXIS} />
            </>
          );
        })()}
        {!hasValue && <circle cx={CX} cy={CY} r="6" fill={GREY} />}

        {/* Значение */}
        <text x="135" y="182" textAnchor="middle" fontSize="30" fontWeight="700" fill={valColor}>
          {hasValue ? ix!.displayValue : "—"}
        </text>
        <text x="135" y="200" textAnchor="middle" fontSize="11" fill="#6a7886">
          {hasValue ? `${ix!.unit || ""}${cfg?.subLabel ? (ix!.unit ? " · " : "") + cfg!.subLabel : ""}` : "нет данных"}
        </text>
        <text x="135" y="218" textAnchor="middle" fontSize="11" fill="#8a97a4">
          {ix?.target ? `цель ${ix.target}` : ""}
          {zone ? `  ·  ${VERDICT[zone.color]}` : ""}
        </text>
      </svg>
    </div>
  );
}

export interface IndicesGaugesProps {
  indices: IndexResult[];
  patientSex?: "M" | "F" | null;
}

// Фиксированный порядок карточек — панель выглядит одинаково у всех пациентов;
// отсутствующие индексы рисуются серыми "нет данных".
const ORDER: Array<{ id: string; label: string }> = [
  { id: "omega3_index", label: "Омега-3 индекс" },
  { id: "omega_ratio", label: "Омега-6 / Омега-3" },
  { id: "aa_epa", label: "AA / EPA" },
  { id: "holman", label: "Индекс Холмана" },
  { id: "carnitine_ester_ratio", label: "Этерифиц./своб. карнитин" },
  { id: "c3_c2", label: "C3 / C2" },
  { id: "fai", label: "FAI" },
  { id: "t_dht", label: "T / DHT" },
  { id: "t_e2", label: "T / E2" },
];

export function IndicesGauges({ indices, patientSex }: IndicesGaugesProps) {
  const byId = new Map(indices.map((i) => [i.id, i]));
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {ORDER.map((o) => {
        const ix = byId.get(o.id) || null;
        const cfg = cfgFor(o.id, patientSex);
        // Если индекс не посчитан И у нас нет конфига (c3_c2, t_e2) — скрываем карточку, чтобы не забивать панель заглушками.
        if (!ix && !cfg) return null;
        return <Gauge key={o.id} label={o.label} ix={ix} cfg={cfg} />;
      })}
    </div>
  );
}
