import { useMemo } from "react";
import DOMPurify from "dompurify";
import { splitContentByGallery, parseGalleryFileEntries } from "@/lib/markdown/galleryMarkers";
import ImageGallery from "@/components/parents/ImageGallery";
import PlaceholderGallery from "@/components/parents/PlaceholderGallery";

interface Props {
  /** HTML содержимое обзора (может содержать маркеры галерей [[GALLERY: ...]]). */
  html: string;
  /** Опционально: клик по ссылкам-номерам источников [N]. */
  onFragmentClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Режим админа: показывать плашку-загрузчик для незаполненных маркеров и управление галереей. */
  admin?: {
    reviewId: string;
    reviewSlug: string;
    fullContent: string;
    onContentChange?: (next: string) => void;
  };
}

/**
 * Рендерит контент научного обзора: HTML-фрагменты — через DOMPurify,
 * на месте маркеров [[GALLERY: ...]] — общий ImageGallery (публично)
 * или PlaceholderGallery в admin-режиме (управление файлами прямо на странице).
 */
const ResearchContent = ({ html, onFragmentClick, admin }: Props) => {
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
        // Админ: и пустые, и заполненные маркеры показываем как редактор галереи.
        if (admin) {
          return (
            <PlaceholderGallery
              key={i}
              articleId={admin.reviewId}
              articleSlug={admin.reviewSlug}
              caption={seg.caption}
              marker={seg.marker}
              fullContent={admin.fullContent}
              existingFiles={seg.files}
              onContentChange={admin.onContentChange}
              ownerTable="research_reviews"
              contentColumn="content"
            />
          );
        }
        // Публично: пустой маркер (без файлов) скрываем.
        if (!seg.files.length) return null;
        const files = parseGalleryFileEntries(seg.files.join(" | ")).map((e) =>
          e.caption ? `${e.filename} "${e.caption}"` : e.filename,
        );
        return <ImageGallery key={i} caption={seg.caption} files={files} />;
      })}
    </div>
  );
};

export default ResearchContent;
