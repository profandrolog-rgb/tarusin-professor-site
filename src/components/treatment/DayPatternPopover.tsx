import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { expandDays, compactDays, formatPattern } from "@/lib/dayPattern";

interface Props {
  value: string | null | undefined;
  duration: number;
  onChange: (v: string) => void;
}

export function DayPatternPopover({ value, duration, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);

  const apply = (v: string) => { onChange(v); setOpen(false); setCustom(false); };
  const selected = new Set(expandDays(value, duration));

  const presets: { label: string; v: string }[] = [
    { label: "Весь курс", v: `1-${duration}` },
    { label: "Через день", v: "every_other" },
    { label: "Дни 1–5", v: "1-5" },
    { label: "Дни 6–10", v: `6-${Math.min(10, duration)}` },
    { label: "1 раз в неделю", v: "weekly" },
    { label: "2 раза в неделю", v: "twice_weekly" },
    { label: "3 раза в неделю", v: "thrice_weekly" },
  ];

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCustom(false); }}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1">
          <Calendar className="w-3 h-3" />
          <span className="text-[11px]">{formatPattern(value, duration)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-80 p-2 bg-popover">
        {!custom ? (
          <>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {presets.map(p => (
                <button key={p.label} onClick={() => apply(p.v)}
                  className="text-xs px-2 py-1.5 rounded border hover:bg-muted text-left">
                  {p.label}
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={() => setCustom(true)}>
              Произвольно (выбрать дни)
            </Button>
          </>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-1">Отметьте дни курса:</div>
            <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto">
              {Array.from({ length: duration }, (_, i) => i + 1).map(d => {
                const sel = selected.has(d);
                return (
                  <button key={d}
                    onClick={() => {
                      const next = new Set(selected);
                      if (sel) next.delete(d); else next.add(d);
                      onChange(compactDays([...next]));
                    }}
                    className={`text-xs h-7 rounded border ${sel ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCustom(false)}>Назад</Button>
              <Button size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>Готово</Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
