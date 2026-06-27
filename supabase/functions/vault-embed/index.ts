// Generates a Voyage embedding for one vault note and upserts into vault_note_embeddings.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VOYAGE_KEY = Deno.env.get("VOYAGE_API_KEY");
const MODEL = "voyage-3";

async function sha256(s: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    const sbUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user } } = await sbUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    if (!VOYAGE_KEY) return new Response(JSON.stringify({ error: "VOYAGE_API_KEY not configured" }), { status: 500, headers: corsHeaders });

    const { noteId } = await req.json();
    if (!noteId) return new Response(JSON.stringify({ error: "noteId required" }), { status: 400, headers: corsHeaders });

    const sb = createClient(SUPABASE_URL, SVC);
    const { data: note } = await sb.from("vault_notes").select("id, owner_id, title, content_md").eq("id", noteId).maybeSingle();
    if (!note || note.owner_id !== user.id) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: corsHeaders });

    const text = `${note.title}\n\n${(note.content_md || "").slice(0, 8000)}`;
    const hash = await sha256(text);

    const { data: existing } = await sb.from("vault_note_embeddings").select("content_hash").eq("note_id", noteId).maybeSingle();
    if (existing?.content_hash === hash) {
      return new Response(JSON.stringify({ status: "unchanged" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const r = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${VOYAGE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: [text], input_type: "document" }),
    });
    if (!r.ok) return new Response(JSON.stringify({ error: `voyage ${r.status}` }), { status: 500, headers: corsHeaders });
    const j = await r.json();
    const vec: number[] = j?.data?.[0]?.embedding;
    if (!vec) return new Response(JSON.stringify({ error: "no embedding" }), { status: 500, headers: corsHeaders });

    await sb.from("vault_note_embeddings").upsert({
      note_id: noteId, owner_id: user.id, embedding: vec as any, content_hash: hash, updated_at: new Date().toISOString(),
    }, { onConflict: "note_id" });

    return new Response(JSON.stringify({ status: "ok" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});
