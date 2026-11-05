import { useEffect, useRef, useState } from "react";
import { FileUp, Sparkles, FlaskConical, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { HistoryDocumentsDialog } from "./HistoryDocumentsDialog";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
  patientId?: string | null;
  currentVisitId?: string | null;
  anamnesis?: string;
  onAnamnesis: (text: string) => void;
  onImport: () => void;
  refreshToken?: number;
}

/** Компактная панель «История пациента»: старый документ, анамнез, анализы для сравнения. */
export function PatientHistoryPanel({ patientId, currentVisitId, anamnesis, onAnamnesis, onImport, refreshToken }: Props) {
  const [busy, setBusy] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
  const [summarySource, setSummarySource] = useState("");
  const scope = `${patientId || ""}:${currentVisitId || ""}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => { setDocumentsOpen(false); setSummaryDraft(null); }, [scope]);
  const [prevVisits, setPrevVisits] = useState<number | null>(null);
  const [prevLabs, setPrevLabs] = useState<number | null>(null);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      let vq = supabase.from("patient_visits").select("id", { count: "exact", head: true }).eq("patient_id", patientId);
      let lq = supabase.from("lab_results").select("id", { count: "exact", head: true }).eq("patient_id", patientId);
      if (currentVisitId) {
        vq = vq.neq("id", currentVisitId);
        lq = lq.or(`visit_id.is.null,visit_id.neq.${currentVisitId}`);
      }
      const [v, l] = await Promise.all([vq, lq]);
      setPrevVisits(v.count ?? 0);
      setPrevLabs(l.count ?? 0);
    })();
  }, [patientId, currentVisitId, refreshToken]);

  if (!patientId) return null;

  const collect = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-patient-anamnesis", {
        body: { patient_id: patientId, exclude_visit_id: currentVisitId, prior_anamnesis: anamnesis || "" },
      });
      if (error) throw error;
      const summary = (data as any)?.summary?.trim();
      if (!summary) {
        toast({ title: "Нет данных для анамнеза", description: "У пациента нет предыдущих протоколов." });
        return;
      }
      onAnamnesis(summary);
      toast({ title: "Анамнез собран из истории", description: "Текст вставлен в поле «Анамнез»." });
    } catch (e: any) {
      toast({ title: "Не удалось собрать анамнез", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const compact = async () => {
    if (!anamnesis?.trim()) return;
    const requestScope = scope;
    const source = anamnesis;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-patient-anamnesis", {
        body: { mode: "compact", text: source },
      });
      if (error || !data?.summary?.trim()) throw new Error("Нет результата");
      if (currentScope.current !== requestScope) return;
      setSummarySource(source);
      setSummaryDraft(data.summary.trim());
    } catch {
      if (currentScope.current === requestScope) toast({ title: "Не удалось сократить анамнез. Исходный текст сохранён.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const goLabs = () => {
    document.getElementById("visit-labs-upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
    <div className="rounded-md border bg-muted/30 px-3 py-2 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-sm font-medium mr-1">
        <History className="h-4 w-4 text-primary" />
        История пациента
        <span className="text-xs font-normal text-muted-foreground">
          {prevVisits === null ? "" : `· визитов: ${prevVisits} · анализов: ${prevLabs}`}
        </span>
      </div>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={onImport}
        title="ODT, DOC, DOCX, PDF, RTF, скан — заполнить этот протокол или сохранить как прошлый визит">
        <FileUp className="h-3.5 w-3.5" /> Загрузить старый документ
      </Button>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => setDocumentsOpen(true)}>
        <FileUp className="h-3.5 w-3.5" /> Загрузить документы в анамнез
      </Button>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={compact} disabled={busy || !anamnesis?.trim()}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Сократить анамнез с ИИ
      </Button>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={collect} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Собрать анамнез из истории
      </Button>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={goLabs}
        title="Загрузить бланки анализов; динамика с прошлыми визитами печатается в заключении">
        <FlaskConical className="h-3.5 w-3.5" /> Анализы для сравнения{prevLabs ? ` (${prevLabs})` : ""}
      </Button>
    </div>
    <HistoryDocumentsDialog key={scope} open={documentsOpen} onOpenChange={setDocumentsOpen} patientId={patientId} anamnesis={anamnesis || ""} onAnamnesis={onAnamnesis} />
    <Dialog open={summaryDraft !== null} onOpenChange={(open) => { if (!open) setSummaryDraft(null); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Сокращённый анамнез</DialogTitle></DialogHeader>
        <Textarea rows={14} value={summaryDraft || ""} onChange={(event) => setSummaryDraft(event.target.value)} />
        {anamnesis !== summarySource && <p className="text-sm text-destructive">Исходный анамнез изменился. Закройте окно и повторите сокращение.</p>}
        <DialogFooter><Button variant="outline" onClick={() => setSummaryDraft(null)}>Отмена</Button><Button disabled={!summaryDraft?.trim() || anamnesis !== summarySource} onClick={() => { if (summaryDraft?.trim() && anamnesis === summarySource) { onAnamnesis(summaryDraft.trim()); setSummaryDraft(null); } }}>Применить</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
