# ИИ-оптимизация рядом с анамнезом

В проверенном протоколе Уначева кнопка «Сократить анамнез с ИИ» есть в панели «История пациента» выше содержания протокола. Рядом с самим полем «Анамнез» её нет.

Предлагается изменить только `src/components/visits/sections/ClinicalHistorySection.tsx`: добавить кнопку «Оптимизировать анамнез с ИИ» рядом с полем во всех формах, использующих общий блок анамнеза, включая протокол Уначева. Результат сначала открывается для проверки; только «Применить» заменяет текст. Пустой анамнез не отправляется. История, документы, сохранение визита, печать и защита доступа не меняются. Существующая кнопка в верхней панели остаётся.

## Точный diff (ещё не применён)
```diff
--- src/components/visits/sections/ClinicalHistorySection.tsx
+++ src/components/visits/sections/ClinicalHistorySection.tsx
@@ -1,10 +1,11 @@
-import { useState } from "react";
+import { useEffect, useRef, useState } from "react";
 import { Textarea } from "@/components/ui/textarea";
 import { Button } from "@/components/ui/button";
 import { Sparkles, Loader2 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "@/hooks/use-toast";
 import { SmartFieldLabel } from "../SmartTemplates";
+import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 
 /**
  * Универсальный блок "Жалобы / Анамнез / Динамика".
@@ -36,6 +37,30 @@
     dynamics: show?.dynamics ?? true,
   };
   const [aiBusy, setAiBusy] = useState(false);
+  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
+  const [summarySource, setSummarySource] = useState("");
+  const scope = `${patientId || ""}:${currentVisitId || ""}`;
+  const currentScope = useRef(scope);
+  currentScope.current = scope;
+  useEffect(() => { setSummaryDraft(null); }, [scope]);
+
+  const compactAnamnesis = async () => {
+    const source = data.anamnesis || "";
+    if (!source.trim()) return;
+    const requestScope = scope;
+    setAiBusy(true);
+    try {
+      const { data: response, error } = await supabase.functions.invoke("summarize-patient-anamnesis", {
+        body: { mode: "compact", text: source },
+      });
+      if (error || !response?.summary?.trim()) throw new Error("Нет результата");
+      if (currentScope.current !== requestScope) return;
+      setSummarySource(source);
+      setSummaryDraft(response.summary.trim());
+    } catch {
+      if (currentScope.current === requestScope) toast({ title: "Не удалось сократить анамнез. Исходный текст сохранён.", variant: "destructive" });
+    } finally { setAiBusy(false); }
+  };
 
   const collectAnamnesis = async () => {
     if (!patientId) {
@@ -63,6 +88,7 @@
   };
 
   return (
+    <>
     <div className="space-y-4">
       {s.complaints && (
         <div className="space-y-1">
@@ -76,10 +102,15 @@
       )}
       {s.anamnesis && (
         <div className="space-y-1">
-          <div className="flex items-center justify-between gap-2">
+          <div className="flex items-center justify-between gap-2 flex-wrap">
             <SmartFieldLabel fieldKey="anamnesis" value={data.anamnesis || ""} onSet={(v) => onChange({ anamnesis: v })}>
               Анамнез
             </SmartFieldLabel>
+            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
+              onClick={compactAnamnesis} disabled={aiBusy || !data.anamnesis?.trim()}>
+              {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
+              Оптимизировать анамнез с ИИ
+            </Button>
             {patientId ? (
               <Button
                 type="button"
@@ -116,5 +147,22 @@
         </div>
       )}
     </div>
+    <Dialog open={summaryDraft !== null} onOpenChange={(open) => { if (!open) setSummaryDraft(null); }}>
+      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
+        <DialogHeader><DialogTitle>Оптимизированный анамнез</DialogTitle></DialogHeader>
+        <Textarea rows={14} value={summaryDraft || ""} onChange={(event) => setSummaryDraft(event.target.value)} />
+        {(data.anamnesis || "") !== summarySource && <p className="text-sm text-destructive">Исходный анамнез изменился. Закройте окно и повторите оптимизацию.</p>}
+        <DialogFooter>
+          <Button variant="outline" onClick={() => setSummaryDraft(null)}>Отмена</Button>
+          <Button disabled={!summaryDraft?.trim() || (data.anamnesis || "") !== summarySource} onClick={() => {
+            if (summaryDraft?.trim() && (data.anamnesis || "") === summarySource) {
+              onChange({ anamnesis: summaryDraft.trim() });
+              setSummaryDraft(null);
+            }
+          }}>Применить</Button>
+        </DialogFooter>
+      </DialogContent>
+    </Dialog>
+    </>
   );
 }
```

После подтверждения: проверить вызов ИИ, отмену и применение результата, сохранение и повторное открытие протокола. Без публикации до отдельной команды.
