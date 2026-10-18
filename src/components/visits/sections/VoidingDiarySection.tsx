import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DIARY_DAYS, DIARY_ROWS, DiaryRow, VoidingDiary, calcDiary, fmtMin, isNight } from "@/lib/visits/voidingDiary";

export function VoidingDiarySection({ data, onChange }: { data?: VoidingDiary; onChange: (d: VoidingDiary) => void }) {
  const d = data || {};
  const days: DiaryRow[][] = Array.from({ length: DIARY_DAYS }, (_, i) =>
    Array.from({ length: DIARY_ROWS }, (_, j) => d.days?.[i]?.[j] || {})
  );
  const setRow = (i: number, j: number, p: Partial<DiaryRow>) => {
    const next = days.map((rows) => rows.map((r) => ({ ...r })));
    next[i][j] = { ...next[i][j], ...p };
    onChange({ ...d, days: next });
  };
  const s = calcDiary({ days });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm">Дневник ритма микций (3 суток)</CardTitle>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={d.enabled === true} onCheckedChange={(v) => onChange({ ...d, enabled: v === true })} />
          Включить
        </label>
      </CardHeader>
      {d.enabled && (
        <CardContent className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {days.map((rows, i) => (
              <div key={i} className="space-y-1">
                <div className="text-sm font-medium">Сутки {i + 1}</div>
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 text-xs text-muted-foreground">
                  <span>Время</span><span>Выпито, мл</span><span>Выделено, мл</span><span>Ночь</span>
                </div>
                {rows.map((r, j) => (
                  <div key={j} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 items-center">
                    <Input className="h-7 text-xs px-1" placeholder="чч:мм" value={r.time || ""} onChange={(e) => setRow(i, j, { time: e.target.value })} />
                    <Input className="h-7 text-xs px-1" inputMode="decimal" value={r.drank || ""} onChange={(e) => setRow(i, j, { drank: e.target.value })} />
                    <Input className="h-7 text-xs px-1" inputMode="decimal" value={r.voided || ""} onChange={(e) => setRow(i, j, { voided: e.target.value })} />
                    <Checkbox checked={isNight(r)} onCheckedChange={(v) => setRow(i, j, { night: v === true })} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm rounded-md bg-muted/30 p-3">
            <div>Число микций по суткам: {s.voidsPerDay.join(" / ")} (всего {s.voidsTotal})</div>
            <div>Средняя порция по суткам: {s.avgPortionPerDay.map((v) => v ?? "—").join(" / ")} мл</div>
            <div>Интервал между микциями: мин {fmtMin(s.voidMin)}, макс {fmtMin(s.voidMax)}</div>
            <div>Средняя порция за 3 суток: {s.avgPortion3 ?? "—"} мл</div>
            <div>Интервал между приёмами жидкости: мин {fmtMin(s.drinkMin)}, макс {fmtMin(s.drinkMax)}</div>
            <div>Моча днём: {s.dayVolume} мл · ночью: {s.nightVolume} мл</div>
            <div>Выпито всего: {s.drankTotal} мл · выделено всего: {s.voidedTotal} мл</div>
            <div>Суточный диурез (среднее): {s.dailyDiuresis ?? "—"} мл</div>
          </div>
          <div className="space-y-1">
            <Label>Заключение по ритму микций</Label>
            <Textarea rows={3} value={d.conclusion || ""} onChange={(e) => onChange({ ...d, conclusion: e.target.value })} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
