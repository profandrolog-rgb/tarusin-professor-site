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

function unwrapMarkdownInParagraphs(html: string): string {
  // Случай: текст уже обёрнут в <p>…</p>, но внутри markdown (## …, **…**, - …).
  // Разворачиваем такие <p> в чистый markdown, чтобы marked корректно их обработал.
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (full, inner: string) => {
    const trimmed = inner.trim();
    if (/^#{1,6}\s+\S/.test(trimmed) || /^[-*]\s+\S/.test(trimmed)) {
      return `\n\n${trimmed}\n\n`;
    }
    // Параграф содержит **жирный** markdown — оставляем как параграф, но переводим **…** в <strong>
    if (/\*\*[^*\n]+\*\*/.test(trimmed)) {
      const converted = trimmed.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
      return `<p>${converted}</p>`;
    }
    return full;
  });
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  const unwrapped = unwrapMarkdownInParagraphs(md);
  const prepared = unwrapped.replace(
    GALLERY_RE,
    (_m, caption: string, files: string) =>
      `\n\n<div data-gallery-placeholder data-caption="${escapeHtml(caption)}" data-files="${escapeHtml((files || "").replace(/^\|/, "").trim())}">Галерея</div>\n\n`,
  );
  return marked.parse(prepared, { async: false }) as string;
}

function looksLikeMarkdown(body: string): boolean {
  if (!body) return false;
  // Заголовки/списки на отдельной строке — надёжный признак markdown.
  const hasMdHeading = /(^|\n)#{1,6} \S/.test(body);
  const hasMdList = /(^|\n)[-*] \S/.test(body) && !/<(ul|ol)\b/i.test(body);
  const hasBoldNoHtml = /\*\*[^*\n]+\*\*/.test(body) && !/<(p|h[1-6])\b/i.test(body);
  // Спец-случай: markdown-заголовки/списки/жирный обёрнуты в <p>…</p>.
  const hasWrappedMd =
    /<p>\s*#{1,6}\s+\S/i.test(body) ||
    /<p>\s*[-*]\s+\S/i.test(body) ||
    /<p>[^<]*\*\*[^*\n]+\*\*[^<]*<\/p>/i.test(body);
  return hasMdHeading || hasMdList || hasBoldNoHtml || hasWrappedMd;
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
