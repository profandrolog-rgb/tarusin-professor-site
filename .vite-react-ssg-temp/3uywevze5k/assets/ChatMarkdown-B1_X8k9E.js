import { jsx } from "react/jsx-runtime";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(/* @__PURE__ */ new Set([
    ...defaultSchema.tagNames || [],
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "ul",
    "ol",
    "li",
    "br",
    "mark",
    "strong",
    "em",
    "p",
    "code",
    "pre",
    "blockquote"
  ])),
  attributes: {
    ...defaultSchema.attributes || {},
    "*": [...defaultSchema.attributes && defaultSchema.attributes["*"] || [], "className"],
    th: [["align"], "colSpan", "rowSpan", "scope"],
    td: [["align"], "colSpan", "rowSpan"]
  }
};
const components = {
  table: ({ children, ...props }) => /* @__PURE__ */ jsx("div", { className: "my-3 overflow-x-auto rounded-md border border-border", children: /* @__PURE__ */ jsx("table", { className: "chat-md-table", ...props, children }) })
};
function ChatMarkdown({ children, className }) {
  return /* @__PURE__ */ jsx("div", { className: className ?? "prose prose-sm dark:prose-invert max-w-none", children: /* @__PURE__ */ jsx(
    ReactMarkdown,
    {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeRaw, [rehypeSanitize, sanitizeSchema]],
      components,
      children
    }
  ) });
}
function ChatMarkdownWith({
  children,
  className,
  extraComponents
}) {
  return /* @__PURE__ */ jsx("div", { className: className ?? "prose prose-sm dark:prose-invert max-w-none", children: /* @__PURE__ */ jsx(
    ReactMarkdown,
    {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeRaw, [rehypeSanitize, sanitizeSchema]],
      components: { ...components, ...extraComponents || {} },
      children
    }
  ) });
}
export {
  ChatMarkdown as C,
  ChatMarkdownWith as a
};
