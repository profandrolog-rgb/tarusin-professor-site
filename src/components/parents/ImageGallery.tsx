import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  caption: string;
  files: string[];
}

interface Item {
  filename: string;
  caption: string;
}

const FOLDER = "article-images";

function publicUrl(filename: string) {
  const { data } = supabase.storage.from("disease-media").getPublicUrl(`${FOLDER}/${filename}`);
  return data.publicUrl;
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
        <div className="max-w-[860px] mx-auto w-full">
          <button
            type="button"
            onClick={() => setLightboxIdx(0)}
            className="relative block w-full rounded-lg border border-border hover:opacity-95 transition bg-background"
          >
            <img
              src={publicUrl(items[0].filename)}
              alt={items[0].caption || caption || "Фото 1"}
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
          {items[0].caption && (
            <figcaption style={photoCaptionStyle}>{items[0].caption}</figcaption>
          )}
        </div>
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
