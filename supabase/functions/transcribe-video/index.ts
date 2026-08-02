// Транскрипция видео раздела «Видео» через OpenAI Whisper.
// Вход: { video_id }. Пишет transcript, duration_sec и чанки в video_chunks.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const MAX_BYTES = 25 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SVC);
  let videoId: string | null = null;

  const fail = async (message: string, status = 500) => {
    if (videoId) {
      await sb.from("videos").update({ transcript_status: "error", transcript_error: message }).eq("id", videoId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    const body = await req.json().catch(() => ({}));
    videoId = typeof body?.video_id === "string" ? body.video_id : null;
    if (!videoId) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!OPENAI_API_KEY) return await fail("Не задан секрет OPENAI_API_KEY");

    const { data: video, error: loadErr } = await sb
      .from("videos")
      .select("id, video_url")
      .eq("id", videoId)
      .maybeSingle();
    if (loadErr) return await fail(loadErr.message);
    if (!video?.video_url) return await fail("У видео не заполнена ссылка на файл", 400);

    await sb.from("videos").update({ transcript_status: "processing", transcript_error: null }).eq("id", videoId);

    // 1. Размер файла
    let size = 0;
    try {
      const head = await fetch(video.video_url, { method: "HEAD" });
      size = Number(head.headers.get("content-length") || 0);
    } catch (_e) {
      size = 0;
    }

    if (size > MAX_BYTES) {
      await sb
        .from("videos")
        .update({
          transcript_status: "too_large",
          transcript_error: `Файл ${(size / 1048576).toFixed(1)} МБ — больше лимита 25 МБ. Вставьте транскрипт вручную.`,
        })
        .eq("id", videoId);
      return new Response(JSON.stringify({ status: "too_large", size }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Скачиваем и отправляем в Whisper
    const fileRes = await fetch(video.video_url);
    if (!fileRes.ok) return await fail(`Не удалось скачать файл (HTTP ${fileRes.status})`);
    const blob = await fileRes.blob();
    if (blob.size > MAX_BYTES) {
      await sb
        .from("videos")
        .update({ transcript_status: "too_large", transcript_error: "Файл больше 25 МБ" })
        .eq("id", videoId);
      return new Response(JSON.stringify({ status: "too_large", size: blob.size }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = (video.video_url.split("/").pop() || "video.mp4").split("?")[0];
    const form = new FormData();
    form.append("file", blob, name);
    form.append("model", "whisper-1");
    form.append("language", "ru");
    form.append("response_format", "verbose_json");

    const wRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });
    const wText = await wRes.text();
    if (!wRes.ok) return await fail(`Whisper вернул ${wRes.status}`);

    const w = JSON.parse(wText);
    const transcript: string = w?.text ?? "";
    const segments: Array<{ start: number; end: number; text: string }> = Array.isArray(w?.segments) ? w.segments : [];
    const duration = w?.duration != null ? Math.round(Number(w.duration)) : null;

    // 4. Чанки
    await sb.from("video_chunks").delete().eq("video_id", videoId);
    if (segments.length) {
      const rows = segments.map((s) => ({
        video_id: videoId,
        start_sec: Math.round(Number(s.start) || 0),
        end_sec: Math.round(Number(s.end) || 0),
        content: String(s.text || "").trim(),
      }));
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await sb.from("video_chunks").insert(rows.slice(i, i + 200));
        if (error) return await fail(error.message);
      }
    }

    await sb
      .from("videos")
      .update({
        transcript,
        duration_sec: duration,
        transcript_status: "done",
        transcript_error: null,
      })
      .eq("id", videoId);

    return new Response(
      JSON.stringify({ status: "done", chunks: segments.length, duration_sec: duration }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("transcribe-video", e);
    return await fail(e instanceof Error ? e.message : "Неизвестная ошибка");
  }
});
