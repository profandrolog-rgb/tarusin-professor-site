import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  src: string;
  poster?: string | null;
  title: string;
  /** Стартовая секунда (глубокая ссылка ?t=). */
  startSec?: number;
  /** Требуется подтверждение перед показом (медицинские изображения). */
  requiresConfirm?: boolean;
}

const VideoPlayer = ({ src, poster, title, startSec = 0, requiresConfirm }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [revealed, setRevealed] = useState(!requiresConfirm);

  useEffect(() => {
    const el = ref.current;
    if (!el || !startSec) return;
    const onLoaded = () => {
      try {
        el.currentTime = startSec;
      } catch {
        /* игнорируем */
      }
    };
    el.addEventListener("loadedmetadata", onLoaded);
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, [startSec, src]);

  if (!revealed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl border border-border bg-muted/50 p-6 text-center">
        <Eye className="h-8 w-8 text-muted-foreground" />
        <p className="max-w-md text-sm text-muted-foreground">
          Видео содержит медицинские изображения. Откройте его, только если готовы их видеть.
        </p>
        <Button onClick={() => setRevealed(true)}>Показать видео</Button>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster || undefined}
      title={title}
      controls
      preload="metadata"
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      className="aspect-video w-full rounded-xl bg-black"
    />
  );
};

export default VideoPlayer;
