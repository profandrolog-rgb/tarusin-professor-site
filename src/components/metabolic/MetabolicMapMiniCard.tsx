import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { runAggregation, SEVERITY_LABEL, type Severity, type PathwaySummary } from "@/lib/metabolic/aggregator";
import { toast } from "@/hooks/use-toast";

const STATUS_CLS: Record<Severity, string> = {
  no_data: "bg-muted text-muted-foreground border-border",
  norm: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  mild: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
  moderate: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  severe: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300",
};

interface Props { patientId: string; patientName?: string | null }

export default function MetabolicMapMiniCard({ patientId, patientName }: Props) {
  const [summary, setSummary] = useState<PathwaySummary[]>([]);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState(false); // грузим ТОЛЬКО по запросу пользователя

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("metabolic_maps")
        .select("aggregate_summary, last_aggregated_at")
        .eq("patient_id", patientId)
        .maybeSingle();
      setSummary((data?.aggregate_summary?.pathways as PathwaySummary[]) || []);
      setLastAt(data?.last_aggregated_at || null);
    } finally {
      setLoading(false);
    }
  };

  const show = async () => {
    setShown(true);
    await load();
  };

  const recalc = async () => {
    setRunning(true);
    try {
      await runAggregation({ patientId, visitId: null });
      await load();
      toast({ title: "Карта пересчитана" });
    } catch (e: any) {
      toast({ title: "Ошибка пересчёта", description: e?.message || String(e), variant: "destructive" });
    } finally { setRunning(false); }
  };

  // Свёрнутый вид — ничего не грузим, пока пользователь не попросит
  if (!shown) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 flex items-center gap-2 text-sm">
        <Activity className="w-4 h-4 text-primary" />
        <span className="font-medium">Метаболическая карта</span>
        {patientName && <span className="text-muted-foreground text-xs truncate">· {patientName}</span>}
        <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={show}>
          Показать
        </Button>
        <a
          href={`/admin/patients/${patientId}/metabolic-map`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Открыть <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Activity className="w-4 h-4 text-primary" />
        <span className="font-medium">Метаболическая карта</span>
        {patientName && <span className="text-muted-foreground text-xs truncate">· {patientName}</span>}
        <button
          type="button"
          onClick={() => setShown(false)}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          title="Свернуть"
        >
          Скрыть
        </button>
        <a
          href={`/admin/patients/${patientId}/metabolic-map`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Открыть <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Загрузка…</div>
      ) : summary.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">Ещё не рассчитано. Нажмите «Пересчитать».</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {summary.map((s) => (
            <Badge
              key={s.pathway_id}
              variant="outline"
              className={`text-[11px] ${STATUS_CLS[s.status]}`}
              title={
                s.needs_phase_codes && s.needs_phase_codes.length
                  ? `Нужна фаза цикла: ${s.needs_phase_codes.join(", ")}`
                  : undefined
              }
            >
              {s.name}: {SEVERITY_LABEL[s.status]}
              {s.matched_markers > 0 && ` (${s.matched_markers})`}
              {s.needs_phase_codes && s.needs_phase_codes.length > 0 && (
                <span className="ml-1 text-blue-600">🔵</span>
              )}
            </Badge>
          ))}
        </div>
      )}
      {summary.some((s) => s.needs_phase_codes && s.needs_phase_codes.length > 0) && (
        <div className="text-[10px] text-blue-700 dark:text-blue-300">
          🔵 нужна фаза цикла:{" "}
          {Array.from(
            new Set(summary.flatMap((s) => s.needs_phase_codes || []))
          ).join(", ")}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={recalc} disabled={running}>
          {running ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Пересчитать
        </Button>
        {lastAt && <span className="text-[10px] text-muted-foreground">{new Date(lastAt).toLocaleString("ru-RU")}</span>}
      </div>
    </div>
  );
}
