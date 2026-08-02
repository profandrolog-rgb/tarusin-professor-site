import { Link } from "react-router-dom";
import { Play, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration, FORMAT_LABELS } from "@/lib/video/constants";

export interface VideoCardData {
  slug: string;
  title: string;
  summary_short?: string | null;
  poster_url?: string | null;
  duration_sec?: number | null;
  format?: string | null;
  is_graphic?: boolean | null;
}

interface Props {
  video: VideoCardData;
  /** Секунда, с которой открыть видео (для результатов поиска). */
  startSec?: number;
}

const VideoCard = ({ video, startSec }: Props) => {
  const to = startSec ? `/video/${video.slug}?t=${startSec}` : `/video/${video.slug}`;
  const duration = formatDuration(video.duration_sec);

  return (
    <Link
      to={to}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.poster_url ? (
          <img
            src={video.poster_url}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Play className="h-10 w-10" />
          </div>
        )}
        {video.is_graphic && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-4 text-center text-sm font-medium text-foreground backdrop-blur-md">
            Медицинские изображения. Нажмите, чтобы открыть
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground">
            <Play className="h-5 w-5" />
          </span>
        </div>
        {duration && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-foreground/80 px-2 py-0.5 text-xs text-background">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        {video.format && FORMAT_LABELS[video.format] && (
          <Badge variant="secondary" className="text-xs">
            {FORMAT_LABELS[video.format]}
          </Badge>
        )}
        <h3 className="line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary">
          {video.title}
        </h3>
        {video.summary_short && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{video.summary_short}</p>
        )}
      </div>
    </Link>
  );
};

export default VideoCard;
