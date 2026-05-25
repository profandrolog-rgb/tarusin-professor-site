import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsSection, type AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { Loader2 } from "lucide-react";

interface Row { rank: number; name: string; section: string; usage_count: number; pct_of_plans: number }

export default function TopCatalogTable({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useAnalyticsSection<Row[]>("top_catalog", filters);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">ТОП-20 позиций каталога</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Секция</TableHead>
                <TableHead className="text-right">Применений</TableHead>
                <TableHead className="text-right">% листов</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((r) => (
                <TableRow key={r.rank}>
                  <TableCell>{r.rank}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.section}</TableCell>
                  <TableCell className="text-right">{r.usage_count}</TableCell>
                  <TableCell className="text-right">{r.pct_of_plans}%</TableCell>
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
