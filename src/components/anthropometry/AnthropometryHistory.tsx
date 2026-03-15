import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  patientId: string;
}

export function AnthropometryHistory({ patientId }: Props) {
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMeasurements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("anthropometry_measurements")
      .select("*")
      .eq("patient_id", patientId)
      .order("measurement_date", { ascending: false });
    setMeasurements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeasurements();
  }, [patientId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("anthropometry_measurements").delete().eq("id", deleteId);
    if (error) toast.error("Ошибка удаления");
    else { toast.success("Удалено"); fetchMeasurements(); }
    setDeleteId(null);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (measurements.length === 0) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Нет сохранённых измерений</CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История измерений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-muted-foreground font-medium">Дата</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Возраст</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Вес, кг</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Рост, см</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">ИМТ</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">P вес</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">P рост</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">P ИМТ</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Развитие</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Гармоничность</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m: any) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-2">{format(new Date(m.measurement_date), "dd.MM.yyyy")}</td>
                    <td className="p-2 text-right">{m.age_months != null ? `${Math.floor(m.age_months / 12)} г. ${m.age_months % 12} м.` : "—"}</td>
                    <td className="p-2 text-right">{m.weight_kg ?? "—"}</td>
                    <td className="p-2 text-right">{m.height_cm ?? "—"}</td>
                    <td className="p-2 text-right">{m.bmi != null ? Number(m.bmi).toFixed(1) : "—"}</td>
                    <td className="p-2 text-right">{m.weight_percentile != null ? `P${m.weight_percentile}` : "—"}</td>
                    <td className="p-2 text-right">{m.height_percentile != null ? `P${m.height_percentile}` : "—"}</td>
                    <td className="p-2 text-right">{m.bmi_percentile != null ? `P${m.bmi_percentile}` : "—"}</td>
                    <td className="p-2">{m.physical_development ?? "—"}</td>
                    <td className="p-2">{m.harmony ?? "—"}</td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить измерение?</AlertDialogTitle>
            <AlertDialogDescription>Это действие необратимо.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
