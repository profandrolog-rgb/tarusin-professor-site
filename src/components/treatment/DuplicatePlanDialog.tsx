import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Patient { id: string; full_name: string; birth_date: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourcePlanId: string;
  sourcePatientName?: string;
  userId: string;
}

export function DuplicatePlanDialog({ open, onOpenChange, sourcePlanId, sourcePatientName, userId }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [picked, setPicked] = useState<Patient | null>(null);
  const [busy, setBusy] = useState(false);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    if (!open) { setQ(""); setResults([]); setPicked(null); }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, birth_date")
        .ilike("full_name", `%${q}%`)
        .limit(10);
      setResults((data as any) || []);
      setBusy(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const clone = async () => {
    if (!picked) return;
    setCloning(true);
    try {
      // Read source plan
      const { data: src, error: e1 } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("id", sourcePlanId)
        .maybeSingle();
      if (e1 || !src) throw e1 || new Error("Источник не найден");

      // Insert new plan (course_number auto via trigger)
      const newPlan: any = {
        patient_id: picked.id,
        issued_at: new Date().toISOString().slice(0, 10),
        mode: (src as any).mode,
        duration_days: (src as any).duration_days,
        diagnosis_short: (src as any).diagnosis_short,
        clinical_summary: (src as any).clinical_summary,
        based_on_template: (src as any).based_on_template,
        status: "draft",
        created_by: userId,
      };
      const { data: created, error: e2 } = await supabase
        .from("treatment_plans")
        .insert(newPlan)
        .select("id")
        .single();
      if (e2 || !created) throw e2 || new Error("Не удалось создать лист");

      // Copy items
      const { data: items, error: e3 } = await supabase
        .from("treatment_plan_items")
        .select("*")
        .eq("plan_id", sourcePlanId);
      if (e3) throw e3;
      if (items && items.length) {
        const cloned = items.map((it: any) => {
          const { id, plan_id, created_at, ...rest } = it;
          return { ...rest, plan_id: created.id };
        });
        const { error: e4 } = await supabase.from("treatment_plan_items").insert(cloned);
        if (e4) throw e4;
      }

      toast({ title: "Лист продублирован", description: `Создан новый лист для ${picked.full_name}` });
      onOpenChange(false);
      navigate(`/admin/treatment-plans/${created.id}`);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setCloning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!cloning) onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5"/>Дублировать на другого пациента</DialogTitle>
          <DialogDescription>
            {sourcePatientName ? <>Исходный лист: <b>{sourcePatientName}</b>. </> : null}
            Новый лист будет создан как черновик с автонумерацией курса.
          </DialogDescription>
        </DialogHeader>

        {!picked && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск пациента (минимум 2 символа)..." className="pl-9" autoFocus/>
            </div>
            <div className="border rounded max-h-64 overflow-y-auto">
              {busy && <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline"/></div>}
              {!busy && q.trim().length >= 2 && results.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">Не найдено</div>
              )}
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPicked(p)}
                  className="w-full text-left px-3 py-2 hover:bg-accent border-b last:border-0"
                >
                  <div className="font-medium">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground">{p.birth_date}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {picked && (
          <div className="space-y-3">
            <div className="border rounded p-3 bg-secondary/30">
              <div className="font-medium">{picked.full_name}</div>
              <div className="text-xs text-muted-foreground">Дата рождения: {picked.birth_date}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>← Выбрать другого</Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cloning}>Отмена</Button>
          {picked && (
            <Button onClick={clone} disabled={cloning} className="gap-2">
              {cloning && <Loader2 className="w-4 h-4 animate-spin"/>}
              Создать копию
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
