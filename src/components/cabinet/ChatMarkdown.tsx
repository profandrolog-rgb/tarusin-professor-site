// Shared markdown renderer for chat answers.
// - GFM tables (remark-gfm)
// - Safe inline HTML (rehype-raw + rehype-sanitize with a tight allow-list)
// - Tables are wrapped in an overflow-x:auto container with proper styling.
import { type ComponentProps, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(new Set([
    ...(defaultSchema.tagNames || []),
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "ul", "ol", "li", "br", "mark", "strong", "em",
    "p", "code", "pre", "blockquote",
  ])),
  attributes: {
    ...(defaultSchema.attributes || {}),
    "*": [...((defaultSchema.attributes && defaultSchema.attributes["*"]) || []), "className"],
    th: [["align"], "colSpan", "rowSpan", "scope"],
    td: [["align"], "colSpan", "rowSpan"],
  },
};

const components: Components = {
  table: ({ children, ...props }: ComponentProps<"table"> & { children?: ReactNode }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-border">
      <table className="chat-md-table" {...props}>{children}</table>
    </div>
  ),
};

export function ChatMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ?? "prose prose-sm dark:prose-invert max-w-none"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Variant that accepts extra `components` overrides (used by PubMed-mode
 * which wires custom `<a>` for citation anchors).
 */
export function ChatMarkdownWith({
  children,
  className,
  extraComponents,
}: {
  children: string;
  className?: string;
  extraComponents?: Components;
}) {
  return (
    <div className={className ?? "prose prose-sm dark:prose-invert max-w-none"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{ ...components, ...(extraComponents || {}) }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
