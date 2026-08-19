import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OpEntry {
  id: string;
  operation_date: string | null;
  operation_name: string | null;
  diagnosis: string | null;
}

/**
 * Подтягивает последнюю операцию пациента из журнала операций
 * (сопоставление по ФИО + дате рождения — в журнале нет patient_id)
 * и позволяет одним кликом подставить название и дату операции в протокол.
 */
export function OperationHistoryBanner({
  patientName,
  birthDate,
  patientId,
  currentVisitId,
  currentName,
  currentDate,
  onApply,
}: {
  patientName?: string | null;
  birthDate?: string | null;
  patientId?: string | null;
  currentVisitId?: string | null;
  currentName?: string;
  currentDate?: string;
  onApply: (patch: { operation_name: string; operation_date: string }) => void;
}) {
  const [op, setOp] = useState<OpEntry | null>(null);
  const [autoDone, setAutoDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const name = (patientName || "").trim();
    if (!name && !patientId) {
      setOp(null);
      return;
    }
    (async () => {
      let found: OpEntry | null = null;

      if (name) {
        let q = supabase
          .from("operations_journal")
          .select("id, operation_date, operation_name, diagnosis")
          .ilike("patient_name", `%${name}%`)
          .order("operation_date", { ascending: false })
          .limit(1);
        if (birthDate) q = q.eq("patient_birth_date", birthDate);
        const { data } = await q;
        found = ((data as OpEntry[]) || [])[0] ?? null;
      }

      // Резерв: операция могла быть указана в предыдущих протоколах пациента.
      if (!found?.operation_name && patientId) {
        let vq = supabase
          .from("patient_visits")
          .select("id, visit_date, diagnosis, protocol_data")
          .eq("patient_id", patientId)
          .order("visit_date", { ascending: false })
          .limit(20);
        if (currentVisitId) vq = vq.neq("id", currentVisitId);
        const { data: visits } = await vq;
        for (const v of (visits as any[]) || []) {
          const pd = (v?.protocol_data || {}) as Record<string, any>;
          const opName = typeof pd.operation_name === "string" ? pd.operation_name.trim() : "";
          if (opName) {
            found = {
              id: v.id,
              operation_name: opName,
              operation_date: typeof pd.operation_date === "string" ? pd.operation_date : null,
              diagnosis: v.diagnosis ?? null,
            };
            break;
          }
        }
      }

      if (!cancelled) setOp(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientName, birthDate, patientId, currentVisitId]);

  // Автоподстановка: если в протоколе поля операции пустые — заполняем сразу.
  useEffect(() => {
    if (autoDone || !op?.operation_name) return;
    if ((currentName || "").trim() || (currentDate || "").trim()) return;
    setAutoDone(true);
    onApply({
      operation_name: op.operation_name || "",
      operation_date: op.operation_date || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op, autoDone]);

  if (!op || !op.operation_name) return null;

  const already =
    (currentName || "") === op.operation_name && (currentDate || "") === (op.operation_date || "");

  const apply = () => {
    onApply({
      operation_name: op.operation_name || "",
      operation_date: op.operation_date || "",
    });
    toast({ title: "Операция подставлена из журнала" });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <div className="flex items-start gap-2">
        <Scissors className="h-4 w-4 text-primary mt-0.5" />
        <div>
          <div>
            Операция из журнала: <strong>{op.operation_name}</strong>
            {op.operation_date ? (
              <span className="text-muted-foreground">
                {" "}
                от {new Date(op.operation_date).toLocaleDateString("ru-RU")}
              </span>
            ) : null}
          </div>
          {op.diagnosis ? (
            <div className="text-xs text-muted-foreground">Диагноз: {op.diagnosis}</div>
          ) : null}
        </div>
      </div>
      <Button type="button" size="sm" onClick={apply} disabled={already}>
        {already ? "Подставлено" : "Подставить"}
      </Button>
    </div>
  );
}
