import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  getPercentileLines,
  WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS,
  WHO_HEIGHT_BOYS, WHO_HEIGHT_GIRLS,
  WHO_BMI_BOYS, WHO_BMI_GIRLS,
  WHO_HEAD_BOYS, WHO_HEAD_GIRLS,
} from "@/utils/anthropometry/who-reference";

interface Props {
  patientId: string;
  sex: "male" | "female";
}

type ChartType = "weight" | "height" | "bmi" | "head";

const CHART_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "weight", label: "Масса тела" },
  { value: "height", label: "Рост" },
  { value: "bmi", label: "ИМТ" },
  { value: "head", label: "Окружность головы" },
];

const PERCENTILE_COLORS: Record<number, string> = {
  3: "#ef4444",
  15: "#f59e0b",
  50: "#22c55e",
  85: "#f59e0b",
  97: "#ef4444",
};

export function GrowthCharts({ patientId, sex }: Props) {
  const [chartType, setChartType] = useState<ChartType>("weight");
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("anthropometry_measurements")
        .select("*")
        .eq("patient_id", patientId)
        .order("measurement_date", { ascending: true });
      setMeasurements(data || []);
      setLoading(false);
    };
    fetch();
  }, [patientId]);

  const getRefData = () => {
    switch (chartType) {
      case "weight": return sex === "male" ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
      case "height": return sex === "male" ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
      case "bmi": return sex === "male" ? WHO_BMI_BOYS : WHO_BMI_GIRLS;
      case "head": return sex === "male" ? WHO_HEAD_BOYS : WHO_HEAD_GIRLS;
    }
  };

  const getValueField = (): string => {
    switch (chartType) {
      case "weight": return "weight_kg";
      case "height": return "height_cm";
      case "bmi": return "bmi";
      case "head": return "head_circumference_cm";
    }
  };

  const getUnit = () => {
    switch (chartType) {
      case "weight": return "кг";
      case "height": return "см";
      case "bmi": return "кг/м²";
      case "head": return "см";
    }
  };

  const refData = getRefData();
  const percentileLines = getPercentileLines(refData);
  const valueField = getValueField();

  // Build chart data: percentile curves + patient points
  // Use age in months as x-axis
  const patientPoints = measurements
    .filter((m: any) => m[valueField] != null && m.age_months != null)
    .map((m: any) => ({
      age: Number(m.age_months),
      patient: Number(m[valueField]),
    }));

  // Merge all data points
  const allAges = new Set<number>();
  percentileLines.forEach(pl => pl.points.forEach(p => allAges.add(p.age)));
  patientPoints.forEach(p => allAges.add(p.age));

  const chartData = Array.from(allAges).sort((a, b) => a - b).map(age => {
    const point: any = { age };
    percentileLines.forEach(pl => {
      const found = pl.points.find(p => p.age === age);
      if (found) point[`p${pl.percentile}`] = found.value;
    });
    const pp = patientPoints.find(p => p.age === age);
    if (pp) point.patient = pp.patient;
    return point;
  });

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Кривые роста (WHO)</CardTitle>
        <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CHART_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Нет данных для отображения</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="age"
                label={{ value: "Возраст (мес.)", position: "insideBottom", offset: -15 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                label={{ value: getUnit(), angle: -90, position: "insideLeft", offset: 5 }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === "patient") return [`${value} ${getUnit()}`, "Пациент"];
                  return [`${value} ${getUnit()}`, name];
                }}
                labelFormatter={(age) => `${age} мес. (${(Number(age) / 12).toFixed(1)} лет)`}
              />
              {/* Percentile lines */}
              {percentileLines.map(pl => (
                <Line
                  key={pl.percentile}
                  dataKey={`p${pl.percentile}`}
                  stroke={PERCENTILE_COLORS[pl.percentile]}
                  strokeWidth={pl.percentile === 50 ? 2 : 1}
                  strokeDasharray={pl.percentile === 50 ? undefined : "4 4"}
                  dot={false}
                  name={`P${pl.percentile}`}
                  connectNulls
                />
              ))}
              {/* Patient data */}
              <Line
                dataKey="patient"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 5 }}
                name="patient"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-destructive inline-block" /> P3 / P97</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-amber-500 inline-block" /> P15 / P85</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 inline-block" /> P50 (медиана)</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1 bg-primary inline-block rounded" /> Пациент</span>
        </div>
      </CardContent>
    </Card>
  );
}
