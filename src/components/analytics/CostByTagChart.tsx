import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsSection, type AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

interface Row { tag: string; avg_cost: number; plans_count: number }

export default function CostByTagChart({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useAnalyticsSection<Row[]>("cost_by_tag", filters);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Средняя стоимость курса по тегам</CardTitle></CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data ?? []} margin={{ top: 8, right: 8, bottom: 40, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="tag" angle={-30} textAnchor="end" interval={0} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(v: any) => [`${Number(v).toLocaleString("ru-RU")} ₽`, "Ср. стоимость"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="avg_cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
