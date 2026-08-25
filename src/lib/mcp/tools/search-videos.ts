import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_videos",
  title: "Search videos",
  description: "Search published videos of the video hub by title, summary or tags.",
  inputSchema: {
    query: z.string().trim().min(2).optional().describe("Search text."),
    rubric: z.string().trim().min(1).optional().describe("Filter by rubric slug."),
    limit: z.number().int().min(1).max(50).default(10).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, rubric, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let request = supabase
      .from("videos")
      .select("id, slug, title, summary_short, rubric, subrubric, duration_sec, published_at, tags")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit ?? 10);
    if (rubric) request = request.eq("rubric", rubric);
    if (query) {
      const escaped = query.replace(/[%,]/g, " ");
      request = request.or(
        `title.ilike.%${escaped}%,summary_short.ilike.%${escaped}%,summary_plain.ilike.%${escaped}%`,
      );
    }
    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { videos: data ?? [] },
    };
  },
});
