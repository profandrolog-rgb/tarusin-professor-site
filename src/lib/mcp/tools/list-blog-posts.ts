import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_blog_posts",
  title: "List blog posts",
  description: "List published blog posts («Размышления») with excerpts, newest first.",
  inputSchema: {
    query: z.string().trim().min(2).optional().describe("Optional search text in title or excerpt."),
    limit: z.number().int().min(1).max(50).default(10).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let request = supabase
      .from("blog_posts")
      .select("id, title, excerpt, created_at, updated_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (query) {
      const escaped = query.replace(/[%,]/g, " ");
      request = request.or(`title.ilike.%${escaped}%,excerpt.ilike.%${escaped}%`);
    }
    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
