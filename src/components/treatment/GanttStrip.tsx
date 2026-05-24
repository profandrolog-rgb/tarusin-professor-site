import { expandDays, toggleDay } from "@/lib/dayPattern";

interface Props {
  pattern: string | null | undefined;
  duration: number;
  color?: string;
  onChange?: (next: string) => void;
}

/** Inline Gantt strip: N small cells, click toggles a day. */
export function GanttStrip({ pattern, duration, color = "hsl(var(--primary))", onChange }: Props) {
  const set = new Set(expandDays(pattern, duration));
  return (
    <div className="flex gap-[2px] items-center overflow-x-auto py-0.5">
      {Array.from({ length: duration }, (_, i) => i + 1).map(d => {
        const sel = set.has(d);
        return (
          <button
            key={d}
            type="button"
            title={`День ${d}${sel ? " (отменить)" : ""}`}
            disabled={!onChange}
            onClick={() => onChange?.(toggleDay(pattern, duration, d))}
            className={`shrink-0 w-4 h-5 rounded-sm border transition-colors ${sel ? "" : "bg-muted/40 hover:bg-muted"}`}
            style={sel ? { backgroundColor: color, borderColor: color } : undefined}
          />
        );
      })}
    </div>
  );
}

/** Sticky header row with day numbers and per-day context menu. */
interface HeaderProps {
  duration: number;
  onDayAction?: (action: "clear" | "copyFrom" | "copyTo", day: number) => void;
}
export function GanttHeader({ duration }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-card border-b py-1 pl-2 overflow-x-auto">
      <div className="flex gap-[2px]">
        {Array.from({ length: duration }, (_, i) => i + 1).map(d => (
          <div key={d} className="shrink-0 w-4 h-5 text-[9px] text-center text-muted-foreground leading-5 font-mono">
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
