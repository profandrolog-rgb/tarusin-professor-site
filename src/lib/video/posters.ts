// Захват кадра из <video> и загрузка обложки в публичный бакет.
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "video-cases";
const PREFIX = "video-posters";

/** Снимает текущий кадр видео в JPEG-файл. */
export async function captureVideoFrame(video: HTMLVideoElement, name = "poster"): Promise<File> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) throw new Error("Кадр ещё не готов — дождитесь загрузки видео");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Не удалось создать canvas");
  ctx.drawImage(video, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Не удалось получить кадр (возможно, видео с другого домена без CORS)");
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}

/** Загружает обложку и возвращает публичный URL. */
export async function uploadPoster(file: File, slug: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${PREFIX}/${slug || "video"}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
