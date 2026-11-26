// Загрузка и воспроизведение видео статей: выбор облака, presigned-ссылки, обложки.
// Яндекс Object Storage — рабочий путь. Timeweb (File Browser на Honest Lacerta)
// помечен как недоступный, пока сервер не разрешит вход приложению.

import { supabase } from "@/integrations/supabase/client";
import { uploadWithProgress } from "@/lib/research/uploadToYc";
import { uploadPoster } from "@/lib/video/posters";

export type VideoCloud = "yandex" | "timeweb";

export interface VideoCloudOption {
  id: VideoCloud;
  label: string;
  hint: string;
  /** false — облако видно в интерфейсе, но загрузка в него запрещена. */
  ready: boolean;
}

export const VIDEO_CLOUDS: VideoCloudOption[] = [
  {
    id: "yandex",
    label: "Яндекс Облако",
    hint: "Основное хранилище: файл грузится напрямую, ссылка выдаётся на час.",
    ready: true,
  },
  {
    id: "timeweb",
    label: "Timeweb (Honest Lacerta)",
    hint: "Сервер требует капчу при входе — загрузка из сайта будет доступна после настройки сервера.",
    ready: false,
  },
];

export interface VideoRef {
  cloud: VideoCloud;
  /** objectKey облака (Яндекс) или путь на сервере (Timeweb). */
  key: string;
}

const VIDEO_EXT_RE = /\.(mp4|m4v|mov|webm|ogv|ogg)$/i;

/** Файл подходит для встраивания в страницу (HTML5 <video>). */
export function isPlayableVideo(file: File): boolean {
  return file.type.startsWith("video/") || VIDEO_EXT_RE.test(file.name);
}

export function videoFileName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 200) || "video.mp4";
}

/** Загружает видео в выбранное облако и возвращает ссылку на объект. */
export async function uploadArticleVideo(params: {
  file: File;
  cloud: VideoCloud;
  onProgress?: (pct: number) => void;
}): Promise<VideoRef> {
  const { file, cloud, onProgress } = params;
  const option = VIDEO_CLOUDS.find((c) => c.id === cloud);
  if (!option) throw new Error("Неизвестное облако");
  if (!option.ready) throw new Error(`${option.label}: ${option.hint}`);

  if (cloud === "yandex") {
    const { data, error } = await supabase.functions.invoke("article-video-signurl", {
      body: { operation: "put", filename: videoFileName(file.name) },
    });
    if (error) throw new Error(error.message || "Не удалось получить ссылку на загрузку");
    if (!data?.url) throw new Error(data?.error || "Сервер не вернул ссылку на загрузку");
    await uploadWithProgress(data.url, file, onProgress);
    return { cloud: "yandex", key: String(data.objectKey) };
  }

  throw new Error(`${option.label}: ${option.hint}`);
}

const srcCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_SLACK_MS = 120_000;

/** Выдаёт воспроизводимый URL видео (для Яндекса — подписанная ссылка на час). */
export async function resolveVideoSrc(ref: VideoRef): Promise<string> {
  const cacheKey = `${ref.cloud}:${ref.key}`;
  const hit = srcCache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  if (ref.cloud === "yandex") {
    const { data, error } = await supabase.functions.invoke("article-video-signurl", {
      body: { operation: "get", objectKey: ref.key },
    });
    if (error) throw new Error(error.message || "Не удалось получить ссылку на видео");
    if (!data?.url) throw new Error(data?.error || "Сервер не вернул ссылку на видео");
    const ttl = Number(data.expiresIn || 3600) * 1000;
    srcCache.set(cacheKey, { url: String(data.url), expiresAt: Date.now() + ttl - CACHE_SLACK_MS });
    return String(data.url);
  }

  if (ref.cloud === "timeweb") {
    const url = new URL("https://bpbwkizvvythqotcyfii.functions.supabase.co/article-video-filebrowser");
    url.searchParams.set("operation", "raw");
    url.searchParams.set("path", ref.key);
    return url.toString();
  }

  throw new Error("Неизвестное облако");
}

/** Удаляет видео из облака (кнопка в редакторе галереи). */
export async function deleteArticleVideo(ref: VideoRef): Promise<void> {
  if (ref.cloud === "yandex") {
    const { data, error } = await supabase.functions.invoke("article-video-signurl", {
      body: { operation: "delete", objectKey: ref.key },
    });
    if (error) throw new Error(error.message || "Не удалось удалить видео");
    if (!data?.url) throw new Error(data?.error || "Сервер не вернул ссылку на удаление");
    const res = await fetch(data.url, { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error(`delete failed: ${res.status}`);
    return;
  }
  throw new Error("Удаление из этого облака пока недоступно");
}

/** Загружает обложку в публичный бакет и возвращает её адрес. */
export async function uploadVideoPoster(file: File, slug: string): Promise<string> {
  return uploadPoster(file, slug);
}

/** Полные https-ссылки (обложки, чужие хосты) можно показывать без подписи. */
export function isDirectVideoUrl(value: string): boolean {
  return /^https?:\/\//i.test(value || "");
}
