import { supabase } from "@/integrations/supabase/client";

// Изображения хранятся в существующем публичном бакете `disease-media`
// под префиксом `parents/`. Отдельный бакет parents-media заблокирован
// политикой воркспейса (public buckets запрещены).
export const PARENTS_MEDIA_BUCKET = "disease-media";
export const PARENTS_MEDIA_PREFIX = "parents";

export function parentsMediaPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(PARENTS_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadParentsMedia(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${PARENTS_MEDIA_PREFIX}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PARENTS_MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function deleteParentsMedia(path: string): Promise<void> {
  if (!path) return;
  await supabase.storage.from(PARENTS_MEDIA_BUCKET).remove([path]);
}

export interface ParentsMaterial {
  id: string;
  kind: "article" | "video" | "podcast";
  title: string;
  description: string | null;
  title_en: string | null;
  description_en: string | null;
  url: string;
  source: string | null;
  image_path: string | null;
  image_url: string | null;
  emoji: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/** Возвращает лучший URL превью: сначала загруженный файл из бакета, затем внешний image_url. */
export function resolveMaterialPreview(m: Pick<ParentsMaterial, "image_path" | "image_url">): string | null {
  if (m.image_path) return parentsMediaPublicUrl(m.image_path);
  return m.image_url || null;
}
