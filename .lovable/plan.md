# Актуальные модели и отдельные категории OpenRouter

## Объём
- Обновить прежний общий список кабинета, консилиума и оркестратора: актуальные версии Gemini, Claude, GPT, Grok, Qwen, Kimi, GLM, Mistral и MiMo из полученного каталога OpenRouter.
- Сохранить прежние ключи моделей, выбранные пользователем модели и резервные кандидаты. Не менять маршрутизацию запросов, авторизацию, зависимости, Vite, данные бесед и серверные функции.
- В личном советнике показать отдельные раскрывающиеся списки Instruct, Abliterated и Uncensored; в расширенном выборе кабинета — отдельный выбор категории и отметки возле моделей.
- Проверять весь загруженный каталог, включая модели с изображениями на входе и текстом на выходе. Не обрезать список до 400 записей.

## Результат проверки каталога
Получено 456 записей. В названии или ID явно указаны Instruct у 23 моделей, Uncensored у одной; Abliterated не найдены ни в названиях/ID, ни в описаниях. Instruct не означает отсутствие ограничений. Пустая категория Abliterated остаётся видимой и будет заполняться при появлении соответствующих записей в живом каталоге. Наличие в каталоге не гарантирует ответ провайдера или доступность по региону/балансу.

## Технические детали и точный diff
Изменяются только четыре файла ниже. Общий список уже используется кабинетом и оркестратором, поэтому их логику менять не требуется. Дополнительный файл — только тест правил классификации.

```diff
--- a/src/config/aiModels.ts
+++ b/src/config/aiModels.ts
@@ -27,4 +27,4 @@
-    label: "Gemini 3.7 Flash",
-    tier: "fast",
-    candidates: [
-      "google/gemini-3.7-flash",
+    label: "Gemini 3.8 Flash",
+    tier: "fast",
+    candidates: [
+      "google/gemini-3.8-flash", "google/gemini-3.7-flash",
@@ -39 +39 @@
-    label: "Claude Sonnet 5",
+    label: "Claude Sonnet 5.5",
@@ -43 +43 @@
-      "anthropic/claude-sonnet-5",
+      "anthropic/claude-sonnet-5.5", "anthropic/claude-sonnet-5",
@@ -58 +58 @@
-    label: "Grok 4",
+    label: "Grok 4.7",
@@ -61 +61 @@
-    candidates: ["x-ai/grok-4.6", "x-ai/grok-4.3", "x-ai/grok-4.2", "x-ai/grok-4.1", "x-ai/grok-4"],
+    candidates: ["x-ai/grok-4.7", "x-ai/grok-4.6", "x-ai/grok-4.3", "x-ai/grok-4.2", "x-ai/grok-4.1", "x-ai/grok-4"],
@@ -66,4 +66,4 @@
-    label: "Qwen 3.7 Flash",
-    tier: "fast",
-    candidates: [
-      "qwen/qwen3.7-flash",
+    label: "Qwen 3.8 Flash",
+    tier: "fast",
+    candidates: [
+      "qwen/qwen3.8-flash", "qwen/qwen3.7-flash",
@@ -79,4 +79,4 @@
-    label: "Kimi K3",
-    tier: "fast",
-    candidates: [
-      "moonshotai/kimi-k3",
+    label: "Kimi K3.1 Pro",
+    tier: "fast",
+    candidates: [
+      "moonshotai/kimi-k3.1-pro", "moonshotai/kimi-k3",
@@ -96,3 +96,3 @@
-    label: "Gemini 3.1 Pro",
-    tier: "deep",
-    candidates: ["google/gemini-3.1-pro-preview", "google/gemini-2.5-pro"],
+    label: "Gemini 4 Argon",
+    tier: "deep",
+    candidates: ["google/gemini-4-argon", "google/gemini-3.1-pro-preview", "google/gemini-2.5-pro"],
@@ -103,4 +103,4 @@
-    label: "Claude Opus 5",
-    tier: "deep",
-    candidates: [
-      "anthropic/claude-opus-5",
+    label: "Claude Opus 5.5",
+    tier: "deep",
+    candidates: [
+      "anthropic/claude-opus-5.5", "anthropic/claude-opus-5",
@@ -122,4 +122,4 @@
-    label: "GPT-5.6 Luna Pro",
-    tier: "deep",
-    candidates: [
-      "openai/gpt-5.6-luna-pro",
+    label: "GPT-6.1 Terra Pro",
+    tier: "deep",
+    candidates: [
+      "openai/gpt-6.1-terra-pro", "openai/gpt-5.6-luna-pro",
@@ -157,3 +157,3 @@
-    label: "Mistral Large 3",
-    tier: "deep",
-    candidates: ["mistralai/mistral-large-2512", "mistralai/mistral-large"],
+    label: "Mistral Large 4",
+    tier: "deep",
+    candidates: ["mistralai/mistral-large-4-0", "mistralai/mistral-large-2512", "mistralai/mistral-large"],
@@ -184,3 +184,3 @@
-    label: "GLM-5.2 (Zhipu AI)",
-    tier: "deep",
-    candidates: ["z-ai/glm-5.2", "z-ai/glm-5"],
+    label: "GLM-5.3 Prime (Zhipu AI)",
+    tier: "deep",
+    candidates: ["z-ai/glm-5.3-prime", "z-ai/glm-5.2", "z-ai/glm-5"],
@@ -191,4 +191,4 @@
-    label: "Qwen 3.8 Max",
-    tier: "deep",
-    candidates: [
-      "qwen/qwen3.8-max",
+    label: "Qwen 3.8 Max Prime",
+    tier: "deep",
+    candidates: [
+      "qwen/qwen3.8-max-prime", "qwen/qwen3.8-max",
@@ -203,3 +203,3 @@
-    label: "MiMo 2.5 Pro (Xiaomi)",
-    tier: "deep",
-    candidates: ["xiaomi/mimo-v2.5-pro", "xiaomi/mimo-2.5-pro", "xiaomi/mimo-pro"],
+    label: "MiMo 2.6 Pro (Xiaomi)",
+    tier: "deep",
+    candidates: ["xiaomi/mimo-v2.6-pro", "xiaomi/mimo-v2.5-pro", "xiaomi/mimo-2.5-pro", "xiaomi/mimo-pro"],
@@ -470,0 +471,12 @@
+
+/** Explicit catalog labels only: Instruct does not imply Abliterated. */
+export function getOpenRouterModelTags(model: LiveModelInfo): string[] {
+  const output = model.architecture?.output_modalities;
+  if (output?.length && !output.includes("text")) return [];
+  const text = `${model.id} ${model.name ?? ""}`;
+  const tags: string[] = [];
+  if (/\binstruct\b/i.test(text)) tags.push("Instruct");
+  if (/\babliterated\b/i.test(text)) tags.push("Abliterated");
+  if (/\buncensored\b/i.test(text)) tags.push("Uncensored");
+  return tags;
+}
--- a/src/config/aiModels.test.ts
+++ b/src/config/aiModels.test.ts
@@ -0,0 +1,17 @@
+import { describe, expect, it } from "vitest";
+import { getOpenRouterModelTags } from "./aiModels";
+
+describe("OpenRouter explicit model categories", () => {
+  it("identifies Instruct without claiming ablation", () => {
+    expect(getOpenRouterModelTags({ id: "meta-llama/llama-3.3-70b-instruct" })).toEqual(["Instruct"]);
+  });
+  it("identifies Abliterated separately", () => {
+    expect(getOpenRouterModelTags({ id: "provider/example-abliterated" })).toEqual(["Abliterated"]);
+  });
+  it("does not infer ablation from Uncensored or generic description", () => {
+    expect(getOpenRouterModelTags({ id: "provider/uncensored", description: "Instruction tuned" })).toEqual(["Uncensored"]);
+  });
+  it("keeps multimodal Instruct models accepting text", () => {
+    expect(getOpenRouterModelTags({ id: "qwen/qwen3-vl-8b-instruct", architecture: { output_modalities: ["text"] } })).toEqual(["Instruct"]);
+  });
+});
--- a/src/pages/AdminPrivateOrchestrator.tsx
+++ b/src/pages/AdminPrivateOrchestrator.tsx
@@ -15,0 +16 @@
+import { getOpenRouterModelTags } from "@/config/aiModels";
@@ -103 +104 @@
-  const { list, loading } = useOpenRouterModels();
+  const { list, loading, error } = useOpenRouterModels();
@@ -135,0 +137,11 @@
+          {error && <p className="text-sm text-destructive">Не удалось проверить каталог OpenRouter: {error}</p>}
+          {["Instruct", "Abliterated", "Uncensored"].map((tag) => {
+            const models = list.filter((m) => getOpenRouterModelTags(m).includes(tag));
+            return (
+              <details key={tag}>
+                <summary className="cursor-pointer font-semibold text-sm">OpenRouter · {tag} ({models.length})</summary>
+                {models.map((m) => <Row key={m.id} id={m.id} label={m.name || m.id} note={tag} />)}
+                {!loading && !error && !models.length && <p className="text-sm text-muted-foreground">В текущем каталоге не найдены</p>}
+              </details>
+            );
+          })}
@@ -137 +149 @@
-            <h4 className="font-semibold text-sm mb-1">🌶 Instruct / Abliterated / Uncensored</h4>
+            <h4 className="font-semibold text-sm mb-1">Другие предустановленные модели / Venice</h4>
@@ -145 +157 @@
-            <div className="mt-1">{found.map((m) => <Row key={m.id} id={m.id} label={m.name || m.id} />)}</div>
+            <div className="mt-1">{found.map((m) => <Row key={m.id} id={m.id} label={m.name || m.id} note={getOpenRouterModelTags(m).join(" · ") || undefined} />)}</div>
--- a/src/components/cabinet/ExtendedModelPicker.tsx
+++ b/src/components/cabinet/ExtendedModelPicker.tsx
@@ -3,0 +4,2 @@
+import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
+import { Badge } from "@/components/ui/badge";
@@ -9 +11 @@
-import { formatPricePerMtok } from "@/config/aiModels";
+import { getOpenRouterModelTags, formatPricePerMtok } from "@/config/aiModels";
@@ -24,0 +27 @@
+  const [category, setCategory] = useState("Все");
@@ -39,2 +42,2 @@
-    return base.slice(0, 400);
-  }, [combined, q]);
+    return category === "Все" ? base : base.filter((m) => !m.id.startsWith("venice/") && getOpenRouterModelTags(m).includes(category));
+  }, [combined, q, category]);
@@ -61,0 +65,8 @@
+        <Select value={category} onValueChange={setCategory}>
+          <SelectTrigger aria-label="Категория моделей"><SelectValue /></SelectTrigger>
+          <SelectContent>
+            {["Все", "Instruct", "Abliterated", "Uncensored"].map((tag) => (
+              <SelectItem key={tag} value={tag}>{tag === "Все" ? "Все модели" : `OpenRouter · ${tag} (${list.filter((m) => getOpenRouterModelTags(m).includes(tag)).length})`}</SelectItem>
+            ))}
+          </SelectContent>
+        </Select>
@@ -89,0 +101 @@
+                            {!m.id.startsWith("venice/") && getOpenRouterModelTags(m).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
```

## Проверка после подтверждения
- Запустить тесты классификации и существующие тесты личного советника.
- Проверить, что все новые основные ID есть в полученном каталоге.
- Проверить выбор категории и модели в кабинете через реальный вход. Защитный PIN/фразу не обходить; если советник заблокирован, сообщить, что его список за шлюзом не проверен.
- Ничего не публиковать.
