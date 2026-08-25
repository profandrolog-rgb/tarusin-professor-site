import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_disease_articles",
  title: "Search disease articles",
  description:
    "Search published disease articles of the site (section «Родителям») by title, description or keywords.",
  inputSchema: {
    query: z.string().trim().min(2).optional().describe("Search text, e.g. «гинекомастия»."),
    limit: z.number().int().min(1).max(50).default(10).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let request = supabase
      .from("disease_articles")
      .select("id, slug, title, description, category, age_group, updated_at")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(limit ?? 10);
    if (query) {
      const escaped = query.replace(/[%,]/g, " ");
      request = request.or(
        `title.ilike.%${escaped}%,description.ilike.%${escaped}%,keywords.ilike.%${escaped}%`,
      );
    }
    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});
