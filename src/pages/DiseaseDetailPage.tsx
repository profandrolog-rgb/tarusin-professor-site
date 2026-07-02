import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLoaderData, useLocation } from "react-router-dom";
import { ChevronRight, ArrowLeft, Languages } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import AgeConfirmationModal from "@/components/AgeConfirmationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import type { DiseaseLoaderData } from "@/loaders/diseaseLoader";
import { useAuth } from "@/hooks/useAuth";
import MarkdownArticle from "@/components/parents/MarkdownArticle";
import HtmlArticle from "@/components/parents/HtmlArticle";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { getLangFromPath } from "@/lib/i18nUrls";


const isMarkdownContent = (s: string) => {
  const trimmed = s.trim();
  // HTML может содержать [[GALLERY]], но всё равно должен идти через HTML-рендерер.
  return !/^<[a-zA-Z!]/.test(trimmed);
};

// vite-react-ssg вызывает loader при сборке, чтобы пре-рендерить HTML (SEO).
// На клиенте loader-данные не всегда восстанавливаются из HTML, поэтому
// мы используем их как initial state (на сервере и при гидратации),
// а на клиенте дополнительно делаем fetch через supabase-клиент.

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

function useLoaderDataSafe(): DiseaseLoaderData | undefined {
  try {
    return useLoaderData() as DiseaseLoaderData | undefined;
  } catch {
    return undefined;
  }
}

const DiseaseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const loaderData = useLoaderDataSafe();

  const { isAdmin } = useAuth();
  const isEn = getLangFromPath(location.pathname) === "en";

  const [article, setArticle] = useState<any>(loaderData?.article ?? null);
  const [related, setRelated] = useState<any[]>(loaderData?.related ?? []);
  const [notFound, setNotFound] = useState(false);

  const { translation, loading: trLoading } = useContentTranslation(
    "disease_article",
    article?.id,
    isEn,
  );
  const enMissing = isEn && !trLoading && !translation && !!article;

  // English view uses translation fields when present; falls back to RU title only when missing.
  const displayTitle = isEn && translation?.title ? translation.title : article?.title;
  const displayDescription =
    isEn && translation?.description ? translation.description : article?.description;
  const displayContent =
    isEn && translation?.content ? translation.content : article?.article_content;


  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;
    let cancelled = false;

    (async () => {
      const { data: art, error } = await supabase
        .from("disease_articles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (cancelled) return;
      if (error || !art) {
        if (!article) setNotFound(true);
        return;
      }
      setArticle(art);

      const { data: rel } = await supabase
        .from("disease_articles")
        .select("id,slug,title,description,category")
        .eq("category", (art as any).category)
        .eq("is_published", true)
        .neq("id", (art as any).id)
        .limit(3);
      if (cancelled) return;
      setRelated((rel as any[]) || []);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
            <div className="h-64 w-full bg-muted rounded-xl mt-6" />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Загружаем материал профессора… Если страница не открылась за несколько секунд,{" "}
            <button
              onClick={() => navigate("/for-parents")}
              className="underline text-primary hover:text-primary/80"
            >
              вернуться в каталог
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  const rawDesc =
    displayDescription ||
    (displayContent ? stripHtml(displayContent) : displayTitle);
  const metaDesc = (rawDesc || "").length > 160 ? (rawDesc || "").slice(0, 157) + "..." : rawDesc;

  const pageTitle = isEn
    ? `${translation?.seo_title || displayTitle} | Prof. Tarusin D.I.`
    : `${displayTitle} | проф. Тарусин Д.И.`;
  const pageDesc = isEn ? translation?.seo_description || metaDesc : metaDesc;
  const path = isEn ? `/en/for-parents/${article.slug}` : `/for-parents/${article.slug}`;

  return (
    <AgeConfirmationModal>
      <div
        className="min-h-screen bg-background select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <PageMeta
          title={pageTitle}
          description={pageDesc}
          path={path}
          type="article"
          keywords={isEn ? translation?.keywords || undefined : undefined}
        />

        {(() => {
          const catalogTab = article.age_group === "adults" ? "adults" : "children";
          const catalogHref = isEn
            ? `/en/for-parents?tab=${catalogTab}`
            : `/for-parents?tab=${catalogTab}`;
          return (
        <header className="bg-primary text-primary-foreground py-10 md:py-16">
          <div className="container mx-auto px-4">
            <nav className="flex items-center flex-wrap gap-1 text-sm text-primary-foreground/80 mb-6">
              <Link to={isEn ? "/en/" : "/"} className="hover:text-primary-foreground transition-colors">
                {isEn ? "Home" : "Главная"}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link to={catalogHref} className="hover:text-primary-foreground transition-colors">
                {isEn ? "Conditions catalog" : "Каталог болезней"}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-primary-foreground">{displayTitle}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{displayTitle}</h1>
            {displayDescription && (
              <p className="text-lg text-primary-foreground/80 max-w-3xl">{displayDescription}</p>
            )}
          </div>
        </header>
          );
        })()}

        <main className="container mx-auto px-4 py-10 md:py-14 max-w-4xl overflow-x-visible">
          {enMissing ? (
            <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
              <CardContent className="p-10 text-center">
                <Languages className="w-10 h-10 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  English translation coming soon
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  This article has not been translated yet. You can read the Russian
                  original or browse our growing English library.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button
                    onClick={() =>
                      navigate(`/for-parents/${article.slug}` + location.search + location.hash)
                    }
                    variant="default"
                  >
                    Read in Russian
                  </Button>
                  <Button onClick={() => navigate("/en/for-parents")} variant="outline">
                    English catalog
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : displayContent ? (
            isMarkdownContent(displayContent) ? (
              <MarkdownArticle
                content={displayContent}
                articleId={article.id}
                articleSlug={article.slug}
                isAdmin={!!isAdmin && !isEn}
                title={displayTitle}
                onContentChange={(c) => !isEn && setArticle({ ...article, article_content: c })}
              />
            ) : (
              <HtmlArticle
                content={displayContent}
                articleId={article.id}
                articleSlug={article.slug}
                isAdmin={!!isAdmin && !isEn}
                title={displayTitle}
                onContentChange={(c) => !isEn && setArticle({ ...article, article_content: c })}
              />
            )
          ) : (
            <p className="text-muted-foreground">
              {isEn ? "Full text coming soon." : "Полный текст статьи скоро появится."}
            </p>
          )}

          {!enMissing && related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {isEn ? "See also" : "Смотрите также"}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {related.map((r: any) => (
                  <Link
                    key={r.id}
                    to={`${isEn ? "/en" : ""}/for-parents/${r.slug}/`}
                    className="block group"
                  >
                    <Card className="h-full transition-all duration-300 ease-out will-change-transform group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:shadow-xl">
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
              to={`${isEn ? "/en" : ""}/for-parents?tab=${article.age_group === "adults" ? "adults" : "children"}`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />{" "}
              {isEn ? "Back to catalog" : "Назад к каталогу болезней"}
            </Link>
          </div>
        </main>

      </div>
    </AgeConfirmationModal>
  );
};

export default DiseaseDetailPage;
