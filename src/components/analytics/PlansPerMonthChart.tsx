import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsSection, type AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

interface Row { month: string; count: number }

export default function PlansPerMonthChart({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useAnalyticsSection<Row[]>("plans_per_month", filters);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Динамика по месяцам (12 мес)</CardTitle></CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data ?? []} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
