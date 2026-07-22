import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FlaskConical } from "lucide-react";

interface LabRow {
  id: string;
  test_name: string;
  value: number | null;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  test_date: string | null;
  needs_review: boolean | null;
}

interface Props {
  visitId: string;
  refreshToken?: number;
  onRowsLoaded?: (ids: string[]) => void;
}

export default function VisitRecognizedLabs({ visitId, refreshToken, onRowsLoaded }: Props) {
  const [rows, setRows] = useState<LabRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!visitId) return;
    setLoading(true);
    const { data } = await supabase
      .from("lab_results")
      .select("id, test_name, value, unit, reference_min, reference_max, test_date, needs_review")
      .eq("visit_id", visitId)
      .order("test_group", { ascending: true })
      .order("test_name", { ascending: true });
    const list = (data as LabRow[]) || [];
    setRows(list);
    onRowsLoaded?.(list.map((r) => r.id));
    setLoading(false);
  }, [visitId, onRowsLoaded]);

  useEffect(() => { load(); }, [load, refreshToken]);

  if (!visitId) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="w-4 h-4" />
          Распознанные анализы визита ({rows.length})
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет распознанных анализов. Загрузите PDF выше.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-1 pr-2">Показатель</th>
                  <th className="text-right py-1 px-2">Значение</th>
                  <th className="text-left py-1 px-2">Ед.</th>
                  <th className="text-left py-1 px-2">Норма</th>
                  <th className="text-left py-1 px-2">Дата</th>
                  <th className="text-left py-1 pl-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const out = r.value != null && (
                    (r.reference_min != null && r.value < r.reference_min) ||
                    (r.reference_max != null && r.value > r.reference_max)
                  );
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-1 pr-2">{r.test_name}</td>
                      <td className={`py-1 px-2 text-right tabular-nums ${out ? "text-destructive font-semibold" : ""}`}>
                        {r.value ?? "—"}
                      </td>
                      <td className="py-1 px-2 text-muted-foreground">{r.unit || ""}</td>
                      <td className="py-1 px-2 text-muted-foreground">
                        {r.reference_min ?? "?"}–{r.reference_max ?? "?"}
                      </td>
                      <td className="py-1 px-2 text-muted-foreground">{r.test_date || ""}</td>
                      <td className="py-1 pl-2">
                        {r.needs_review && <Badge variant="outline" className="text-xs">на проверку</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
