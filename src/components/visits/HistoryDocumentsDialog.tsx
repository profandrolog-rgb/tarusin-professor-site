import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDocumentRecognition } from "@/hooks/useDocumentRecognition";
import { DocumentRecognitionStatus } from "./DocumentRecognitionStatus";
import { appendHistoryDocuments, historyDocumentText, sameHistoryPatient } from "@/lib/visits/historyDocuments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Item { parentId?: string; id: string; file: File; text: string; state: "waiting" | "busy" | "done" | "error"; error?: string; patient?: string; confirmed: boolean }
interface Props { open: boolean; onOpenChange: (open: boolean) => void; patientId: string; anamnesis: string; onAnamnesis: (text: string) => void }

export function HistoryDocumentsDialog({ open, onOpenChange, patientId, anamnesis, onAnamnesis }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const recognition = useDocumentRecognition();
  const busy = recognition.busy;
  const [active, setActive] = useState<Item | null>(null);
  const [expectedPatient, setExpectedPatient] = useState("");
  const consumed = useRef(new Set<string>());
  const input = useRef<HTMLInputElement>(null);
  const patch = (id: string, changes: Partial<Item>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  const add = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).map((file): Item => ({ id: crypto.randomUUID(), file, text: "", state: "waiting", confirmed: false }));
    setItems((current) => [...current, ...added]);
  };
  const recognize = async (queue: Item[]) => {
    const item = queue[0];
    if (!item || busy) return;
    const { data: patient, error } = await supabase.from("patients").select("full_name").eq("id", patientId).single();
    if (error || !patient) { toast({ title: "Не удалось проверить пациента", variant: "destructive" }); return; }
    setExpectedPatient(patient.full_name);
    setActive(item);
    await recognition.start(item.file);
  };
  useEffect(() => {
    if (!active) return;
    for (const part of recognition.parts) {
      if (!part.parsed || consumed.current.has(part.id)) continue;
      consumed.current.add(part.id);
      const text = historyDocumentText(`${active.file.name} (${part.label})`, part.parsed);
      const parsed = part.parsed;
      setItems((current) => [...current, { id: part.id, parentId: active.id, file: active.file, state: text ? "done" : "error", text, error: text ? undefined : "В части не найдено данных для анамнеза", patient: parsed.patient?.full_name, confirmed: sameHistoryPatient(expectedPatient, parsed.patient?.full_name) }]);
    }
    if (recognition.phase === "results") {
      patch(active.id, { state: "done", text: "", error: recognition.parts.some((part) => part.state !== "done") ? "Документ распознан не полностью" : undefined });
    }
    if (recognition.error) patch(active.id, { state: "error", error: recognition.error });
  }, [recognition.parts, recognition.phase, recognition.error, active, expectedPatient]);
  useEffect(() => {
    if (busy || !active || recognition.phase !== "results" || recognition.parts.some((part) => part.state !== "done")) return;
    const next = items.find((item) => item.id !== active.id && item.state === "waiting" && !item.parentId);
    if (next) void recognize([next]);
  }, [busy, active, recognition.phase, recognition.parts, items]);
  const ready = items.filter((item) => item.state === "done" && item.text.trim());
  const apply = () => {
    if (!ready.length || ready.some((item) => !item.confirmed)) return;
    onAnamnesis(appendHistoryDocuments(anamnesis, ready.map((item) => ({ name: item.file.name, text: item.text }))));
    setItems((current) => current.filter((item) => !ready.some((done) => done.id === item.id)));
    toast({ title: "Документы добавлены в анамнез", description: "Поля текущего осмотра не изменены. Сохраните визит." });
    if (!items.some((item) => !ready.includes(item) && (item.state === "waiting" || item.state === "error")) && !recognition.parts.some((part) => part.state !== "done")) onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Документы в анамнез</DialogTitle></DialogHeader>
      <input ref={input} type="file" multiple className="hidden" accept=".doc,.docx,.odt,.ods,.odp,.ott,.fodt,.fods,.fodp,.pdf,.txt,.md,.rtf,image/*" onChange={(event) => { add(event.target.files); event.target.value = ""; }} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}><FileUp className="mr-2 h-4 w-4" />Выбрать документы</Button>
        <Button disabled={busy || !items.some((item) => item.state === "waiting" || item.state === "error")} onClick={() => recognize(items.filter((item) => item.state === "waiting" || item.state === "error"))}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Распознать</Button>
      </div>
      <DocumentRecognitionStatus recognition={recognition} />
      {items.map((item) => <div key={item.id} className="border-b pb-3 space-y-2 min-w-0">
        <div className="flex items-center gap-2"><span className="text-sm font-medium break-all flex-1">{item.file.name}</span>
          {item.state === "busy" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          {item.state === "error" && !item.parentId && <Button size="icon" variant="ghost" title="Повторить распознавание" disabled={busy} onClick={() => recognize([item])}><RotateCcw className="h-4 w-4" /></Button>}
          <Button size="icon" variant="ghost" title="Убрать документ" disabled={busy} onClick={() => { if (active?.id === item.id) { recognition.reset(); setActive(null); } setItems((current) => current.filter((row) => row.id !== item.id && row.parentId !== item.id)); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
        {item.state === "waiting" && <p className="text-sm text-muted-foreground">Ожидает распознавания</p>}
        {item.error && <p className="text-sm text-destructive">{item.error}</p>}
        {item.state === "done" && item.text && <>
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
