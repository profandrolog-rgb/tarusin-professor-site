import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, FileText, FileArchive, Image as ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "chat-attachments";
const MAX_FILES = 50;
const MAX_TOTAL_MB = 300;
const MAX_FILE_MB = 30;

type Pending = { file: File; localId: string; progress: number; uploadedPath?: string; error?: string };

type BatchRow = {
  id: string;
  status: "pending" | "processing" | "done" | "error";
  total_files: number;
  processed_files: number;
  partial_results: { subbatch_index: number; files: string[]; content?: string; error?: string; per_file_errors?: { file: string; error: string }[] }[];
  final_result: string | null;
  error: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  conversationId: string | null;
  onResult: (payload: { final: string; partial: BatchRow["partial_results"]; task: string }) => void;
}

const friendlyError = (e: string | null | undefined): string => {
  if (!e) return "";
  if (/context_length/i.test(e)) return "Контекст модели переполнен — уменьшите размер подпакета или количество файлов в нём.";
  if (/429|rate limit/i.test(e)) return "Превышен лимит запросов к модели (429). Подождите немного.";
  if (/402|credits|insufficient/i.test(e)) return "Закончились кредиты у провайдера модели (402).";
  if (/unsupported.*(image|file|modality)/i.test(e)) return "Модель не поддерживает один из типов вложений.";
  return e;
};

export function BatchAnalysisDialog({ open, onOpenChange, userId, conversationId, onResult }: Props) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [task, setTask] = useState("Извлеки и сведи все показатели лабораторных анализов, отметь отклонения от референсных диапазонов, укажи динамику по датам.");
  const [subbatchSize, setSubbatchSize] = useState(7);
  const [uploading, setUploading] = useState(false);
  const [activeBatch, setActiveBatch] = useState<BatchRow | null>(null);
  const [phase, setPhase] = useState<"select" | "uploading" | "analyzing" | "done" | "error">("select");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultDeliveredRef = useRef(false);

  const reset = () => {
    setPending([]);
    setActiveBatch(null);
    setPhase("select");
    resultDeliveredRef.current = false;
  };

  useEffect(() => {
    if (!open) { reset(); }
  }, [open]);

  // Realtime subscription for the active batch row
  useEffect(() => {
    if (!activeBatch?.id) return;
    const channel = supabase
      .channel(`batch-${activeBatch.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "analysis_batches", filter: `id=eq.${activeBatch.id}` },
        (payload) => {
          const row = payload.new as BatchRow;
          setActiveBatch(row);
          if (row.status === "done") setPhase("done");
          else if (row.status === "error") setPhase("error");
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeBatch?.id]);

  // Deliver final result once
  useEffect(() => {
    if (phase === "done" && activeBatch?.final_result && !resultDeliveredRef.current) {
      resultDeliveredRef.current = true;
      onResult({ final: activeBatch.final_result, partial: activeBatch.partial_results || [], task });
    }
  }, [phase, activeBatch, onResult, task]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming: Pending[] = [];
    let totalMb = pending.reduce((s, p) => s + p.file.size / (1024 * 1024), 0);
    for (const f of Array.from(files)) {
      if (pending.length + incoming.length >= MAX_FILES) { toast.error(`Максимум ${MAX_FILES} файлов`); break; }
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_FILE_MB) { toast.error(`${f.name}: больше ${MAX_FILE_MB} МБ`); continue; }
      if (totalMb + mb > MAX_TOTAL_MB) { toast.error(`Превышен суммарный лимит ${MAX_TOTAL_MB} МБ`); break; }
      totalMb += mb;
      const isZip = /\.zip$/i.test(f.name);
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      const isImg = f.type.startsWith("image/");
      if (!isZip && !isPdf && !isImg) { toast.error(`${f.name}: поддерживаются PDF, изображения и ZIP`); continue; }
      incoming.push({ file: f, localId: `${Date.now()}-${Math.random()}`, progress: 0 });
    }
    setPending(prev => [...prev, ...incoming]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePending = (id: string) => setPending(prev => prev.filter(p => p.localId !== id));

  const startBatch = useCallback(async () => {
    if (!pending.length) { toast.error("Не выбраны файлы"); return; }
    if (!task.trim()) { toast.error("Опишите задачу для анализа"); return; }
    setUploading(true);
    setPhase("uploading");

    // 1. Insert analysis_batches row to get batchId for storage path
    const { data: batchRow, error: bErr } = await supabase
      .from("analysis_batches")
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        task: task.trim(),
        subbatch_size: subbatchSize,
        file_paths: [],
        total_files: 0,
      })
      .select("*")
      .single();
    if (bErr || !batchRow) {
      toast.error("Не удалось создать пакет: " + (bErr?.message || ""));
      setUploading(false); setPhase("select"); return;
    }
    const batchId = batchRow.id;
    setActiveBatch(batchRow as unknown as BatchRow);

    // 2. Upload each file
    const uploadedPaths: string[] = [];
    const zipPaths: string[] = [];
    for (const p of pending) {
      const safe = p.file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${userId}/${batchId}/${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, p.file, { upsert: true, contentType: p.file.type || "application/octet-stream" });
      if (error) {
        setPending(prev => prev.map(x => x.localId === p.localId ? { ...x, error: error.message } : x));
        continue;
      }
      setPending(prev => prev.map(x => x.localId === p.localId ? { ...x, progress: 100, uploadedPath: path } : x));
      if (/\.zip$/i.test(p.file.name)) zipPaths.push(path);
      else uploadedPaths.push(path);
    }

    // 3. Unzip archives, if any
    for (const zp of zipPaths) {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unzip-chat-archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
          body: JSON.stringify({ zipPath: zp }),
        });
        if (!resp.ok) {
          const err = await resp.text();
          toast.error(`Архив ${zp.split("/").pop()}: ${err.slice(0, 200)}`);
          continue;
        }
        const json = await resp.json();
        uploadedPaths.push(...(json.paths || []));
        if (Array.isArray(json.skipped) && json.skipped.length) {
          toast.warning(`Пропущено в архиве: ${json.skipped.slice(0, 5).map((s: any) => s.name).join(", ")}${json.skipped.length > 5 ? "…" : ""}`);
        }
      } catch (e: any) {
        toast.error(`Распаковка архива: ${e.message}`);
      }
    }

    if (!uploadedPaths.length) {
      toast.error("Не загружено ни одного файла");
      await supabase.from("analysis_batches").update({ status: "error", error: "Нет загруженных файлов" }).eq("id", batchId);
      setUploading(false); setPhase("error"); return;
    }

    // 4. Update batch with final file list and total
    await supabase.from("analysis_batches").update({
      file_paths: uploadedPaths,
      total_files: uploadedPaths.length,
    }).eq("id", batchId);

    // 5. Trigger analyzer
    setPhase("analyzing");
    setUploading(false);
    const { data: sess } = await supabase.auth.getSession();
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-documents-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
      body: JSON.stringify({ batchId }),
    }).catch((e) => toast.error("Не удалось запустить анализ: " + e.message));
  }, [pending, task, subbatchSize, userId, conversationId]);

  const progressPct = activeBatch
    ? activeBatch.status === "done" ? 100
    : activeBatch.total_files ? Math.round((activeBatch.processed_files / activeBatch.total_files) * 100) : 5
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Пакетный анализ документов</DialogTitle>
          <DialogDescription>
            Загрузите PDF / изображения / ZIP с медицинскими документами (макс. {MAX_FILES} файлов, до {MAX_TOTAL_MB} МБ суммарно).
            Файлы анализирует Claude Sonnet 4.5 подпакетами по {subbatchSize} штук с финальной сводкой.
          </DialogDescription>
        </DialogHeader>

        {phase === "select" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Задача для модели</label>
              <Textarea value={task} onChange={(e) => setTask(e.target.value)} className="min-h-[80px] mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm">Размер подпакета:</label>
              <Input type="number" min={1} max={15} value={subbatchSize}
                onChange={(e) => setSubbatchSize(Math.max(1, Math.min(15, Number(e.target.value) || 7)))}
                className="w-20" />
              <span className="text-xs text-muted-foreground">файлов за один запрос к модели</span>
            </div>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm mt-2">Нажмите или перетащите файлы. PDF, изображения, ZIP.</p>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                accept="application/pdf,image/*,.zip,application/zip"
                onChange={(e) => addFiles(e.target.files)} />
            </div>
            {pending.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {pending.map(p => (
                  <div key={p.localId} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1 text-sm">
                    {/\.zip$/i.test(p.file.name) ? <FileArchive className="w-4 h-4" />
                      : p.file.type.startsWith("image/") ? <ImageIcon className="w-4 h-4" />
                      : <FileText className="w-4 h-4" />}
                    <span className="flex-1 truncate">{p.file.name}</span>
                    <span className="text-xs text-muted-foreground">{(p.file.size / (1024 * 1024)).toFixed(1)} МБ</span>
                    <button onClick={() => removePending(p.localId)} className="hover:text-destructive"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{pending.length} / {MAX_FILES} файлов</p>
              </div>
            )}
          </div>
        )}

        {(phase === "uploading" || phase === "analyzing" || phase === "done" || phase === "error") && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">
                  {phase === "uploading" && "Загрузка файлов…"}
                  {phase === "analyzing" && `Анализ: ${activeBatch?.processed_files || 0} из ${activeBatch?.total_files || pending.length} файлов`}
                  {phase === "done" && "Готово"}
                  {phase === "error" && "Ошибка"}
                </span>
                <span className="text-muted-foreground">{progressPct}%</span>
              </div>
              <Progress value={progressPct} />
            </div>
            {phase === "error" && activeBatch?.error && (
              <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded p-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>{friendlyError(activeBatch.error)}</div>
              </div>
            )}
            {activeBatch?.partial_results && activeBatch.partial_results.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                {activeBatch.partial_results.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {p.error ? <AlertCircle className="w-3 h-3 text-destructive" /> : <CheckCircle2 className="w-3 h-3 text-green-600" />}
                    <span>Подпакет {i + 1} ({p.files.length} файлов): {p.error ? friendlyError(p.error) : "готово"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {phase === "select" && (
            <Button onClick={startBatch} disabled={!pending.length || !task.trim()}>
              <Upload className="w-4 h-4 mr-1" /> Запустить анализ ({pending.length})
            </Button>
          )}
          {(phase === "uploading" || phase === "analyzing") && (
            <Button disabled><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Обработка…</Button>
          )}
          {(phase === "done" || phase === "error") && (
            <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
