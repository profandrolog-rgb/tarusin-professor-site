// Загрузка извлечённого артефакта в приватный YC-бакет через presigned PUT.

import { requestSignedUrl, uploadWithProgress } from "@/lib/research/uploadToYc";

function safeName(s: string): string {
  return (s || "file")
    .replace(/\.[^.]+$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "file";
}

/** Загружает блоб в yc://research-materials/{reviewId}/extracted/{sanitized}/{idx}.{ext}. */
export async function uploadExtracted(
  reviewId: string,
  originalFileName: string,
  index: number,
  ext: string,
  blob: Blob,
): Promise<{ objectKey: string }> {
  const filename = `extracted__${safeName(originalFileName)}__${index}.${ext}`;
  const sig = await requestSignedUrl({ operation: "put", review_id: reviewId, filename });
  const file = new File([blob], filename, { type: blob.type });
  await uploadWithProgress(sig.url, file);
  return { objectKey: sig.objectKey };
}
