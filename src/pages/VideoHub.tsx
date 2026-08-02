import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertTriangle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import VideoCard, { type VideoCardData } from "@/components/video/VideoCard";
import VideoSearchBox from "@/components/video/VideoSearchBox";
import { Skeleton } from "@/components/ui/skeleton";
import { VIDEO_RUBRIC_FALLBACK } from "@/lib/video/constants";
import { SITE_URL } from "@/lib/i18nUrls";

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
  const latest = videos.slice(0, 8);

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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Новые видео</h2>
          <Link to="/video/search" className="inline-flex items-center gap-1 text-sm text-primary">
            <Search className="h-4 w-4" /> Найти по вопросу
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-xl" />
            ))}
          </div>
        ) : latest.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((v) => (
              <VideoCard key={v.slug} video={v} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Видео пока не опубликованы.</p>
        )}
      </section>
    </div>
  );
};

export default VideoHub;
