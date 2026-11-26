import { useEffect, useMemo, useState } from "react";
import { Film, Play, X } from "lucide-react";
import ClinicalCurtain, { getClinicalAcknowledgedCookie } from "@/components/gallery/ClinicalCurtain";
import { useOptionalAuth } from "@/hooks/useAuth";
import {
  VIDEO_RATIO_META,
  type VideoGalleryEntry,
  type VideoGalleryOptions,
} from "@/lib/markdown/videoGalleryMarkers";
import { isDirectVideoUrl, resolveVideoSrc, type VideoRef } from "@/lib/video/videoStorage";

interface Props {
  caption: string;
  entries: VideoGalleryEntry[];
  options: VideoGalleryOptions;
}

/** Режим просмотра: всплывающий контейнер или плеер поверх всей страницы. */
type Player = { index: number; autoCloseOnEnd: boolean };

const videoCaptionStyle: React.CSSProperties = {
  fontSize: "clamp(10px, 2.6vw, 13px)",
  lineHeight: 1.25,
  color: "#666",
  fontStyle: "italic",
  textAlign: "center",
  marginTop: 6,
  marginBottom: 2,
  paddingInline: 2,
  overflowWrap: "anywhere",
  hyphens: "auto",
};

const watermarkStyle: React.CSSProperties = {
  position: "absolute",
  right: 12,
  bottom: 12,
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(255, 255, 255, 0.7)",
  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
  pointerEvents: "none",
  userSelect: "none",
  letterSpacing: 0.2,
};

const noContextMenu = (e: React.MouseEvent) => e.preventDefault();
const noDragStart = (e: React.DragEvent) => e.preventDefault();

/** Плитка видео: обложка, кнопка запуска, подпись; просмотр — по режиму галереи. */
const VideoGallery = ({ caption, entries, options }: Props) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [src, setSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const meta = VIDEO_RATIO_META[options.ratio] ?? VIDEO_RATIO_META["16:9"];

  // Шторка снята, если галерея открытая либо предупреждение уже принято.
  // Админ и редактор работают с галереями по существу — шторка их не блокирует.
  const auth = useOptionalAuth();
  const isStaff = !!(auth?.isAdmin || auth?.isEditor);
  const [unlocked, setUnlocked] = useState(!options.restricted);
  useEffect(() => {
    setUnlocked(!options.restricted || isStaff || getClinicalAcknowledgedCookie());
  }, [options.restricted, isStaff]);
  const locked = options.restricted && !unlocked;

  useEffect(() => {
    if (locked && player) setPlayer(null);
  }, [locked, player]);

  // Esc закрывает плеер в обоих режимах.
  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlayer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  // Ссылку на видео берём только при открытии: подписанные адреса короткоживущие.
  useEffect(() => {
    if (!player) {
      setSrc("");
      setError("");
      return;
    }
    const entry = entries[player.index];
    if (!entry) return;
    let alive = true;
    setLoading(true);
    setError("");
    setSrc("");
    (isDirectVideoUrl(entry.key)
      ? Promise.resolve(entry.key)
      : resolveVideoSrc({ cloud: entry.cloud, key: entry.key } as VideoRef)
    )
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Не удалось получить ссылку на видео");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [player, entries]);

  const gridStyle = useMemo(
    () => ({ ["--cols" as string]: String(meta.cols) } as React.CSSProperties),
    [meta.cols],
  );

  if (!entries.length) return null;

  const closePlayer = () => setPlayer(null);
  const current = player ? entries[player.index] : null;

  return (
    <figure className="my-8 not-prose select-none max-w-full" style={{ userSelect: "none" }}>
      {caption && (
        <h4 className="text-base md:text-lg font-semibold mb-3" style={{ color: "#1B4F8A" }}>
          {caption}
        </h4>
      )}

      <div className={locked ? "relative min-h-[280px]" : "relative"}>
        <div
          className={locked ? "pointer-events-none select-none" : "transition-[filter] duration-500"}
          style={locked ? { filter: "blur(26px) saturate(0.85)", transform: "scale(1.02)" } : undefined}
          aria-hidden={locked}
        >
          <div className="flex flex-wrap justify-center gap-3" style={gridStyle}>
            {entries.map((entry, i) => (
              <div
                key={`${entry.key}-${i}`}
                className="basis-[calc((100%-(var(--cols)-1)*0.75rem)/var(--cols))] max-w-[calc((100%-(var(--cols)-1)*0.75rem)/var(--cols))]"
                style={{ maxWidth: `min(100%, ${meta.maxTile}px)` }}
              >
                <button
                  type="button"
                  onClick={() => setPlayer({ index: i, autoCloseOnEnd: options.mode === "overlay" })}
                  className="relative block w-full overflow-hidden rounded-lg border border-border hover:opacity-95 transition bg-muted"
                  style={{ aspectRatio: meta.css }}
                  aria-label={`Открыть видео ${i + 1}`}
                >
                  {entry.poster ? (
                    <img
                      src={entry.poster}
                      alt={entry.caption || caption || `Видео ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      draggable={false}
                      onDragStart={noDragStart}
                      onContextMenu={noContextMenu}
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Film className="w-8 h-8" />
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-black/55 border border-white/40">
                      <Play className="w-6 h-6 text-white translate-x-[1px]" />
                    </span>
                  </span>
                  <span style={watermarkStyle}>tarusin.pro</span>
                </button>
                {entry.caption && <figcaption style={videoCaptionStyle}>{entry.caption}</figcaption>}
              </div>
            ))}
          </div>
        </div>
        {locked && <ClinicalCurtain onConfirm={() => setUnlocked(true)} />}
      </div>

      {player && !locked && (
        <div
          className={
            options.mode === "overlay"
              ? "fixed inset-0 z-[100] bg-black flex items-center justify-center select-none"
              : "fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 select-none"
          }
          style={{ userSelect: "none" }}
          onClick={closePlayer}
          onContextMenu={noContextMenu}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full z-10"
            onClick={(e) => {
              e.stopPropagation();
              closePlayer();
            }}
            aria-label="Закрыть"
          >
            <X className="w-7 h-7" />
          </button>

          <div
            className={
              options.mode === "overlay"
                ? "relative w-full h-full flex items-center justify-center"
                : "relative w-full max-w-4xl flex items-center justify-center"
            }
            onClick={(e) => e.stopPropagation()}
          >
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                Загружаем видео…
              </span>
            )}
            {error && (
              <span className="absolute inset-0 flex items-center justify-center text-white/90 text-sm px-6 text-center">
                {error}
              </span>
            )}
            {src && current && (
              <video
                key={src}
                src={src}
                poster={current.poster || undefined}
                controls
                autoPlay
                playsInline
                controlsList="nodownload"
                disablePictureInPicture
                className={
                  options.mode === "overlay"
                    ? "max-w-full max-h-full w-auto h-auto object-contain"
                    : "w-full max-h-[80vh] bg-black rounded-lg"
                }
                onContextMenu={noContextMenu}
                onEnded={() => {
                  if (player.autoCloseOnEnd) closePlayer();
                }}
              />
            )}
          </div>

          {(current?.caption || caption) && (
            <div
              className="absolute bottom-0 left-0 right-0 px-6 py-4 text-center pointer-events-none"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))",
                color: "#fff",
                fontSize: 14,
              }}
            >
              {current?.caption || caption}
            </div>
          )}
        </div>
      )}
    </figure>
  );
};

export default VideoGallery;
