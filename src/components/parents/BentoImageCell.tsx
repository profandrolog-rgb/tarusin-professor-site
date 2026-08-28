import { supabase } from "@/integrations/supabase/client";
import { storageThumb, storageOriginal } from "@/lib/storageImage";

export interface BentoImageData {
  path: string;
  x?: number; // 0..100 object-position X
  y?: number; // 0..100 object-position Y
  zoom?: number; // 100..250 (scale %)
}

interface Props {
  image?: BentoImageData | null;
  className?: string;
  rounded?: string;
}

const BentoImageCell = ({ image, className = "", rounded = "rounded-lg" }: Props) => {
  const original = image?.path
    ? supabase.storage.from("disease-media").getPublicUrl(image.path).data.publicUrl
    : null;
  // Карточка показывает превью, поэтому грузим сжатый вариант (~5x меньше).
  const url = original ? storageThumb(original, 800, 72) : null;

  const x = image?.x ?? 50;
  const y = image?.y ?? 50;
  const zoom = image?.zoom ?? 100;

  return (
    <div
      className={`relative overflow-hidden bg-muted/40 ring-1 ring-border/60 shadow-inner ${rounded} ${className}`}
    >
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(e) => {
            // Если трансформатор недоступен — молча падаем на исходный файл.
            const img = e.currentTarget;
            const fallback = storageOriginal(original);
            if (fallback && img.src !== fallback) img.src = fallback;
          }}
          className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
          style={{
            objectPosition: `${x}% ${y}%`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: `${x}% ${y}%`,
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/70">
          +
        </div>
      )}
    </div>
  );
};

export default BentoImageCell;
