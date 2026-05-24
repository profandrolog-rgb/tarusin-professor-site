import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, ChevronRight } from "lucide-react";
import { PlanItem } from "./PlanItemRow";
import { expandDays, compactDays, shiftDays } from "@/lib/dayPattern";

interface Props {
  day: number;
  duration: number;
  items: PlanItem[];
  onBulkUpdate: (updater: (it: PlanItem) => Partial<PlanItem> | null) => void;
}

/** Per-day context menu in Gantt header: copy/clear/all/shift. */
export function DayContextMenu({ day, duration, items, onBulkUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [copySubOpen, setCopySubOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftN, setShiftN] = useState(1);

  const close = () => { setOpen(false); setCopySubOpen(false); setShiftOpen(false); };

  const copyDayTo = (target: number) => {
    onBulkUpdate(it => {
      const days = new Set(expandDays(it.day_pattern, duration));
      if (!days.has(day)) return null;
      days.add(target);
      return { day_pattern: compactDays([...days]) };
    });
    close();
  };

  const clearDay = () => {
    onBulkUpdate(it => {
      const days = new Set(expandDays(it.day_pattern, duration));
      if (!days.has(day)) return null;
      days.delete(day);
      return { day_pattern: compactDays([...days]) };
    });
    close();
  };

  const setAllEveryDay = () => {
    onBulkUpdate(() => ({ day_pattern: `1-${duration}` }));
    close();
  };

  // Compute how many items would go out of bounds for given shift
  const overflowCount = items.filter(it => {
    const days = expandDays(it.day_pattern, duration);
    if (!days.length) return false;
    return Math.max(...days) + shiftN > duration;
  }).length;

  const doShift = () => {
    if (!Number.isFinite(shiftN) || shiftN === 0) return;
    onBulkUpdate(it => ({ day_pattern: shiftDays(it.day_pattern, duration, shiftN) }));
    close();
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCopySubOpen(false); setShiftOpen(false); } }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="opacity-30 hover:opacity-100 transition-opacity"
          title={`Действия для дня ${day}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {!copySubOpen && !shiftOpen && (
          <div className="flex flex-col text-sm">
            <button
              className="px-2 py-1.5 rounded hover:bg-accent text-left flex items-center justify-between"
              onClick={() => setCopySubOpen(true)}
            >
              Скопировать день {day} в… <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button className="px-2 py-1.5 rounded hover:bg-accent text-left" onClick={clearDay}>
              Очистить день {day}
            </button>
            <button className="px-2 py-1.5 rounded hover:bg-accent text-left" onClick={setAllEveryDay}>
              Назначить всё на каждый день
            </button>
            <button className="px-2 py-1.5 rounded hover:bg-accent text-left" onClick={() => setShiftOpen(true)}>
              Сдвинуть курс на N дней…
            </button>
          </div>
        )}
        {copySubOpen && (
          <div>
            <div className="px-2 py-1 text-xs text-muted-foreground">Целевой день:</div>
            <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto p-1">
              {Array.from({ length: duration }, (_, i) => i + 1).filter(d => d !== day).map(d => (
                <button
                  key={d}
                  className="text-xs h-7 rounded border hover:bg-accent"
                  onClick={() => copyDayTo(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setCopySubOpen(false)}>Назад</Button>
          </div>
        )}
        {shiftOpen && (
          <div className="space-y-2 p-2">
            <div className="text-xs text-muted-foreground">Сдвиг (+вперёд, −назад):</div>
            <Input
              type="number"
              value={shiftN}
              onChange={e => setShiftN(parseInt(e.target.value) || 0)}
              className="h-8"
            />
            {overflowCount > 0 && shiftN > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ {overflowCount} {overflowCount === 1 ? "позиция выйдет" : "позиций выйдут"} за пределы курса (будут обрезаны)
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShiftOpen(false)}>Отмена</Button>
              <Button size="sm" className="flex-1" onClick={doShift}>Сдвинуть</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
