import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  patientId?: string;
  consultationCaseId?: string;
  visitId?: string;
  onComplete?: (summary: FileStatus[]) => void;
}

interface FileStatus {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "parsing" | "done" | "error";
  message?: string;
  result?: {
    document_type?: string;
    inserted_labs_count?: number;
    inserted_diagnoses_count?: number;
    queued_unknown_count?: number;
    conclusion_text?: string | null;
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function PdfBatchUpload({ patientId, consultationCaseId, onComplete }: Props) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [parseEnabled, setParseEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    setFiles((prev) => [...prev, ...arr.map((f) => ({ file: f, progress: 0, status: "pending" as const }))]);
  };

  const run = async () => {
    if (!files.length) return;
    if (!patientId && !consultationCaseId) {
      toast({ title: "Не указан пациент/консультация", variant: "destructive" });
      return;
    }
    setRunning(true);
    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "done") continue;
      updated[i] = { ...updated[i], status: "uploading", progress: 20 };
      setFiles([...updated]);
      try {
        const dataUrl = await fileToDataUrl(updated[i].file);
        if (!parseEnabled) {
          // Upload-only: skip parsing
          updated[i] = { ...updated[i], status: "done", progress: 100, message: "Загружено (без парсинга)" };
          setFiles([...updated]);
          continue;
        }
        updated[i] = { ...updated[i], status: "parsing", progress: 55 };
        setFiles([...updated]);

        const { data, error } = await supabase.functions.invoke("parse-medical-pdf", {
          body: {
            file_data: dataUrl,
            file_name: updated[i].file.name,
            patient_id: patientId,
            consultation_case_id: consultationCaseId,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        updated[i] = {
          ...updated[i],
          status: "done",
          progress: 100,
          result: data,
        };
      } catch (err: any) {
        updated[i] = { ...updated[i], status: "error", progress: 100, message: err?.message || "Ошибка" };
      }
      setFiles([...updated]);
    }
    setRunning(false);
    onComplete?.(updated);
    const totalLabs = updated.reduce((a, f) => a + (f.result?.inserted_labs_count || 0), 0);
    const totalDx = updated.reduce((a, f) => a + (f.result?.inserted_diagnoses_count || 0), 0);
    toast({
      title: "Обработка завершена",
      description: `Показателей: ${totalLabs}, диагнозов: ${totalDx}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Загрузить анализы (PDF)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={running}>
            <Upload className="w-4 h-4 mr-2" />Выбрать PDF
          </Button>
          <Button size="sm" onClick={run} disabled={!files.length || running}>
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Обработать ({files.length})
          </Button>
          <label className="flex items-center gap-2 text-sm ml-auto">
            <Checkbox
              checked={parseEnabled}
              onCheckedChange={(v) => setParseEnabled(!!v)}
              disabled={running}
            />
            Парсить PDF в заключение
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          Можно выбирать несколько файлов из любого расположения (компьютер, флешка, сетевая папка).
        </p>

        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="border rounded p-2 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate flex-1">{f.file.name}</span>
                <span className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB</span>
                {f.status === "done" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                {f.status === "error" && <AlertTriangle className="w-4 h-4 text-destructive" />}
              </div>
              <Progress value={f.progress} className="h-1" />
              {f.status === "error" && (
                <p className="text-xs text-destructive">{f.message}</p>
              )}
              {f.status === "done" && f.result && (
                <p className="text-xs text-muted-foreground">
                  Тип: {f.result.document_type || "—"} · Показателей: {f.result.inserted_labs_count ?? 0}
                  {" · "}Диагнозов: {f.result.inserted_diagnoses_count ?? 0}
                  {f.result.queued_unknown_count ? ` · На проверку: ${f.result.queued_unknown_count}` : ""}
                </p>
              )}
              {f.status === "done" && f.result?.conclusion_text && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Заключение из документа</summary>
                  <p className="mt-1 whitespace-pre-wrap">{f.result.conclusion_text}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
