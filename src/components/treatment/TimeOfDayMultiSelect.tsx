import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { TIME_OF_DAY } from "./sections";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
}

export function TimeOfDayMultiSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cb = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", cb);
    return () => document.removeEventListener("mousedown", cb);
  }, []);

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-8 border rounded-md px-2 py-1 text-left text-sm bg-background hover:bg-muted/50 flex items-center justify-between gap-1"
      >
        <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-muted-foreground text-xs">—</span>
          ) : (
            value.map(v => (
              <span key={v} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]">
                {v}
                <X
                  className="w-2.5 h-2.5 cursor-pointer hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); toggle(v); }}
                />
              </span>
            ))
          )}
        </div>
        <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[180px] bg-popover border rounded-md shadow-md py-1">
          {TIME_OF_DAY.map(t => (
            <label key={t} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={value.includes(t)}
                onChange={() => toggle(t)}
                className="w-3.5 h-3.5"
              />
              {t}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
