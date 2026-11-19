# Справка из открытого протокола

Кнопка «Справка» в верхней панели каждого протокола. ФИО и дата рождения из карточки, диагноз и дата выдачи из визита. Консультация/лечение, учебное учреждение, календарные даты освобождения от посещения, физкультуры и прививок, дата возвращения, примечания. Логотип и реквизиты из существующего бланка. Пустые значения печатаются с прочерками; отдельный лист для печати.

«Применить» добавляет справку в текущий протокол; штатная кнопка «Сохранить» сохраняет её в истории визита. При повторном открытии значения восстанавливаются. Печать читает текущие значения формы. Новых таблиц, зависимостей и изменений настройки сайта нет.

Меняются только: два новых файла данных/теста, новый диалог, подключение в странице визита, правило хранения в AGENTS.md.

## Точный diff — до применения
```diff
--- /dev/null
+++ src/lib/visits/schoolCertificate.ts
@@ -0,0 +1,32 @@
+export interface SchoolCertificate {
+  attendance?: string;
+  treatmentFrom?: string;
+  treatmentTo?: string;
+  diagnosis?: string;
+  institutionType?: string;
+  institutionName?: string;
+  exemptionFrom?: string;
+  exemptionTo?: string;
+  returnDate?: string;
+  sportsFrom?: string;
+  sportsTo?: string;
+  vaccinationUntil?: string;
+  notes?: string;
+}
+
+export function certificateValue(value?: string | null): string {
+  return value?.trim() || "—";
+}
+
+export function certificateDate(value?: string | null): string {
+  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
+  const date = new Date(`${value}T00:00:00`);
+  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ru-RU");
+}
+
+export function initialCertificate(saved: SchoolCertificate | undefined, visitDate: string, diagnosis?: string | null): SchoolCertificate {
+  return saved ? { ...saved } : {
+    attendance: "консультации", treatmentFrom: visitDate.slice(0, 10), treatmentTo: visitDate.slice(0, 10),
+    diagnosis: diagnosis || "", institutionType: "школы",
+  };
+}
--- /dev/null
+++ src/lib/visits/schoolCertificate.test.ts
@@ -0,0 +1,18 @@
+import { describe, expect, it } from "vitest";
+import { certificateValue, certificateDate, initialCertificate } from "./schoolCertificate";
+
+describe("school certificate", () => {
+  it("represents unfilled values with a dash", () => {
+    expect(certificateValue("   ")).toBe("—");
+    expect(certificateDate(undefined)).toBe("—");
+  });
+  it("prefills treatment dates from the visit and diagnosis from the conclusion", () => {
+    expect(initialCertificate(undefined, "2026-11-19", "Цистит")).toMatchObject({
+      treatmentFrom: "2026-11-19", treatmentTo: "2026-11-19", diagnosis: "Цистит",
+    });
+  });
+  it("preserves saved certificate fields on reopening", () => {
+    expect(initialCertificate({ diagnosis: "Проверено", treatmentFrom: "2026-11-01" }, "2026-11-19", "Другой диагноз"))
+      .toEqual({ diagnosis: "Проверено", treatmentFrom: "2026-11-01" });
+  });
+});
--- /dev/null
+++ src/components/visits/SchoolCertificateDialog.tsx
@@ -0,0 +1,96 @@
+import { useEffect, useState } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import { CalendarIcon, Printer } from "lucide-react";
+import { Button } from "@/components/ui/button";
+import { Input } from "@/components/ui/input";
+import { Label } from "@/components/ui/label";
+import { Textarea } from "@/components/ui/textarea";
+import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
+import { Calendar } from "@/components/ui/calendar";
+import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
+import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
+import { toast } from "@/hooks/use-toast";
+import { format } from "date-fns";
+import { certificateDate, certificateValue, initialCertificate, type SchoolCertificate } from "@/lib/visits/schoolCertificate";
+
+interface Props {
+  open: boolean;
+  onOpenChange: (open: boolean) => void;
+  visitId: string;
+  visitDate: string;
+  patientName?: string | null;
+  birthDate?: string | null;
+  diagnosis?: string | null;
+  saved?: SchoolCertificate;
+  onApply: (certificate: SchoolCertificate) => void;
+}
+
+const DATE_FIELDS: { key: keyof SchoolCertificate; label: string }[] = [
+  { key: "treatmentFrom", label: "Консультация / лечение с" }, { key: "treatmentTo", label: "Консультация / лечение по" },
+  { key: "exemptionFrom", label: "Освобождение от посещения с" }, { key: "exemptionTo", label: "Освобождение от посещения по" },
+  { key: "returnDate", label: "Может посещать с" },
+  { key: "sportsFrom", label: "Освобождение от физкультуры с" }, { key: "sportsTo", label: "Освобождение от физкультуры по" },
+  { key: "vaccinationUntil", label: "Освобождение от прививок до" },
+];
+
+function CertificateSheet({ data, patientName, birthDate, visitDate }: {
+  data: SchoolCertificate; patientName?: string | null; birthDate?: string | null; visitDate: string;
+}) {
+  const value = certificateValue;
+  const date = certificateDate;
+  return <article className="certificate-sheet space-y-4">
+    <header className="flex items-center gap-4 border-b pb-4">
+      <img src="/mca-logo.png" alt="МЦА" width="80" height="80" />
+      <div><strong>Международный центр андрологии</strong><p>ООО «Профессиональный медицинский центр»</p><p>127486 г. Москва, Коровинское шоссе д. 9, корп. 2</p><p>+7 (495) 303-00-00 / +7 (926) 303-01-11</p></div>
+    </header>
+    <h2 className="text-center text-xl font-semibold">Справка о прохождении лечения</h2>
+    <p>Дата выдачи: {date(visitDate.slice(0, 10))}</p>
+    <p>ФИО: {value(patientName)}. Дата рождения: {date(birthDate?.slice(0, 10))}.</p>
+    <p>Находился на {value(data.attendance)} у члена-корреспондента РАЕН, профессора, доктора медицинских наук Тарусина Дмитрия Игоревича с {date(data.treatmentFrom)} по {date(data.treatmentTo)}.</p>
+    <p>Диагноз: {value(data.diagnosis)}.</p>
+    <p>Освобождён от посещения {value(data.institutionType)} {value(data.institutionName)} с {date(data.exemptionFrom)} по {date(data.exemptionTo)}.</p>
+    <p>Контактов с инфекционными заболеваниями не имел.</p>
+    <p>Может посещать с {date(data.returnDate)}.</p>
+    <p>Освобождение от физкультуры с {date(data.sportsFrom)} по {date(data.sportsTo)}.</p>
+    <p>Освобождение от прививок до {date(data.vaccinationUntil)}.</p>
+    <p className="whitespace-pre-wrap">Примечания: {value(data.notes)}.</p>
+    <footer className="pt-8"><p>Врач: Д. И. Тарусин ____________________</p><p>М. П.</p></footer>
+  </article>;
+}
+
+export function SchoolCertificateDialog(props: Props) {
+  const { open, onOpenChange, saved, visitDate, diagnosis, visitId, onApply } = props;
+  const [draft, setDraft] = useState<SchoolCertificate>(() => initialCertificate(saved, visitDate, diagnosis));
+  useEffect(() => { if (open) setDraft(initialCertificate(saved, visitDate, diagnosis)); }, [open, visitId]);
+  const set = (key: keyof SchoolCertificate, value: string) => setDraft((current) => ({ ...current, [key]: value }));
+  const print = () => {
+    const popup = window.open("", "_blank");
+    if (!popup) { toast({ title: "Разрешите всплывающее окно для печати", variant: "destructive" }); return; }
+    const markup = renderToStaticMarkup(<CertificateSheet {...props} data={draft} />);
+    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Справка о прохождении лечения</title><style>
+      @page{size:A4;margin:15mm}body{font:12pt 'Times New Roman',serif;margin:0}article{line-height:1.5}header{display:flex;align-items:center;gap:5mm;border-bottom:1px solid;padding-bottom:4mm}header img{width:22mm;height:22mm;object-fit:contain}header p{margin:0;font-size:10pt}h2{text-align:center;font-size:16pt}p{overflow-wrap:anywhere}footer{margin-top:12mm}article>p:last-of-type{white-space:pre-wrap}
+      </style></head><body>${markup}</body></html>`);
+    popup.document.close();
+    const doPrint = () => { popup.focus(); popup.print(); };
+    const logo = popup.document.querySelector("img");
+    if (logo && !logo.complete) { logo.onload = doPrint; logo.onerror = doPrint; } else doPrint();
+  };
+  return <Dialog open={open} onOpenChange={onOpenChange}>
+    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
+      <DialogHeader><DialogTitle>Справка о прохождении лечения</DialogTitle></DialogHeader>
+      <p className="text-sm">{certificateValue(props.patientName)} · {certificateDate(props.birthDate?.slice(0, 10))}</p>
+      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+        <div className="space-y-1"><Label>Находился на</Label><Select value={draft.attendance || "консультации"} onValueChange={(v) => set("attendance", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="консультации">Консультации</SelectItem><SelectItem value="лечении">Лечении</SelectItem></SelectContent></Select></div>
+        <div className="space-y-1"><Label>Учебное учреждение</Label><Select value={draft.institutionType || "школы"} onValueChange={(v) => set("institutionType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["детского сада", "школы", "колледжа", "ВУЗа"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
+        <div className="space-y-1 md:col-span-2"><Label htmlFor="certificate-institution">Название учреждения</Label><Input id="certificate-institution" value={draft.institutionName || ""} onChange={(e) => set("institutionName", e.target.value)} /></div>
+        <div className="space-y-1 md:col-span-2"><Label htmlFor="certificate-diagnosis">Диагноз</Label><Textarea id="certificate-diagnosis" value={draft.diagnosis || ""} onChange={(e) => set("diagnosis", e.target.value)} /></div>
+        {DATE_FIELDS.map(({ key, label }) => <div key={key} className="space-y-1"><Label>{label}</Label><div className="flex gap-1">
+          <Popover><PopoverTrigger asChild><Button type="button" variant="outline" className="justify-start flex-1" aria-label={label}><CalendarIcon className="h-4 w-4 mr-2" />{draft[key] ? certificateDate(draft[key]) : "Выберите дату"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={draft[key] ? new Date(`${draft[key]}T00:00:00`) : undefined} onSelect={(v) => set(key, v ? format(v, "yyyy-MM-dd") : "")} defaultMonth={new Date(`${draft[key] || visitDate.slice(0, 10)}T00:00:00`)} fixedWeeks initialFocus /></PopoverContent></Popover>
+        </div></div>)}
+        <div className="space-y-1 md:col-span-2"><Label htmlFor="certificate-notes">Примечания</Label><Textarea id="certificate-notes" value={draft.notes || ""} onChange={(e) => set("notes", e.target.value)} /></div>
+      </div>
+      <section className="border-t pt-4"><CertificateSheet {...props} data={draft} /></section>
+      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button><Button variant="outline" onClick={print}><Printer className="h-4 w-4 mr-2" />Печать справки</Button><Button onClick={() => { onApply(draft); onOpenChange(false); toast({ title: "Справка добавлена в протокол", description: "Сохраните визит." }); }}>Применить</Button></DialogFooter>
+    </DialogContent>
+  </Dialog>;
+}
--- src/pages/AdminPatientVisitDetail.tsx
+++ src/pages/AdminPatientVisitDetail.tsx
@@ -40,6 +40,8 @@
 import { mergePlanItemsIntoAssignments } from "@/lib/visits/applyPlanItemsToAssignments";
 import PdfBatchUpload from "@/components/medical/PdfBatchUpload";
 import { ProtocolImportDialog } from "@/components/visits/ProtocolImportDialog";
+import { SchoolCertificateDialog } from "@/components/visits/SchoolCertificateDialog";
+import type { SchoolCertificate } from "@/lib/visits/schoolCertificate";
 import { PatientHistoryPanel } from "@/components/visits/PatientHistoryPanel";
 import { SystemReadinessButton } from "@/components/admin/SystemReadinessButton";
 import { NEXT_VISIT_DURATIONS, nextVisitMissing } from "@/lib/visits/nextVisit";
@@ -92,6 +94,7 @@
   const [siblings, setSiblings] = useState<SiblingVisit[]>([]);
   const [previewOpen, setPreviewOpen] = useState(false);
   const [importOpen, setImportOpen] = useState(false);
+  const [certificateOpen, setCertificateOpen] = useState(false);
 
   const [labsRefresh, setLabsRefresh] = useState(0);
   const [previewLabs, setPreviewLabs] = useState<{ labs: any[]; dynamics: any[] }>({ labs: [], dynamics: [] });
@@ -643,6 +646,18 @@
               </TooltipTrigger>
               <TooltipContent>Распознать протокол старого формата (Word, PDF, скан, текст) и заполнить форму</TooltipContent>
             </Tooltip>
+
+            <Button variant="outline" size="sm" onClick={() => setCertificateOpen(true)} aria-label="Справка о прохождении лечения">
+              <FileDown className="h-4 w-4 md:mr-1" />Справка
+            </Button>
+            <SchoolCertificateDialog open={certificateOpen} onOpenChange={setCertificateOpen} visitId={visit.id}
+              visitDate={visit.visit_date} patientName={visit.patient?.full_name} birthDate={visit.patient?.birth_date}
+              diagnosis={visit.diagnosis}
+              saved={isProtocolRecord(visit.protocol_data) ? (visit.protocol_data.school_certificate as SchoolCertificate | undefined) : undefined}
+              onApply={(certificate) => {
+                const base = isProtocolRecord(visit.protocol_data) ? { ...visit.protocol_data } : {};
+                update({ protocol_data: { ...base, school_certificate: certificate as unknown as Json } });
+              }} />
 
             <ProtocolImportDialog
               open={importOpen}
--- AGENTS.md
+++ AGENTS.md
@@ -8,3 +8,5 @@
 - Prescription preview edits remain local to the printable form; print and PDF read that exact edited DOM so existing stored prescriptions remain unchanged.- Store multiple referral operations in the existing `operation_name` text as numbered lines (`joinOperations`/`splitOperations`), avoiding a schema change that would break old referrals and effectiveness matching.
 - Store postoperative dressing fields in visit protocol JSON and reuse the operation history lookup and shared print layout, so existing visits and operation records remain unchanged.
 - Physiotherapy session protocol (`physio_session`) keeps procedures in visit protocol JSON and prints per-session sheets from its own form, so the shared protocol print layout stays unchanged.
+
+- Store school certificates inside the current visit protocol JSON and print a dedicated sheet, so no schema or shared protocol printing changes are required.
```

Проверки после подтверждения: заполнение, отмена, применение, сохранение и повторное открытие на временном визите, отдельное окно печати с логотипом и прочерками, компьютер и телефон. Без публикации.
