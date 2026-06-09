import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  caption: string;
  files: string[];
}

interface Item {
  filename: string;
  caption: string;
}

const FOLDER = "article-images";
const BUCKET = "disease-media";
// Стабильный базовый URL из env — не зависит от состояния клиента Supabase.
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

function publicUrl(filename: string) {
  const safe = filename
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${STORAGE_BASE}/${FOLDER}/${safe}`;
}

// Parses entries like:  `name.jpg` or `name.jpg "подпись"` (also `'…'`, `“…”`)
function parseEntry(raw: string): Item {
  const s = raw.trim();
  const m = s.match(/^(\S+)\s+["'“”]([^"'“”]*)["'“”]\s*$/);
  if (m) return { filename: m[1], caption: m[2].trim() };
  return { filename: s, caption: "" };
}

const ImageGallery = ({ caption, files }: Props) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const items = useMemo<Item[]>(() => files.map(parseEntry), [files]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)));
      if (e.key === "ArrowRight")
        setLightboxIdx((i) => (i === null ? null : Math.min(items.length - 1, i + 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, items.length]);

  const isSingle = items.length === 1;

  const photoCaptionStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 6,
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

  const isInfographic = (filename: string) => /-infographic-/i.test(filename);
  const isPatientFull = (filename: string) => /-patient-full-/i.test(filename);
  // Высота карточки вертикального фото (рост 9:16). Ширина = высота * 9/16.
  const PATIENT_FULL_H = 500;
  const PATIENT_FULL_W = Math.round((PATIENT_FULL_H * 9) / 16); // ~281px

  return (
    <figure
      className="my-8 not-prose select-none max-w-full overflow-x-visible"
      style={{ userSelect: "none" }}
    >
      {caption && (
        <h4 className="text-base md:text-lg font-semibold mb-3" style={{ color: "#1B4F8A" }}>
          {caption}
        </h4>
      )}
      {isSingle ? (
        (() => {
          const single = items[0];
          const single_patientFull = isPatientFull(single.filename);
          const wrapperClass = single_patientFull
            ? "mx-auto"
            : "max-w-[860px] mx-auto w-full";
          const wrapperStyle: React.CSSProperties = single_patientFull
            ? { width: PATIENT_FULL_W, maxWidth: "100%" }
            : {};
          const imgStyle: React.CSSProperties = single_patientFull
            ? {
                maxWidth: "100%",
                width: "auto",
                height: PATIENT_FULL_H,
                maxHeight: "70vh",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }
            : {
                maxWidth: "100%",
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
              };
          return (
            <div className={wrapperClass} style={wrapperStyle}>
              <button
                type="button"
                onClick={() => setLightboxIdx(0)}
                className="relative block w-full rounded-lg border border-border hover:opacity-95 transition bg-background"
              >
                <img
                  src={publicUrl(single.filename)}
                  alt={single.caption || caption || "Фото 1"}
                  loading="lazy"
                  style={imgStyle}
                  draggable={false}
                  onDragStart={noDragStart}
                  onContextMenu={noContextMenu}
                />
                <span style={watermarkStyle}>tarusin.pro</span>
              </button>
              {single.caption && (
                <figcaption style={photoCaptionStyle}>{single.caption}</figcaption>
              )}
            </div>
          );
        })()
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {items.map((it, i) => (
            <div
              key={it.filename + i}
              className="basis-full sm:basis-[calc(50%-0.375rem)] sm:max-w-[calc(50%-0.375rem)] md:basis-[calc(33.333%-0.5rem)] md:max-w-[calc(33.333%-0.5rem)]"
            >
              {isInfographic(it.filename) ? (
                <button
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className="relative block w-full rounded-lg border border-border hover:opacity-95 transition bg-background"
                >
                  <img
                    src={publicUrl(it.filename)}
                    alt={it.caption || caption || `Фото ${i + 1}`}
                    loading="lazy"
                    style={{
                      maxWidth: "100%",
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                    }}
                    draggable={false}
                    onDragStart={noDragStart}
                    onContextMenu={noContextMenu}
                  />
                  <span style={watermarkStyle}>tarusin.pro</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className="relative block w-full overflow-hidden rounded-lg border border-border hover:opacity-95 transition"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  <img
                    src={publicUrl(it.filename)}
                    alt={it.caption || caption || `Фото ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{ maxWidth: "100%", height: "auto" }}
                    draggable={false}
                    onDragStart={noDragStart}
                    onContextMenu={noContextMenu}
                  />
                  <span style={watermarkStyle}>tarusin.pro</span>
                </button>
              )}
              {it.caption && (
                <figcaption style={photoCaptionStyle}>{it.caption}</figcaption>
              )}
            </div>
          ))}
        </div>
      )}


      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 select-none"
          style={{ userSelect: "none" }}
          onClick={() => setLightboxIdx(null)}
          onContextMenu={noContextMenu}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx(null);
            }}
            aria-label="Закрыть"
          >
            <X className="w-7 h-7" />
          </button>
          {items.length > 1 && lightboxIdx > 0 && (
            <button
              type="button"
              className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)));
              }}
              aria-label="Назад"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {items.length > 1 && lightboxIdx < items.length - 1 && (
            <button
              type="button"
              className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((i) => (i === null ? null : Math.min(items.length - 1, i + 1)));
              }}
              aria-label="Вперёд"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={publicUrl(items[lightboxIdx].filename)}
              alt={items[lightboxIdx].caption || caption || `Фото ${lightboxIdx + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              draggable={false}
              onDragStart={noDragStart}
              onContextMenu={noContextMenu}
            />
            <span style={watermarkStyle}>tarusin.pro</span>
          </div>
          {items[lightboxIdx].caption && (
            <div
              className="absolute bottom-0 left-0 right-0 px-6 py-4 text-center pointer-events-none"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))",
                color: "#fff",
                fontSize: 14,
              }}
            >
              {items[lightboxIdx].caption}
            </div>
          )}
        </div>
      )}
    </figure>
  );
};

export default ImageGallery;
