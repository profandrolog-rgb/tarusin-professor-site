# Почему правки не видны на tarusin.pro

Проверил базу. Ваши сегодняшние правки (до 08:07 UTC) **сохранились только в черновике редактора**, а в саму статью не попали — последнее сохранение статьи было вчера в 19:18 UTC. Редактор страницы сохраняет статью только по кнопке «Сохранить изменения», автоматически он пишет лишь черновик. Фото загружены в хранилище, но сама статья на них не ссылается.

## Шаг 1. Перенести ваши сегодняшние правки из черновика в статью «Фимоз у мальчиков» (одна запись)

Разница между черновиком и статьёй — только ваши правки, остальной текст совпадает:

```diff
- [[GALLERY: caption="Механизм формирования фимоза: рубцовые изменения после воспаления крайней плоти"]]
+ [[GALLERY: caption="Механизм и причины формирования фимоза"|gallery-default-5e2957d0.png "Следите за этими факторами, чтобы избежать рубцевания"]]

  Основное проявление фимоза — **невозможность отвести крайнюю плоть и полностью открыть головку**. Здесь принципиально важно отличать физиологическое сужение от патологического, рубцового.
+ Кроме того, важно понимать, что неоткрытие это только симптом, характеризующий болезнь, но ничего не говорящий
+
+ ## Клиническая галерея: различные формы фимоза.
+
+ [[GALLERY: caption="Различные клинические формы фимоза"|gallery-urology-c70802e8.jpg "рубец дистальный (1)"]]
```

(Абзац «…ничего не говорящий» в черновике обрывается — переношу как есть.)

## Шаг 2. Автосохранение статьи в редакторе страницы

Файл: `src/components/parents/InlineArticlePageEditor.tsx` (только он).

- Через 2 секунды после последней правки текст, заголовок, описание и галереи сохраняются прямо в статью — без кнопки.
- Рядом с кнопкой видно состояние: «Сохраняю…», «Сохранено автоматически», «Ошибка автосохранения».
- При закрытии редактора несохранённое сохраняется перед закрытием; кнопка «Закрыть без сохранения» станет «Закрыть».
- Кнопка «Сохранить изменения» остаётся.

```diff
-import { useRef, useState } from "react";
+import { useEffect, useRef, useState } from "react";
@@
   const [saving, setSaving] = useState(false);
+  const lastSaved = useRef({
+    title: (article.title || "").trim(),
+    description: (article.description || "").trim(),
+    content: article.article_content || "",
+  });
+  const [autoState, setAutoState] = useState<"idle" | "saving" | "saved" | "error">("idle");
+
+  const isDirty = () =>
+    title.trim() !== lastSaved.current.title ||
+    description.trim() !== lastSaved.current.description ||
+    content !== lastSaved.current.content;
+
+  const autoSave = async () => {
+    const t = title.trim();
+    const d = description.trim();
+    if (!t || !isDirty()) return true;
+    setAutoState("saving");
+    const { data, error } = await supabase
+      .from("disease_articles")
+      .update({ title: t, description: d || null, article_content: content })
+      .eq("id", article.id)
+      .select("id");
+    if (error || !data?.length) { setAutoState("error"); return false; }
+    lastSaved.current = { title: t, description: d, content };
+    onSaved({ title: t, description: d || null, article_content: content });
+    setAutoState("saved");
+    return true;
+  };
+
+  useEffect(() => {
+    if (!isDirty()) return;
+    const timer = window.setTimeout(() => { void autoSave(); }, 2000);
+    return () => window.clearTimeout(timer);
+  }, [title, description, content]);
+
+  const handleClose = async () => {
+    await autoSave();
+    onClose();
+  };
@@ handleSave: после успешного сохранения
+      lastSaved.current = { title: title.trim(), description: description.trim(), content: nextContent };
+      setAutoState("saved");
@@ верхняя панель
+          <span className="text-xs text-muted-foreground">
+            {autoState === "saving" ? "Сохраняю…" : autoState === "saved" ? "Сохранено автоматически" : autoState === "error" ? "Ошибка автосохранения" : ""}
+          </span>
-          <Button size="sm" variant="outline" onClick={onClose} ...>
+          <Button size="sm" variant="outline" onClick={handleClose} ...>
@@ нижняя панель
-        <Button variant="outline" onClick={onClose} ...>
-          <X /> Закрыть без сохранения
+        <Button variant="outline" onClick={handleClose} ...>
+          <X /> Закрыть
```

Сайт после сохранения уже перечитывает статью (вчерашняя правка), поэтому изменения будут видны читателям при открытии страницы. Чтобы автосохранение появилось на tarusin.pro, нужна одна выкладка — только по вашей команде.
