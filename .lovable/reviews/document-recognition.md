# Точная правка: оценка и распознавание длинных документов

Справка: публикация запрошена отдельно. Этот diff пока НЕ применён к работающему приложению.

## Объём
- Локальная оценка до вызова ИИ: PDF, текстовые документы, изображения.
- «Требуется фрагментация» и кнопка «Разделить и распознать».
- Последовательная обработка частей, остановка ожидания, ручное продолжение только нераспознанных частей.
- Анамнез: каждая часть с исходными страницами/датой, отдельная проверка принадлежности пациенту.
- Старый протокол: проверка и применение каждой части отдельно, без молчаливого объединения полей.
- Повреждённый/защищённый PDF не отправляется на распознавание.
- Без новых зависимостей, изменений базы, серверных функций, CORS/failover/Vite и защищённых файлов.
- Дополнительные файлы относительно плана: общий `DocumentRecognitionStatus.tsx` и `useDocumentRecognition.ts` для одинакового порядка оценки/обработки в двух окнах.
- Предел изображения предлагается 12 мегапикселей на часть.

## Полный diff

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -10,3 +10,5 @@
 - Physiotherapy session protocol (`physio_session`) keeps procedures in visit protocol JSON and prints per-session sheets from its own form, so the shared protocol print layout stays unchanged.
 
 - Store school certificates inside the current visit protocol JSON and print a dedicated sheet, so no schema or shared protocol printing changes are required.
+
+- Assess document workload locally before medical protocol recognition; require explicit fragmentation approval for long sources and retain per-part results, so oversized requests and silent cross-document merges are avoided.
--- /dev/null
+++ b/src/components/visits/DocumentRecognitionStatus.tsx
@@ -0,0 +1,25 @@
+import { Loader2, Square, Scissors, RotateCcw } from "lucide-react";
+import { Button } from "@/components/ui/button";
+import type { useDocumentRecognition } from "@/hooks/useDocumentRecognition";
+
+type Props = { recognition: ReturnType<typeof useDocumentRecognition> };
+export function DocumentRecognitionStatus({ recognition: r }: Props) {
+  return <div className="space-y-2 min-w-0" aria-live="polite">
+    {r.phase === "assessment" && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Оцениваю документ</p>}
+    {r.assessment && <p className="text-sm text-muted-foreground">{r.assessment.reason}</p>}
+    {r.phase === "fragmentation" && <>
+      <p className="font-medium">Требуется фрагментация</p>
+      <Button onClick={r.resume}><Scissors className="mr-2 h-4 w-4" />Разделить и распознать</Button>
+    </>}
+    {r.phase === "recognition" && <p className="text-sm">Распознано частей: {r.parts.filter((part) => part.state === "done").length} из {r.parts.length}</p>}
+    {r.busy && <Button variant="outline" onClick={r.stop}><Square className="mr-2 h-4 w-4" />Остановить ожидание</Button>}
+    {r.parts.map((part) => <p key={part.id} className={`text-sm break-words ${part.state === "error" ? "text-destructive" : "text-muted-foreground"}`}>
+      {part.label}: {part.state === "done" ? "распознано" : part.state === "busy" ? "распознаётся" : part.state === "error" ? part.error : "не распознано"}
+    </p>)}
+    {r.phase === "results" && r.parts.some((part) => part.state !== "done") && <>
+      <p className="text-sm text-destructive">Документ распознан не полностью. Нераспознанные части перечислены выше.</p>
+      <Button variant="outline" onClick={r.resume}><RotateCcw className="mr-2 h-4 w-4" />Продолжить нераспознанные части</Button>
+    </>}
+    {r.error && <p className="text-sm text-destructive">{r.error}</p>}
+  </div>;
+}
--- a/src/components/visits/HistoryDocumentsDialog.tsx
+++ b/src/components/visits/HistoryDocumentsDialog.tsx
@@ -1,20 +1,25 @@
-import { useRef, useState } from "react";
+import { useEffect, useRef, useState } from "react";
 import { FileUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Textarea } from "@/components/ui/textarea";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
-import { extractProtocolSource, parseProtocolDocument } from "@/lib/visits/protocolImport";
+import { useDocumentRecognition } from "@/hooks/useDocumentRecognition";
+import { DocumentRecognitionStatus } from "./DocumentRecognitionStatus";
 import { appendHistoryDocuments, historyDocumentText, sameHistoryPatient } from "@/lib/visits/historyDocuments";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "@/hooks/use-toast";
 
-interface Item { id: string; file: File; text: string; state: "waiting" | "busy" | "done" | "error"; error?: string; patient?: string; confirmed: boolean }
+interface Item { parentId?: string; id: string; file: File; text: string; state: "waiting" | "busy" | "done" | "error"; error?: string; patient?: string; confirmed: boolean }
 interface Props { open: boolean; onOpenChange: (open: boolean) => void; patientId: string; anamnesis: string; onAnamnesis: (text: string) => void }
 
 export function HistoryDocumentsDialog({ open, onOpenChange, patientId, anamnesis, onAnamnesis }: Props) {
   const [items, setItems] = useState<Item[]>([]);
-  const [busy, setBusy] = useState(false);
+  const recognition = useDocumentRecognition();
+  const busy = recognition.busy;
+  const [active, setActive] = useState<Item | null>(null);
+  const [expectedPatient, setExpectedPatient] = useState("");
+  const consumed = useRef(new Set<string>());
   const input = useRef<HTMLInputElement>(null);
   const patch = (id: string, changes: Partial<Item>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
   const add = (files: FileList | null) => {
@@ -23,33 +28,40 @@
     setItems((current) => [...current, ...added]);
   };
   const recognize = async (queue: Item[]) => {
-    setBusy(true);
-    try {
-      const { data: patient, error } = await supabase.from("patients").select("full_name").eq("id", patientId).single();
-      if (error || !patient) throw new Error("Не удалось проверить пациента");
-      for (const item of queue) {
-        patch(item.id, { state: "busy", error: undefined });
-        try {
-          const source = await extractProtocolSource(item.file);
-          const parsed = await parseProtocolDocument(source);
-          const text = historyDocumentText(item.file.name, parsed);
-          if (!text) throw new Error("В документе не найдено данных для анамнеза");
-          patch(item.id, { state: "done", text, patient: parsed.patient?.full_name, confirmed: sameHistoryPatient(patient.full_name, parsed.patient?.full_name) });
-        } catch (error) {
-          patch(item.id, { state: "error", error: error instanceof Error ? error.message : "Не удалось распознать документ" });
-        }
-      }
-    } catch {
-      toast({ title: "Не удалось проверить пациента. Документы не добавлены.", variant: "destructive" });
-    } finally { setBusy(false); }
+    const item = queue[0];
+    if (!item || busy) return;
+    const { data: patient, error } = await supabase.from("patients").select("full_name").eq("id", patientId).single();
+    if (error || !patient) { toast({ title: "Не удалось проверить пациента", variant: "destructive" }); return; }
+    setExpectedPatient(patient.full_name);
+    setActive(item);
+    await recognition.start(item.file);
   };
+  useEffect(() => {
+    if (!active) return;
+    for (const part of recognition.parts) {
+      if (!part.parsed || consumed.current.has(part.id)) continue;
+      consumed.current.add(part.id);
+      const text = historyDocumentText(`${active.file.name} (${part.label})`, part.parsed);
+      const parsed = part.parsed;
+      setItems((current) => [...current, { id: part.id, parentId: active.id, file: active.file, state: text ? "done" : "error", text, error: text ? undefined : "В части не найдено данных для анамнеза", patient: parsed.patient?.full_name, confirmed: sameHistoryPatient(expectedPatient, parsed.patient?.full_name) }]);
+    }
+    if (recognition.phase === "results") {
+      patch(active.id, { state: "done", text: "", error: recognition.parts.some((part) => part.state !== "done") ? "Документ распознан не полностью" : undefined });
+    }
+    if (recognition.error) patch(active.id, { state: "error", error: recognition.error });
+  }, [recognition.parts, recognition.phase, recognition.error, active, expectedPatient]);
+  useEffect(() => {
+    if (busy || !active || recognition.phase !== "results" || recognition.parts.some((part) => part.state !== "done")) return;
+    const next = items.find((item) => item.state === "waiting" && !item.parentId);
+    if (next) void recognize([next]);
+  }, [busy, active, recognition.phase, recognition.parts, items]);
   const ready = items.filter((item) => item.state === "done" && item.text.trim());
   const apply = () => {
     if (!ready.length || ready.some((item) => !item.confirmed)) return;
     onAnamnesis(appendHistoryDocuments(anamnesis, ready.map((item) => ({ name: item.file.name, text: item.text }))));
     setItems((current) => current.filter((item) => !ready.some((done) => done.id === item.id)));
     toast({ title: "Документы добавлены в анамнез", description: "Поля текущего осмотра не изменены. Сохраните визит." });
-    if (ready.length === items.length) onOpenChange(false);
+    if (!items.some((item) => !ready.includes(item) && (item.state === "waiting" || item.state === "error")) && !recognition.parts.some((part) => part.state !== "done")) onOpenChange(false);
   };
   return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
     <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
@@ -59,15 +71,16 @@
         <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}><FileUp className="mr-2 h-4 w-4" />Выбрать документы</Button>
         <Button disabled={busy || !items.some((item) => item.state === "waiting" || item.state === "error")} onClick={() => recognize(items.filter((item) => item.state === "waiting" || item.state === "error"))}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Распознать</Button>
       </div>
+      <DocumentRecognitionStatus recognition={recognition} />
       {items.map((item) => <div key={item.id} className="border-b pb-3 space-y-2 min-w-0">
         <div className="flex items-center gap-2"><span className="text-sm font-medium break-all flex-1">{item.file.name}</span>
           {item.state === "busy" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
-          {item.state === "error" && <Button size="icon" variant="ghost" title="Повторить распознавание" disabled={busy} onClick={() => recognize([item])}><RotateCcw className="h-4 w-4" /></Button>}
-          <Button size="icon" variant="ghost" title="Убрать документ" disabled={busy} onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
+          {item.state === "error" && !item.parentId && <Button size="icon" variant="ghost" title="Повторить распознавание" disabled={busy} onClick={() => recognize([item])}><RotateCcw className="h-4 w-4" /></Button>}
+          <Button size="icon" variant="ghost" title="Убрать документ" disabled={busy} onClick={() => { if (active?.id === item.id) { recognition.reset(); setActive(null); } setItems((current) => current.filter((row) => row.id !== item.id && row.parentId !== item.id)); }}><Trash2 className="h-4 w-4" /></Button>
         </div>
         {item.state === "waiting" && <p className="text-sm text-muted-foreground">Ожидает распознавания</p>}
         {item.error && <p className="text-sm text-destructive">{item.error}</p>}
-        {item.state === "done" && <>
+        {item.state === "done" && item.text && <>
           <Textarea value={item.text} rows={6} disabled={busy} onChange={(event) => patch(item.id, { text: event.target.value })} />
           <label className="flex items-start gap-2 text-sm"><Checkbox checked={item.confirmed} disabled={busy} onCheckedChange={(value) => patch(item.id, { confirmed: value === true })} />
             <span>Документ относится к этому пациенту{item.patient ? ` (в документе: ${item.patient})` : " (ФИО не распознано)"}</span>
--- a/src/components/visits/ProtocolImportDialog.tsx
+++ b/src/components/visits/ProtocolImportDialog.tsx
@@ -15,10 +15,12 @@
 import { toast } from "@/hooks/use-toast";
 import { PROTOCOL_TYPES, getProtocolLabel, type ProtocolType } from "@/lib/visits/protocolTypes";
 import { normalizeImportedProtocolData } from "@/lib/visits/normalizeProtocolData";
+import { useDocumentRecognition } from "@/hooks/useDocumentRecognition";
+import { DocumentRecognitionStatus } from "./DocumentRecognitionStatus";
 import { SystemReadinessButton } from "@/components/admin/SystemReadinessButton";
 
 import {
-  extractProtocolSource, parseProtocolDocument, flattenProtocolData,
+  flattenProtocolData,
   setByPath, deleteByPath, type ParsedProtocol, type FlatField,
 } from "@/lib/visits/protocolImport";
 
@@ -58,7 +60,9 @@
   open, onOpenChange, patientId, patientName, currentVisitId, onApply, onSaved, initialFile,
 }: Props) {
   const [step, setStep] = useState<Step>("source");
-  const [busy, setBusy] = useState(false);
+  const recognition = useDocumentRecognition();
+  const busy = recognition.busy;
+  const [selectedPartId, setSelectedPartId] = useState("");
   const [saving, setSaving] = useState(false);
   const [pastedText, setPastedText] = useState("");
   const [file, setFile] = useState<File | null>(null);
@@ -139,55 +143,27 @@
   }, [effectivePatientId, target]);
 
   const handleParse = async () => {
-    if (!file && !pastedText.trim()) {
-      toast({ title: "Добавьте файл или вставьте текст протокола", variant: "destructive" });
-      return;
-    }
-    setBusy(true);
-    try {
-      let payload: {
-        text?: string;
-        fileData?: string;
-        storageBucket?: string;
-        storagePath?: string;
-        fileName?: string;
-      } = {};
-      if (file) {
-        const src = await extractProtocolSource(file);
-        payload = {
-          text: src.text,
-          fileData: src.fileData,
-          storageBucket: src.storageBucket,
-          storagePath: src.storagePath,
-          fileName: src.fileName,
-        };
-        if (pastedText.trim()) {
-          payload.text = [payload.text, pastedText.trim()].filter(Boolean).join("\n\n");
-        }
-
-      } else {
-        payload = { text: pastedText.trim(), fileName: "Вставленный текст" };
-      }
-
-      const result = await parseProtocolDocument(payload);
-      setParsed(result);
-      setProtocolType((result.protocol_type as ProtocolType) || "primary_short");
-      setVisitDate(result.visit_date || format(new Date(), "yyyy-MM-dd"));
-      setDiagnosis(result.diagnosis || "");
-      setIcdCode(result.icd_code || "");
-      setNextVisitDate(result.next_visit_date || "");
-      setData(result.protocol_data || {});
-      setUnmapped(result.unmapped || "");
-      if (!patientId && result.patient?.full_name) {
-        setPatientSearch(result.patient.full_name);
-      }
-      setStep("review");
-    } catch (e) {
-      toast({ title: "Не удалось распознать", description: (e as Error).message, variant: "destructive" });
-    } finally {
-      setBusy(false);
-    }
+    if (!file && !pastedText.trim()) { toast({ title: "Добавьте файл или текст", variant: "destructive" }); return; }
+    await recognition.start(file, pastedText);
   };
+  const reviewPart = (result: ParsedProtocol, id: string) => {
+    setSelectedPartId(id);
+    setParsed(result);
+    setProtocolType(result.protocol_type || "primary_short");
+    setVisitDate(result.visit_date || format(new Date(), "yyyy-MM-dd"));
+    setDiagnosis(result.diagnosis || "");
+    setIcdCode(result.icd_code || "");
+    setNextVisitDate(result.next_visit_date || "");
+    setData(result.protocol_data || {});
+    setUnmapped(result.unmapped || "");
+    if (!patientId && result.patient?.full_name) setPatientSearch(result.patient.full_name);
+    setStep("review");
+  };
+  useEffect(() => {
+    if (recognition.phase !== "results" || recognition.parts.length !== 1) return;
+    const part = recognition.parts[0];
+    if (part.parsed && part.id !== selectedPartId) reviewPart(part.parsed, part.id);
+  }, [recognition.phase, recognition.parts, selectedPartId]);
 
   const fields: FlatField[] = useMemo(() => flattenProtocolData(data), [data]);
 
@@ -249,7 +225,8 @@
         protocol_data: normalized,
         unmapped,
       });
-      onOpenChange(false);
+      if (recognition.parts.length > 1) setStep("source");
+      else onOpenChange(false);
       return;
     }
 
@@ -305,7 +282,8 @@
         toast({ title: "Визит создан из документа" });
         onSaved?.((created as any).id);
       }
-      onOpenChange(false);
+      if (recognition.parts.length > 1) setStep("source");
+      else onOpenChange(false);
     } catch (e) {
       toast({ title: "Не удалось сохранить", description: (e as Error).message, variant: "destructive" });
     } finally {
@@ -316,7 +294,7 @@
   const confidence = parsed?.confidence ?? null;
 
   return (
-    <Dialog open={open} onOpenChange={onOpenChange}>
+    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
@@ -337,9 +315,9 @@
                 e.preventDefault();
                 setDragOver(false);
                 const f = e.dataTransfer.files?.[0];
-                if (f) setFile(f);
+                if (f && !busy) { recognition.reset(); setSelectedPartId(""); setFile(f); }
               }}
-              onClick={() => fileRef.current?.click()}
+              onClick={() => { if (!busy) fileRef.current?.click(); }}
               className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                 dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
               }`}
@@ -349,7 +327,7 @@
                 type="file"
                 className="hidden"
                 accept=".doc,.docx,.odt,.ods,.odp,.ott,.fodt,.pdf,.txt,.md,.rtf,image/*"
-                onChange={(e) => setFile(e.target.files?.[0] || null)}
+                disabled={busy} onChange={(e) => { recognition.reset(); setSelectedPartId(""); setFile(e.target.files?.[0] || null); }}
               />
               {file ? (
                 <div className="flex items-center justify-center gap-2 text-sm">
@@ -372,17 +350,19 @@
                 rows={8}
                 placeholder="Вставьте текст старого протокола (можно вместе с таблицами)"
                 value={pastedText}
-                onChange={(e) => setPastedText(e.target.value)}
+                disabled={busy} onChange={(e) => { recognition.reset(); setSelectedPartId(""); setPastedText(e.target.value); }}
               />
             </div>
 
+            <DocumentRecognitionStatus recognition={recognition} />
+            {recognition.parts.length > 1 && recognition.parts.filter((part) => part.parsed).map((part) => <Button key={part.id} variant="outline" disabled={busy} onClick={() => { if (part.parsed) reviewPart(part.parsed, part.id); }}>Проверить {part.label}</Button>)}
             <SystemReadinessButton label="Проверить готовность системы" />
 
             <DialogFooter>
-              <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
-              <Button onClick={handleParse} disabled={busy}>
+              <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Отмена</Button>
+              <Button onClick={handleParse} disabled={busy || recognition.phase === "fragmentation" || (recognition.parts.length > 0 && recognition.phase === "results")}>
                 {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
-                Распознать
+                {recognition.phase === "assessment" ? "Оцениваю документ" : "Распознать"}
               </Button>
             </DialogFooter>
 
--- /dev/null
+++ b/src/hooks/useDocumentRecognition.ts
@@ -0,0 +1,106 @@
+import { useEffect, useRef, useState } from "react";
+import { assessDocument, recognizePart, type DocumentAssessment } from "@/lib/visits/documentRecognition";
+import type { ParsedProtocol } from "@/lib/visits/protocolImport";
+
+export interface PartResult {
+  id: string;
+  label: string;
+  state: "waiting" | "busy" | "done" | "error";
+  parsed?: ParsedProtocol;
+  error?: string;
+}
+
+export function useDocumentRecognition() {
+  const [phase, setPhase] = useState<"idle" | "assessment" | "fragmentation" | "recognition" | "results">("idle");
+  const [assessment, setAssessment] = useState<DocumentAssessment | null>(null);
+  const [parts, setParts] = useState<PartResult[]>([]);
+  const [error, setError] = useState("");
+  const controller = useRef<AbortController | null>(null);
+  const activeAssessment = useRef<DocumentAssessment | null>(null);
+  const results = useRef<PartResult[]>([]);
+  const mounted = useRef(true);
+  const busy = phase === "assessment" || phase === "recognition";
+  const update = (next: PartResult[]) => { results.current = next; if (mounted.current) setParts(next); };
+
+  useEffect(() => {
+    mounted.current = true;
+    return () => {
+      mounted.current = false;
+      controller.current?.abort();
+      void activeAssessment.current?.dispose();
+    };
+  }, []);
+
+  const run = async (value: DocumentAssessment) => {
+    const request = new AbortController();
+    controller.current = request;
+    setError("");
+    setPhase("recognition");
+    try {
+      for (const part of value.parts) {
+        const previous = results.current.find((row) => row.id === part.id);
+        if (previous?.state === "done") continue;
+        if (request.signal.aborted) break;
+        update(results.current.map((row) => row.id === part.id ? { ...row, state: "busy", error: undefined } : row));
+        try {
+          const parsed = await recognizePart(part, request.signal);
+          if (request.signal.aborted) break;
+          update(results.current.map((row) => row.id === part.id ? { ...row, state: "done", parsed } : row));
+        } catch (cause) {
+          update(results.current.map((row) => row.id === part.id ? { ...row, state: "error", error: request.signal.aborted ? "Остановлено. Часть не распознана." : cause instanceof Error ? cause.message : "Не удалось распознать часть" } : row));
+          // Следующая часть не отправляется после ошибки; повтор — только вручную.
+          break;
+        }
+      }
+    } finally {
+      update(results.current.map((row) => row.state === "busy" ? { ...row, state: "error", error: "Остановлено. Часть не распознана." } : row));
+      if (mounted.current) setPhase("results");
+      controller.current = null;
+    }
+  };
+
+  const start = async (file: File | null, text = "") => {
+    if (controller.current) return;
+    await activeAssessment.current?.dispose();
+    activeAssessment.current = null;
+    setAssessment(null);
+    update([]);
+    setError("");
+    setPhase("assessment");
+    const request = new AbortController();
+    controller.current = request;
+    try {
+      const value = await assessDocument(file, text, request.signal);
+      if (request.signal.aborted || !mounted.current) { await value.dispose(); return; }
+      activeAssessment.current = value;
+      setAssessment(value);
+      update(value.parts.map((part) => ({ id: part.id, label: part.label, state: "waiting" })));
+      controller.current = null;
+      if (value.requiresFragmentation) setPhase("fragmentation");
+      else await run(value);
+    } catch (cause) {
+      if (mounted.current) {
+        setError(request.signal.aborted ? "Оценка остановлена" : cause instanceof Error ? cause.message : "Не удалось оценить документ");
+        setPhase("idle");
+      }
+    } finally {
+      controller.current = null;
+      if (request.signal.aborted && mounted.current && !activeAssessment.current) setPhase("idle");
+    }
+  };
+
+  const reset = () => {
+    if (controller.current) return;
+    void activeAssessment.current?.dispose();
+    activeAssessment.current = null;
+    setAssessment(null);
+    update([]);
+    setError("");
+    setPhase("idle");
+  };
+
+  return { phase, assessment, parts, error, busy, start, reset,
+    stop: () => controller.current?.abort(),
+    resume: () => { if (!controller.current && activeAssessment.current) void run(activeAssessment.current); },
+  };
+}
--- /dev/null
+++ b/src/lib/visits/documentAssessmentRules.test.ts
@@ -0,0 +1,30 @@
+import { describe, expect, it } from "vitest";
+import { MAX_DOCUMENT_BYTES, MAX_IMAGE_PIXELS, pageRanges, splitDocumentText } from "./documentAssessmentRules";
+
+describe("предварительная оценка документов", () => {
+  it("сохраняет ограничение 20 МБ", () => expect(MAX_DOCUMENT_BYTES).toBe(20 * 1024 * 1024));
+  it("делит 18 сканированных страниц на шесть частей по три", () => expect(pageRanges(Array(18).fill(0))).toEqual([{ start: 1, end: 3 }, { start: 4, end: 6 }, { start: 7, end: 9 }, { start: 10, end: 12 }, { start: 13, end: 15 }, { start: 16, end: 18 }]));
+  it("оставляет три страницы скана одной частью", () => expect(pageRanges([0, 0, 0])).toEqual([{ start: 1, end: 3 }]));
+  it("текстовый PDF ограничен шестью страницами", () => expect(pageRanges(Array(7).fill(1000))).toEqual([{ start: 1, end: 6 }, { start: 7, end: 7 }]));
+  it("текстовый PDF разделяется при превышении 15000 символов", () => expect(pageRanges([8000, 8000])).toEqual([{ start: 1, end: 1 }, { start: 2, end: 2 }]));
+  it("смешанный PDF использует предел сканов", () => expect(pageRanges([1000, 1000, 0, 1000])).toEqual([{ start: 1, end: 3 }, { start: 4, end: 4 }]));
+  it("сохраняет все символы длинного абзаца", () => {
+    const text = "А".repeat(30001);
+    const parts = splitDocumentText(text);
+    expect(parts.map((part) => part.length)).toEqual([15000, 15000, 1]);
+    expect(parts.join("")).toBe(text);
+  });
+  it("не теряет переносы строк и даты", () => {
+    const text = ("2026-11-19: обследование\n").repeat(1000);
+    expect(splitDocumentText(text).join("")).toBe(text);
+    expect(splitDocumentText(text).every((part) => part.length <= 15000)).toBe(true);
+  });
+  it("не разрывает суррогатную пару", () => {
+    const text = "А".repeat(14999) + "😀" + "Б";
+    const parts = splitDocumentText(text);
+    expect(parts[0].length).toBe(14999);
+    expect(parts.join("")).toBe(text);
+  });
+  it("ограничивает изображение 12 мегапикселями на часть", () => expect(MAX_IMAGE_PIXELS).toBe(12000000));
+  it("не принимает PDF без страниц", () => expect(() => pageRanges([])).toThrow());
+});
--- /dev/null
+++ b/src/lib/visits/documentAssessmentRules.ts
@@ -0,0 +1,45 @@
+export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
+export const MAX_PART_CHARS = 15_000;
+export const MAX_SCAN_PAGES = 3;
+export const MAX_TEXT_PAGES = 6;
+export const MIN_PAGE_TEXT = 100;
+export const MAX_IMAGE_PIXELS = 12_000_000;
+
+export interface PageRange { start: number; end: number }
+
+export function pageRanges(lengths: number[]): PageRange[] {
+  if (!lengths.length) throw new Error("В PDF нет страниц");
+  const scanned = lengths.some((length) => length < MIN_PAGE_TEXT);
+  const limit = scanned ? MAX_SCAN_PAGES : MAX_TEXT_PAGES;
+  const ranges: PageRange[] = [];
+  let start = 1;
+  let chars = 0;
+  for (let i = 0; i < lengths.length; i++) {
+    if (i + 1 > start && (i + 1 - start >= limit || (!scanned && chars + lengths[i] > MAX_PART_CHARS))) {
+      ranges.push({ start, end: i });
+      start = i + 1;
+      chars = 0;
+    }
+    chars += lengths[i];
+  }
+  ranges.push({ start, end: lengths.length });
+  return ranges;
+}
+
+/** Сохраняет каждый символ, включая разделители и длинные абзацы. */
+export function splitDocumentText(text: string): string[] {
+  const parts: string[] = [];
+  let offset = 0;
+  while (offset < text.length) {
+    let end = Math.min(offset + MAX_PART_CHARS, text.length);
+    if (end < text.length) {
+      const paragraph = text.lastIndexOf("\n", end - 1);
+      if (paragraph > offset + MAX_PART_CHARS / 2) end = paragraph + 1;
+      const code = text.charCodeAt(end - 1);
+      if (code >= 0xd800 && code <= 0xdbff) end--;
+    }
+    parts.push(text.slice(offset, end));
+    offset = end;
+  }
+  return parts;
+}
--- /dev/null
+++ b/src/lib/visits/documentRecognition.ts
@@ -0,0 +1,157 @@
+import { extractProtocolSource, parseProtocolDocument, type ExtractedSource, type ParsedProtocol } from "./protocolImport";
+import { MAX_DOCUMENT_BYTES, MAX_IMAGE_PIXELS, MIN_PAGE_TEXT, pageRanges, splitDocumentText } from "./documentAssessmentRules";
+
+type Source = Parameters<typeof parseProtocolDocument>[0];
+export interface DocumentPart {
+  id: string;
+  label: string;
+  prepare: (signal: AbortSignal) => Promise<Source>;
+}
+export interface DocumentAssessment {
+  reason: string;
+  requiresFragmentation: boolean;
+  parts: DocumentPart[];
+  dispose: () => Promise<void>;
+}
+
+export function checkDocumentAbort(signal: AbortSignal) {
+  if (signal.aborted) throw new DOMException("Распознавание остановлено", "AbortError");
+}
+
+function textParts(text: string, name: string, prefix = ""): DocumentPart[] {
+  return splitDocumentText(text).map((chunk, index) => ({
+    id: crypto.randomUUID(),
+    label: `${prefix}${prefix ? ", " : ""}часть ${index + 1}`,
+    prepare: async (signal) => {
+      checkDocumentAbort(signal);
+      return { text: chunk, fileName: `${name} (${prefix}${prefix ? ", " : ""}часть ${index + 1})`, assessed: true };
+    },
+  }));
+}
+
+async function assessText(text: string, name: string): Promise<DocumentAssessment> {
+  if (!text.trim()) throw new Error("В документе не найден текст");
+  const parts = textParts(text, name);
+  return { parts, requiresFragmentation: parts.length > 1, reason: `${text.length.toLocaleString("ru")} символов; ${parts.length} ч.`, dispose: async () => {} };
+}
+
+export async function assessDocument(file: File | null, pastedText: string, signal: AbortSignal): Promise<DocumentAssessment> {
+  checkDocumentAbort(signal);
+  if (!file) return assessText(pastedText, "Вставленный текст");
+  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Файл больше 20 МБ");
+  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
+  const isPdf = new TextDecoder().decode(header) === "%PDF-";
+  checkDocumentAbort(signal);
+  if (isPdf) {
+    const pdfjs = await import("pdfjs-dist");
+    const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
+    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
+    const task = pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false });
+    const abort = () => { void task.destroy(); };
+    signal.addEventListener("abort", abort, { once: true });
+    try {
+      const pdf = await task.promise;
+      const texts: string[] = [];
+      for (let i = 1; i <= pdf.numPages; i++) {
+        checkDocumentAbort(signal);
+        const page = await pdf.getPage(i);
+        const content = await page.getTextContent();
+        // Любое встроенное изображение: текстовый слой не считается полным.
+        const ops = await page.getOperatorList();
+        const hasImages = ops.fnArray.some((op) => [pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageXObjectRepeat].includes(op));
+        texts.push(hasImages ? "" : content.items.map((item) => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join(""));
+        page.cleanup();
+      }
+      const scanned = texts.some((text) => text.trim().length < MIN_PAGE_TEXT);
+      const parts: DocumentPart[] = [];
+      for (const range of pageRanges(texts.map((text) => text.trim().length))) {
+        const label = `стр. ${range.start}–${range.end}`;
+        if (!scanned) {
+          const text = texts.slice(range.start - 1, range.end).map((value, i) => `\n[Страница ${range.start + i}]\n${value}`).join("");
+          parts.push(...textParts(text, file.name, label));
+        } else {
+          parts.push({ id: crypto.randomUUID(), label, prepare: async (partSignal) => {
+            checkDocumentAbort(partSignal);
+            const { jsPDF } = await import("jspdf");
+            let output: InstanceType<typeof jsPDF> | undefined;
+            for (let i = range.start; i <= range.end; i++) {
+              checkDocumentAbort(partSignal);
+              const page = await pdf.getPage(i);
+              const natural = page.getViewport({ scale: 1 });
+              const viewport = page.getViewport({ scale: Math.min(2, 2200 / Math.max(natural.width, natural.height)) });
+              const canvas = document.createElement("canvas");
+              canvas.width = Math.ceil(viewport.width);
+              canvas.height = Math.ceil(viewport.height);
+              const context = canvas.getContext("2d");
+              if (!context) throw new Error("Не удалось подготовить страницу PDF");
+              const render = page.render({ canvasContext: context, canvas, viewport });
+              const stopRender = () => render.cancel();
+              partSignal.addEventListener("abort", stopRender, { once: true });
+              try { await render.promise; } finally { partSignal.removeEventListener("abort", stopRender); }
+              const orientation = canvas.width > canvas.height ? "landscape" : "portrait";
+              if (!output) output = new jsPDF({ unit: "px", format: [canvas.width, canvas.height], orientation });
+              else output.addPage([canvas.width, canvas.height], orientation);
+              output.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
+              canvas.width = 0;
+              canvas.height = 0;
+              page.cleanup();
+            }
+            checkDocumentAbort(partSignal);
+            if (!output) throw new Error("Пустой фрагмент PDF");
+            const fragment = new File([output.output("blob")], `${file.name.replace(/\.pdf$/i, "")}_pages_${range.start}-${range.end}.pdf`, { type: "application/pdf" });
+            const source = await extractProtocolSource(fragment);
+            return { ...source, text: `Исходный документ: ${file.name}. Исходные страницы ${range.start}–${range.end}.`, assessed: true };
+          } });
+        }
+      }
+      if (pastedText.trim()) parts.push(...textParts(pastedText, "Дополнительный текст"));
+      return { parts, requiresFragmentation: parts.length > 1, reason: `${pdf.numPages} стр.; ${scanned ? "скан или смешанный PDF" : "текстовый PDF"}; ${(file.size / 1024 / 1024).toFixed(2)} МБ; ${parts.length} ч.`, dispose: async () => { signal.removeEventListener("abort", abort); await pdf.destroy(); } };
+    } catch (error) {
+      signal.removeEventListener("abort", abort);
+      await task.destroy();
+      checkDocumentAbort(signal);
+      throw new Error(error instanceof Error && error.name === "PasswordException" ? "PDF защищён паролем. Загрузите копию без пароля." : "Не удалось оценить PDF. Проверьте, что документ не повреждён.");
+    }
+  }
+  if (file.type.startsWith("image/")) {
+    const image = await createImageBitmap(file);
+    try {
+      checkDocumentAbort(signal);
+      const strips = Math.ceil(image.width * image.height / MAX_IMAGE_PIXELS);
+      const height = Math.max(1, Math.floor(MAX_IMAGE_PIXELS / image.width));
+      const parts: DocumentPart[] = [];
+      for (let y = 0; y < image.height; y += height) {
+        const top = y;
+        const sectionHeight = Math.min(height, image.height - y);
+        parts.push({ id: crypto.randomUUID(), label: `изображение, часть ${parts.length + 1}`, prepare: async (partSignal) => {
+          checkDocumentAbort(partSignal);
+          const bitmap = await createImageBitmap(file);
+          try {
+            const canvas = document.createElement("canvas");
+            canvas.width = bitmap.width;
+            canvas.height = sectionHeight;
+            const context = canvas.getContext("2d");
+            if (!context) throw new Error("Не удалось подготовить изображение");
+            context.drawImage(bitmap, 0, top, bitmap.width, sectionHeight, 0, 0, bitmap.width, sectionHeight);
+            const fileData = canvas.toDataURL("image/png");
+            canvas.width = 0;
+            canvas.height = 0;
+            return { fileData, fileName: `${file.name} (строки ${top + 1}–${top + sectionHeight})`, assessed: true };
+          } finally { bitmap.close(); }
+        } });
+      }
+      if (pastedText.trim()) parts.push(...textParts(pastedText, "Дополнительный текст"));
+      return { parts, requiresFragmentation: parts.length > 1, reason: `${image.width} × ${image.height}; ${(file.size / 1024 / 1024).toFixed(2)} МБ; ${strips} ч. изображения`, dispose: async () => {} };
+    } finally { image.close(); }
+  }
+  const source: ExtractedSource = await extractProtocolSource(file);
+  checkDocumentAbort(signal);
+  if (!source.text) throw new Error("Не удалось оценить текст документа");
+  return assessText([source.text, pastedText].filter(Boolean).join("\n\n"), file.name);
+}
+
+export async function recognizePart(part: DocumentPart, signal: AbortSignal): Promise<ParsedProtocol> {
+  const source = await part.prepare(signal);
+  checkDocumentAbort(signal);
+  return parseProtocolDocument(source, signal);
+}
--- a/src/lib/visits/protocolImport.ts
+++ b/src/lib/visits/protocolImport.ts
@@ -130,7 +130,7 @@
   };
   const body = doc.getElementsByTagNameNS("*", "body")[0] || doc.documentElement;
   walk(body, []);
-  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 200_000);
+  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
 }
 
 async function openDocumentToText(file: File): Promise<string> {
@@ -157,7 +157,7 @@
     const r8 = u8.match(/[\p{L}\p{N}][\p{L}\p{N} .,;:!?()«»"“”'’%№+\-–—/\\@#&*=<>[\]{}]{2,}/gu) || [];
     text = r8.map((s) => s.trim()).filter((s) => s.length >= 4 && /[\p{L}]{2,}/u.test(s)).join("\n");
   }
-  return text.replace(/\n{3,}/g, "\n\n").trim().slice(0, 200_000);
+  return text.replace(/\n{3,}/g, "\n\n").trim();
 }
 
 /** Простое извлечение текста из RTF (с поддержкой \'hh в cp1251 и \uN). */
@@ -251,7 +251,11 @@
   storageBucket?: string;
   storagePath?: string;
   fileName?: string;
-}): Promise<ParsedProtocol> {
+  /** Только после локальной оценки и подготовки безопасной части. */
+  assessed?: boolean;
+}, signal?: AbortSignal): Promise<ParsedProtocol> {
+  if (!source.assessed) throw new Error("Сначала требуется оценка документа");
+  if (signal?.aborted) throw new DOMException("Распознавание остановлено", "AbortError");
   // functions.invoke иногда успевает взять anon-key во время восстановления
   // сохранённой сессии после открытия вкладки. Для защищённого медицинского
   // парсера всегда передаём явно проверенный пользовательский access token.
@@ -267,36 +271,23 @@
     throw new Error("Нет активной сессии. Войдите в систему ещё раз.");
   }
 
-  let lastErr: any = null;
-  for (let attempt = 1; attempt <= 3; attempt++) {
-    try {
-      const { data, error } = await supabase.functions.invoke("parse-visit-protocol", {
-        headers: { Authorization: `Bearer ${session.access_token}` },
-        body: {
-          text: source.text || "",
-          file_data: source.fileData || "",
-          storage_bucket: source.storageBucket || "",
-          storage_path: source.storagePath || "",
-          file_name: source.fileName || "protocol",
-        },
-      });
-      if (error) throw error;
-      if ((data as any)?.error) throw new Error((data as any).error);
-      return data as ParsedProtocol;
-    } catch (e: any) {
-      lastErr = e;
-      const msg = String(e?.message || e);
-      // Повторяем сетевые сбои и шлюзовые ошибки прокси, не ошибки разбора.
-      if (!/failed to (send|fetch)|network|abort|timeout|502|504|non-2xx/i.test(msg)) break;
-      await new Promise((r) => setTimeout(r, 1500 * attempt));
-    }
-  }
-  const msg = String(lastErr?.message || lastErr || "Не удалось распознать документ");
-  throw new Error(
-    /failed to (send|fetch)|network|abort/i.test(msg)
-      ? "Не удалось отправить документ на сервер (сеть). Попробуйте ещё раз."
-      : msg,
-  );
+  // Один вызов на часть: повтор выполняется пользователем, не всей очередью.
+  const { data, error } = await supabase.functions.invoke("parse-visit-protocol", {
+    signal,
+    headers: { Authorization: `Bearer ${session.access_token}` },
+    body: {
+      text: source.text || "",
+      file_data: source.fileData || "",
+      storage_bucket: source.storageBucket || "",
+      storage_path: source.storagePath || "",
+      file_name: source.fileName || "protocol",
+    },
+  });
+  if (signal?.aborted) throw new DOMException("Распознавание остановлено", "AbortError");
+  if (error) throw new Error("Не удалось распознать часть. Можно повторить её отдельно.");
+  if (data?.error) throw new Error(data.error);
+  if (!data || typeof data !== "object") throw new Error("Пустой ответ распознавания");
+  return data as ParsedProtocol;
 }
 
 
```
