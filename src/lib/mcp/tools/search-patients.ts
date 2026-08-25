import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_patients",
  title: "Search patients",
  description:
    "Search patient records the signed-in user is allowed to see (access is enforced by database policies).",
  inputSchema: {
    query: z.string().trim().min(2).describe("Part of the patient name or history number."),
    limit: z.number().int().min(1).max(25).default(10).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const escaped = query.replace(/[%,]/g, " ");
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, birth_date, sex, history_number, updated_at")
      .or(`full_name.ilike.%${escaped}%,history_number.ilike.%${escaped}%`)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { patients: data ?? [] },
    };
  },
});
