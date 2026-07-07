import { supabase } from "@/integrations/supabase/client";

// Изображения хранятся в существующем публичном бакете `disease-media`.
// - Обложки карточек: parents/
// - PDF-памятки:       parents/handouts/
// - OG-картинки:       parents/og/
export const PARENTS_MEDIA_BUCKET = "disease-media";
export const PARENTS_MEDIA_PREFIX = "parents";
export const PARENTS_HANDOUTS_PREFIX = "parents/handouts";
export const PARENTS_OG_PREFIX = "parents/og";

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 MB

export function parentsMediaPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(PARENTS_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function uploadTo(prefix: string, file: File, forcedBasename?: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const base = forcedBasename?.replace(/[^a-z0-9-_]/gi, "-") || crypto.randomUUID();
  const path = `${prefix}/${base}.${ext}`;
  const { error } = await supabase.storage
    .from(PARENTS_MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function uploadParentsMedia(file: File): Promise<string> {
  return uploadTo(PARENTS_MEDIA_PREFIX, file);
}

export async function uploadParentsOgImage(file: File): Promise<string> {
  return uploadTo(PARENTS_OG_PREFIX, file);
}

export async function uploadParentsHandoutPdf(file: File, slug?: string): Promise<{ path: string; size: number }> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Загрузить можно только PDF-файл");
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new Error(`Файл больше 20 МБ (${(file.size / 1024 / 1024).toFixed(1)} МБ)`);
  }
  const path = await uploadTo(PARENTS_HANDOUTS_PREFIX, file, slug);
  return { path, size: file.size };
}

export async function deleteParentsMedia(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await supabase.storage.from(PARENTS_MEDIA_BUCKET).remove([path]);
}

export type ParentsMaterialKind = "article" | "video" | "podcast" | "handout";
export type ParentsMaterialAudience = "parent" | "adult_man" | "pediatric_patient" | "professional";

export interface ParentsMaterial {
  id: string;
  kind: ParentsMaterialKind;
  title: string;
  description: string | null;
  title_en: string | null;
  description_en: string | null;
  url: string | null;
  source: string | null;
  image_path: string | null;
  image_url: string | null;
  emoji: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // handout-specific
  slug: string | null;
  file_path: string | null;
  file_size_bytes: number | null;
  pages_count: number | null;
  long_description: string | null;
  long_description_en: string | null;
  seo_title: string | null;
  seo_title_en: string | null;
  seo_description: string | null;
  seo_description_en: string | null;
  og_image_path: string | null;
  audience: ParentsMaterialAudience | null;
  download_count: number;
  gated: boolean;
}

export function resolveMaterialPreview(m: Pick<ParentsMaterial, "image_path" | "image_url">): string | null {
  if (m.image_path) return parentsMediaPublicUrl(m.image_path);
  return m.image_url || null;
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",
    н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",
    ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function pagesLabel(n: number | null | undefined): string {
  if (!n || n <= 0) return "";
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${n} страниц`;
  if (last === 1) return `${n} страница`;
  if (last >= 2 && last <= 4) return `${n} страницы`;
  return `${n} страниц`;
}
