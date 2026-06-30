// One-shot helper: converts raw markdown bodies of disease_articles / blog_posts /
// research_articles to HTML (preserving [[GALLERY:...]] markers), in place.
// Idempotent — skips rows that already contain HTML block tags.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { marked } from "https://esm.sh/marked@12.0.2";
import { corsHeaders } from "../_shared/cors.ts";

marked.setOptions({ gfm: true, breaks: false });

const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*["'""]([^"'""]*)["'""]\s*((?:\|[^\]]*)?)\]\]/g;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  const prepared = md.replace(
    GALLERY_RE,
    (_m, caption: string, files: string) =>
      `\n\n<div data-gallery-placeholder data-caption="${escapeHtml(caption)}" data-files="${escapeHtml((files || "").replace(/^\|/, "").trim())}">Галерея</div>\n\n`,
  );
  return marked.parse(prepared, { async: false }) as string;
}

function looksLikeMarkdown(body: string): boolean {
  if (!body) return false;
  // Если уже выглядит как полноценный HTML-документ статьи (есть <p>...</p>
  // вокруг текста), но при этом markdown-маркеры отсутствуют — пропускаем.
  const hasMarkdown =
    /(^|\n)#{1,6} /.test(body) ||
    /\*\*[^*]+\*\*/.test(body) ||
    /(^|\n)\* /.test(body) ||
    /(^|\n)- \S/.test(body) ||
    /(^|\n)\d+\. \S/.test(body);
  if (!hasMarkdown) return false;
  // Если markdown-маркеры есть — конвертируем, даже если в теле уже встречается
  // HTML (marked корректно сохраняет inline-HTML блоки).
  return true;
}

const TABLES: Array<{ table: string; column: string }> = [
  { table: "disease_articles", column: "article_content" },
  { table: "blog_posts", column: "content" },
  { table: "research_articles", column: "content" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Admin check: require caller to be an admin via has_role().
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const report: Array<Record<string, unknown>> = [];

  for (const { table, column } of TABLES) {
    const { data, error } = await admin.from(table).select(`id, title, ${column}`);
    if (error) {
      report.push({ table, error: error.message });
      continue;
    }
    let converted = 0;
    let skipped = 0;
    for (const row of data || []) {
      const body = (row as any)[column] as string | null;
      if (!body || !looksLikeMarkdown(body)) {
        skipped++;
        continue;
      }
      const html = markdownToHtml(body);
      const { error: updErr } = await admin
        .from(table)
        .update({ [column]: html })
        .eq("id", (row as any).id);
      if (updErr) {
        report.push({ table, id: (row as any).id, error: updErr.message });
      } else {
        converted++;
      }
    }
    report.push({ table, converted, skipped, total: data?.length || 0 });
  }

  return new Response(JSON.stringify({ ok: true, report }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
