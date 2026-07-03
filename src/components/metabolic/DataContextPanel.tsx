import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type Props = {
  patientId: string;
  visitId?: string | null;
};

type Counts = {
  labs: number;
  labsRecent: Array<{ test_date: string; test_name: string; value: number; unit: string | null; reference_min: number | null; reference_max: number | null }>;
  visits: number;
  visitsWithProtocol: number;
  anthropometry: number;
  diagnoses: number;
  prescriptions: number;
  cutoffDate: string | null;
};

/**
 * Показывает пользователю, какие данные будут учтены при пересчёте и в ИИ-запросе:
 * количества по источникам + последние 5 лабораторных. Убирает «слепое ожидание».
 */
export function DataContextPanel({ patientId, visitId }: Props) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [c, setC] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      let cutoff: string | null = null;
      if (visitId) {
        const { data: v } = await supabase
          .from("patient_visits")
          .select("visit_date")
          .eq("id", visitId)
          .maybeSingle();
        cutoff = (v?.visit_date as string | undefined) || null;
      }

      // labs count + recent 5
      let labsQ = supabase
        .from("lab_results")
        .select("id, test_date, test_name, value, unit, reference_min, reference_max", { count: "exact" })
        .eq("patient_id", patientId)
        .order("test_date", { ascending: false });
      if (cutoff) labsQ = labsQ.lte("test_date", cutoff);
      const { data: labs, count: labsCount } = await labsQ.limit(5);

      // visits
      let visQ = supabase
        .from("patient_visits")
        .select("id, protocol_data", { count: "exact" })
        .eq("patient_id", patientId);
      if (cutoff) visQ = visQ.lte("visit_date", cutoff);
      const { data: visits, count: visitsCount } = await visQ;
      const visitsWithProtocol = (visits || []).filter((v: any) => v.protocol_data && Object.keys(v.protocol_data).length).length;

      // anthropometry
      const { count: anthroCount } = await supabase
        .from("anthropometry_measurements")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId);

      // diagnoses (может отсутствовать)
      let dxCount = 0;
      try {
        const { count } = await (supabase as any)
          .from("patient_diagnosis_timeline")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", patientId);
        dxCount = count || 0;
      } catch { /* noop */ }

      // prescriptions
      const { count: rxCount } = await supabase
        .from("prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId);

      if (cancelled) return;
      setC({
        labs: labsCount || 0,
        labsRecent: (labs as any) || [],
        visits: visitsCount || 0,
        visitsWithProtocol,
        anthropometry: anthroCount || 0,
        diagnoses: dxCount,
        prescriptions: rxCount || 0,
        cutoffDate: cutoff,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [patientId, visitId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Что учитывается в расчёте
            {c?.cutoffDate && (
              <Badge variant="outline" className="text-[10px]">до {c.cutoffDate}</Badge>
            )}
          </span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setOpen((v) => !v)}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-3">
          {loading || !c ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Считаем данные…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                <Metric label="Лабораторные" value={c.labs} accent={c.labs > 0} />
                <Metric label="Визиты" value={c.visits} sub={`с протоколом: ${c.visitsWithProtocol}`} accent={c.visits > 0} />
                <Metric label="Антропометрия" value={c.anthropometry} accent={c.anthropometry > 0} />
                <Metric label="Диагнозы" value={c.diagnoses} accent={c.diagnoses > 0} />
                <Metric label="Рецепты" value={c.prescriptions} accent={c.prescriptions > 0} />
              </div>
              {c.labs === 0 ? (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-2 py-1.5">
                  Лабораторных данных нет — все пути покажут «нет данных».
                  Загрузите лабы или запустите извлечение из AI-протоколов визитов.
                </div>
              ) : (
                <div>
                  <div className="text-[11px] font-medium text-muted-foreground mb-1">Последние 5 маркеров:</div>
                  <ul className="text-xs space-y-0.5">
                    {c.labsRecent.map((l, i) => {
                      const v = Number(l.value);
                      const lo = l.reference_min == null ? null : Number(l.reference_min);
                      const hi = l.reference_max == null ? null : Number(l.reference_max);
                      const flag =
                        Number.isFinite(v) && lo != null && v < lo ? "↓" :
                        Number.isFinite(v) && hi != null && v > hi ? "↑" : "";
                      const flagCls = flag === "↑" ? "text-red-600" : flag === "↓" ? "text-blue-600" : "text-muted-foreground";
                      return (
                        <li key={i} className="flex items-baseline gap-2 font-mono">
                          <span className="text-muted-foreground w-20 shrink-0">{l.test_date}</span>
                          <span className="flex-1 truncate">{l.test_name}</span>
                          <span className="tabular-nums">{l.value}{l.unit ? ` ${l.unit}` : ""}</span>
                          <span className={`w-4 ${flagCls}`}>{flag}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Правила автоагрегатора сравнивают значения с референсами по коду/названию теста.
                ИИ-интерпретация получает эти же данные + антропометрию, диагнозы, жалобы и рецепты.
              </p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded border px-2 py-1.5 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
