# Обновление сохранённых текста и фото без повторной публикации

## Точный объём
Рабочий файл: **`src/pages/DiseaseDetailPage.tsx`**. Сохранение в панели, оформление, преобразования галерей, возрастное окно, маршруты, загрузчик, настройки сети и серверы не меняются.

- При каждом открытии статьи читать актуальную опубликованную запись, даже если первоначальная разметка содержит старый текст.
- При возвращении к уже открытой вкладке перечитывать текст и ссылки на фотографии. Не обновлять открытый редактор, чтобы не потерять несохранённый ввод.
- Не запускать периодический опрос, автоматические повторные попытки или параллельные одинаковые запросы. Связанные статьи перечитывать только при открытии, не при возвращении к вкладке.

## Важные ограничения
**Для самого исправления нужна одна отдельно разрешённая выкладка.** После неё сохранённые изменения статей не требуют новой публикации сайта. Вариант обновляет уже открытую вкладку при возвращении к ней, а не непрерывно, пока посетитель её читает. Несохранённые изменения и пустые галереи не публикуются автоматически.

Сейчас в коде есть остановка чтения актуальной записи, если уже получены начальные данные, и повторное использование начального ответа. Это потенциально оставляет старую версию; предыдущая проверка базы сама по себе не установила, что именно этот путь вызвал расхождение у вас.

Это целевое исключение из прежнего запрета на повторное чтение статьи: добавляется чтение при возвращении к вкладке. Маршруты и `diseaseLoader` остаются неизменными. Отдельно замечено: ранний запрос в `index.html` сейчас использует api3 на всех доменах, вопреки записанному правилу api2 для рабочего сайта; **это распределение не меняю**.

## Проверка после подтверждения
Проверить под администратором на отдельной тестовой статье сохранение текста и фото, чтение в другом окне и возврат к ранее открытой вкладке. Убедиться, что несохранённый ввод не пропадает. Существующую медицинскую статью не менять. Проверка на tarusin.pro возможна после отдельного разрешения однократной выкладки.

## Полный предлагаемый diff
```diff
--- a/src/pages/DiseaseDetailPage.tsx
+++ b/src/pages/DiseaseDetailPage.tsx
@@ -84,72 +84,62 @@
     }
   }, [slug]);
 
-  // Ранний результат из inline-скрипта в index.html: запрос стартует до загрузки
-  // бандла, поэтому свежая версия статьи (в т.ч. новые галереи) появляется сразу,
-  // не дожидаясь инициализации клиента и маршрутизатора бэкенда.
+  // Первоначальная разметка — первый кадр, сохранённая статья — источник
+  // актуального текста и галерей. Несохранённый ввод редактора не обновляем.
   useEffect(() => {
-    if (typeof window === "undefined" || !slug) return;
-    const early = (window as any).__earlyArticle as
-      | { slug: string; promise: Promise<any> }
-      | undefined;
-    if (!early || early.slug !== slug) return;
+    if (typeof window === "undefined" || !slug || editing) return;
     let cancelled = false;
-    early.promise
-      .then((art) => {
-        if (!cancelled && art) setArticle(art);
-      })
-      .catch(() => {});
+    let refreshing = false;
+
+    const loadData = async (withRelated = false) => {
+      if (refreshing) return;
+      refreshing = true;
+      try {
+        const { data: art, error } = await supabase
+          .from("disease_articles")
+          .select("*")
+          .eq("slug", slug)
+          .eq("is_published", true)
+          .maybeSingle();
+
+        if (cancelled) return;
+        if (error) return;
+        if (!art) {
+          setNotFound(true);
+          return;
+        }
+        setNotFound(false);
+        setArticle(art);
+
+        if (!withRelated) return;
+        const { data: rel } = await supabase
+          .from("disease_articles")
+          .select("id,slug,title,description,category")
+          .eq("category", (art as any).category)
+          .eq("is_published", true)
+          .neq("id", (art as any).id)
+          .limit(3);
+        if (cancelled) return;
+        setRelated((rel as any[]) || []);
+      } finally {
+        refreshing = false;
+      }
+    };
+
+    void loadData(true);
+    const onFocus = () => { void loadData(); };
+    const onVisibilityChange = () => {
+      if (document.visibilityState === "visible") void loadData();
+    };
+    window.addEventListener("focus", onFocus);
+    document.addEventListener("visibilitychange", onVisibilityChange);
+
     return () => {
       cancelled = true;
+      window.removeEventListener("focus", onFocus);
+      document.removeEventListener("visibilitychange", onVisibilityChange);
     };
-  }, [slug]);
-
-  useEffect(() => {
-    if (typeof window === "undefined" || !slug) return;
-    const early = (window as any).__earlyArticle as
-      | { slug?: string; promise?: Promise<any> }
-      | undefined;
-    if (loaderData?.article) return;
-
-    let cancelled = false;
-
-    (async () => {
-      // Если ранний запрос уже нашёл статью — повторно не грузим;
-      // если нет (ошибка/пусто) — обычная загрузка или «не найдено».
-      if (early?.slug === slug && early.promise) {
-        const earlyArt = await early.promise.catch(() => null);
-        if (cancelled || earlyArt) return;
-      }
-      const { data: art, error } = await supabase
-        .from("disease_articles")
-        .select("*")
-        .eq("slug", slug)
-        .eq("is_published", true)
-        .maybeSingle();
-
-      if (cancelled) return;
-      if (error || !art) {
-        if (!article) setNotFound(true);
-        return;
-      }
-      setArticle(art);
-
-      const { data: rel } = await supabase
-        .from("disease_articles")
-        .select("id,slug,title,description,category")
-        .eq("category", (art as any).category)
-        .eq("is_published", true)
-        .neq("id", (art as any).id)
-        .limit(3);
-      if (cancelled) return;
-      setRelated((rel as any[]) || []);
-    })();
-
-    return () => {
-      cancelled = true;
-    };
-    // eslint-disable-next-line react-hooks/exhaustive-deps
-  }, [slug]);
+  }, [slug, editing]);
 
   if (notFound) {
     return (
```
