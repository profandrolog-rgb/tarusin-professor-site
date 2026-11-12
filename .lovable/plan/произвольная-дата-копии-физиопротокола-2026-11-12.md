# Произвольная дата копии физиопротокола

Кнопка «Дублировать протокол датой» открывает существующий русский календарь. По умолчанию выбран сегодняшний день — день заполнения нового протокола, независимо от даты открытого старого протокола. Можно выбрать любую другую дату, в том числе более раннюю, и нажать «Создать копию».

Все поля физиопротокола переносятся без переписывания, исходный протокол не меняется. Дублирование остальных видов протоколов остаётся прежним. Ничего не публикуется.

## Точный объём

Только три файла, изменённые в предыдущем задании. Заменяется правило «следующий день» и соответствующие тесты; используется имеющийся календарь. Без изменений архитектуры, базы данных, зависимостей, конфигурации и печати.

## Точный diff

```diff
--- a/src/lib/visits/physio.ts
+++ b/src/lib/visits/physio.ts
@@ -1,4 +1,4 @@
-import { addDays, format, parseISO } from "date-fns";
+import { format } from "date-fns";
 
 /** Протокол физиолечения: перечень процедур и расчёт листов по сеансам. */
 export const PHYSIO_PROCEDURES = [
@@ -27,9 +27,9 @@
   recommendations?: string;
 }
 
-/** Следующий календарный день после даты исходного физиопротокола. */
-export function nextPhysioDate(visitDate: string): string {
-  return format(addDays(parseISO(visitDate.slice(0, 10)), 1), "yyyy-MM-dd");
+/** Дата копии физиопротокола: выбранная дата либо сегодняшний день. */
+export function physioCopyDate(selected?: Date, now = new Date()): string {
+  return format(selected ?? now, "yyyy-MM-dd");
 }
 
 /** Номера сеансов для печати: все или один выбранный (1..N). */
--- a/src/lib/visits/physio.test.ts
+++ b/src/lib/visits/physio.test.ts
@@ -1,15 +1,12 @@
 import { describe, it, expect } from "vitest";
-import { physioSessionNumbers, filledPhysioRows, PHYSIO_PROCEDURES, nextPhysioDate } from "./physio";
+import { physioSessionNumbers, filledPhysioRows, PHYSIO_PROCEDURES, physioCopyDate } from "./physio";
 
-describe("дата повторного физиопротокола", () => {
-  it.each([
-    ["2026-11-12", "2026-11-13"],
-    ["2026-11-30", "2026-12-01"],
-    ["2026-12-31", "2027-01-01"],
-    ["2028-02-28", "2028-02-29"],
-    ["2028-02-29", "2028-03-01"],
-  ])("следующий календарный день после %s — %s", (source, expected) => {
-    expect(nextPhysioDate(source)).toBe(expected);
+describe("дата копии физиопротокола", () => {
+  it("по умолчанию использует день заполнения", () => {
+    expect(physioCopyDate(undefined, new Date(2026, 10, 12, 14, 27))).toBe("2026-11-12");
+  });
+  it.each(["2026-10-01", "2026-11-12", "2026-12-25"])("сохраняет произвольную выбранную дату %s", (selected) => {
+    expect(physioCopyDate(new Date(selected + "T00:00:00"), new Date(2026, 10, 12))).toBe(selected);
   });
 });
 
--- a/src/pages/AdminPatientVisitDetail.tsx
+++ b/src/pages/AdminPatientVisitDetail.tsx
@@ -1,5 +1,5 @@
 import { useEffect, useMemo, useRef, useState } from "react";
-import { nextPhysioDate, physioFromAssignments } from "@/lib/visits/physio";
+import { physioCopyDate, physioFromAssignments } from "@/lib/visits/physio";
 import { Link, useParams, useNavigate } from "react-router-dom";
 import { ArrowLeft, Loader2, Printer, Trash2, RotateCcw, Eye, Plus, ChevronDown, Save, X, Copy, Stethoscope, Pencil, FileDown, FileUp, CalendarIcon } from "lucide-react";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
@@ -94,6 +94,8 @@
   const [labsRefresh, setLabsRefresh] = useState(0);
   const [previewLabs, setPreviewLabs] = useState<{ labs: any[]; dynamics: any[] }>({ labs: [], dynamics: [] });
   const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);
+  const [duplicateOpen, setDuplicateOpen] = useState(false);
+  const [duplicateDate, setDuplicateDate] = useState<Date | undefined>(undefined);
 
   // Для окна «Предпросмотр»: та же таблица анализов и динамика, что на странице печати
   useEffect(() => {
@@ -419,15 +421,15 @@
     else navigate("/admin/visits");
   };
 
-  const handleDuplicate = async () => {
+  const handleDuplicate = async (selectedDate?: Date) => {
     if (!visit) return;
     const proceed = () => true;
     const isPhysio = visit.protocol_type === "physio_session";
     const confirmation = isPhysio
-      ? "Есть несохранённые изменения. Перенести их в копию на следующий день, не сохраняя исходный протокол?"
+      ? "Есть несохранённые изменения. Перенести их в копию на выбранную дату, не сохраняя исходный протокол?"
       : "Есть несохранённые изменения. Дублировать без сохранения?";
     if (isDirty && !window.confirm(confirmation)) return;
-    const copyDate = isPhysio ? nextPhysioDate(visit.visit_date) : format(new Date(), "yyyy-MM-dd");
+    const copyDate = isPhysio ? physioCopyDate(selectedDate) : format(new Date(), "yyyy-MM-dd");
     const { data, error } = await supabase
       .from("patient_visits")
       .insert({
@@ -594,15 +596,41 @@
               <TooltipContent>Создать новый протокол для этого пациента</TooltipContent>
             </Tooltip>
 
-            <Tooltip>
-              <TooltipTrigger asChild>
-                <Button variant="outline" size="sm" onClick={handleDuplicate}>
-                  <Copy className="h-4 w-4 md:mr-1" />
-                  <span className="hidden md:inline">{visit.protocol_type === "physio_session" ? "Повторить на следующий день" : "Дублировать"}</span>
-                </Button>
-              </TooltipTrigger>
-              <TooltipContent>{visit.protocol_type === "physio_session" ? "Повторить физиопротокол на следующий день после его даты" : "Создать копию этого протокола (сегодняшняя дата)"}</TooltipContent>
-            </Tooltip>
+            {visit.protocol_type === "physio_session" ? (
+              <Popover open={duplicateOpen} onOpenChange={(open) => {
+                if (open) setDuplicateDate(new Date());
+                setDuplicateOpen(open);
+              }}>
+                <PopoverTrigger asChild>
+                  <Button variant="outline" size="sm" aria-label="Дублировать протокол датой">
+                    <Copy className="h-4 w-4 md:mr-1" />
+                    <span className="hidden md:inline">Дублировать протокол датой</span>
+                  </Button>
+                </PopoverTrigger>
+                <PopoverContent className="w-auto p-3" align="start" collisionPadding={12}>
+                  <div className="space-y-2">
+                    <Label>Дата копии</Label>
+                    <div className="text-sm">{duplicateDate ? format(duplicateDate, "dd.MM.yyyy") : "Выберите дату"}</div>
+                    <Calendar mode="single" selected={duplicateDate} onSelect={setDuplicateDate}
+                      defaultMonth={duplicateDate} fixedWeeks initialFocus className="pointer-events-auto" />
+                    <Button type="button" className="w-full gap-1" disabled={!duplicateDate}
+                      onClick={() => handleDuplicate(duplicateDate)}>
+                      <Copy className="h-4 w-4" /> Создать копию
+                    </Button>
+                  </div>
+                </PopoverContent>
+              </Popover>
+            ) : (
+              <Tooltip>
+                <TooltipTrigger asChild>
+                  <Button variant="outline" size="sm" onClick={() => handleDuplicate()}>
+                    <Copy className="h-4 w-4 md:mr-1" />
+                    <span className="hidden md:inline">Дублировать</span>
+                  </Button>
+                </TooltipTrigger>
+                <TooltipContent>Создать копию этого протокола (сегодняшняя дата)</TooltipContent>
+              </Tooltip>
+            )}
 
             <Tooltip>
               <TooltipTrigger asChild>
```

## Проверка

- Тесты: дата по умолчанию совпадает с днём заполнения; выбранные прошлые, текущие и будущие даты сохраняются точно.
- В кабинете открыть старый проверочный физиопротокол: убедиться в сегодняшней дате по умолчанию, выбрать другую дату, создать копию, повторно открыть и проверить дату, процедуры и неизменность оригинала.
- Проверочные записи удалить, итоговые изменения сверить с согласованным diff.

Для внесения правки требуется «Подтверждаю».
