import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import type { AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444"];

function Section({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div> : children}
      </CardContent>
    </Card>
  );
}

export default function IrtAnalyticsSection({ filters }: { filters: AnalyticsFilters }) {
  const qc = useQueryClient();
  const dash = useQuery({
    queryKey: ["irt-dashboard", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("analytics_irt_dashboard" as any, {
        _from: filters.from, _to: filters.to, _status: filters.status, _doctor: filters.doctor,
      });
      if (error) throw error;
      return (data ?? {}) as any;
    },
    staleTime: 60 * 60 * 1000,
  });
  const loading = dash.isLoading;
  const d = (dash.data ?? {}) as any;
  const protocols = { isLoading: loading, data: (d.protocols ?? []) as any[] };
  const points = { isLoading: loading, data: (d.points ?? []) as any[] };
  const meridians = { isLoading: loading, data: (d.meridians ?? []) as any[] };
  const modality = { isLoading: loading, data: (d.modality ?? []) as any[] };
  const perMonth = { isLoading: loading, data: (d.per_month ?? []) as any[] };
  const nosology = { isLoading: loading, data: (d.nosology ?? []) as any[] };
  const last12 = { isLoading: loading, data: (d.last_12m ?? []) as any[] };
  const meridianTrendsRaw = (d.meridian_trends ?? []) as any[];
  const compare = (d.compare ?? null) as null | { current: any; previous: any };
  const cacheStatus = d._cache as string | undefined;

  const meridianTrendData = (() => {
    const map = new Map<string, any>();
    const codes = new Set<string>();
    for (const row of meridianTrendsRaw) {
      codes.add(row.meridian_code);
      if (!map.has(row.month)) map.set(row.month, { month: row.month });
      map.get(row.month)[row.meridian_code] = Number(row.points_count) || 0;
    }
    const data = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    const totals = Array.from(codes).map(c => ({ c, sum: data.reduce((s, r) => s + (r[c] || 0), 0) }));
    const top = totals.sort((a, b) => b.sum - a.sum).slice(0, 6).map(x => x.c);
    return { data, codes: top };
  })();

  const renderDelta = (cur: number, prev: number) => {
    const diff = cur - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : (cur > 0 ? 100 : 0);
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground";
    return <span className={`text-xs ${cls}`}>{sign}{diff} ({sign}{pct}%)</span>;
  };

  const handleRefresh = async () => {
    const { error } = await supabase.from("analytics_cache").delete().like("cache_key", "irt_dashboard:%");
    if (error) { toast.error("Не удалось сбросить кэш"); return; }
    await qc.invalidateQueries({ queryKey: ["irt-dashboard"] });
    toast.success("Кэш ИРТ-аналитики сброшен");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xl font-semibold">🪡 Аналитика ИРТ</h2>
        <Badge variant="outline">иглорефлексотерапия</Badge>
        {cacheStatus && <Badge variant={cacheStatus === "hit" ? "default" : "secondary"} className="text-[10px]">cache: {cacheStatus}</Badge>}
        <Button size="sm" variant="ghost" className="ml-auto gap-1 h-7" onClick={handleRefresh} disabled={dash.isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 ${dash.isFetching ? "animate-spin" : ""}`} />
          Пересчитать
        </Button>
      </div>

      <Section title="ТОП-10 протоколов ИРТ" loading={protocols.isLoading}>
        {(protocols.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2">Протокол</th>
                  <th className="py-2">Тип</th>
                  <th className="py-2 text-right">Использований</th>
                  <th className="py-2 text-right">В планах</th>
                </tr>
              </thead>
              <tbody>
                {protocols.data!.map((p: any) => (
                  <tr key={p.protocol_id} className="border-b">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2"><Badge variant={p.is_template ? "default" : "secondary"}>{p.is_template ? "Встроенный" : "Пользовательский"}</Badge></td>
                    <td className="py-2 text-right font-mono">{p.usage_count}</td>
                    <td className="py-2 text-right font-mono">{p.plans_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="ТОП-15 точек акупунктуры" loading={points.isLoading}>
          {(points.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={points.data} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="who_code" width={70} />
                <Tooltip formatter={(v: any, _n, p: any) => [v, p.payload?.name_ru || p.payload?.who_code]} />
                <Bar dataKey="usage_count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Распределение по меридианам" loading={meridians.isLoading}>
          {(meridians.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie data={meridians.data} dataKey="points_count" nameKey="meridian_name" cx="50%" cy="50%" outerRadius={120} label={(e: any) => `${e.meridian_code}: ${e.points_count}`}>
                  {meridians.data!.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="ЭАП / Мокса / Классическая ИРТ" loading={modality.isLoading}>
          {(modality.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modality.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="modality" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Динамика ИРТ-планов по месяцам" loading={perMonth.isLoading}>
          {(perMonth.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={perMonth.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="plans_count" stroke="hsl(var(--primary))" strokeWidth={2} name="Планов с ИРТ" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>
        <Section title="Распределение по нозологиям (теги протоколов)" loading={nosology.isLoading}>
          {(nosology.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={nosology.data} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="tag" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="usage_count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>
    </div>
  );
}
