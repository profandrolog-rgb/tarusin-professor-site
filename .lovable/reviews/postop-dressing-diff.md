# Точный diff: послеоперационная перевязка

Изменения ещё не применены. Действующие формы и база остаются без изменений.

```diff
--- /dev/null
+++ b/src/lib/visits/postopDressing.ts
@@ -0,0 +1,36 @@
+export const DRESSING_LOCAL_FIELDS = [
+  ["healing", "Заживление раны", ["Первичным натяжением", "Вторичным натяжением"]],
+  ["inflammation", "Признаки воспаления", ["Есть", "Нет"]],
+  ["hematoma", "Признаки гематомы", ["Есть", "Нет"]],
+  ["sutures", "Швы", ["Состоятельны", "Не состоятельны"]],
+  ["discharge", "Отделяемое из раны", ["Нет", "Сукровичное", "Гнойное"]],
+] as const;
+
+export const DRESSING_ACTION_FIELDS = [
+  ["sanitation", "Санация области швов раствором", ["Перекиси водорода 3%", "Водным раствором хлоргекседина 0,05%"]],
+  ["treatment", "Область швов обработана", ["Спиртовым раствором йода 2%", "Йодопироном", "Бетадином", "Повидон-йодом", "Спиртовым раствором бриллиантового зеленого 1%"]],
+  ["bandage", "Наложена асептическая повязка", ["Сухая", "Полуспиртовая", "С мазью левомеколь", "С мазью гидрокортизон 1%", "С мазью «Тарумель»"]],
+  ["recommendations", "Рекомендовано", ["Повязку не снимать до следующего визита", "Смена повязки ежедневно"]],
+] as const;
+
+export const DEFAULT_POSTOP_DRESSING = {
+  operation_name: "",
+  dressing_number: null,
+  complaints: "",
+  general_status: "Общее состояние удовлетворительное, кожные покровы обычной окраски, кардио-респираторная деятельность стабильна, живот при пальпации мягкий безболезненный во всех отделах. Физиологические отправления в норме.",
+  conclusion: "Этап репарации после операции.",
+  dressing_local: {},
+  dressing_actions: {},
+};
+
+export function parseDressingNumber(value: string): number | null {
+  if (!/^\d+$/.test(value)) return null;
+  const number = Number(value);
+  return Number.isSafeInteger(number) && number > 0 ? number : null;
+}
+
+export function dressingActionText(data: Record<string, unknown>, key: string): string {
+  return [data[key], data[`${key}_notes`]]
+    .filter((value): value is string => typeof value === "string" && !!value.trim())
+    .join(". ");
+}
--- /dev/null
+++ b/src/components/visits/forms/PostopDressingForm.tsx
@@ -0,0 +1,74 @@
+import { Input } from "@/components/ui/input";
+import { Label } from "@/components/ui/label";
+import { Textarea } from "@/components/ui/textarea";
+import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
+import { DRESSING_LOCAL_FIELDS, DRESSING_ACTION_FIELDS, parseDressingNumber } from "@/lib/visits/postopDressing";
+
+export function PostopDressingForm({ data, onChange }: {
+  data: Record<string, any>;
+  onChange: (patch: Record<string, any>) => void;
+}) {
+  const local = data.dressing_local || {};
+  const actions = data.dressing_actions || {};
+  const choice = (id: string, label: string, options: readonly string[], value: string, set: (value: string) => void) => (
+    <div className="space-y-1" key={id}>
+      <Label htmlFor={id}>{label}</Label>
+      <Select value={value || "empty"} onValueChange={(v) => set(v === "empty" ? "" : v)}>
+        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
+        <SelectContent>
+          <SelectItem value="empty">— не выбрано —</SelectItem>
+          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
+        </SelectContent>
+      </Select>
+    </div>
+  );
+  return (
+    <div className="space-y-4">
+      <div className="grid gap-4 md:grid-cols-2">
+        <div className="space-y-1">
+          <Label htmlFor="dressing-number">№ перевязки по счёту</Label>
+          <Input id="dressing-number" type="number" min={1} step={1} value={data.dressing_number ?? ""}
+            onChange={(e) => onChange({ dressing_number: parseDressingNumber(e.target.value) })} />
+        </div>
+        <div className="space-y-1">
+          <Label htmlFor="dressing-operation">Название операции</Label>
+          <Input id="dressing-operation" value={data.operation_name || ""} onChange={(e) => onChange({ operation_name: e.target.value })} />
+        </div>
+      </div>
+      <div className="space-y-1">
+        <Label htmlFor="dressing-complaints">Жалобы</Label>
+        <Textarea id="dressing-complaints" rows={3} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
+      </div>
+      <div className="space-y-1">
+        <Label htmlFor="dressing-somatic">Соматический статус</Label>
+        <Textarea id="dressing-somatic" rows={4} value={data.general_status || ""} onChange={(e) => onChange({ general_status: e.target.value })} />
+      </div>
+      <h3 className="font-semibold">Локальный статус</h3>
+      <div className="grid gap-4 md:grid-cols-2">
+        {DRESSING_LOCAL_FIELDS.map(([key, label, options]) => choice(`dressing-${key}`, label, options, local[key],
+          (value) => onChange({ dressing_local: { ...local, [key]: value } })))}
+      </div>
+      <h3 className="font-semibold">Выполнено</h3>
+      {DRESSING_ACTION_FIELDS.filter(([key]) => key !== "recommendations").map(([key, label, options]) => (
+        <div className="space-y-2" key={key}>
+          {choice(`dressing-${key}`, label, options, actions[key], (value) => onChange({ dressing_actions: { ...actions, [key]: value } }))}
+          <Label htmlFor={`dressing-${key}-notes`}>Дополнительно</Label>
+          <Textarea id={`dressing-${key}-notes`} rows={2} value={actions[`${key}_notes`] || ""}
+            onChange={(e) => onChange({ dressing_actions: { ...actions, [`${key}_notes`]: e.target.value } })} />
+        </div>
+      ))}
+      <div className="space-y-1">
+        <Label htmlFor="dressing-conclusion">Заключение</Label>
+        <Textarea id="dressing-conclusion" rows={2} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
+      </div>
+      {DRESSING_ACTION_FIELDS.filter(([key]) => key === "recommendations").map(([key, label, options]) => (
+        <div className="space-y-2" key={key}>
+          {choice(`dressing-${key}`, label, options, actions[key], (value) => onChange({ dressing_actions: { ...actions, [key]: value } }))}
+          <Label htmlFor="dressing-recommendations-notes">Дополнительные рекомендации</Label>
+          <Textarea id="dressing-recommendations-notes" rows={2} value={actions.recommendations_notes || ""}
+            onChange={(e) => onChange({ dressing_actions: { ...actions, recommendations_notes: e.target.value } })} />
+        </div>
+      ))}
+    </div>
+  );
+}
--- a/src/lib/visits/protocolTypes.ts
+++ b/src/lib/visits/protocolTypes.ts
@@ -13,7 +13,8 @@
   | "peptide_program"
   | "girl_urology"
   | "uzi_abdominal"
-  | "physio_session";
+  | "physio_session"
+  | "postop_dressing";
 
 
 export interface ProtocolDef {
@@ -45,6 +46,7 @@
   girl_urology: "Урологический осмотр (девочки)",
   uzi_abdominal: "Ультразвуковое исследование органов брюшной полости",
   physio_session: "Протокол физиолечения",
+  postop_dressing: "Послеоперационная перевязка",
   dynamic: "Динамический осмотр",
   unknown: "Осмотр",
 };
@@ -71,6 +73,7 @@
   girl_urology: "Осмотр девочки",
   uzi_abdominal: "УЗИ брюшной полости",
   physio_session: "Физиолечение",
+  postop_dressing: "Перевязка",
   dynamic: "Динамический",
   unknown: "Осмотр",
 };
@@ -92,6 +95,7 @@
   "repeat_with_uzi",
   "peptide_program",
   "physio_session",
+  "postop_dressing",
 ].map((key) => ({
   key: key as ProtocolType,
   title: PROTOCOL_LABELS[key],
--- a/src/lib/visits/protocolSchemas.ts
+++ b/src/lib/visits/protocolSchemas.ts
@@ -1,4 +1,5 @@
 import { GIRL_LOCAL_FIELDS, GIRL_PELVIS_FIELDS, defaultsOf } from "./girlExam";
+import { DEFAULT_POSTOP_DRESSING } from "./postopDressing";
 import { ProtocolType } from "./protocolTypes";
 import { DEFAULT_SOMATIC, SomaticStatusData } from "@/components/visits/sections/SomaticStatus";
 import { DEFAULT_LOCAL_STATUS, LocalStatusData } from "@/components/visits/sections/LocalStatusAndrology";
@@ -276,4 +277,5 @@
     recommendations: "Динамическое наблюдение.",
   },
   physio_session: { indications: "", procedures: [{}], sessions_total: 10, per_week: 2 },
+  postop_dressing: DEFAULT_POSTOP_DRESSING,
 };
--- a/src/components/visits/ProtocolForm.tsx
+++ b/src/components/visits/ProtocolForm.tsx
@@ -13,6 +13,7 @@
 import { PeptideProgramForm } from "./forms/PeptideProgramForm";
 import { GirlUrologyForm } from "./forms/GirlUrologyForm";
 import { AbdominalUziForm } from "./forms/AbdominalUziForm";
+import { PostopDressingForm } from "./forms/PostopDressingForm";
 import { PhysioSessionForm } from "./forms/PhysioSessionForm";
 import { AbdominalUziSection } from "./sections/AbdominalUziSection";
 import { VoidingDiarySection } from "./sections/VoidingDiarySection";
@@ -58,6 +59,15 @@
 
   if (type === "physio_session") {
     return <PhysioSessionForm data={data || {}} onChange={patch} patientName={patientName} birthDate={birthDate} visitDate={visitDate} />;
+  }
+
+  if (type === "postop_dressing") {
+    return <div className="space-y-4">
+      <OperationHistoryBanner patientName={patientName} birthDate={birthDate} patientId={patientId}
+        currentVisitId={currentVisitId} currentName={data?.operation_name || ""} currentDate={data?.operation_date || ""}
+        onApply={patch} />
+      <PostopDressingForm data={data || {}} onChange={patch} />
+    </div>;
   }
 
   const renderForm = () => {
--- a/src/lib/visits/nextVisit.ts
+++ b/src/lib/visits/nextVisit.ts
@@ -8,6 +8,7 @@
 
 /** Текст даты контрольного осмотра: конкретная дата или интервал (конец интервала — protocol_data.next_visit_date_to). */
 export function formatNextVisitDate(from: string | null | undefined, data: any): string | null {
+  if (data?.next_visit_none === true) return "Повторный визит не назначен";
   if (!from) return null;
   const to = data?.next_visit_date_to;
   if (to && to !== from) return `с ${fmt(from)} по ${fmt(to)}`;
@@ -16,6 +17,7 @@
 
 /** Что не заполнено для повторного приёма (пусто — всё в порядке). */
 export function nextVisitMissing(from: string | null | undefined, data: any): string[] {
+  if (data?.next_visit_none === true) return [];
   const missing: string[] = [];
   if (!from) missing.push("дата контрольного осмотра");
   else if (data?.next_visit_range && !data?.next_visit_date_to) missing.push("конец интервала дат");
--- a/src/pages/AdminPatientVisitDetail.tsx
+++ b/src/pages/AdminPatientVisitDetail.tsx
@@ -16,6 +16,7 @@
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Textarea } from "@/components/ui/textarea";
 import { Input } from "@/components/ui/input";
+import { Checkbox } from "@/components/ui/checkbox";
 import { Label } from "@/components/ui/label";
 import { toast } from "@/hooks/use-toast";
 import { PROTOCOL_TYPE_MAP, ProtocolType } from "@/lib/visits/protocolTypes";
@@ -806,8 +807,17 @@
                 const pd: any = isProtocolRecord(visit.protocol_data) ? visit.protocol_data : {};
                 const setPd = (p: Record<string, any>) => update({ protocol_data: { ...pd, ...p } });
                 const range = !!pd.next_visit_range;
+                const noNextVisit = pd.next_visit_none === true;
                 return (
                   <div className="space-y-2">
+                    <label className="flex items-center gap-2 text-sm cursor-pointer">
+                      <Checkbox checked={noNextVisit} onCheckedChange={(value) => update({
+                        next_visit_date: null,
+                        protocol_data: { ...pd, next_visit_none: value === true, next_visit_range: false, next_visit_date_to: null, next_visit_duration: null },
+                      })} />
+                      Нет повторного визита
+                    </label>
+                    {!noNextVisit && <>
                     <div className="flex items-center justify-between gap-2">
                       <Label>Контрольный осмотр *</Label>
                       <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
@@ -868,6 +878,7 @@
                         {NEXT_VISIT_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                       </select>
                     </div>
+                    </>}
                   </div>
                 );
               })()}
--- a/src/components/visits/ProtocolPrintLayout.tsx
+++ b/src/components/visits/ProtocolPrintLayout.tsx
@@ -1,4 +1,5 @@
 import { format } from "date-fns";
+import { DRESSING_LOCAL_FIELDS, DRESSING_ACTION_FIELDS, dressingActionText } from "@/lib/visits/postopDressing";
 import { filledPhysioRows } from "@/lib/visits/physio";
 import { formatNextVisitDate } from "@/lib/visits/nextVisit";
 import { ru } from "date-fns/locale";
@@ -456,6 +457,7 @@
   "print_labs_table","print_labs_dynamics","include_consent","include_understanding","metabolic_map_checklist",
   "testis_asymmetry_percent","epididymis_asymmetry_percent","show_sexual_formula","show_sexual_constitution",
   "procedures","sessions_total","per_week",
+  "next_visit_none","dressing_number","dressing_local","dressing_actions",
 ]);
 
 function pushUnknownScalars(rows: React.ReactNode[], d: any) {
@@ -710,6 +712,22 @@
     rows.push(<Field key="dev" label="Аппарат / датчик" value={d.device} />);
   }
 
+  if (t === "postop_dressing") {
+    rows.push(<Field key="dn" label="№ перевязки по счёту" value={d.dressing_number} />);
+    rows.push(<Field key="do" label="Название операции" value={d.operation_name} />);
+    rows.push(<Field key="dc" label="Жалобы" value={d.complaints} />);
+    rows.push(<Field key="ds" label="Соматический статус" value={d.general_status} />);
+    rows.push(<Section key="dl" title="Локальный статус">
+      {DRESSING_LOCAL_FIELDS.map(([key, label]) => <Field key={key} label={label} value={d.dressing_local?.[key]} />)}
+    </Section>);
+    rows.push(<Section key="da" title="Выполнено">
+      {DRESSING_ACTION_FIELDS.filter(([key]) => key !== "recommendations").map(([key, label]) =>
+        <Field key={key} label={label} value={dressingActionText(d.dressing_actions || {}, key)} />)}
+    </Section>);
+    rows.push(<Field key="dz" label="Заключение" value={d.conclusion} />);
+    rows.push(<Field key="dr" label="Рекомендовано" value={dressingActionText(d.dressing_actions || {}, "recommendations")} />);
+  }
+
   if (t === "physio_session") {
     rows.push(<Field key="pi" label="Показания к проведению процедур" value={d.indications} />);
     filledPhysioRows(d.procedures).forEach((r: any, i: number) => {
@@ -1015,11 +1033,11 @@
   }
 
 
-  if (visit.next_visit_date) {
+  if (d.next_visit_none === true || visit.next_visit_date) {
     rows.push(
       <Field key="nv" label="Контрольный осмотр" value={formatNextVisitDate(visit.next_visit_date, d)} />
     );
-    if (d.next_visit_duration) {
+    if (d.next_visit_none !== true && d.next_visit_duration) {
       rows.push(<Field key="nvd" label="Рекомендованное время приёма" value={d.next_visit_duration} />);
     }
   }
--- a/src/components/visits/VisitPrint.tsx
+++ b/src/components/visits/VisitPrint.tsx
@@ -263,10 +263,10 @@
         </>
       )}
 
-      {visit.next_visit_date && (
+      {(data.next_visit_none === true || visit.next_visit_date) && (
         <>
           <Row label="Контрольный осмотр" value={formatNextVisitDate(visit.next_visit_date, data)} />
-          <Row label="Рекомендованное время приёма" value={data.next_visit_duration} />
+          {data.next_visit_none !== true && <Row label="Рекомендованное время приёма" value={data.next_visit_duration} />}
         </>
       )}
 
--- /dev/null
+++ b/src/lib/visits/nextVisit.test.ts
@@ -0,0 +1,23 @@
+import { describe, expect, it } from "vitest";
+import { formatNextVisitDate, nextVisitMissing } from "./nextVisit";
+
+describe("Нет повторного визита", () => {
+  it("отменяет обязательность даты и времени", () => {
+    expect(nextVisitMissing(null, { next_visit_none: true })).toEqual([]);
+  });
+  it("не печатает устаревшую дату и интервал", () => {
+    expect(formatNextVisitDate("2026-11-20", { next_visit_none: true, next_visit_date_to: "2026-11-25" }))
+      .toBe("Повторный визит не назначен");
+  });
+  it("при выключении возвращает обязательные поля", () => {
+    expect(nextVisitMissing(null, { next_visit_none: false }))
+      .toEqual(["дата контрольного осмотра", "рекомендованное время приёма"]);
+  });
+  it("сохраняет требования к концу интервала", () => {
+    expect(nextVisitMissing("2026-11-20", { next_visit_range: true, next_visit_duration: "20 минут" }))
+      .toEqual(["конец интервала дат"]);
+  });
+  it("сохраняет действующий заполненный повторный приём", () => {
+    expect(nextVisitMissing("2026-11-20", { next_visit_duration: "20 минут" })).toEqual([]);
+  });
+});
--- /dev/null
+++ b/src/lib/visits/postopDressing.test.ts
@@ -0,0 +1,22 @@
+import { describe, expect, it } from "vitest";
+import { DEFAULT_POSTOP_DRESSING, parseDressingNumber, dressingActionText } from "./postopDressing";
+
+describe("Перевязка", () => {
+  it("при отсутствии операции оставляет название пустым", () => {
+    expect(DEFAULT_POSTOP_DRESSING.operation_name).toBe("");
+  });
+  it("не предполагает состояние раны и выполненные действия", () => {
+    expect(DEFAULT_POSTOP_DRESSING.dressing_local).toEqual({});
+    expect(DEFAULT_POSTOP_DRESSING.dressing_actions).toEqual({});
+  });
+  it("принимает номер перевязки по счёту", () => {
+    expect(parseDressingNumber("3")).toBe(3);
+  });
+  it.each(["", "0", "-1", "1.5", "abc"])("не принимает недопустимый номер %s", (value) => {
+    expect(parseDressingNumber(value)).toBeNull();
+  });
+  it("сохраняет свободное дополнение вместе с выбранным действием", () => {
+    expect(dressingActionText({ bandage: "Сухая", bandage_notes: "Дополнительная фиксация" }, "bandage"))
+      .toBe("Сухая. Дополнительная фиксация");
+  });
+});
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -6,4 +6,5 @@
 - Keep batch document import scoped to the current visit's anamnesis and require review before applying AI condensation, so historical records cannot overwrite today's clinical fields.
 - Normalize laboratory extraction in a function-local helper before caching or saving, preserving per-page dates so multi-document replies cannot silently lose results.
 - Prescription preview edits remain local to the printable form; print and PDF read that exact edited DOM so existing stored prescriptions remain unchanged.- Store multiple referral operations in the existing `operation_name` text as numbered lines (`joinOperations`/`splitOperations`), avoiding a schema change that would break old referrals and effectiveness matching.
+- Store postoperative dressing fields in visit protocol JSON and reuse the operation history lookup and shared print layout, so existing visits and operation records remain unchanged.
 - Physiotherapy session protocol (`physio_session`) keeps procedures in visit protocol JSON and prints per-session sheets from its own form, so the shared protocol print layout stays unchanged.
--- a/roadmap.md
+++ b/roadmap.md
@@ -1,6 +1,6 @@
 - [ ] CORS на api3: nginx отдаёт статический Access-Control-Allow-Headers без x-upsert/cache-control -> блокируется загрузка файлов в Storage с tarusin.pro. Варианты: правка nginx на VPS Минск ИЛИ переключение прод-маршрута на api2.
 # Задачи
-- [ ] Послеоперационная перевязка и «Нет повторного визита» во всех осмотрах: согласовать объём и diff, затем внедрить и проверить сохранение и печать; публикация только по отдельной команде.
+- [ ] Послеоперационная перевязка и «Нет повторного визита» во всех осмотрах: план согласован, подготовлен точный diff; применение и проверка после «Подтверждаю», публикация только по отдельной команде.
 - [x] Русские календари: понедельник, подсветка среды и четверга; русский календарь проверен в браузере на компьютере и телефоне.
 - [x] Редактирование путёвок из списка и статус «Дата операции определена»; сохранение и повторное открытие проверены, тестовая путёвка удалена.
 - [x] Исправить массивные ответы импорта анализов и очистить два сбойных кэша; оба оригинала повторно импортированы, по 9 показателей видны в протоколах; проверочные дубликаты удалены.
```

## Изменение ограничения типов визита

Сохраняет все прежние допустимые значения и добавляет только `postop_dressing`. Выполняется после подтверждения штатным инструментом базы.

```sql
ALTER TABLE public.patient_visits DROP CONSTRAINT patient_visits_protocol_type_check;
ALTER TABLE public.patient_visits ADD CONSTRAINT patient_visits_protocol_type_check CHECK (protocol_type = ANY (ARRAY[
  'ultrashort','primary_short','dynamic','dynamic_with_uzi','repeat_with_labs','uzi_reproductive','uzi_urinary','uzi_bladder','postop_day3','postop_day7','postop_day10','repeat_with_uzi','online_consult','peptide_program','unknown','girl_urology','uzi_abdominal','physio_session','postop_dressing'
]::text[]));
```

Никакие текущие записи не изменяются. Файл изменения базы создаст штатный инструмент; типы обновляются им автоматически. Посторонние уже существующие изменения зависимостей не входят в этот diff.
