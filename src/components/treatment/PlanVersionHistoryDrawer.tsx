import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, RotateCcw, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { SECTIONS, TreatmentCategory } from "./sections";

interface Version {
  id: string;
  plan_id: string;
  version_no: number;
  snapshot: any;
  created_by: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planId: string;
  userId: string;
}

function summarize(items: any[]): string {
  const byCat: Record<string, number> = {};
  items.forEach((i: any) => { byCat[i.section_category] = (byCat[i.section_category] || 0) + 1; });
  const parts = Object.entries(byCat).map(([k, n]) => {
    const s = SECTIONS.find(s => s.key === k);
    return `${s?.short || k}: ${n}`;
  });
  return parts.join(" · ");
}

export function PlanVersionHistoryDrawer({ open, onOpenChange, planId, userId }: Props) {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Version | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!open) { setSelected(null); return; }
    (async () => {
      setBusy(true);
      const { data } = await supabase
        .from("treatment_plan_versions")
        .select("*")
        .eq("plan_id", planId)
        .order("version_no", { ascending: false });
      setVersions((data as any) || []);
      setBusy(false);
    })();
  }, [open, planId]);

  const restore = async () => {
    if (!selected) return;
    if (!confirm("Создать новый черновик на основе этой версии? Текущий лист не будет затронут.")) return;
    setRestoring(true);
    try {
      const snap = selected.snapshot || {};
      const srcPlan = snap.plan || {};
      const srcItems: any[] = snap.items || [];

      const newPlan: any = {
        patient_id: srcPlan.patient_id,
        issued_at: new Date().toISOString().slice(0, 10),
        mode: srcPlan.mode,
        duration_days: srcPlan.duration_days,
        diagnosis_short: srcPlan.diagnosis_short,
        clinical_summary: srcPlan.clinical_summary,
        based_on_template: srcPlan.based_on_template,
        status: "draft",
        created_by: userId,
      };
      const { data: created, error } = await supabase
        .from("treatment_plans")
        .insert(newPlan)
        .select("id")
        .single();
      if (error || !created) throw error || new Error("Не удалось создать");

      if (srcItems.length) {
        const cloned = srcItems.map((it) => {
          const { id, plan_id, created_at, ...rest } = it;
          return { ...rest, plan_id: created.id };
        });
        const { error: e2 } = await supabase.from("treatment_plan_items").insert(cloned);
        if (e2) throw e2;
      }

      toast({ title: "Версия восстановлена", description: `Создан новый черновик из версии №${selected.version_no}` });
      onOpenChange(false);
      navigate(`/admin/treatment-plans/${created.id}`);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5"/>
            {selected ? `Версия №${selected.version_no}` : "История версий"}
          </SheetTitle>
          <SheetDescription>
            {selected
              ? `Снапшот от ${format(new Date(selected.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}`
              : "Версии создаются при каждом сохранении выписанного листа."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          {busy && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>}

          {!busy && !selected && versions.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              История пуста. Версии появятся после первой выписки листа.
            </div>
          )}

          {!busy && !selected && versions.length > 0 && (
            <div className="space-y-2">
              {versions.map(v => (
                <button
                  key={v.id}
                  className="w-full text-left border rounded-md p-3 hover:bg-accent transition-colors"
                  onClick={() => setSelected(v)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">№{v.version_no}</Badge>
                    <span className="text-sm">{format(new Date(v.created_at), "d MMM yyyy, HH:mm", { locale: ru })}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{summarize(v.snapshot?.items || [])}</div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1">
                <ArrowLeft className="w-4 h-4"/>К списку версий
              </Button>
              <div className="rounded-md border bg-amber-50 dark:bg-amber-900/20 border-amber-300/50 p-2 text-xs text-amber-800 dark:text-amber-200">
                Это версия №{selected.version_no}. Только просмотр. Чтобы вернуться к этому состоянию — нажмите «Восстановить» (создастся новый черновик).
              </div>

              <ReadOnlySnapshot snap={selected.snapshot}/>

              <Button onClick={restore} disabled={restoring} className="w-full gap-2">
                {restoring ? <Loader2 className="w-4 h-4 animate-spin"/> : <RotateCcw className="w-4 h-4"/>}
                Восстановить эту версию (создать новый черновик)
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ReadOnlySnapshot({ snap }: { snap: any }) {
  const plan = snap?.plan || {};
  const items: any[] = snap?.items || [];
  const grouped = SECTIONS.map(s => ({ section: s, list: items.filter((i: any) => i.section_category === s.key) }));
  return (
    <div className="space-y-2 opacity-95">
      <div className="border rounded-md p-2 text-xs space-y-1 bg-muted/30">
        <div><b>Режим:</b> {plan.mode === "scheduled" ? "по дням" : "плоский"}</div>
        <div><b>Длительность:</b> {plan.duration_days} дн.</div>
        {plan.diagnosis_short && <div><b>Диагноз:</b> {plan.diagnosis_short}</div>}
      </div>
      {grouped.filter(g => g.list.length > 0).map(({ section, list }) => (
        <div key={section.key} className="border rounded-md p-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{section.label}</div>
          <ul className="text-sm space-y-0.5">
            {list.map((it: any, idx: number) => (
              <li key={idx}>
                <span className="font-medium">{it.name_snapshot}</span>
                {it.dose != null && <> — {it.dose} {it.dose_unit}</>}
                {it.frequency && <>, {it.frequency}</>}
                {it.day_pattern && <span className="text-xs text-muted-foreground"> · дни: {it.day_pattern}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
