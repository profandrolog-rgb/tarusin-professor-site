// Индексация чанков видео. Вход: { video_id }.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { embedTexts } from "../_shared/videoEmbeddings.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { video_id } = await req.json().catch(() => ({}));
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SVC);

    const { data: video, error: vErr } = await sb
      .from("videos")
      .select("id, title, summary_plain, faq_questions")
      .eq("id", video_id)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!video) throw new Error("Видео не найдено");

    const { count } = await sb
      .from("video_chunks")
      .select("id", { count: "exact", head: true })
      .eq("video_id", video_id);

    // Нет транскрипта — создаём синтетический чанк
    if (!count) {
      const synthetic = [
        video.title || "",
        video.summary_plain || "",
        (video.faq_questions || []).join(" "),
      ].join(" ").trim();
      if (!synthetic) throw new Error("Нечего индексировать: нет ни транскрипта, ни описания");
      const { error } = await sb
        .from("video_chunks")
        .insert({ video_id, start_sec: 0, end_sec: 0, content: synthetic });
      if (error) throw new Error(error.message);
    }

    const { data: chunks, error: cErr } = await sb
      .from("video_chunks")
      .select("id, content")
      .eq("video_id", video_id)
      .is("embedding", null)
      .limit(1000);
    if (cErr) throw new Error(cErr.message);

    const pending = (chunks || []).filter((c) => (c.content || "").trim().length > 0);
    let indexed = 0;

    for (let i = 0; i < pending.length; i += 64) {
      const batch = pending.slice(i, i + 64);
      const vectors = await embedTexts(batch.map((c) => String(c.content).slice(0, 6000)));
      for (let j = 0; j < batch.length; j++) {
        if (!vectors[j]) continue;
        const { error } = await sb
          .from("video_chunks")
          .update({ embedding: vectors[j] as unknown as string })
          .eq("id", batch[j].id);
        if (!error) indexed++;
      }
    }

    return new Response(JSON.stringify({ indexed, total: pending.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("index-video", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ошибка" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
