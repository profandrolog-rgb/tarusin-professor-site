import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PlaceholderGallery from "./PlaceholderGallery";
import ImageGallery from "./ImageGallery";

interface ParsedGallery {
  marker: string; // оригинальная строка маркера
  caption: string;
  files: string[];
}

interface Segment {
  type: "md" | "gallery";
  content: string;
  gallery?: ParsedGallery;
}

const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*"([^"]*)"\s*((?:\|[^\]]*)?)\]\]/g;

function parseGalleryFiles(rest: string): string[] {
  if (!rest) return [];
  return rest
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseArticleContent(content: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const re = new RegExp(GALLERY_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: "md", content: content.slice(lastIndex, m.index) });
    }
    segments.push({
      type: "gallery",
      content: m[0],
      gallery: {
        marker: m[0],
        caption: m[1] || "",
        files: parseGalleryFiles(m[2] || ""),
      },
    });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "md", content: content.slice(lastIndex) });
  }
  return segments;
}

interface Props {
  content: string;
  articleId: string;
  articleSlug: string;
  isAdmin: boolean;
  onContentChange?: (newContent: string) => void;
}

const MarkdownArticle = ({ content, articleId, articleSlug, isAdmin, onContentChange }: Props) => {
  const segments = useMemo(() => parseArticleContent(content), [content]);

  return (
    <div className="prose prose-base max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-table:w-full prose-th:bg-muted prose-th:p-2 prose-th:border prose-th:border-border prose-td:p-2 prose-td:border prose-td:border-border">
      {segments.map((seg, i) => {
        if (seg.type === "md") {
          return (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
              {seg.content}
            </ReactMarkdown>
          );
        }
        const g = seg.gallery!;
        if (g.files.length === 0) {
          if (!isAdmin) {
            // Скрываем пустые маркеры от обычных пользователей
            return null;
          }
          return (
            <PlaceholderGallery
              key={i}
              articleId={articleId}
              articleSlug={articleSlug}
              caption={g.caption}
              marker={g.marker}
              fullContent={content}
              onContentChange={onContentChange}
            />
          );
        }
        return <ImageGallery key={i} caption={g.caption} files={g.files} />;
      })}
    </div>
  );
};

export default MarkdownArticle;
