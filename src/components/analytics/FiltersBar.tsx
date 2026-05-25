import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { useDoctorsList } from "@/lib/analytics/useAnalyticsSection";

export type PeriodPreset = "30" | "90" | "365" | "all" | "custom";

interface Props {
  filters: AnalyticsFilters;
  setFilters: (f: AnalyticsFilters) => void;
  period: PeriodPreset;
  setPeriod: (p: PeriodPreset) => void;
  onExport: () => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(d: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().slice(0, 10);
}

export function applyPeriod(period: PeriodPreset, custom?: { from: string; to: string }): { from: string | null; to: string | null } {
  if (period === "all") return { from: null, to: null };
  if (period === "custom") return { from: custom?.from || null, to: custom?.to || null };
  return { from: daysAgoStr(Number(period)), to: todayStr() };
}

export default function FiltersBar({ filters, setFilters, period, setPeriod, onExport }: Props) {
  const { data: doctors } = useDoctorsList();

  const updatePeriod = (p: PeriodPreset) => {
    setPeriod(p);
    if (p !== "custom") {
      const { from, to } = applyPeriod(p);
      setFilters({ ...filters, from, to });
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-card border rounded-lg">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Период</Label>
        <Select value={period} onValueChange={(v) => updatePeriod(v as PeriodPreset)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Последние 30 дней</SelectItem>
            <SelectItem value="90">Последние 90 дней</SelectItem>
            <SelectItem value="365">Последний год</SelectItem>
            <SelectItem value="all">Всё время</SelectItem>
            <SelectItem value="custom">Произвольный</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === "custom" && (
        <>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">С</Label>
            <Input type="date" value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || null })} className="w-[150px]" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">По</Label>
            <Input type="date" value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || null })} className="w-[150px]" />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <Label className="text-xs">Статус</Label>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as any })}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="issued">Выданные</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(doctors?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Врач</Label>
          <Select value={filters.doctor} onValueChange={(v) => setFilters({ ...filters, doctor: v })}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все врачи</SelectItem>
              {doctors!.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.email} ({d.plans_count})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="ml-auto">
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />Экспорт CSV
        </Button>
      </div>
    </div>
  );
}
