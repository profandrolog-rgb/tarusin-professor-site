// Import Boericke's Materia Medica "Relationship" sections per remedy.
// Source: homeoint.org/books/boericmm/{letter}/{slug-no-trailing-dot}.htm
// Chained self-invoke: ~25 remedies per slice, then re-invokes next slice.
//
// POST { } — start new job
// POST { jobId, cursor } with header x-internal-chain — continue

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SLICE = 12;
const BASE = "https://www.homeoint.org/books/boericmm";
const WAYBACK = "https://web.archive.org/web/2023id_/https://www.homeoint.org/books/boericmm";

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function selfInvoke(body: Record<string, unknown>) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-boericke-mm`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "x-internal-chain": "1",
    },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function slugToPaths(slug: string): { primary: string; fallback: string } | null {
  const s = slug.trim().toLowerCase().replace(/\.+$/, "");
  if (!s) return null;
  const letter = s[0];
  if (!/[a-z]/.test(letter)) return null;
  const tail = `/${letter}/${encodeURIComponent(s)}.htm`;
  return { primary: `${BASE}${tail}`, fallback: `${WAYBACK}${tail}` };
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LovableBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const buf = new Uint8Array(await resp.arrayBuffer());
    return new TextDecoder("latin1").decode(buf);
  } catch (e) {
    console.log("fetch failed", url, (e as Error).message);
    return null;
  }
}

// Strip HTML tags → clean text
function stripHtml(s: string): string {
  return s
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&aelig;/gi, "ae")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

// Extract the Relationship section (red bold "Relationship.--" anchor)
function extractRelationship(html: string): string | null {
  const re = /Relationship\s*\.\s*--\s*<\/b>\s*<\/font>([\s\S]*?)(?=<font[^>]*color\s*=\s*"#ff0000"[^>]*>\s*<b>|<hr|<\/body>)/i;
  const m = html.match(re);
  if (m) {
    const text = stripHtml(m[1]);
    return text || null;
  }
  // Fallback: look for "Relationship" inside any bold/header without specific markup
  const re2 = /(?:<b>|<strong>)\s*Relationship[^<]*(?:<\/b>|<\/strong>)([\s\S]{0,4000}?)(?=<(?:b|strong)>|<hr|<\/body>)/i;
  const m2 = html.match(re2);
  if (m2) {
    const text = stripHtml(m2[1]);
    return text || null;
  }
  return null;
}

async function appendLog(sb: ReturnType<typeof admin>, jobId: string, entry: Record<string, unknown>) {
  try {
    await sb.rpc("append_mm_job_log", { _job_id: jobId, _entry: entry }).then(() => {});
  } catch {
    // RPC may not exist — fallback to direct update
    const { data: job } = await sb.from("mm_import_jobs").select("chain_log").eq("id", jobId).maybeSingle();
    const log = Array.isArray(job?.chain_log) ? job!.chain_log : [];
    log.push({ ts: new Date().toISOString(), ...entry });
    await sb.from("mm_import_jobs").update({ chain_log: log }).eq("id", jobId);
  }
}

async function authorize(req: Request): Promise<Response | null> {
  const cronKey = Deno.env.get("CRON_INVOKE_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const providedCron = req.headers.get("x-cron-key");
  if (cronKey && providedCron && providedCron === cronKey) return null;
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token && serviceKey && token === serviceKey) return null;
  if (token) {
    try {
      const sb = (await import("npm:@supabase/supabase-js@2")).createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: `Bearer ${token}` } } },
      );
      const { data: claims } = await sb.auth.getClaims(token);
      if (claims?.claims?.sub) {
        const { data: isAdmin } = await sb.rpc("has_role", { _user_id: claims.claims.sub, _role: "admin" });
        if (isAdmin) return null;
      }
    } catch (_) { /* fall through */ }
  }
  return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const denied = await authorize(req);
  if (denied) return denied;

  try {
    const sb = admin();
    const body = await req.json().catch(() => ({}));
    let jobId: string | undefined = body.jobId;
    let cursor: number = typeof body.cursor === "number" ? body.cursor : 0;

    // Start new job
    if (!jobId) {
      const { count } = await sb.from("repertory_remedies").select("id", { count: "exact", head: true });
      const total = count || 0;
      const { data: job, error } = await sb
        .from("mm_import_jobs")
        .insert({ source: "boericke", status: "processing", total_remedies: total, cursor_idx: 0 })
        .select("id")
        .single();
      if (error) throw error;
      jobId = job.id as string;
      // Kick off the chain (don't await)
      selfInvoke({ jobId, cursor: 0 });
      return new Response(JSON.stringify({ jobId, total }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Process one slice
    const { data: remedies, error } = await sb
      .from("repertory_remedies")
      .select("id, slug, name_latin, abbrev")
      .order("name_latin", { ascending: true })
      .range(cursor, cursor + SLICE - 1);
    if (error) throw error;

    let inserted = 0, skipped = 0, failed = 0;
    for (const r of remedies || []) {
      const slug = (r.slug || r.abbrev || "").toString();
      // Skip if already imported
      const { data: existing } = await sb
        .from("materia_medica_sections")
        .select("id")
        .eq("remedy_id", r.id)
        .eq("source", "boericke")
        .eq("heading", "Relationship")
        .maybeSingle();
      if (existing) { skipped++; continue; }

      const urls = slugToPaths(slug);
      if (!urls) { skipped++; continue; }

      let html = await fetchHtml(urls.primary);
      let usedUrl = urls.primary;
      if (!html) {
        html = await fetchHtml(urls.fallback);
        usedUrl = urls.fallback;
      }
      if (!html) { failed++; continue; }
      const rel = extractRelationship(html);
      if (!rel) { skipped++; continue; }

      const { error: insErr } = await sb.from("materia_medica_sections").insert({
        remedy_id: r.id,
        source: "boericke",
        heading: "Relationship",
        body: rel.slice(0, 8000),
        source_url: usedUrl,
      });
      if (insErr) failed++; else inserted++;
    }

    const processed = (remedies?.length || 0);
    const newCursor = cursor + processed;
    const { data: job } = await sb.from("mm_import_jobs").select("processed_remedies, inserted_sections, skipped, failed, total_remedies").eq("id", jobId).single();
    const done = newCursor >= (job?.total_remedies || 0) || processed === 0;

    await sb.from("mm_import_jobs").update({
      processed_remedies: (job?.processed_remedies || 0) + processed,
      inserted_sections: (job?.inserted_sections || 0) + inserted,
      skipped: (job?.skipped || 0) + skipped,
      failed: (job?.failed || 0) + failed,
      cursor_idx: newCursor,
      status: done ? "done" : "processing",
    }).eq("id", jobId);

    await appendLog(sb, jobId, { cursor, processed, inserted, skipped, failed });

    if (!done) {
      selfInvoke({ jobId, cursor: newCursor });
    }

    return new Response(JSON.stringify({ jobId, cursor: newCursor, processed, inserted, skipped, failed, done }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[import-boericke-mm]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
