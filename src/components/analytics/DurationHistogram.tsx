import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsSection, type AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

interface Row { bucket: string; count: number }

export default function DurationHistogram({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useAnalyticsSection<Row[]>("duration_histogram", filters);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Распределение длительности (дни)</CardTitle></CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data ?? []} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="bucket" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
