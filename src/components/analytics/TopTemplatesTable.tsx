import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsSection, type AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { Loader2 } from "lucide-react";

interface Row { rank: number; name: string; usage_count: number; avg_duration_days: number; avg_cost: number }

export default function TopTemplatesTable({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useAnalyticsSection<Row[]>("top_templates", filters);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">ТОП-10 шаблонов</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="text-right">Применений</TableHead>
                <TableHead className="text-right">Ср. длит-сть, дн</TableHead>
                <TableHead className="text-right">Ср. стоимость, ₽</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((r) => (
                <TableRow key={r.rank}>
                  <TableCell>{r.rank}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{r.usage_count}</TableCell>
                  <TableCell className="text-right">{r.avg_duration_days ?? "—"}</TableCell>
                  <TableCell className="text-right">{r.avg_cost ? Number(r.avg_cost).toLocaleString("ru-RU") : "—"}</TableCell>
                </TableRow>
              ))}
              {(data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Нет данных</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
