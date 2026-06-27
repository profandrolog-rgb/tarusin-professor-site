// Vault ↔ GitHub sync via Contents API.
// Action "push": uploads all DB notes to repo (creates/updates by SHA).
// Action "pull": fetches repo, imports newer files into DB (by SHA + updated_at).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GH_TOKEN = Deno.env.get("GITHUB_VAULT_TOKEN")!;
const GH_REPO = Deno.env.get("GITHUB_VAULT_REPO")!; // "owner/repo"
const GH_BRANCH = Deno.env.get("GITHUB_VAULT_BRANCH") || "main";

const GH = "https://api.github.com";

function b64encode(s: string): string {
  // utf-8 safe
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function b64decode(s: string): string {
  const bin = atob(s.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function noteToMd(n: any): string {
  const fm = [
    "---",
    `id: ${n.id}`,
    `title: ${JSON.stringify(n.title)}`,
    `folder: ${JSON.stringify(n.folder_path || "/")}`,
    `tags: [${(n.tags || []).map((t: string) => JSON.stringify(t)).join(", ")}]`,
    n.is_daily ? `daily: true` : "",
    n.daily_date ? `daily_date: ${n.daily_date}` : "",
    n.patient_id ? `patient_id: ${n.patient_id}` : "",
    `updated_at: ${n.updated_at}`,
    "---",
    "",
  ].filter(Boolean).join("\n");
  return fm + (n.content_md || "");
}

function parseFm(md: string): { meta: any; body: string } {
  if (!md.startsWith("---")) return { meta: {}, body: md };
  const end = md.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: md };
  const head = md.slice(3, end).trim();
  const body = md.slice(end + 4).replace(/^\n/, "");
  const meta: any = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/i);
    if (!m) continue;
    const k = m[1]; let v: any = m[2].trim();
    if (v === "true") v = true;
    else if (v === "false") v = false;
    else if (v.startsWith("[")) { try { v = JSON.parse(v); } catch {} }
    else if (v.startsWith('"')) { try { v = JSON.parse(v); } catch {} }
    meta[k] = v;
  }
  return { meta, body };
}

function notePath(n: any): string {
  const folder = (n.folder_path || "/").replace(/^\/+|\/+$/g, "");
  const safe = (n.slug || n.title || n.id).replace(/[^a-z0-9а-я\-_]+/gi, "-").slice(0, 100);
  return (folder ? folder + "/" : "") + safe + ".md";
}

async function gh(path: string, init: RequestInit = {}) {
  return fetch(`${GH}/repos/${GH_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "tarusin-vault-sync",
      ...(init.headers || {}),
    },
  });
}

async function getFile(path: string) {
  const r = await gh(`/contents/${encodeURI(path)}?ref=${GH_BRANCH}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GH GET ${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function putFile(path: string, content: string, sha: string | null, msg: string) {
  const r = await gh(`/contents/${encodeURI(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: msg, content: b64encode(content), branch: GH_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!r.ok) throw new Error(`GH PUT ${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function listTree(): Promise<{ path: string; sha: string }[]> {
  // get branch head -> tree (recursive)
  const br = await gh(`/branches/${encodeURIComponent(GH_BRANCH)}`);
  if (br.status === 404) return [];
  if (!br.ok) throw new Error(`branch: ${await br.text()}`);
  const { commit } = await br.json();
  const tr = await gh(`/git/trees/${commit.sha}?recursive=1`);
  if (!tr.ok) throw new Error(`tree: ${await tr.text()}`);
  const { tree } = await tr.json();
  return tree.filter((x: any) => x.type === "blob" && x.path.endsWith(".md")).map((x: any) => ({ path: x.path, sha: x.sha }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!GH_TOKEN || !GH_REPO) throw new Error("GITHUB_VAULT_TOKEN/REPO not set");

    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(SUPA_URL, SR, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action } = await req.json();

    if (action === "push") {
      const { data: notes, error } = await sb.from("vault_notes").select("*").eq("owner_id", user.id);
      if (error) throw error;
      let created = 0, updated = 0, skipped = 0;
      for (const n of notes || []) {
        const path = notePath(n);
        const content = noteToMd(n);
        const existing = await getFile(path);
        if (existing) {
          const remote = b64decode(existing.content);
          if (remote === content) { skipped++; continue; }
          await putFile(path, content, existing.sha, `update: ${n.title}`);
          updated++;
        } else {
          await putFile(path, content, null, `create: ${n.title}`);
          created++;
        }
      }
      return new Response(JSON.stringify({ ok: true, created, updated, skipped, total: notes?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "pull") {
      const tree = await listTree();
      let imported = 0, updated = 0, skipped = 0;
      for (const entry of tree) {
        const file = await getFile(entry.path);
        if (!file) continue;
        const md = b64decode(file.content);
        const { meta, body } = parseFm(md);
        const title = meta.title || entry.path.split("/").pop()!.replace(/\.md$/, "");
        const folder = meta.folder || ("/" + entry.path.split("/").slice(0, -1).join("/"));
        const tags = Array.isArray(meta.tags) ? meta.tags : [];
        const remoteUpdated = meta.updated_at ? new Date(meta.updated_at) : null;

        if (meta.id) {
          const { data: existing } = await sb.from("vault_notes").select("id, updated_at, content_md").eq("id", meta.id).eq("owner_id", user.id).maybeSingle();
          if (existing) {
            const localT = new Date(existing.updated_at);
            if (remoteUpdated && remoteUpdated <= localT) { skipped++; continue; }
            if (existing.content_md === body) { skipped++; continue; }
            await sb.from("vault_notes").update({ title, content_md: body, folder_path: folder, tags }).eq("id", meta.id);
            updated++;
            continue;
          }
        }
        // create new
        const slug = (title || "note").toLowerCase().replace(/[^a-z0-9а-я]+/gi, "-").slice(0, 80);
        await sb.from("vault_notes").insert({
          owner_id: user.id, title, slug, folder_path: folder, content_md: body, tags,
          is_daily: !!meta.daily, daily_date: meta.daily_date || null, patient_id: meta.patient_id || null,
        });
        imported++;
      }
      return new Response(JSON.stringify({ ok: true, imported, updated, skipped, total: tree.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("vault-sync error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
