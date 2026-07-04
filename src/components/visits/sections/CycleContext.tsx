import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Контекст менструального цикла и репродуктивного статуса.
 * Пишется в protocol_data визита, читается referenceResolver.deriveCycleContext:
 *   cycle_phase, cycle_day, repro_status, last_period_date, cycle_length,
 *   cycle_mode ('simple' | 'full').
 * Показывается только для пациенток женского пола.
 */
export interface CycleContextData {
  cycle_mode?: "simple" | "full";
  repro_status?: "" | "prepubertal" | "pubertal" | "reproductive" | "pregnant" | "postmenopause";
  cycle_phase?: "" | "follicular" | "ovulatory" | "luteal" | "postmenopause";
  cycle_day?: string | number;
  last_period_date?: string;
  cycle_length?: string | number;
  cycle_note?: string;
}

const REPRO: Array<{ v: NonNullable<CycleContextData["repro_status"]>; label: string }> = [
  { v: "", label: "не указан" },
  { v: "prepubertal", label: "препубертат" },
  { v: "pubertal", label: "пубертат" },
  { v: "reproductive", label: "репродуктивный" },
  { v: "pregnant", label: "беременность" },
  { v: "postmenopause", label: "постменопауза" },
];

const PHASES: Array<{ v: NonNullable<CycleContextData["cycle_phase"]>; label: string; range: string }> = [
  { v: "", label: "не выбрано", range: "" },
  { v: "follicular", label: "фолликулярная", range: "1–13 дн" },
  { v: "ovulatory", label: "овуляторная", range: "≈14 дн" },
  { v: "luteal", label: "лютеиновая", range: "15–28 дн" },
  { v: "postmenopause", label: "постменопауза", range: "" },
];

function phaseFromDay(day: number, cycleLen: number): CycleContextData["cycle_phase"] {
  if (!Number.isFinite(day) || day < 1) return "";
  const ovulation = Math.max(11, cycleLen - 14);
  if (day <= ovulation - 2) return "follicular";
  if (day <= ovulation + 1) return "ovulatory";
  return "luteal";
}

export function CycleContextSection({
  data,
  onChange,
}: {
  data: CycleContextData | undefined;
  onChange: (patch: Partial<CycleContextData>) => void;
}) {
  const d = data || {};
  const mode: "simple" | "full" = d.cycle_mode === "full" ? "full" : "simple";

  const derived = useMemo(() => {
    if (mode !== "full" || !d.last_period_date) return null;
    const start = new Date(d.last_period_date);
    if (isNaN(start.getTime())) return null;
    const cycleLen = Number(d.cycle_length) || 28;
    const dayNo = Math.floor((Date.now() - start.getTime()) / (24 * 3600 * 1000)) + 1;
    const phase = phaseFromDay(dayNo, cycleLen);
    return { dayNo, phase };
  }, [mode, d.last_period_date, d.cycle_length]);

  const isPostmeno = d.repro_status === "postmenopause" || d.repro_status === "prepubertal" || d.repro_status === "pregnant";

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm">Контекст цикла</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className={mode === "simple" ? "font-medium" : "text-muted-foreground"}>упрощённый</span>
            <Switch
              checked={mode === "full"}
              onCheckedChange={(v) => onChange({ cycle_mode: v ? "full" : "simple" })}
            />
            <span className={mode === "full" ? "font-medium" : "text-muted-foreground"}>полный</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Женские фазозависимые показатели (E2, Прогестерон, ЛГ, ФСГ) интерпретируются только при указанной фазе — иначе показатель пропускается.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Репродуктивный статус</Label>
            <Select
              value={d.repro_status || "__none__"}
              onValueChange={(v) => {
                const val = v === "__none__" ? "" : v;
                onChange({ repro_status: val as any, ...(val === "postmenopause" ? { cycle_phase: "postmenopause" } : {}) });
              }}
            >
              <SelectTrigger className="h-9"><SelectValue placeholder="не указан" /></SelectTrigger>
              <SelectContent>
                {REPRO.map((r) => (
                  <SelectItem key={r.v || "none"} value={r.v || "__none__"}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isPostmeno && mode === "simple" ? (
            <div className="space-y-1">
              <Label className="text-xs">Фаза цикла (врач выбирает)</Label>
              <Select
                value={d.cycle_phase || ""}
                onValueChange={(v) => onChange({ cycle_phase: (v === "__none__" ? "" : v) as any })}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="не выбрано" /></SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => (
                    <SelectItem key={p.v || "none"} value={p.v || "__none__"}>
                      {p.label}{p.range ? ` · ${p.range}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {!isPostmeno && mode === "full" ? (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Первый день последних mens</Label>
              <Input
                type="date"
                value={d.last_period_date || ""}
                onChange={(e) => onChange({ last_period_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Длина цикла, дн</Label>
              <Input
                type="number" min={20} max={45}
                placeholder="28"
                value={d.cycle_length ?? ""}
                onChange={(e) => onChange({ cycle_length: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">День цикла (можно вручную)</Label>
              <Input
                type="number" min={1} max={45}
                placeholder={derived ? String(derived.dayNo) : ""}
                value={d.cycle_day ?? ""}
                onChange={(e) => onChange({ cycle_day: e.target.value })}
              />
            </div>
            {derived ? (
              <div className="md:col-span-3 text-xs text-muted-foreground">
                Расчёт: день <b>{derived.dayNo}</b> · фаза <b>{PHASES.find(p => p.v === derived.phase)?.label || "—"}</b>.
                {" "}Значение перекрывается ручным «Днём цикла» / «Фазой», если заданы.
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1">
          <Label className="text-xs">Примечание</Label>
          <Input
            value={d.cycle_note || ""}
            onChange={(e) => onChange({ cycle_note: e.target.value })}
            placeholder="Напр.: ановуляторный цикл; КОК; ЗГТ и т.п."
          />
        </div>
      </CardContent>
    </Card>
  );
}
