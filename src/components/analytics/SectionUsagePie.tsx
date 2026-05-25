import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsSection, type AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Loader2 } from "lucide-react";

interface Row { section: string; count: number; pct: number }

const COLORS = [
  "hsl(210, 80%, 55%)", "hsl(25, 85%, 55%)", "hsl(140, 60%, 45%)", "hsl(280, 60%, 55%)",
  "hsl(0, 70%, 55%)", "hsl(190, 70%, 50%)", "hsl(45, 85%, 55%)", "hsl(320, 60%, 55%)",
  "hsl(160, 60%, 45%)", "hsl(260, 60%, 60%)", "hsl(15, 75%, 55%)", "hsl(200, 70%, 60%)",
  "hsl(100, 50%, 50%)",
];

const SECTION_LABELS: Record<string, string> = {
  iv_drip: "в/в кап.", iv_bolus: "в/в стр.", im: "в/м", sc: "п/к",
  oral_rx: "Перорал.Rx", oral_supplement: "Перорал. БАД",
  rectal: "Ректально", topical: "Топически", nasal: "Назально",
  sublingual: "Сублингв.", peptide: "Пептиды", procedure: "Процедуры", lifestyle: "Образ жизни",
};

export default function SectionUsagePie({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useAnalyticsSection<Row[]>("section_usage", filters);

  const chartData = (data ?? []).map((r) => ({ ...r, label: SECTION_LABELS[r.section] ?? r.section }));

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Использование секций</CardTitle></CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="count" nameKey="label" cx="40%" cy="50%" outerRadius={90} label={(e: any) => `${e.pct}%`}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
