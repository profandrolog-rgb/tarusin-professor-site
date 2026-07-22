import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { IndexResult } from "@/lib/metabolic/metaIndices";

interface Group { title: string; indices?: string[]; assessment: string; actions?: string }

interface Props {
  patientId: string;
  indices: IndexResult[];
  patientSex?: "M" | "F" | null;
}

export default function IndicesInterpretation({ patientId, indices, patientSex }: Props) {
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [ts, setTs] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("metabolic_maps")
        .select("indices_interpretation")
        .eq("patient_id", patientId)
        .maybeSingle();
      const p = data?.indices_interpretation;
      if (p?.groups) { setGroups(p.groups); setTs(p.generated_at || null); }
    })();
  }, [patientId]);

  const run = async (force = false) => {
    setBusy(true); setErr(null);
    try {
      const payload = {
        patient_id: patientId,
        patient_sex: patientSex,
        force,
        indices: indices.map((i) => ({
          id: i.id, label: (i as any).label || i.id,
          value: i.value, displayValue: i.displayValue, unit: i.unit, target: i.target,
        })),
      };
      const { data, error } = await supabase.functions.invoke("interpret-metabolic-indices", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setGroups((data as any).groups || []);
      setTs((data as any).generated_at || null);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally { setBusy(false); }
  };

  if (indices.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Интерпретация индексов
          {ts && <span className="text-xs font-normal text-muted-foreground ml-2">от {new Date(ts).toLocaleString("ru-RU")}</span>}
        </CardTitle>
        <Button size="sm" variant="secondary" onClick={() => run(true)} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {groups.length ? "Перегенерировать" : "Сформировать"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {err && <p className="text-xs text-destructive">{err}</p>}
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нажмите «Сформировать», чтобы получить краткое ИИ-объяснение индексов.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => (
              <div key={i} className="rounded-md border p-3 text-sm">
                <div className="font-medium mb-1">{g.title}</div>
                <p className="text-muted-foreground whitespace-pre-wrap">{g.assessment}</p>
                {g.actions && <p className="mt-2 text-xs"><span className="font-medium">Что делать: </span>{g.actions}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
