import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import VideoCard, { type VideoCardData } from "@/components/video/VideoCard";
import VideoSearchBox from "@/components/video/VideoSearchBox";
import { Skeleton } from "@/components/ui/skeleton";
import { VIDEO_RUBRIC_FALLBACK } from "@/lib/video/constants";
import { SITE_URL } from "@/lib/i18nUrls";

const VideoRubricPage = () => {
  const { slug = "" } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [r, v] = await Promise.all([
        supabase.from("video_rubrics").select("title, description").eq("slug", slug).maybeSingle(),
        supabase
          .from("videos")
          .select("slug, title, summary_short, poster_url, duration_sec, format, is_graphic")
          .eq("is_published", true)
          .eq("access_level", "public")
          .eq("rubric", slug)
          .order("sort_order", { ascending: true })
          .order("published_at", { ascending: false }),
      ]);
      if (cancelled) return;
      const fallback = VIDEO_RUBRIC_FALLBACK.find((x) => x.slug === slug);
      setTitle(r.data?.title ?? fallback?.title ?? "Видео");
      setDescription(r.data?.description ?? null);
      setVideos((v.data ?? []) as VideoCardData[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${title} — видео профессора Тарусина Д.И.`}
        description={
          description ||
          `Видеоответы профессора Тарусина Д.И. по теме «${title}»: простые объяснения для родителей и пациентов.`
        }
        path={`/video/rubric/${slug}/`}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Видео", item: `${SITE_URL}/video/` },
            { "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}/video/rubric/${slug}/` },
          ],
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/video" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все разделы
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}

        <div className="mt-6 max-w-2xl">
          <VideoSearchBox />
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-xl" />
              ))}
            </div>
          ) : videos.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <VideoCard key={v.slug} video={v} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">В этом разделе пока нет видео.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRubricPage;
