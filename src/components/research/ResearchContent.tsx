import { useMemo } from "react";
import DOMPurify from "dompurify";
import { splitContentByGallery, parseGalleryFileEntries } from "@/lib/markdown/galleryMarkers";
import ImageGallery from "@/components/parents/ImageGallery";

interface Props {
  /** HTML содержимое обзора (может содержать маркеры галерей [[GALLERY: ...]]). */
  html: string;
  /** Опционально: клик по ссылкам-номерам источников [N]. */
  onFragmentClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Рендерит контент научного обзора: HTML-фрагменты — через DOMPurify,
 * на месте маркеров [[GALLERY: ...]] — общий компонент ImageGallery,
 * тот же самый, что используется в статьях для родителей.
 */
const ResearchContent = ({ html, onFragmentClick }: Props) => {
  const segments = useMemo(() => splitContentByGallery(html || ""), [html]);

  return (
    <div className="prose prose-sm md:prose-base max-w-none text-foreground">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          const clean = DOMPurify.sanitize(seg.content, { ADD_ATTR: ["target", "rel", "data-ref"] });
          return (
            <div
              key={i}
              onClick={onFragmentClick}
              dangerouslySetInnerHTML={{ __html: clean }}
            />
          );
        }
        // Пустой маркер (без файлов) на публичной странице скрываем — редактор ещё не заполнил.
        if (!seg.files.length) return null;
        // Пробрасываем строки как есть: ImageGallery сам парсит `name.jpg "подпись"`.
        const files = parseGalleryFileEntries(seg.files.join(" | ")).map((e) =>
          e.caption ? `${e.filename} "${e.caption}"` : e.filename,
        );
        return <ImageGallery key={i} caption={seg.caption} files={files} />;
      })}
    </div>
  );
};

export default ResearchContent;
