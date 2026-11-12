# Повторение физиопротокола на следующий день

Только для физиопротокола существующая кнопка «Дублировать» станет «Повторить на следующий день». Копия получит дату на один календарный день позже даты исходного протокола, а не позже сегодняшнего дня. Например: 12.11.2026 → 13.11.2026.

Все процедуры, показания, продолжительность, параметры, примечания, число сеансов, кратность, пациент и диагноз копируются без переписывания. Исходный протокол остаётся неизменным. После создания открывается копия, дату которой можно изменить обычным способом. Поведение дублирования остальных видов протоколов сохраняется.

Если есть несохранённые изменения, подтверждение явно укажет, что они попадут в копию, но исходный протокол сохранён не будет.

## Точный объём

Три файла: страница визита, существующий помощник физиопротокола и его тесты. Без изменений базы данных, конфигурации, зависимостей, печати и соседних форм. Публикация не входит в эту правку.

## Точный diff для подтверждения

```diff
--- a/src/lib/visits/physio.ts
+++ b/src/lib/visits/physio.ts
@@
+import { addDays, format, parseISO } from "date-fns";
+
 /** Протокол физиолечения: перечень процедур и расчёт листов по сеансам. */
@@
+/** Следующий календарный день после даты исходного физиопротокола. */
+export function nextPhysioDate(visitDate: string): string {
+  return format(addDays(parseISO(visitDate.slice(0, 10)), 1), "yyyy-MM-dd");
+}
+
 /** Номера сеансов для печати: все или один выбранный (1..N). */
--- a/src/pages/AdminPatientVisitDetail.tsx
+++ b/src/pages/AdminPatientVisitDetail.tsx
@@
-import { physioFromAssignments } from "@/lib/visits/physio";
+import { nextPhysioDate, physioFromAssignments } from "@/lib/visits/physio";
@@
   const handleDuplicate = async () => {
     if (!visit) return;
     const proceed = () => true;
-    if (isDirty && !window.confirm("Есть несохранённые изменения. Дублировать без сохранения?")) return;
-    const today = format(new Date(), "yyyy-MM-dd");
+    const isPhysio = visit.protocol_type === "physio_session";
+    const confirmation = isPhysio
+      ? "Есть несохранённые изменения. Перенести их в копию на следующий день, не сохраняя исходный протокол?"
+      : "Есть несохранённые изменения. Дублировать без сохранения?";
+    if (isDirty && !window.confirm(confirmation)) return;
+    const copyDate = isPhysio ? nextPhysioDate(visit.visit_date) : format(new Date(), "yyyy-MM-dd");
@@
-        visit_date: today,
+        visit_date: copyDate,
         protocol_type: visit.protocol_type,
@@
-    toast({ title: "Протокол продублирован", description: "Измените динамические поля." });
+    toast({ title: "Протокол продублирован", description: isPhysio ? `Дата копии: ${format(new Date(copyDate + "T00:00:00"), "dd.MM.yyyy")}` : "Измените динамические поля." });
@@
                 <Button variant="outline" size="sm" onClick={handleDuplicate}>
                   <Copy className="h-4 w-4 md:mr-1" />
-                  <span className="hidden md:inline">Дублировать</span>
+                  <span className="hidden md:inline">{visit.protocol_type === "physio_session" ? "Повторить на следующий день" : "Дублировать"}</span>
                 </Button>
@@
-              <TooltipContent>Создать копию этого протокола (сегодняшняя дата)</TooltipContent>
+              <TooltipContent>{visit.protocol_type === "physio_session" ? "Повторить физиопротокол на следующий день после его даты" : "Создать копию этого протокола (сегодняшняя дата)"}</TooltipContent>
--- a/src/lib/visits/physio.test.ts
+++ b/src/lib/visits/physio.test.ts
@@
-import { physioSessionNumbers, filledPhysioRows, PHYSIO_PROCEDURES } from "./physio";
+import { physioSessionNumbers, filledPhysioRows, PHYSIO_PROCEDURES, nextPhysioDate } from "./physio";
@@
+describe("дата повторного физиопротокола", () => {
+  it.each([
+    ["2026-11-12", "2026-11-13"],
+    ["2026-11-30", "2026-12-01"],
+    ["2026-12-31", "2027-01-01"],
+    ["2028-02-28", "2028-02-29"],
+    ["2028-02-29", "2028-03-01"],
+  ])("следующий календарный день после %s — %s", (source, expected) => {
+    expect(nextPhysioDate(source)).toBe(expected);
+  });
+});
+
 describe("протокол физиолечения", () => {
```

## Проверка после подтверждения

- Запустить тесты физиопротокола, включая переход месяца, года и високосный февраль.
- Войти в кабинет, повторить заполненный проверочный физиопротокол, убедиться в сохранении новой даты и всех полей после повторного открытия, проверить неизменность оригинала. Проверочные записи удалить.
- Сверить итоговые изменения с согласованным diff; защищённые файлы не менять.

Для внесения этих изменений требуется «Подтверждаю».