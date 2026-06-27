import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, FileText, Search, CheckSquare, Square, Headphones, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type SourceKind = "blog_posts" | "disease_articles" | "research_articles" | "clinical_cases";

interface Item {
  id: string;
  kind: SourceKind;
  title: string;
  excerpt?: string;
  updated_at: string;
  is_published: boolean;
  category?: string | null;
  textBuilder: () => string;
}

const KIND_LABEL: Record<SourceKind, string> = {
  blog_posts: "Размышлизмы (блог)",
  disease_articles: "Материалы о заболеваниях",
  research_articles: "Наши исследования",
  clinical_cases: "Клинические случаи",
};

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  // sensible newlines
  tmp.querySelectorAll("p,div,br,li,h1,h2,h3,h4,h5,h6,tr").forEach((el) => {
    el.insertAdjacentText("afterend", "\n");
  });
  return (tmp.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "untitled";
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const AdminPodcastSources = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<SourceKind | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [onlyPublished, setOnlyPublished] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/podcast-sources" } });
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      setLoading(true);
      try {
        const [blog, disease, research, cases] = await Promise.all([
          supabase.from("blog_posts").select("id,title,content,excerpt,is_published,updated_at").order("updated_at", { ascending: false }),
          supabase.from("disease_articles").select("id,title,article_content,description,category,age_group,is_published,updated_at").order("updated_at", { ascending: false }),
          supabase.from("research_articles").select("id,title,content,excerpt,category,is_published,updated_at").order("updated_at", { ascending: false }),
          supabase.from("clinical_cases").select("id,title,category,history,conclusions,recommendations,is_published,updated_at").order("updated_at", { ascending: false }),
        ]);

        const all: Item[] = [];
        for (const r of blog.data ?? []) {
          all.push({
            id: `blog_posts:${r.id}`,
            kind: "blog_posts",
            title: r.title,
            excerpt: r.excerpt ?? stripHtml(r.content).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            textBuilder: () => `${r.title}\n\n${stripHtml(r.content)}`,
          });
        }
        for (const r of disease.data ?? []) {
          all.push({
            id: `disease_articles:${r.id}`,
            kind: "disease_articles",
            title: r.title,
            excerpt: r.description ?? stripHtml(r.article_content).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            category: [r.category, r.age_group].filter(Boolean).join(" · "),
            textBuilder: () => `${r.title}\n${r.description ?? ""}\n\n${stripHtml(r.article_content)}`,
          });
        }
        for (const r of research.data ?? []) {
          all.push({
            id: `research_articles:${r.id}`,
            kind: "research_articles",
            title: r.title,
            excerpt: r.excerpt ?? stripHtml(r.content).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            category: r.category ?? undefined,
            textBuilder: () => `${r.title}\n\n${stripHtml(r.content)}`,
          });
        }
        for (const r of cases.data ?? []) {
          const body = `Анамнез:\n${stripHtml(r.history)}\n\nЗаключение:\n${stripHtml(r.conclusions)}\n\nРекомендации:\n${stripHtml(r.recommendations)}`;
          all.push({
            id: `clinical_cases:${r.id}`,
            kind: "clinical_cases",
            title: r.title,
            excerpt: stripHtml(r.history).slice(0, 220),
            updated_at: r.updated_at,
            is_published: !!r.is_published,
            category: r.category ?? undefined,
            textBuilder: () => `${r.title}\n${r.category ? "Категория: " + r.category + "\n" : ""}\n${body}`,
          });
        }
        setItems(all);
      } catch (e: any) {
        toast.error("Не удалось загрузить материалы: " + (e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (tab !== "all" && it.kind !== tab) return false;
      if (onlyPublished && !it.is_published) return false;
      if (!q) return true;
      return it.title.toLowerCase().includes(q) || (it.excerpt ?? "").toLowerCase().includes(q);
    });
  }, [items, tab, query, onlyPublished]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAllVisible = () => {
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) filtered.forEach((i) => n.delete(i.id));
      else filtered.forEach((i) => n.add(i.id));
      return n;
    });
  };

  const downloadOne = (it: Item) => {
    const txt = it.textBuilder();
    downloadText(`${sanitizeFilename(it.title)}.txt`, txt);
  };

  const downloadSelected = (mode: "separate" | "combined") => {
    const list = items.filter((i) => selected.has(i.id));
    if (!list.length) {
      toast.error("Не выбрано ни одного материала");
      return;
    }
    if (mode === "separate") {
      list.forEach((it, idx) => setTimeout(() => downloadOne(it), idx * 150));
      toast.success(`Скачиваю ${list.length} файл(ов)`);
    } else {
      const big = list
        .map((it) => `===== ${it.title} [${KIND_LABEL[it.kind]}] =====\n\n${it.textBuilder()}`)
        .join("\n\n\n");
      downloadText(`podcast-sources-${new Date().toISOString().slice(0, 10)}.txt`, big);
      toast.success(`Объединено ${list.length} материалов в один файл`);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          В админ-панель
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Headphones className="w-7 h-7 text-fuchsia-500" />
            Исходники для подкастов
          </h1>
          <p className="text-muted-foreground">
            Скачивайте текстовые материалы (блог, статьи о заболеваниях, исследования, клинические случаи) для загрузки в NotebookLM или другие генераторы подкастов.
          </p>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Фильтры и выбор</CardTitle>
            <CardDescription>
              Выберите несколько материалов и скачайте их как отдельные .txt файлы или одним общим документом.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по названию или фрагменту…"
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => setOnlyPublished((v) => !v)}>
                {onlyPublished ? "Только опубликованные" : "Все (в т.ч. черновики)"}
              </Button>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="blog_posts">Блог</TabsTrigger>
                <TabsTrigger value="disease_articles">Заболевания</TabsTrigger>
                <TabsTrigger value="research_articles">Исследования</TabsTrigger>
                <TabsTrigger value="clinical_cases">Случаи</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={toggleAllVisible}>
                {allVisibleSelected ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
                {allVisibleSelected ? "Снять все" : "Выбрать все видимые"}
              </Button>
              <Badge variant="secondary">Выбрано: {selected.size}</Badge>
              <div className="flex-1" />
              <Button size="sm" variant="outline" disabled={!selected.size} onClick={() => downloadSelected("separate")}>
                <Download className="w-4 h-4 mr-1" /> Скачать отдельными
              </Button>
              <Button size="sm" disabled={!selected.size} onClick={() => downloadSelected("combined")}>
                <Download className="w-4 h-4 mr-1" /> Один файл
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Ничего не найдено</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => {
              const isSel = selected.has(it.id);
              return (
                <Card key={it.id} className={isSel ? "border-primary/60" : ""}>
                  <CardContent className="p-3 sm:p-4 flex gap-3 items-start">
                    <button
                      onClick={() => toggle(it.id)}
                      className="mt-1 shrink-0"
                      aria-label={isSel ? "Убрать из подборки" : "Добавить в подборку"}
                    >
                      {isSel ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5 hidden sm:block" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold truncate">{it.title}</h3>
                        <Badge variant="outline" className="text-xs">{KIND_LABEL[it.kind]}</Badge>
                        {it.category && <Badge variant="secondary" className="text-xs">{it.category}</Badge>}
                        {!it.is_published && <Badge variant="destructive" className="text-xs">черновик</Badge>}
                      </div>
                      {it.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{it.excerpt}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Обновлено: {new Date(it.updated_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => downloadOne(it)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-6 bg-muted/30">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <ExternalLink className="w-4 h-4" /> Как сделать подкаст в NotebookLM
            </p>
            <p>1. Скачайте выбранные материалы одним файлом или по отдельности.</p>
            <p>2. Откройте <a href="https://notebooklm.google.com" target="_blank" rel="noreferrer" className="underline">notebooklm.google.com</a>, создайте новый блокнот и загрузите .txt файлы как источники.</p>
            <p>3. В разделе Studio нажмите «Audio Overview» — NotebookLM сгенерирует диалоговый подкаст по этим материалам.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPodcastSources;
