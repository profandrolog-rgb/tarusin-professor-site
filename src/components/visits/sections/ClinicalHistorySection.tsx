import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SmartFieldLabel } from "../SmartTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

/**
 * Универсальный блок "Жалобы / Анамнез / Динамика".
 * Все поля выводятся вертикально (одна под другой), широкие контейнеры.
 * Пустые поля не выводятся на печать — см. ProtocolPrintLayout.
 */
export interface ClinicalHistoryData {
  complaints?: string;
  anamnesis?: string;
  dynamics?: string;
}

interface Props {
  data: ClinicalHistoryData;
  onChange: (patch: Partial<ClinicalHistoryData>) => void;
  /** Какие из трёх полей показать. По умолчанию все три. */
  show?: { complaints?: boolean; anamnesis?: boolean; dynamics?: boolean };
  /** Высота textarea в строках (по умолчанию 4 — крупные поля) */
  rows?: number;
  /** Для кнопки "Собрать анамнез из истории" */
  patientId?: string | null;
  currentVisitId?: string | null;
}

export function ClinicalHistorySection({ data, onChange, show, rows = 4, patientId, currentVisitId }: Props) {
  const s = {
    complaints: show?.complaints ?? true,
    anamnesis: show?.anamnesis ?? true,
    dynamics: show?.dynamics ?? true,
  };
  const [aiBusy, setAiBusy] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
  const [summarySource, setSummarySource] = useState("");
  const scope = `${patientId || ""}:${currentVisitId || ""}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => { setSummaryDraft(null); }, [scope]);

  const compactAnamnesis = async () => {
    const source = data.anamnesis || "";
    if (!source.trim()) return;
    const requestScope = scope;
    setAiBusy(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("summarize-patient-anamnesis", {
        body: { mode: "compact", text: source },
      });
      if (error || !response?.summary?.trim()) throw new Error("Нет результата");
      if (currentScope.current !== requestScope) return;
      setSummarySource(source);
      setSummaryDraft(response.summary.trim());
    } catch {
      if (currentScope.current === requestScope) toast({ title: "Не удалось сократить анамнез. Исходный текст сохранён.", variant: "destructive" });
    } finally { setAiBusy(false); }
  };

  const collectAnamnesis = async () => {
    if (!patientId) {
      toast({ title: "Не указан пациент", variant: "destructive" });
      return;
    }
    setAiBusy(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke("summarize-patient-anamnesis", {
        body: { patient_id: patientId, exclude_visit_id: currentVisitId, prior_anamnesis: data.anamnesis || "" },
      });
      if (error) throw error;
      const summary = (resp as any)?.summary?.trim();
      if (!summary) {
        toast({ title: "Нет данных для анамнеза", description: "У пациента нет предыдущих протоколов." });
        return;
      }
      onChange({ anamnesis: summary });
      toast({ title: "Анамнез собран из истории" });
    } catch (e: any) {
      toast({ title: "Не удалось собрать анамнез", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <>
    <div className="space-y-4">
      {s.complaints && (
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="complaints">Жалобы</SmartFieldLabel>
          <Textarea
            rows={rows}
            value={data.complaints || ""}
            onChange={(e) => onChange({ complaints: e.target.value })}
          />
        </div>
      )}
      {s.anamnesis && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <SmartFieldLabel fieldKey="anamnesis" value={data.anamnesis || ""} onSet={(v) => onChange({ anamnesis: v })}>
              Анамнез
            </SmartFieldLabel>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
              onClick={compactAnamnesis} disabled={aiBusy || !data.anamnesis?.trim()}>
              {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Оптимизировать анамнез с ИИ
            </Button>
            {patientId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={collectAnamnesis}
                disabled={aiBusy}
                className="h-7 gap-1 text-xs"
                title="Собрать краткий анамнез ИИ из всех предыдущих протоколов пациента"
              >
                {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Собрать из истории
              </Button>
            ) : null}
          </div>
          <Textarea
            rows={rows}
            value={data.anamnesis || ""}
            onChange={(e) => onChange({ anamnesis: e.target.value })}
          />
        </div>
      )}
      {s.dynamics && (
        <div className="space-y-1">
          <SmartFieldLabel value={data.dynamics || ""} onSet={(v) => onChange({ dynamics: v })}>
            Динамика
          </SmartFieldLabel>
          <Textarea
            rows={rows}
            value={data.dynamics || ""}
            onChange={(e) => onChange({ dynamics: e.target.value })}
            placeholder="Если первичный визит — оставьте пустым, на печать не попадёт"
          />
        </div>
      )}
    </div>
    <Dialog open={summaryDraft !== null} onOpenChange={(open) => { if (!open) setSummaryDraft(null); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Оптимизированный анамнез</DialogTitle></DialogHeader>
        <Textarea rows={14} value={summaryDraft || ""} onChange={(event) => setSummaryDraft(event.target.value)} />
        {(data.anamnesis || "") !== summarySource && <p className="text-sm text-destructive">Исходный анамнез изменился. Закройте окно и повторите оптимизацию.</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setSummaryDraft(null)}>Отмена</Button>
          <Button disabled={!summaryDraft?.trim() || (data.anamnesis || "") !== summarySource} onClick={() => {
            if (summaryDraft?.trim() && (data.anamnesis || "") === summarySource) {
              onChange({ anamnesis: summaryDraft.trim() });
              setSummaryDraft(null);
            }
          }}>Применить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
