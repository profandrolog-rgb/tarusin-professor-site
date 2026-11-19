import { Loader2, Square, Scissors, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useDocumentRecognition } from "@/hooks/useDocumentRecognition";

type Props = { recognition: ReturnType<typeof useDocumentRecognition> };
export function DocumentRecognitionStatus({ recognition: r }: Props) {
  return <div className="space-y-2 min-w-0" aria-live="polite">
    {r.phase === "assessment" && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Оцениваю документ</p>}
    {r.assessment && <p className="text-sm text-muted-foreground">{r.assessment.reason}</p>}
    {r.phase === "fragmentation" && <>
      <p className="font-medium">Требуется фрагментация</p>
      <Button onClick={r.resume}><Scissors className="mr-2 h-4 w-4" />Разделить и распознать</Button>
    </>}
    {r.phase === "recognition" && <p className="text-sm">Распознано частей: {r.parts.filter((part) => part.state === "done").length} из {r.parts.length}</p>}
    {r.busy && <Button variant="outline" onClick={r.stop}><Square className="mr-2 h-4 w-4" />Остановить ожидание</Button>}
    {r.parts.map((part) => <p key={part.id} className={`text-sm break-words ${part.state === "error" ? "text-destructive" : "text-muted-foreground"}`}>
      {part.label}: {part.state === "done" ? "распознано" : part.state === "busy" ? "распознаётся" : part.state === "error" ? part.error : "не распознано"}
    </p>)}
    {r.phase === "results" && r.parts.some((part) => part.state !== "done") && <>
      <p className="text-sm text-destructive">Документ распознан не полностью. Нераспознанные части перечислены выше.</p>
      <Button variant="outline" onClick={r.resume}><RotateCcw className="mr-2 h-4 w-4" />Продолжить нераспознанные части</Button>
    </>}
    {r.error && <p className="text-sm text-destructive">{r.error}</p>}
  </div>;
}
