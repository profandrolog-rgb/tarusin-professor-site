import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle, Sun, Beaker } from "lucide-react";
import { FREQUENCY_PRESETS, SOLVENTS, DILUTION_VOLUMES, TreatmentCategory } from "./sections";

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
}

interface Props {
  item: PlanItem;
  update: (patch: Partial<PlanItem>) => void;
  remove: () => void;
  duplicateInn?: boolean;
  mode?: "flat" | "scheduled";
}

const showInfusion = (c: TreatmentCategory) => c === "iv_drip";

export function PlanItemRow({ item, update, remove, duplicateInn, mode = "flat" }: Props) {
  const outOfRange =
    item.dose !== null &&
    ((item.dose_range_min !== undefined && item.dose_range_min !== null && item.dose < item.dose_range_min) ||
     (item.dose_range_max !== undefined && item.dose_range_max !== null && item.dose > item.dose_range_max));

  const incompat = item.glucose_only && item.dilution_solvent && !item.dilution_solvent.toLowerCase().includes("глюк");

  return (
    <div className="border rounded-md p-3 bg-card space-y-2">
      <div className="flex items-start justify-between gap-2">
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
              <Badge variant="outline" className="text-[10px] h-5 border-amber-500/50 text-amber-600">вне диапазона дозы</Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={remove}><X className="w-4 h-4"/></Button>
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
        <div className="col-span-2 md:col-span-3">
          <label className="text-[11px] text-muted-foreground">Заметка</label>
          <Input value={item.notes ?? ""} onChange={e=>update({notes: e.target.value})} className="h-8" placeholder="контроль АД, утром, до еды..."/>
        </div>
      </div>
    </div>
  );
}
