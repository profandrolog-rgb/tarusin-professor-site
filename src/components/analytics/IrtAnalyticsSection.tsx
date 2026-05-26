import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import type { AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444"];

function useIrt<T = any>(rpc: string, filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["irt-analytics", rpc, filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(rpc as any, {
        _from: filters.from, _to: filters.to, _status: filters.status, _doctor: filters.doctor,
      });
      if (error) throw error;
      return (data ?? []) as T[];
    },
    staleTime: 60 * 60 * 1000,
  });
}

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
  const protocols = useIrt<any>("analytics_irt_top_protocols", filters);
  const points = useIrt<any>("analytics_irt_top_points", filters);
  const meridians = useIrt<any>("analytics_irt_meridian_distribution", filters);
  const modality = useIrt<any>("analytics_irt_modality_usage", filters);
  const perMonth = useIrt<any>("analytics_irt_plans_per_month", filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">🪡 Аналитика ИРТ</h2>
        <Badge variant="outline">иглорефлексотерапия</Badge>
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
      </div>
    </div>
  );
}
