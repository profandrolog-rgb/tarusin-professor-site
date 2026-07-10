import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { markdownToHtml } from "@/lib/markdown/galleryMarkers";
import { Upload, Loader2, Eye, EyeOff, Save, Sparkles, X, ArrowLeft, Wand2, CheckCircle2 } from "lucide-react";

const categoryLabels: Record<string, string> = {
  general: "Общее",
  urology: "Урология",
  andrology: "Андрология",
  surgery: "Хирургия",
  endocrinology: "Эндокринология",
  psychology: "Психология",
  sexology: "Сексология",
  genetics: "Генетика",
};

function slugifyRu(s: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",
    к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
    х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return s
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const PUBLISHER_DRAFT_KEY = "publisher:draft:v1";
const PUBLISHER_DRAFT_TTL_MS = 30 * 24 * 3600 * 1000; // 30 дней

const AdminArticleImport = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [category, setCategory] = useState("general");
  const [ageGroup, setAgeGroup] = useState<"children" | "adults">("children");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [filename, setFilename] = useState("");
  const [aiReview, setAiReview] = useState<any>(null);
  const draftHydratingRef = useRef(true);
  const draftLoadedRef = useRef(false);

  const location = useLocation();
  const incoming = (location.state || null) as {
    title?: string;
    text?: string;
    source?: string;
    existingRef?: { id: string; kind: "disease_articles" | "blog_posts" | "research_articles" } | null;
    seoMeta?: {
      title?: string;
      slug?: string;
      excerpt?: string;
      keywords?: string[];
      category?: string;
      age_group?: "children" | "adults";
    };
  } | null;
  const existingRef = incoming?.existingRef ?? null;

  // Восстановление черновика из localStorage. Триггеры сброса ТОЛЬКО:
  // (1) кнопка «Сбросить черновик», (2) успешное сохранение/публикация.
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    // Если пришли из оркестратора с явным text — приоритет за ним, черновик пропускаем.
    if (incoming?.text) { draftHydratingRef.current = false; return; }
    try {
      const raw = localStorage.getItem(PUBLISHER_DRAFT_KEY);
      if (!raw) { draftHydratingRef.current = false; return; }
      const d = JSON.parse(raw);
      if (!d?.savedAt || Date.now() - d.savedAt > PUBLISHER_DRAFT_TTL_MS) {
        draftHydratingRef.current = false; return;
      }
      if (typeof d.title === "string") setTitle(d.title);
      if (typeof d.slug === "string") setSlug(d.slug);
      if (typeof d.excerpt === "string") setExcerpt(d.excerpt);
      if (Array.isArray(d.keywords)) setKeywords(d.keywords);
      if (typeof d.category === "string") setCategory(d.category);
      if (d.ageGroup === "children" || d.ageGroup === "adults") setAgeGroup(d.ageGroup);
      if (typeof d.content === "string") setContent(d.content);
      if (typeof d.isPublished === "boolean") setIsPublished(d.isPublished);
      if (typeof d.filename === "string") setFilename(d.filename);
      const when = new Date(d.savedAt);
      toast({ title: "Черновик публикатора восстановлен", description: `Автосохранение от ${when.toLocaleString("ru-RU")}` });
    } catch (e) {
      console.warn("[publisher] draft restore failed", e);
    } finally {
      setTimeout(() => { draftHydratingRef.current = false; }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced автосохранение — переживает уход со страницы, F5, случайное закрытие.
  useEffect(() => {
    if (draftHydratingRef.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PUBLISHER_DRAFT_KEY, JSON.stringify({
          savedAt: Date.now(),
          title, slug, excerpt, keywords, category, ageGroup, content, isPublished, filename,
        }));
      } catch (e) { console.warn("[publisher] draft save failed", e); }
    }, 600);
    return () => clearTimeout(t);
  }, [title, slug, excerpt, keywords, category, ageGroup, content, isPublished, filename]);

  function resetPublisherDraft() {
    if (!confirm("Сбросить черновик публикатора? Все поля очистятся.")) return;
    try { localStorage.removeItem(PUBLISHER_DRAFT_KEY); } catch {}
    setTitle(""); setSlug(""); setExcerpt(""); setKeywords([]); setKeywordInput("");
    setCategory("general"); setAgeGroup("children"); setContent(""); setIsPublished(false);
    setFilename(""); setAiReview(null);
    toast({ title: "Черновик сброшен" });
  }


  // Auto-prefill when arriving from the Orchestrator with a finished article
  useEffect(() => {
    if (!incoming?.text) return;
    const plain = incoming.text;
    setContent(markdownToHtml(plain));
    if (incoming.title) {
      const cleaned = incoming.title
        .replace(/\.(docx?|txt|md|rtf)$/i, "")
        .replace(/[_\-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      setTitle(cleaned);
      setSlug(slugifyRu(cleaned));
    }
    setFilename(incoming.source === "orchestrator" ? "Из оркестратора" : "");

    // Если SEO-мета уже подготовлена в оркестраторе — применяем её и НЕ вызываем import-article-meta.
    if (incoming.seoMeta) {
      const m = incoming.seoMeta;
      if (m.title) { setTitle(m.title); setSlug(slugifyRu(m.title)); }
      if (m.slug) setSlug(m.slug);
      if (m.excerpt) setExcerpt(m.excerpt);
      if (Array.isArray(m.keywords)) setKeywords(m.keywords);
      if (m.category && categoryLabels[m.category]) setCategory(m.category);
      if (m.age_group === "adults" || m.age_group === "children") setAgeGroup(m.age_group);
      toast({ title: "SEO-поля перенесены из оркестратора" });
      return;
    }

    setSeoLoading(true);
    toast({ title: "Анализирую статью…", description: "ИИ заполняет SEO-поля" });
    supabase.functions
      .invoke("import-article-meta", { body: { text: plain, filename: incoming.title || "article" } })
      .then(({ data, error }) => {
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (data.title && !incoming.title) setTitle(data.title);
        if (data.slug) setSlug(data.slug);
        if (data.excerpt) setExcerpt(data.excerpt);
        if (Array.isArray(data.keywords)) setKeywords(data.keywords);
        if (data.category && categoryLabels[data.category]) setCategory(data.category);
        if (data.age_group === "adults" || data.age_group === "children") setAgeGroup(data.age_group);
        toast({ title: "Готово", description: "Осталось только Форматировать и Сохранить" });
      })
      .catch((err) => toast({ title: "SEO не получен", description: err.message, variant: "destructive" }))
      .finally(() => setSeoLoading(false));
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  if (authLoading) return <div className="p-8 text-center">Загрузка…</div>;
  if (!isAdmin) {
    return <div className="p-8 text-center text-destructive">Доступ только для администраторов</div>;
  }

  const handleAutoLoad = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const [{ value: html }, { value: rawText }] = await Promise.all([
        mammoth.convertToHtml({ arrayBuffer: buf }),
        mammoth.extractRawText({ arrayBuffer: buf }),
      ]);

      setContent(html);

      // Quick local fallback for title/slug from filename
      const baseName = file.name.replace(/\.[^.]+$/, "");
      if (!title) {
        setTitle(baseName);
        setSlug(slugifyRu(baseName));
      }

      // Background SEO analysis
      setSeoLoading(true);
      toast({ title: "Анализирую статью…", description: "ИИ извлекает заголовок, slug и ключевые слова" });

      supabase.functions
        .invoke("import-article-meta", {
          body: { text: rawText, filename: file.name },
        })
        .then(({ data, error }) => {
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          if (data.title) setTitle(data.title);
          if (data.slug) setSlug(data.slug);
          else if (data.title) setSlug(slugifyRu(data.title));
          if (data.excerpt) setExcerpt(data.excerpt);
          if (Array.isArray(data.keywords)) setKeywords(data.keywords);
          if (data.category && categoryLabels[data.category]) setCategory(data.category);
          if (data.age_group === "adults" || data.age_group === "children") setAgeGroup(data.age_group);
          toast({ title: "Готово", description: "SEO-данные заполнены ИИ" });
        })
        .catch((err) => {
          toast({ title: "SEO не получен", description: err.message, variant: "destructive" });
        })
        .finally(() => setSeoLoading(false));
    } catch (err: any) {
      toast({ title: "Ошибка чтения Word", description: err.message, variant: "destructive" });
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const runAiAnalysis = async () => {
    // Strip HTML to plain text for the model
    const tmp = document.createElement("div");
    tmp.innerHTML = content;
    const plain = (tmp.textContent || tmp.innerText || "").trim();
    if (plain.length < 50) {
      toast({ title: "Слишком мало текста", description: "Загрузите Word или вставьте содержимое в редактор", variant: "destructive" });
      return;
    }
    setSeoLoading(true);
    setAiReview(null);
    toast({ title: "ИИ-анализ запущен…", description: "Подбираю заголовок, slug, ключевые слова, аннотацию" });
    try {
      const { data, error } = await supabase.functions.invoke("import-article-meta", {
        body: { text: plain, filename: filename || title || "article" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.title) setTitle(data.title);
      if (data.slug) setSlug(data.slug);
      else if (data.title) setSlug(slugifyRu(data.title));
      if (data.excerpt) setExcerpt(data.excerpt);
      if (Array.isArray(data.keywords)) setKeywords(data.keywords);
      if (data.category && categoryLabels[data.category]) setCategory(data.category);
      if (data.age_group === "adults" || data.age_group === "children") setAgeGroup(data.age_group);
      setAiReview({ ...data, _words: plain.split(/\s+/).filter(Boolean).length });
      toast({ title: "Готово", description: "ИИ заполнил SEO-поля — проверьте ревью ниже" });
    } catch (err: any) {
      toast({ title: "Ошибка ИИ-анализа", description: err.message, variant: "destructive" });
    } finally {
      setSeoLoading(false);
    }
  };

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k)) setKeywords([...keywords, k]);
    setKeywordInput("");
  };

  const removeKeyword = (k: string) => setKeywords(keywords.filter((x) => x !== k));

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({ title: "Заполните заголовок и slug", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (existingRef) {
        const contentField = existingRef.kind === "disease_articles" ? "article_content" : "content";
        const payload: any = {
          title: title.trim(),
          slug: slug.trim(),
          [contentField]: content,
          is_published: isPublished,
        };
        if (existingRef.kind === "disease_articles") {
          payload.description = excerpt.trim() || null;
          payload.keywords = keywords.length ? keywords : null;
          payload.category = category;
          payload.age_group = ageGroup;
        } else {
          payload.excerpt = excerpt.trim() || null;
        }
        const { error } = await supabase.from(existingRef.kind).update(payload).eq("id", existingRef.id);
        if (error) throw error;
        toast({ title: "Статья обновлена", description: "Изменения сохранены" });
        const back =
          existingRef.kind === "disease_articles" ? "/admin/disease-articles" :
          existingRef.kind === "blog_posts" ? "/admin" : "/admin";
        navigate(back);
      } else {
        const { error } = await supabase.from("disease_articles").insert({
          title: title.trim(),
          slug: slug.trim(),
          description: excerpt.trim() || null,
          keywords: keywords.length ? keywords : null,
          category,
          age_group: ageGroup,
          article_content: content,
          is_published: isPublished,
        } as any);
        if (error) throw error;
        toast({ title: "Статья сохранена", description: isPublished ? "Опубликована" : "В черновиках" });
        navigate("/admin/disease-articles");
      }
    } catch (err: any) {
      toast({ title: "Ошибка сохранения", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> В админку
        </Button>
        <h1 className="text-2xl font-bold">📥 Импорт статьи</h1>
        <div className="w-24" />
      </div>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 text-sm">
          <div className="font-semibold mb-1">Это финальная форма сохранения.</div>
          <div className="text-muted-foreground">
            Для ИИ-ревью статьи несколькими моделями, выбора правок галочками и переписывания
            с сохранением вашего голоса — начните с <b>Оркестратора статей</b>. Оттуда по кнопке
            «Разместить» текст и SEO-поля придут сюда автоматически.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/admin/article-orchestrator")} className="shrink-0">
          Открыть оркестратор
        </Button>
      </div>

      <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Загрузите готовый Word-документ — я извлеку текст, подберу заголовок, slug, ключевые слова и аннотацию.
        </p>
        <Button size="lg" onClick={handleAutoLoad} disabled={parsing || seoLoading} className="gap-2">
          {parsing || seoLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Автоподгрузка из Word
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={handleFile}
        />
        {filename && (
          <p className="text-xs text-muted-foreground">Файл: {filename}</p>
        )}
        {seoLoading && (
          <p className="text-xs text-primary animate-pulse">
            <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
            ИИ анализирует SEO в фоне…
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="text-sm">
          <div className="font-medium flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" /> Ручной ИИ-анализ статьи
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Запустите, если правили текст в редакторе — ИИ перечитает и обновит заголовок, slug, ключевые слова, аннотацию и категорию.
          </div>
        </div>
        <Button onClick={runAiAnalysis} disabled={seoLoading || !content} className="gap-2">
          {seoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Запустить ИИ-анализ
        </Button>
      </div>

      {aiReview && (
        <div className="rounded-lg border-2 border-green-500/40 bg-green-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" /> Ревью ИИ
          </div>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div><span className="text-muted-foreground">Заголовок:</span> {aiReview.title || "—"}</div>
            <div><span className="text-muted-foreground">Slug:</span> <code className="text-xs">{aiReview.slug || "—"}</code></div>
            <div><span className="text-muted-foreground">Категория:</span> {categoryLabels[aiReview.category] || aiReview.category || "—"}</div>
            <div><span className="text-muted-foreground">Возраст:</span> {aiReview.age_group === "adults" ? "Взрослые" : "Дети"}</div>
            <div className="md:col-span-2"><span className="text-muted-foreground">Аннотация:</span> {aiReview.excerpt || "—"}</div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Ключевые слова:</span>{" "}
              {Array.isArray(aiReview.keywords) && aiReview.keywords.length
                ? aiReview.keywords.join(", ")
                : "—"}
            </div>
            <div className="md:col-span-2 text-xs text-muted-foreground">
              Объём текста: {aiReview._words} слов. Все поля уже подставлены в форму — можете править вручную.
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Заголовок *</Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) setSlug(slugifyRu(e.target.value));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Slug (URL) *</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Категория</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Возрастная группа</Label>
          <Select value={ageGroup} onValueChange={(v: any) => setAgeGroup(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="children">Дети</SelectItem>
              <SelectItem value="adults">Взрослые</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Краткая аннотация</Label>
          <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Ключевые слова</Label>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="Добавить и нажать Enter"
            />
            <Button type="button" variant="outline" onClick={addKeyword}>+</Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {keywords.map((k) => (
              <Badge key={k} variant="secondary" className="gap-1">
                {k}
                <button type="button" onClick={() => removeKeyword(k)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Содержимое статьи (форматирование доступно в редакторе)</Label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-lg border bg-background/95 backdrop-blur p-3 shadow-lg">
        <Button
          type="button"
          variant={isPublished ? "default" : "outline"}
          onClick={() => setIsPublished(!isPublished)}
          className="gap-2"
          title="Видимость на сайте"
        >
          {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {isPublished ? "Опубликовано" : "Скрыто"}
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default AdminArticleImport;
