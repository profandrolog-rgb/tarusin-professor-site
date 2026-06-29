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

  const location = useLocation();
  const incoming = (location.state || null) as { title?: string; text?: string; source?: string } | null;

  // Auto-prefill when arriving from the Orchestrator with a finished article
  useEffect(() => {
    if (!incoming?.text) return;
    const plain = incoming.text;
    const html = plain
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
      .join("");
    setContent(html);
    if (incoming.title) {
      setTitle(incoming.title);
      setSlug(slugifyRu(incoming.title));
    }
    setFilename(incoming.source === "orchestrator" ? "Из оркестратора" : "");
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
