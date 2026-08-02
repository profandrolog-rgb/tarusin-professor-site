import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoCard, { type VideoCardData } from "@/components/video/VideoCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AUDIENCE_LABELS,
  AGE_LABELS,
  FORMAT_LABELS,
  formatDuration,
  VIDEO_RUBRIC_FALLBACK,
} from "@/lib/video/constants";
import { SITE_URL } from "@/lib/i18nUrls";

interface VideoRow {
  id: string;
  slug: string;
  title: string;
  summary_short: string | null;
  summary_plain: string | null;
  seo_title: string | null;
  seo_description: string | null;
  video_url: string;
  poster_url: string | null;
  duration_sec: number | null;
  transcript: string | null;
  rubric: string | null;
  audience: string[] | null;
  age_groups: string[] | null;
  format: string | null;
  tags: string[] | null;
  faq_questions: string[] | null;
  cluster_slug: string | null;
  series_slug: string | null;
  is_graphic: boolean | null;
  published_at: string | null;
}

const VideoDetailPage = () => {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const startSec = Number(params.get("t") || 0) || 0;

  const [video, setVideo] = useState<VideoRow | null>(null);
  const [related, setRelated] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const { data } = await supabase
        .from("videos")
        .select(
          "id, slug, title, summary_short, summary_plain, seo_title, seo_description, video_url, poster_url, duration_sec, transcript, rubric, audience, age_groups, format, tags, faq_questions, cluster_slug, series_slug, is_graphic, published_at",
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("access_level", "public")
        .maybeSingle();

      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setVideo(data as VideoRow);
      setLoading(false);

      supabase.rpc("increment_video_view", { _slug: slug }).then(() => undefined);

      const row = data as VideoRow;
      let q = supabase
        .from("videos")
        .select("slug, title, summary_short, poster_url, duration_sec, format, is_graphic")
        .eq("is_published", true)
        .eq("access_level", "public")
        .neq("slug", slug)
        .limit(6);
      q = row.series_slug
        ? q.eq("series_slug", row.series_slug)
        : row.rubric
          ? q.eq("rubric", row.rubric)
          : q;
      const { data: rel } = await q;
      if (!cancelled) setRelated((rel ?? []) as VideoCardData[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const rubricTitle = useMemo(
    () => VIDEO_RUBRIC_FALLBACK.find((r) => r.slug === video?.rubric)?.title ?? null,
    [video?.rubric],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="mt-6 h-8 w-2/3" />
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <PageMeta title="Видео не найдено" description="Такого видео нет." path={`/video/${slug}/`} />
        <h1 className="text-2xl font-bold text-foreground">Видео не найдено</h1>
        <Link to="/video" className="mt-4 inline-block text-primary">
          Вернуться в раздел «Видео»
        </Link>
      </div>
    );
  }

  const seoTitle = video.seo_title || `${video.title} — профессор Тарусин Д.И.`;
  const seoDescription =
    video.seo_description ||
    video.summary_short ||
    `Видеоответ профессора Тарусина Д.И.: ${video.title}`;

  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.title,
      description: seoDescription,
      thumbnailUrl: video.poster_url ? [video.poster_url] : undefined,
      uploadDate: video.published_at || undefined,
      duration: video.duration_sec ? `PT${Math.floor(video.duration_sec / 60)}M${video.duration_sec % 60}S` : undefined,
      contentUrl: video.video_url,
      url: `${SITE_URL}/video/${video.slug}/`,
    },
  ];
  if (video.faq_questions?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: video.faq_questions.map((q) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: video.summary_plain || seoDescription },
      })),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={seoTitle}
        description={seoDescription}
        path={`/video/${video.slug}/`}
        type="article"
        image={video.poster_url || undefined}
        keywords={video.tags ?? undefined}
      />
      <JsonLd data={jsonLd} />

      <article className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/video" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все видео
        </Link>

        <div className="mt-5">
          <VideoPlayer
            src={video.video_url}
            poster={video.poster_url}
            title={video.title}
            startSec={startSec}
            requiresConfirm={!!video.is_graphic}
          />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-foreground md:text-3xl">{video.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {rubricTitle && video.rubric && (
            <Link to={`/video/rubric/${video.rubric}`} className="text-primary">
              {rubricTitle}
            </Link>
          )}
          {video.duration_sec ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatDuration(video.duration_sec)}
            </span>
          ) : null}
          {video.published_at && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(video.published_at).toLocaleDateString("ru-RU")}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {video.format && FORMAT_LABELS[video.format] && (
            <Badge variant="secondary">{FORMAT_LABELS[video.format]}</Badge>
          )}
          {(video.audience ?? []).map((a) => (
            <Badge key={a} variant="outline">{AUDIENCE_LABELS[a] ?? a}</Badge>
          ))}
          {(video.age_groups ?? []).map((a) => (
            <Badge key={a} variant="outline">{AGE_LABELS[a] ?? a}</Badge>
          ))}
        </div>

        {video.summary_plain && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-foreground">Коротко о чём это видео</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
              {video.summary_plain}
            </p>
          </section>
        )}

        {!!video.faq_questions?.length && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">Частые вопросы по теме</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              {video.faq_questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </section>
        )}

        {video.transcript && (
          <section className="mt-10">
            <Accordion type="single" collapsible>
              <AccordionItem value="transcript">
                <AccordionTrigger className="text-lg font-semibold">Расшифровка видео</AccordionTrigger>
                <AccordionContent>
                  <div className="max-h-[28rem] select-none overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {video.transcript}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        )}

        <p className="mt-10 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Видео носит информационный характер и не заменяет консультацию врача. Диагноз и лечение
          определяются на приёме.
        </p>

        {!!related.length && (
          <section className="mt-12">
            <h2 className="mb-5 text-xl font-semibold text-foreground">Смотрите также</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <VideoCard key={r.slug} video={r} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

export default VideoDetailPage;
