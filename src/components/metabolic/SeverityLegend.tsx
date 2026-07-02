import { SEVERITY_COLORS, SEVERITY_ORDER } from "@/lib/metabolic/severityColors";

export function SeverityLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${className}`}>
      <span className="text-muted-foreground">Легенда:</span>
      {SEVERITY_ORDER.map((s) => {
        const c = SEVERITY_COLORS[s];
        return (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3.5 h-3.5 rounded-sm border"
              style={{ background: c.fill, borderColor: c.stroke }}
            />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}
