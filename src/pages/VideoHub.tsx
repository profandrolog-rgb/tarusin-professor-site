import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertTriangle, ArrowRight, Rows3, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import VideoCard, { type VideoCardData } from "@/components/video/VideoCard";
import VideoSearchBox from "@/components/video/VideoSearchBox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { VIDEO_RUBRIC_FALLBACK } from "@/lib/video/constants";
import { SITE_URL } from "@/lib/i18nUrls";

type ViewMode = "shelves" | "grid" | "feed";
const VIEW_KEY = "video-hub-view";


interface Rubric {
  slug: string;
  title: string;
  description: string | null;
  is_urgent: boolean | null;
}

const VideoHub = () => {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [videos, setVideos] = useState<(VideoCardData & { rubric: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [r, v] = await Promise.all([
        supabase
          .from("video_rubrics")
          .select("slug, title, description, is_urgent")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("videos")
          .select("slug, title, summary_short, poster_url, duration_sec, format, is_graphic, rubric")
          .eq("is_published", true)
          .eq("access_level", "public")
          .order("sort_order", { ascending: true })
          .order("published_at", { ascending: false })
          .limit(60),
      ]);
      if (cancelled) return;
      setRubrics(r.data?.length ? (r.data as Rubric[]) : (VIDEO_RUBRIC_FALLBACK as Rubric[]));
      setVideos((v.data ?? []) as any[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const urgent = rubrics.find((r) => r.is_urgent);

  const [view, setView] = useState<ViewMode>("shelves");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(VIEW_KEY) : null;
    if (saved === "shelves" || saved === "grid" || saved === "feed") setView(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);


  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Видео профессора Тарусина — ответы на вопросы о здоровье мальчиков"
        description="Видеоответы детского уролога-андролога, профессора Тарусина Д.И.: развитие мальчика, боль, гигиена, обследования, операции и наркоз."
        path="/video/"
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Видео профессора Тарусина",
          url: `${SITE_URL}/video/`,
        }}
      />

      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Видео</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Опишите ситуацию своими словами — я подберу видео, где отвечаю именно на этот вопрос.
          </p>
          <div className="mt-6 max-w-2xl">
            <VideoSearchBox />
          </div>
          {urgent && (
            <Link
              to={`/video/rubric/${urgent.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-foreground"
            >
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Резко заболело сейчас — что делать
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Разделы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rubrics.map((r) => (
            <Link
              key={r.slug}
              to={`/video/rubric/${r.slug}`}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <h3 className="font-semibold text-foreground">{r.title}</h3>
              {r.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              )}
              <span className="mt-3 inline-block text-sm text-muted-foreground">
                {videos.filter((v) => v.rubric === r.slug).length} видео
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-foreground">
            {view === "shelves" ? "По разделам" : view === "grid" ? "Все видео" : "Лента"}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              {(
                [
                  { id: "shelves", label: "Полки", Icon: Rows3 },
                  { id: "grid", label: "Сетка", Icon: LayoutGrid },
                  { id: "feed", label: "Лента", Icon: List },
                ] as { id: ViewMode; label: string; Icon: typeof Rows3 }[]
              ).map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={view === id ? "secondary" : "ghost"}
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                  className="gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
            <Link to="/video/search" className="inline-flex items-center gap-1 text-sm text-primary">
              <Search className="h-4 w-4" /> Найти по вопросу
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-xl" />
            ))}
          </div>
        ) : !videos.length ? (
          <p className="text-muted-foreground">Видео пока не опубликованы.</p>
        ) : view === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((v) => (
              <VideoCard key={v.slug} video={v} />
            ))}
          </div>
        ) : view === "feed" ? (
          <div className="mx-auto grid max-w-2xl gap-6">
            {videos.map((v) => (
              <VideoCard key={v.slug} video={v} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {rubrics.map((r) => {
              const list = videos.filter((v) => v.rubric === r.slug);
              if (!list.length) return null;
              return (
                <div key={r.slug}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{r.title}</h3>
                    <Link to={`/video/rubric/${r.slug}`} className="text-sm text-primary">
                      Все
                    </Link>
                  </div>
                  <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
                    {list.map((v) => (
                      <div key={v.slug} className="w-64 shrink-0 snap-start">
                        <VideoCard video={v} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(() => {
              const rest = videos.filter((v) => !rubrics.some((r) => r.slug === v.rubric));
              if (!rest.length) return null;
              return (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">Другие видео</h3>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {rest.map((v) => (
                      <VideoCard key={v.slug} video={v} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

    </div>
  );
};

export default VideoHub;
