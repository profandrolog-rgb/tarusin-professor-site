// Extracts a zip uploaded to chat-attachments into individual files.
// Input: { zipPath: "user_id/batch_id/archive.zip" }
// Output: { paths: string[], skipped: { name: string, reason: string }[] }
import { createClient } from "npm:@supabase/supabase-js@2";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "chat-attachments";
const MAX_ENTRY_BYTES = 30 * 1024 * 1024; // 30 MB per extracted file
const MAX_TOTAL_BYTES = 300 * 1024 * 1024; // 300 MB total
const MAX_ENTRIES = 200;
const ALLOWED_EXT = new Set([
  "pdf", "png", "jpg", "jpeg", "webp", "gif", "heic",
]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}
function mimeOf(ext: string): string {
  return ext === "pdf" ? "application/pdf"
    : ext === "png" ? "image/png"
    : ext === "webp" ? "image/webp"
    : ext === "gif" ? "image/gif"
    : ext === "heic" ? "image/heic"
    : "image/jpeg";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Validate user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { zipPath } = await req.json();
    if (typeof zipPath !== "string" || !zipPath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: "invalid zipPath" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const dl = await supabase.storage.from(BUCKET).download(zipPath);
    if (dl.error || !dl.data) {
      return new Response(JSON.stringify({ error: dl.error?.message || "download failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buf = new Uint8Array(await dl.data.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);

    const baseDir = zipPath.replace(/\/[^/]+$/, ""); // user_id/batch_id
    const paths: string[] = [];
    const skipped: { name: string; reason: string }[] = [];
    let totalBytes = 0;
    let count = 0;

    const entries = Object.values(zip.files).filter((f: any) => !f.dir);
    for (const entry of entries as any[]) {
      if (count >= MAX_ENTRIES) { skipped.push({ name: entry.name, reason: "too many entries" }); continue; }
      const baseName = entry.name.split("/").pop() || entry.name;
      if (!baseName || baseName.startsWith(".")) { skipped.push({ name: entry.name, reason: "hidden/empty" }); continue; }
      const ext = extOf(baseName);
      if (!ALLOWED_EXT.has(ext)) { skipped.push({ name: entry.name, reason: `unsupported .${ext}` }); continue; }
      const data: Uint8Array = await entry.async("uint8array");
      if (data.byteLength > MAX_ENTRY_BYTES) { skipped.push({ name: entry.name, reason: "file > 30MB" }); continue; }
      if (totalBytes + data.byteLength > MAX_TOTAL_BYTES) { skipped.push({ name: entry.name, reason: "total > 300MB" }); continue; }
      const safeName = baseName.replace(/[^\w.\-]+/g, "_");
      const path = `${baseDir}/zx_${count.toString().padStart(3, "0")}_${safeName}`;
      const up = await supabase.storage.from(BUCKET).upload(path, data, {
        contentType: mimeOf(ext), upsert: true,
      });
      if (up.error) { skipped.push({ name: entry.name, reason: up.error.message }); continue; }
      paths.push(path);
      totalBytes += data.byteLength;
      count++;
    }

    // Remove the original zip
    await supabase.storage.from(BUCKET).remove([zipPath]);

    return new Response(JSON.stringify({ paths, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
