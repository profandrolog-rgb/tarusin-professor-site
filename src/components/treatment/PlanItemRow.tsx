import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle, Sun, Beaker, GripVertical, Database } from "lucide-react";
import { FREQUENCY_PRESETS, SOLVENTS, DILUTION_VOLUMES, TreatmentCategory } from "./sections";
import { TimeOfDayMultiSelect } from "./TimeOfDayMultiSelect";
import { DayPatternPopover } from "./DayPatternPopover";
import { GanttStrip } from "./GanttStrip";
import { MedicationImportDialog } from "./MedicationImportDialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface PlanItem {
  client_id: string;
  catalog_id?: string | null;
  section_category: TreatmentCategory;
  name_snapshot: string;
  inn_snapshot?: string | null;
  form_snapshot?: string | null;
  dose: number | null;
  dose_unit: string | null;
  dilution_volume: number | null;
  dilution_solvent: string | null;
  frequency: string | null;
  duration_days: number | null;
  day_pattern?: string | null;
  time_of_day: string[];
  infusion_rate?: string | null;
  route_override?: string | null;
  notes: string | null;
  is_off_label: boolean;
  light_sensitive?: boolean;
  glucose_only?: boolean;
  dose_range_min?: number | null;
  dose_range_max?: number | null;
  prn_estimated_doses?: number | null;
}

interface Props {
  item: PlanItem;
  update: (patch: Partial<PlanItem>) => void;
  remove: () => void;
  duplicateInn?: boolean;
  mode?: "flat" | "scheduled";
  courseDuration?: number;
  sortable?: boolean;
}

const showInfusion = (c: TreatmentCategory) => c === "iv_drip";

export function PlanItemRow({ item, update, remove, duplicateInn, mode = "flat", courseDuration = 10, sortable = false }: Props) {
  const [importOpen, setImportOpen] = useState(false);
  const sort = useSortable({ id: item.client_id, disabled: !sortable });
  const style = sortable ? {
    transform: CSS.Transform.toString(sort.transform),
    transition: sort.transition,
    opacity: sort.isDragging ? 0.5 : 1,
  } : undefined;

  const outOfRange =
    item.dose !== null &&
    ((item.dose_range_min !== undefined && item.dose_range_min !== null && item.dose < item.dose_range_min) ||
     (item.dose_range_max !== undefined && item.dose_range_max !== null && item.dose > item.dose_range_max));

  const incompat = item.glucose_only && item.dilution_solvent && !item.dilution_solvent.toLowerCase().includes("глюк");

  return (
    <div
      ref={sortable ? sort.setNodeRef : undefined}
      style={style}
      className="border rounded-md p-3 bg-card space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1 flex-1">
          {sortable && (
            <button
              type="button"
              {...sort.attributes}
              {...sort.listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 mt-0.5"
              aria-label="Перетащить"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{item.name_snapshot}</span>
              {item.inn_snapshot && <span className="text-xs text-muted-foreground">({item.inn_snapshot})</span>}
              {item.form_snapshot && <span className="text-xs text-muted-foreground">· {item.form_snapshot}</span>}
              {item.is_off_label && (
                <Badge variant="outline" className="text-[10px] h-5 gap-1"><AlertTriangle className="w-3 h-3"/>off-label</Badge>
              )}
              {item.light_sensitive && (
                <Badge variant="outline" className="text-[10px] h-5 gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400"><Sun className="w-3 h-3"/>защищать от света</Badge>
              )}
              {duplicateInn && (
                <Badge variant="destructive" className="text-[10px] h-5">дубль по МНН</Badge>
              )}
              {incompat && (
                <Badge variant="destructive" className="text-[10px] h-5 gap-1"><Beaker className="w-3 h-3"/>не смешивать — нужна 5% глюкоза</Badge>
              )}
              {outOfRange && (
                <Badge variant="outline" className="text-[10px] h-5 border-amber-500/50 text-amber-600 dark:text-amber-400">вне диапазона дозы</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {item.section_category === "oral_rx" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setImportOpen(true)} title="Импорт из справочника">
              <Database className="w-4 h-4"/>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={remove}><X className="w-4 h-4"/></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Доза</label>
          <Input type="number" step="any" value={item.dose ?? ""} onChange={e=>update({dose: e.target.value === "" ? null : Number(e.target.value)})} className="h-8"/>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Ед.</label>
          <Input value={item.dose_unit ?? ""} onChange={e=>update({dose_unit: e.target.value})} className="h-8"/>
        </div>
        {showInfusion(item.section_category) && (
          <>
            <div>
              <label className="text-[11px] text-muted-foreground">Объём</label>
              <Select value={item.dilution_volume?.toString() ?? ""} onValueChange={v=>update({dilution_volume: v ? Number(v) : null})}>
                <SelectTrigger className="h-8"><SelectValue placeholder="—"/></SelectTrigger>
                <SelectContent>
                  {DILUTION_VOLUMES.map(v => <SelectItem key={v} value={v.toString()}>{v} мл</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Растворитель</label>
              <Select value={item.dilution_solvent ?? ""} onValueChange={v=>update({dilution_solvent: v})}>
                <SelectTrigger className="h-8"><SelectValue placeholder="—"/></SelectTrigger>
                <SelectContent>
                  {SOLVENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        <div>
          <label className="text-[11px] text-muted-foreground">Кратность</label>
          <Input list={`freq-presets`} value={item.frequency ?? ""} onChange={e=>update({frequency: e.target.value})} className="h-8"/>
          <datalist id="freq-presets">{FREQUENCY_PRESETS.map(f => <option key={f} value={f}/>)}</datalist>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Дней</label>
          <Input type="number" min={1} value={item.duration_days ?? ""} onChange={e=>update({duration_days: e.target.value === "" ? null : Number(e.target.value)})} className="h-8"/>
        </div>
        {showInfusion(item.section_category) && (
          <div className="col-span-2">
            <label className="text-[11px] text-muted-foreground">Скорость инфузии</label>
            <Input value={item.infusion_rate ?? ""} onChange={e=>update({infusion_rate: e.target.value})} className="h-8" placeholder="40–60 кап/мин"/>
          </div>
        )}
        <div className="col-span-2">
          <label className="text-[11px] text-muted-foreground">Время приёма</label>
          <TimeOfDayMultiSelect value={item.time_of_day || []} onChange={(v) => update({ time_of_day: v })}/>
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="text-[11px] text-muted-foreground">Заметка</label>
          <Input value={item.notes ?? ""} onChange={e=>update({notes: e.target.value})} className="h-8" placeholder="контроль АД, утром, до еды..."/>
        </div>
        {(item.frequency || "").toLowerCase().includes("по требованию") && (
          <div>
            <label className="text-[11px] text-muted-foreground">Расчётный запас, приёмов</label>
            <Input
              type="number" min={1}
              value={item.prn_estimated_doses ?? ""}
              placeholder="10"
              onChange={e=>update({ prn_estimated_doses: e.target.value === "" ? null : Number(e.target.value) })}
              className="h-8"
            />
          </div>
        )}
      </div>

      {mode === "scheduled" && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <DayPatternPopover value={item.day_pattern} duration={courseDuration} onChange={(v) => update({ day_pattern: v })} />
          <div className="flex-1 min-w-0">
            <GanttStrip pattern={item.day_pattern} duration={courseDuration} onChange={(v) => update({ day_pattern: v })} />
          </div>
        </div>
      )}

      {item.section_category === "oral_rx" && (
        <MedicationImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          current={{
            name: item.name_snapshot,
            inn: item.inn_snapshot,
            form: item.form_snapshot,
            default_dose: item.dose,
            dose_unit: item.dose_unit,
          }}
          onApply={(patch) => update({
            ...(patch.name !== undefined ? { name_snapshot: patch.name as string } : {}),
            ...(patch.inn !== undefined ? { inn_snapshot: patch.inn } : {}),
            ...(patch.form !== undefined ? { form_snapshot: patch.form } : {}),
            ...(patch.default_dose !== undefined ? { dose: patch.default_dose } : {}),
            ...(patch.dose_unit !== undefined ? { dose_unit: patch.dose_unit } : {}),
          })}
        />
      )}
    </div>
  );
}
