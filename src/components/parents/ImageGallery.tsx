import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  caption: string;
  files: string[];
}

const FOLDER = "article-images";

function publicUrl(filename: string) {
  const { data } = supabase.storage.from("disease-media").getPublicUrl(`${FOLDER}/${filename}`);
  return data.publicUrl;
}

const ImageGallery = ({ caption, files }: Props) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)));
      if (e.key === "ArrowRight")
        setLightboxIdx((i) => (i === null ? null : Math.min(files.length - 1, i + 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, files.length]);

  const isSingle = files.length === 1;
  const isDouble = files.length === 2;

  return (
    <figure className="my-8 not-prose">
      {caption && (
        <h4 className="text-base md:text-lg font-semibold mb-3" style={{ color: "#1B4F8A" }}>
          {caption}
        </h4>
      )}
      {isSingle ? (
        <div className="max-w-[700px] mx-auto">
          <button
            type="button"
            onClick={() => setLightboxIdx(0)}
            className="block w-full overflow-hidden rounded-lg border border-border hover:opacity-95 transition"
            style={{ aspectRatio: "4 / 3" }}
          >
            <img
              src={publicUrl(files[0])}
              alt={caption || "Фото 1"}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {files.map((f, i) => (
            <button
              key={f + i}
              type="button"
              onClick={() => setLightboxIdx(i)}
              className="block overflow-hidden rounded-lg border border-border hover:opacity-95 transition basis-full sm:basis-[calc(50%-0.375rem)] sm:max-w-[calc(50%-0.375rem)] md:basis-[calc(33.333%-0.5rem)] md:max-w-[calc(33.333%-0.5rem)]"
              style={{ aspectRatio: "4 / 3" }}
            >
              <img
                src={publicUrl(f)}
                alt={caption || `Фото ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}


      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
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
          {files.length > 1 && lightboxIdx > 0 && (
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
          {files.length > 1 && lightboxIdx < files.length - 1 && (
            <button
              type="button"
              className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((i) => (i === null ? null : Math.min(files.length - 1, i + 1)));
              }}
              aria-label="Вперёд"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          <img
            src={publicUrl(files[lightboxIdx])}
            alt={caption || `Фото ${lightboxIdx + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </figure>
  );
};

export default ImageGallery;
