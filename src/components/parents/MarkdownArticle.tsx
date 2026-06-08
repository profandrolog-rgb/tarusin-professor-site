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

// Ensure `---` on its own line is parsed as a thematic break (<hr>) and not a setext heading.
// Markdown requires a blank line before/after `---` for it to become <hr>.
function normalizeHorizontalRules(md: string): string {
  // Add blank lines around standalone --- (3+ dashes)
  return md.replace(/([^\n])\n(-{3,})\s*\n/g, "$1\n\n$2\n\n").replace(/\n(-{3,})\s*\n([^\n])/g, "\n\n$1\n\n$2");
}

const MarkdownArticle = ({ content, articleId, articleSlug, isAdmin, onContentChange }: Props) => {
  const segments = useMemo(() => parseArticleContent(normalizeHorizontalRules(content)), [content]);

  return (
    <div className="article-markdown prose prose-base max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-table:w-full prose-th:bg-muted prose-th:p-2 prose-th:border prose-th:border-border prose-td:p-2 prose-td:border prose-td:border-border [&_p]:mb-7 [&_p]:leading-[1.85] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-14 [&_h2]:mb-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-10 [&_h3]:mb-4 [&_ul]:my-5 [&_ol]:my-5 [&_li]:my-2 [&_hr]:my-10 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[#E2EBF5]">
      {segments.map((seg, i) => {
        if (seg.type === "md") {
          return (
            <ReactMarkdown
              key={i}
              remarkPlugins={[remarkGfm]}
              components={{
                hr: () => (
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid #E2EBF5",
                      margin: "32px 0",
                    }}
                  />
                ),
              }}
            >
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
