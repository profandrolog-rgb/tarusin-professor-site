import { useRef, useState } from "react";
import { FileUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { extractProtocolSource, parseProtocolDocument } from "@/lib/visits/protocolImport";
import { appendHistoryDocuments, historyDocumentText, sameHistoryPatient } from "@/lib/visits/historyDocuments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Item { id: string; file: File; text: string; state: "waiting" | "busy" | "done" | "error"; error?: string; patient?: string; confirmed: boolean }
interface Props { open: boolean; onOpenChange: (open: boolean) => void; patientId: string; anamnesis: string; onAnamnesis: (text: string) => void }

export function HistoryDocumentsDialog({ open, onOpenChange, patientId, anamnesis, onAnamnesis }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const patch = (id: string, changes: Partial<Item>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  const add = (files: FileList | null) => {
    if (!files) return;
    setItems((current) => [...current, ...Array.from(files).map((file): Item => ({ id: crypto.randomUUID(), file, text: "", state: "waiting", confirmed: false }))]);
  };
  const recognize = async (queue: Item[]) => {
    setBusy(true);
    try {
      const { data: patient, error } = await supabase.from("patients").select("full_name").eq("id", patientId).single();
      if (error || !patient) throw new Error("Не удалось проверить пациента");
      for (const item of queue) {
        patch(item.id, { state: "busy", error: undefined });
        try {
          const source = await extractProtocolSource(item.file);
          const parsed = await parseProtocolDocument(source);
          const text = historyDocumentText(item.file.name, parsed);
          if (!text) throw new Error("В документе не найдено данных для анамнеза");
          patch(item.id, { state: "done", text, patient: parsed.patient?.full_name, confirmed: sameHistoryPatient(patient.full_name, parsed.patient?.full_name) });
        } catch (error) {
          patch(item.id, { state: "error", error: error instanceof Error ? error.message : "Не удалось распознать документ" });
        }
      }
    } catch {
      toast({ title: "Не удалось проверить пациента. Документы не добавлены.", variant: "destructive" });
    } finally { setBusy(false); }
  };
  const ready = items.filter((item) => item.state === "done" && item.text.trim());
  const apply = () => {
    if (!ready.length || ready.some((item) => !item.confirmed)) return;
    onAnamnesis(appendHistoryDocuments(anamnesis, ready.map((item) => ({ name: item.file.name, text: item.text }))));
    setItems((current) => current.filter((item) => !ready.some((done) => done.id === item.id)));
    toast({ title: "Документы добавлены в анамнез", description: "Поля текущего осмотра не изменены. Сохраните визит." });
    if (ready.length === items.length) onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Документы в анамнез</DialogTitle></DialogHeader>
      <input ref={input} type="file" multiple className="hidden" accept=".doc,.docx,.odt,.ods,.odp,.ott,.fodt,.fods,.fodp,.pdf,.txt,.md,.rtf,image/*" onChange={(event) => { add(event.target.files); event.target.value = ""; }} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}><FileUp className="mr-2 h-4 w-4" />Выбрать документы</Button>
        <Button disabled={busy || !items.some((item) => item.state === "waiting" || item.state === "error")} onClick={() => recognize(items.filter((item) => item.state === "waiting" || item.state === "error"))}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Распознать</Button>
      </div>
      {items.map((item) => <div key={item.id} className="border-b pb-3 space-y-2 min-w-0">
        <div className="flex items-center gap-2"><span className="text-sm font-medium break-all flex-1">{item.file.name}</span>
          {item.state === "busy" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          {item.state === "error" && <Button size="icon" variant="ghost" title="Повторить распознавание" disabled={busy} onClick={() => recognize([item])}><RotateCcw className="h-4 w-4" /></Button>}
          <Button size="icon" variant="ghost" title="Убрать документ" disabled={busy} onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
        </div>
        {item.state === "waiting" && <p className="text-sm text-muted-foreground">Ожидает распознавания</p>}
        {item.error && <p className="text-sm text-destructive">{item.error}</p>}
        {item.state === "done" && <>
          <Textarea value={item.text} rows={6} disabled={busy} onChange={(event) => patch(item.id, { text: event.target.value })} />
          <label className="flex items-start gap-2 text-sm"><Checkbox checked={item.confirmed} disabled={busy} onCheckedChange={(value) => patch(item.id, { confirmed: value === true })} />
            <span>Документ относится к этому пациенту{item.patient ? ` (в документе: ${item.patient})` : " (ФИО не распознано)"}</span>
          </label>
        </>}
      </div>)}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Закрыть</Button><Button disabled={busy || !ready.length || ready.some((item) => !item.confirmed)} onClick={apply}>Добавить в анамнез ({ready.length})</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
