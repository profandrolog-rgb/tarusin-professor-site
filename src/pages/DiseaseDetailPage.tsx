import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import AgeConfirmationModal from "@/components/AgeConfirmationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// NOTE: we intentionally do NOT use useLoaderData here.
// vite-react-ssg executes the loader at build time to pre-render HTML,
// but the loader result is not reliably re-hydrated on the client,
// which caused "Cannot destructure property 'article' of undefined".
// Instead the page fetches data on the client; the SSG HTML still
// contains the fully rendered article for SEO / first paint.

// Try to read loader data if vite-react-ssg ever provides it via window.
let useLoaderDataSafe: () => any = () => undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rr = require("react-router-dom");
  if (rr.useLoaderData) useLoaderDataSafe = () => {
    try { return rr.useLoaderData(); } catch { return undefined; }
  };
} catch {
  /* noop */
}

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

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

interface Article {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  article_content: string | null;
  category: string;
}

const DiseaseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data: art, error } = await supabase
        .from("disease_articles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (cancelled) return;
      if (error || !art) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setArticle(art as any);

      const { data: rel } = await supabase
        .from("disease_articles")
        .select("id,slug,title,description,category")
        .eq("category", (art as any).category)
        .eq("is_published", true)
        .neq("id", (art as any).id)
        .limit(3);
      if (cancelled) return;
      setRelated((rel as any[]) || []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <PageMeta
          title="Материал не найден | проф. Тарусин Д.И."
          description="Запрошенная страница о заболевании не найдена."
          path={`/for-parents/${slug ?? ""}`}
        />
        <h1 className="text-2xl font-bold text-foreground mb-3">Материал не найден</h1>
        <p className="text-muted-foreground mb-6">
          Возможно, страница была удалена или ещё не опубликована.
        </p>
        <Button onClick={() => navigate("/for-parents")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> К каталогу болезней
        </Button>
      </div>
    );
  }

  if (loading || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  const rawDesc =
    article.description ||
    (article.article_content ? stripHtml(article.article_content) : article.title);
  const metaDesc = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc;

  return (
    <AgeConfirmationModal>
      <div
        className="min-h-screen bg-background select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <PageMeta
          title={`${article.title} | проф. Тарусин Д.И.`}
          description={metaDesc}
          path={`/for-parents/${article.slug}`}
          type="article"
        />

        <header className="bg-primary text-primary-foreground py-10 md:py-16">
          <div className="container mx-auto px-4">
            <nav className="flex items-center flex-wrap gap-1 text-sm text-primary-foreground/80 mb-6">
              <Link to="/" className="hover:text-primary-foreground transition-colors">Главная</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/for-parents" className="hover:text-primary-foreground transition-colors">Для родителей</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-primary-foreground">{article.title}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{article.title}</h1>
            {article.description && (
              <p className="text-lg text-primary-foreground/80 max-w-3xl">{article.description}</p>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
          {article.article_content ? (
            <div
              className="prose prose-base max-w-none text-foreground [&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_th]:bg-muted [&_th]:p-2 [&_th]:border [&_th]:border-border [&_td]:p-2 [&_td]:border [&_td]:border-border"
              dangerouslySetInnerHTML={{ __html: article.article_content }}
              onCopy={(e) => e.preventDefault()}
            />
          ) : (
            <p className="text-muted-foreground">Полный текст статьи скоро появится.</p>
          )}

          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">Смотрите также</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} to={`/for-parents/${r.slug}`} className="block group">
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="text-xs font-medium text-primary mb-2 uppercase tracking-wide">
                          {categoryLabels[r.category] || r.category}
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {r.title}
                        </h3>
                        {r.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 pt-8 border-t">
            <Link
              to="/for-parents"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Назад к каталогу болезней
            </Link>
          </div>
        </main>
      </div>
    </AgeConfirmationModal>
  );
};

export default DiseaseDetailPage;
